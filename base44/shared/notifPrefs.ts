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
  challenge_response: "notif_challenge_results",
  direct_message: "notif_direct_messages",
  challenge_result: "notif_challenge_results",
  post_comment: "notif_post_comments",
  friend_request: "notif_friend_activity",
  friend_response: "notif_friend_activity",
  friend_accepted: "notif_friend_activity",
  friend_removed: "notif_friend_activity",
  league_invite: "notif_friend_activity",
  event_reminder: "notif_public_reminders",
  favorite_event_update: "notif_explore_favorites",
  // Public-event lifecycle notifications are gated by the nearby/public toggle.
  nearby_event: "notify_nearby",
  event_join: "notify_nearby",
  event_cancelled: "notify_nearby",
  // Rivalry alerts ride the challenge-results preference — rivalries are a
  // competitive outcome, so users who opted out of result pings won't get these.
  rivalry_activated: "notif_challenge_results",
  rivalry_lead_change: "notif_challenge_results",
};

// Every notification category also fires a native push, so a category that
// appears in the in-app center always mirrors to the lock screen when the
// recipient allows it (master push toggle + per-category preference).

export function prefFieldForType(type?: string): string | null {
  if (!type) return null;
  return PREF_BY_TYPE[type] ?? null;
}

// Push is available for every category, so a new in-app notification can never
// silently skip the lock screen; the recipient's preferences still decide
// whether it is delivered.
export function isHighSignal(type?: string): boolean {
  return !!type;
}

// Unmapped types are always allowed (preserves existing behavior for anything
// not yet wired to a preference). A mapped preference is off only when
// explicitly false — undefined defaults to on.
export function shouldSend(profile: any, type?: string): boolean {
  const field = prefFieldForType(type);
  if (!field) return true;
  return profile?.[field] !== false;
}

// A native push fires whenever BOTH the recipient's master push toggle
// (push_enabled) and the per-category preference are on. Defaults permissive
// (undefined = on) for both.
export function shouldPush(profile: any, type?: string): boolean {
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
  if (!userId || !type) return;
  try {
    const p = profile ?? (await admin.entities.Profile.filter({ created_by_id: userId }))?.[0];
    if (!shouldPush(p, type)) return;
    await admin.integrations.Core.SendPushNotification({
      user_id: userId,
      title,
      content,
      action_label: "Open",
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
    if (notif) {
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