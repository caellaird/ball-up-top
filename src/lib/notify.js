import { base44 } from '@/api/base44Client';

// Mirror of base44/shared/notifPrefs.ts for client-originated notifications.
// Checks the recipient's stored preference before creating the in-app
// Notification, so toggling a category off in Settings suppresses it.
const PREF_BY_TYPE = {
  challenge_invite: 'notif_challenge_invites',
  direct_message: 'notif_direct_messages',
  challenge_result: 'notif_challenge_results',
  event_reminder: 'notif_public_reminders',
  favorite_event_update: 'notif_explore_favorites',
  nearby_event: 'notify_nearby',
  event_join: 'notify_nearby',
  event_cancelled: 'notify_nearby',
};

function prefFieldForType(type) {
  return type ? (PREF_BY_TYPE[type] || null) : null;
}

export async function sendNotification({ userId, type, actorId, actorName, actorUsername, actorAvatar, title, body, link }) {
  if (!userId) return;
  const field = prefFieldForType(type);
  if (field) {
    try {
      const profiles = await base44.entities.Profile.filter({ created_by_id: userId });
      const p = profiles?.[0];
      if (p && p[field] === false) return null; // suppressed by preference
    } catch { /* ignore — proceed to send */ }
  }
  return base44.entities.Notification.create({
    user_id: userId,
    type,
    actor_id: actorId,
    actor_name: actorName,
    actor_username: actorUsername,
    actor_avatar: actorAvatar,
    title,
    body,
    link,
  });
}