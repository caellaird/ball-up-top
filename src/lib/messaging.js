import { base44 } from '@/api/base44Client';
import { sendNotification } from '@/lib/notify';

export async function getOrCreateThreadRead(threadId, userId) {
  const existing = await base44.entities.ThreadRead.filter({ thread_id: threadId, created_by_id: userId });
  if (existing.length > 0) return existing[0];
  let participant_ids = [];
  try {
    const thread = await base44.entities.Thread.get(threadId);
    participant_ids = thread?.participant_ids || [];
  } catch (e) { /* ignore — participant_ids stays empty */ }
  return base44.entities.ThreadRead.create({ thread_id: threadId, last_read_at: new Date().toISOString(), participant_ids });
}

export async function markThreadRead(threadId, userId) {
  const tr = await getOrCreateThreadRead(threadId, userId);
  return base44.entities.ThreadRead.update(tr.id, { last_read_at: new Date().toISOString() });
}

export async function setTyping(threadId, userId) {
  const tr = await getOrCreateThreadRead(threadId, userId);
  return base44.entities.ThreadRead.update(tr.id, { typing_at: new Date().toISOString() });
}

export function isTyping(threadRead, excludeUserId) {
  if (!threadRead?.typing_at) return false;
  if (threadRead.created_by_id === excludeUserId) return false;
  return Date.now() - new Date(threadRead.typing_at).getTime() < 5000;
}

export function hasRead(threadRead, messageDate) {
  if (!threadRead?.last_read_at || !messageDate) return false;
  return new Date(threadRead.last_read_at).getTime() >= new Date(messageDate).getTime();
}

export async function notifyMessageParticipants(thread, senderName, senderId, body, senderUsername) {
  const otherIds = (thread.participant_ids || []).filter((id) => id !== senderId);
  const isGroup = thread.type === 'group';
  await Promise.all(
    otherIds.map((id) =>
      sendNotification({
        userId: id,
        type: 'message',
        actorName: senderName,
        actorUsername: senderUsername,
        title: isGroup ? `${senderName} in ${thread.name || 'Group'}` : `New message from ${senderName}`,
        body: body || '📷 Photo',
        link: `/messages/${thread.id}`,
      })
    )
  );
}