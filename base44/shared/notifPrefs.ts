// Shared notification-preference + native-push logic. Maps a notification
// `type` to the Profile field that gates it, decides whether a recipient should
// receive that notification (in-app), and — for a high-signal subset — whether
// a native lock-screen push should also fire. Defaults are permissive (true) so
// existing users keep the app's current behavior until they explicitly turn a
// category off.
//
// Used by backend functions (service-role) when creating notifications, so
// preference + push checks happen server-side — never from client code. The
// frontend mirror in src/lib/notify.js just routes through the `sendNotification`
// backend function, which calls into these helpers.

const PREF_BY_TYPE: Record<string, string> = {
  challenge_invite: "notif_challenge_invites",
  direct_message: "notif_direct_messages",
  challenge_result: "notif_challenge_results",
  event_reminder: "notif_public_reminders",
  favorite_event_update: "notif_explore_favorites",
  // Public-event lifecycle notifications are gated by the nearby/public toggle.
  nearby_event: "notify_nearby",
  event_join: "notify_nearby",
  event_cancelled: "notify_nearby",
};

// Only these types also fire a native lock-screen push. Everything else is
// in-app-only, to avoid spamming the lock screen with low-signal updates.
const HIGH_SIGNAL_PUSH_TYPES = new Set<string>([
  "direct_message",
  "challenge_invite",
  "challenge_result",
  "event_reminder",
  "event_cancelled",
]);

export function prefFieldForType(type?: string): string | null {
  if (!type) return null;
  return PREF_BY_TYPE[type] ?? null;
}

export function isHighSignal(type?: string): boolean {
  return !!type && HIGH_SIGNAL_PUSH_TYPES.has(type);
}

// Unmapped types are always allowed (preserves existing behavior for anything
// not yet wired to a preference). A mapped preference is off only when
// explicitly false — undefined defaults to on.
export function shouldSend(profile: any, type?: string): boolean {
  const field = prefFieldForType(type);
  if (!field) return true;
  return profile?.[field] !== false;
}

// A native push fires only for high-signal types, and only when BOTH the
// recipient's master push toggle (push_enabled) and the per-category
// preference are on. Defaults permissive (undefined = on) for both.
export function shouldPush(profile: any, type?: string): boolean {
  if (!isHighSignal(type)) return false;
  if (profile?.push_enabled === false) return false;
  return shouldSend(profile, type);
}

// Sends a native lock-screen push if the recipient's master push toggle and the
// category preference are both on. Pass an already-fetched `profile` to avoid a
// redundant lookup when the caller already has it. Best-effort: never throws.
export async function sendPush(
  admin: any,
  userId: string,
  type: string,
  title: string,
  content: string,
  actionUrl?: string,
  profile?: any,
) {
  if (!userId || !isHighSignal(type)) return;
  try {
    const p = profile ?? (await admin.entities.Profile.filter({ created_by_id: userId }))?.[0];
    if (!shouldPush(p, type)) return;
    await admin.integrations.Core.SendPushNotification({
      user_id: userId,
      title,
      content,
      action_url: actionUrl,
    });
  } catch {
    /* best-effort — push delivery requires a native build with credentials */
  }
}

// Fetches the recipient's profile and creates a Notification only if their
// preference allows it. For high-signal types, also fires a native push.
// Returns the created notification or null if suppressed / not found.
// Best-effort: never throws.
export async function sendIfAllowed(admin: any, params: {
  user_id: string;
  type?: string;
  actor_name?: string;
  actor_username?: string;
  actor_avatar?: string;
  title: string;
  body?: string;
  link?: string;
}) {
  if (!params?.user_id) return null;
  try {
    const profiles = await admin.entities.Profile.filter({ created_by_id: params.user_id });
    const profile = profiles?.[0];
    if (!shouldSend(profile, params.type)) return null;
    const notif = await admin.entities.Notification.create({
      user_id: params.user_id,
      type: params.type,
      actor_name: params.actor_name,
      actor_username: params.actor_username,
      actor_avatar: params.actor_avatar,
      title: params.title,
      body: params.body,
      link: params.link,
    });
    if (notif && isHighSignal(params.type)) {
      await sendPush(
        admin,
        params.user_id,
        params.type,
        params.title,
        params.body || params.title,
        params.link,
        profile,
      );
    }
    return notif;
  } catch {
    return null;
  }
}