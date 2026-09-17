import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { shouldSend, isHighSignal, sendPush } from '../../shared/notifPrefs.ts';

// Validates that a notification link is a safe same-origin app path. Rejects
// absolute URLs, protocol-relative URLs (//evil.com), and backslash escapes
// (/\evil.com) that could redirect to an attacker-controlled site when the
// notification is tapped.
function safeLink(link?: string): string | undefined {
  if (!link || typeof link !== 'string') return undefined;
  const trimmed = link.trim();
  if (!trimmed.startsWith('/')) return undefined;
  if (trimmed.startsWith('//')) return undefined;
  if (trimmed.includes('\\')) return undefined;
  return trimmed;
}

// Verifies the sender has a legitimate relationship with the recipient: a friend
// record (any status — covers pending/accepted), a shared challenge, or a shared
// message thread. Prevents notification spam to arbitrary users with no connection
// to the sender. Runs as the service role so RLS is bypassed.
async function hasRelationship(admin: any, senderId: string, recipientId: string): Promise<boolean> {
  if (!senderId || !recipientId || senderId === recipientId) return false;
  try {
    const f1 = await admin.entities.Friend.filter({ created_by_id: senderId, addressee_id: recipientId }, undefined, 1);
    if (f1?.length) return true;
    const f2 = await admin.entities.Friend.filter({ created_by_id: recipientId, addressee_id: senderId }, undefined, 1);
    if (f2?.length) return true;
    const c1 = await admin.entities.Challenge.filter({ created_by_id: senderId, opponent_id: recipientId }, undefined, 1);
    if (c1?.length) return true;
    const c2 = await admin.entities.Challenge.filter({ created_by_id: recipientId, opponent_id: senderId }, undefined, 1);
    if (c2?.length) return true;
    const threads = await admin.entities.Thread.filter({ participant_ids: { $in: [senderId] } }, undefined, 50);
    for (const t of (threads || [])) {
      if ((t.participant_ids || []).includes(recipientId)) return true;
    }
    return false;
  } catch {
    return false;
  }
}

// Server-side endpoint for client-originated notifications. Derives the actor
// identity from the authenticated caller (never client-supplied), verifies a
// legitimate sender-recipient relationship, validates the link is same-origin,
// checks the recipient's per-category preference, creates the in-app Notification
// under the service role, and — for the high-signal subset — fires a native
// lock-screen push. Push can only be sent server-side, so the client never calls
// SendPushNotification directly; it calls this function via
// base44.functions.invoke('sendNotification', ...).
export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const b = body || {};
    if (!b.user_id || !b.title) {
      return Response.json({ error: 'user_id and title are required' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const admin = base44.asServiceRole;

    // The actor is always the authenticated caller — never trust client-supplied
    // actor identity fields, which would allow impersonation.
    const actorId = user.id;
    const actorName = user.full_name || '';
    let actorUsername = '';
    let actorAvatar = '';
    try {
      const senderProfile = (await admin.entities.Profile.filter({ created_by_id: user.id }, undefined, 1))?.[0];
      if (senderProfile) {
        actorUsername = senderProfile.username || '';
        actorAvatar = senderProfile.avatar_url || '';
      }
    } catch { /* ignore */ }

    // The recipient must have a legitimate relationship with the sender —
    // prevents spam and phishing via notifications to arbitrary users.
    if (!(await hasRelationship(admin, user.id, b.user_id))) {
      return Response.json({ error: 'No relationship with recipient' }, { status: 403 });
    }

    // Validate the link is a safe same-origin app path.
    const link = safeLink(b.link);

    // Respect the recipient's per-category preference (server-side).
    let profile: any = null;
    try {
      const profiles = await admin.entities.Profile.filter({ created_by_id: b.user_id });
      profile = profiles?.[0];
    } catch { /* ignore */ }
    if (!shouldSend(profile, b.type)) return Response.json({ suppressed: true });

    const notif = await admin.entities.Notification.create({
      user_id: b.user_id,
      type: b.type,
      actor_id: actorId,
      actor_name: actorName,
      actor_username: actorUsername,
      actor_avatar: actorAvatar,
      title: b.title,
      body: b.body,
      link,
    });

    if (isHighSignal(b.type)) {
      await sendPush(admin, b.user_id, b.type, b.title, b.body || b.title, link, profile);
    }

    return Response.json({ id: notif?.id ?? null });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}