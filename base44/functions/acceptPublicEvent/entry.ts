import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { waitUntil } from 'base44:runtime';

// Idempotently accepts a public event: creates the accepted participant record,
// bumps the event's accepted_count, and adds the user to the event's dedicated
// group chat — returning the chat id so the client can open it. All validation
// (active, not expired, not cancelled, not already joined) is server-side.
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
    if (event.status === 'cancelled') return Response.json({ error: 'This event was cancelled' }, { status: 400 });
    if (new Date(event.start_datetime).getTime() <= Date.now()) {
      return Response.json({ error: 'This event has already ended' }, { status: 400 });
    }

    const existing = await admin.entities.EventParticipant.filter({ event_id, user_id: user.id });
    if (existing.length > 0) {
      return Response.json({ chat_id: event.chat_id, already_joined: true });
    }

    const profiles = await admin.entities.Profile.filter({ created_by_id: user.id });
    const profile = profiles[0];

    await admin.entities.EventParticipant.create({
      event_id,
      user_id: user.id,
      user_name: user.full_name,
      user_avatar: profile?.avatar_url,
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    });

    await admin.entities.PublicEvent.update(event.id, {
      accepted_count: (event.accepted_count || 1) + 1,
    });

    if (event.chat_id) {
      const thread = await admin.entities.Thread.get(event.chat_id).catch(() => null);
      if (thread) {
        const pids = thread.participant_ids || [];
        const pnames = thread.participant_names || [];
        if (!pids.includes(user.id)) {
          await admin.entities.Thread.update(thread.id, {
            participant_ids: [...pids, user.id],
            participant_names: [...pnames, user.full_name],
          });
        }
      }
      await admin.entities.ThreadRead.create({
        thread_id: event.chat_id,
        participant_ids: [user.id],
        last_read_at: new Date().toISOString(),
      }).catch(() => {});
    }

    waitUntil((async () => {
      try {
        const participants = await admin.entities.EventParticipant.filter({ event_id, status: 'accepted' });
        const others = participants.filter((p) => p.user_id !== user.id);
        await Promise.all(others.map((p) =>
          admin.entities.Notification.create({
            user_id: p.user_id,
            type: 'event_join',
            actor_name: user.full_name,
            title: `${user.full_name} joined ${event.title || 'your event'}`,
            body: `See you at ${event.location_name || 'the game'}`,
            link: `/messages/${event.chat_id}`,
          })
        ));
      } catch (e) { /* best-effort */ }
    })());

    return Response.json({ chat_id: event.chat_id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}