import { base44 } from '@/api/base44Client';

export async function sendNotification({ userId, type, actorName, actorUsername, title, body, link }) {
  if (!userId) return;
  return base44.entities.Notification.create({ user_id: userId, type, actor_name: actorName, actor_username: actorUsername, title, body, link });
}