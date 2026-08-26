import { base44 } from '@/api/base44Client';

// Client-originated notifications route through the server-side `sendNotification`
// backend function. That function checks the recipient's per-category preference,
// creates the in-app Notification under the service role (required to create
// records for other users), and — for the high-signal subset — fires a native
// lock-screen push. Push cannot be sent from client code, so this stays thin.
export async function sendNotification({ userId, type, actorId, actorName, actorUsername, actorAvatar, title, body, link }) {
  if (!userId) return;
  return base44.functions.invoke('sendNotification', {
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