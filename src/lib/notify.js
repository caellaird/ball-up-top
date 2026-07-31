import { base44 } from '@/api/base44Client';

export async function sendNotification({ userId, type, actorId, actorName, actorUsername, actorAvatar, title, body, link }) {
  if (!userId) return;
  return base44.entities.Notification.create({ user_id: userId, type, actor_id: actorId, actor_name: actorName, actor_username: actorUsername, actor_avatar: actorAvatar, title, body, link });
}