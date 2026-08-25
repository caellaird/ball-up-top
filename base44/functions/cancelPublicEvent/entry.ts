import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { waitUntil } from 'base44:runtime';

// Creator-only cancellation. Marks the event cancelled (removes it from Explore,
// blocks new acceptances) and notifies accepted participants. Chat/history is
// preserved — only the status changes.
export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { event_id } = body || {};
    if (!event_id) return Response.json({ error: 'event_id is required' }, { status: 400 });

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const admin = base44.asServiceRole;

    const event = await admin.entities.PublicEvent.get(event_id);
    if (!event) return Response.json({ error: 'Event not found' }, { status: 404 });
    if (event.created_by_id !== user.id) {
      return Response.json({ error: 'Only the creator can cancel this event' }, { status: 403 });
    }

    await admin.entities.PublicEvent.update(event_id, { status: 'cancelled' });

    waitUntil((async () => {
      try {
        const participants = await admin.entities.EventParticipant.filter({ event_id, status: 'accepted' });
        const others = participants.filter((p) => p.user_id !== user.id);
        await Promise.all(others.map((p) =>
          admin.entities.Notification.create({
            user_id: p.user_id,
            type: 'event_cancelled',
            actor_name: user.full_name,
            title: `Event cancelled: ${event.title || ''}`,
            body: `${event.location_name || ''} — the creator cancelled this event.`,
            link: `/messages/${event.chat_id}`,
          })
        ));
      } catch (e) { /* best-effort */ }
    })());

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}