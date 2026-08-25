// Shared notification-preference logic. Maps a notification `type` to the
// Profile field that gates it, and decides whether a recipient should receive
// that notification. Defaults are permissive (true) so existing users keep the
// app's current behavior until they explicitly turn a category off.
//
// Used by backend functions (service-role) when creating notifications, so
// preference checks happen server-side — not just in the client. The frontend
// mirrors this in src/lib/notify.js for client-originated notifications.

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

export function prefFieldForType(type?: string): string | null {
  if (!type) return null;
  return PREF_BY_TYPE[type] ?? null;
}

// Unmapped types are always allowed (preserves existing behavior for anything
// not yet wired to a preference). A mapped preference is off only when
// explicitly false — undefined defaults to on.
export function shouldSend(profile: any, type?: string): boolean {
  const field = prefFieldForType(type);
  if (!field) return true;
  return profile?.[field] !== false;
}

// Fetches the recipient's profile and creates a Notification only if their
// preference allows it. Returns the created notification or null if suppressed
// / not found. Best-effort: never throws.
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
    return admin.entities.Notification.create({
      user_id: params.user_id,
      type: params.type,
      actor_name: params.actor_name,
      actor_username: params.actor_username,
      actor_avatar: params.actor_avatar,
      title: params.title,
      body: params.body,
      link: params.link,
    });
  } catch {
    return null;
  }
}