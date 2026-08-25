import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { waitUntil } from 'base44:runtime';
import { haversineMiles, NEARBY_RADIUS_MILES } from '../../shared/geo.ts';

// Creates a public event + its dedicated group chat + the creator's accepted
// participant record in one function so the multi-step transaction is reliable.
// Runs as the service role so the chat/participant writes can't be half-applied.
export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const b = body || {};
    if (b.latitude == null || b.longitude == null || !b.start_datetime || !b.competition_type) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const start = new Date(b.start_datetime);
    if (isNaN(start.getTime())) return Response.json({ error: 'Invalid start time' }, { status: 400 });
    if (start.getTime() <= Date.now()) return Response.json({ error: 'Event must be in the future' }, { status: 400 });

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const sportLabel = b.competition_type === 'custom' ? (b.custom_sport_name || 'Custom') : (b.sport_label || b.competition_type);
    const emoji = b.competition_type === 'custom' ? (b.custom_sport_emoji || '🏆') : (b.emoji || '🏆');
    const chatName = `${emoji} ${sportLabel} – ${b.location_name || 'Location'}`;

    const event = await base44.entities.PublicEvent.create({
      competition_type: b.competition_type,
      custom_sport_name: b.competition_type === 'custom' ? b.custom_sport_name : undefined,
      custom_sport_emoji: b.competition_type === 'custom' ? b.custom_sport_emoji : undefined,
      title: b.title || chatName,
      description: b.description,
      location_name: b.location_name,
      verified_address: b.verified_address,
      latitude: Number(b.latitude),
      longitude: Number(b.longitude),
      start_datetime: start.toISOString(),
      status: 'active',
      visibility: 'public',
      share_to_friends: !!b.share_to_friends,
      accepted_count: 1,
    });

    const thread = await base44.entities.Thread.create({
      type: 'group',
      name: chatName,
      participant_ids: [user.id],
      participant_names: [user.full_name],
      last_message: '',
      admin_ids: [user.id],
    });

    await base44.entities.PublicEvent.update(event.id, { chat_id: thread.id });

    await base44.entities.EventParticipant.create({
      event_id: event.id,
      user_id: user.id,
      user_name: user.full_name,
      user_avatar: b.creator_avatar,
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    });

    await base44.entities.ThreadRead.create({
      thread_id: thread.id,
      participant_ids: [user.id],
      last_read_at: new Date().toISOString(),
    });

    // Notify nearby users who opted in and match the competition type.
    waitUntil((async () => {
      try {
        const profiles = await base44.entities.Profile.filter({ notify_nearby: true });
        const interested = profiles.filter((p) => {
          if (p.created_by_id === user.id) return false;
          if (p.last_lat == null || p.last_lng == null) return false;
          if (haversineMiles(b.latitude, b.longitude, p.last_lat, p.last_lng) > NEARBY_RADIUS_MILES) return false;
          const types = p.notify_nearby_types || [];
          if (types.length && !types.includes(b.competition_type)) return false;
          const timing = p.notify_nearby_timing || 'new';
          if (timing === 'approaching') return false;
          return true;
        });
        await Promise.all(interested.map((p) =>
          base44.entities.Notification.create({
            user_id: p.created_by_id,
            type: 'nearby_event',
            actor_name: user.full_name,
            title: `${emoji} ${sportLabel} nearby at ${b.location_name || 'a location'}`,
            body: `Starts ${start.toLocaleString()}`,
            link: `/explore?event=${event.id}`,
          })
        ));
      } catch (e) { /* best-effort */ }
    })());

    return Response.json({ event_id: event.id, chat_id: thread.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}