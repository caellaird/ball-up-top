import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { shouldSend, isHighSignal, sendPush } from '../../shared/notifPrefs.ts';

// Server-side endpoint for client-originated notifications. Checks the
// recipient's per-category preference, creates the in-app Notification under
// the service role (required to create records for other users), and — for the
// high-signal subset — fires a native lock-screen push. Push can only be sent
// server-side, so the client never calls SendPushNotification directly; it calls
// this function via base44.functions.invoke('sendNotification', ...).
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
      actor_id: b.actor_id,
      actor_name: b.actor_name,
      actor_username: b.actor_username,
      actor_avatar: b.actor_avatar,
      title: b.title,
      body: b.body,
      link: b.link,
    });

    if (isHighSignal(b.type)) {
      await sendPush(admin, b.user_id, b.type, b.title, b.body || b.title, b.link, profile);
    }

    return Response.json({ id: notif?.id ?? null });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}