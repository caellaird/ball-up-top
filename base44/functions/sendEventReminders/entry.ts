import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { shouldSend, sendPush } from '../../shared/notifPrefs.ts';

// Scheduled by the "Public Event Reminders" workflow (every 5 minutes).
// Finds active public events starting within the next ~30 minutes and sends
// exactly one `event_reminder` notification to each accepted participant
// (including the creator) who has Public Event Reminders enabled. Cancelled,
// ended, and already-started events are skipped. Deduplication is enforced by
// checking for an existing event_reminder notification for that user/event, so
// retries and overlapping runs never produce duplicate reminders.
//
// Server-side + durable: works with the app closed / in the background because
// it is driven by the platform scheduler, not a client timer.
const SPORT_EMOJI: Record<string, string> = {
  basketball: '🏀', golf: '⛳', pickleball: '🥒', darts: '🎯',
  disc_golf: '🥏', cornhole: '🌽', trivia: '🧠', chugging: '🍺', custom: '🏆',
};
const SPORT_LABEL: Record<string, string> = {
  basketball: 'Basketball', golf: 'Golf', pickleball: 'Pickleball', darts: 'Darts',
  disc_golf: 'Disc Golf', cornhole: 'Cornhole', trivia: 'Trivia', chugging: 'Chugging', custom: 'Custom',
};

function display(event: any) {
  if (event.competition_type === 'custom') {
    return { emoji: event.custom_sport_emoji || '🏆', label: event.custom_sport_name || 'Custom' };
  }
  return { emoji: SPORT_EMOJI[event.competition_type] || '🏆', label: SPORT_LABEL[event.competition_type] || event.competition_type };
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const admin = base44.asServiceRole;
    const now = Date.now();

    // The reminder should fire ~30 min before start. With a 5-minute cadence,
    // consider events starting in (20m, 35m] so a 30-min-away event is always
    // caught on the run closest to 30 minutes prior.
    const lower = now + 20 * 60000;
    const upper = now + 35 * 60000;

    const events = await admin.entities.PublicEvent.list('-start_datetime', 200);
    const upcoming = events.filter((e) => {
      if (e.status !== 'active') return false;
      const t = new Date(e.start_datetime).getTime();
      return t > now && t >= lower && t <= upper;
    });

    let sent = 0;
    for (const event of upcoming) {
      const participants = await admin.entities.EventParticipant.filter({ event_id: event.id, status: 'accepted' });
      const { emoji, label } = display(event);
      const start = new Date(event.start_datetime);
      const time = start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      const link = `/explore?event=${event.id}`;

      for (const p of participants) {
        // Respect the recipient's reminder preference (default on).
        let profile: any = null;
        try {
          const profiles = await admin.entities.Profile.filter({ created_by_id: p.user_id });
          profile = profiles?.[0];
        } catch { /* ignore */ }
        if (!shouldSend(profile, 'event_reminder')) continue;

        // Dedup: never send more than one reminder per user/event.
        try {
          const existing = await admin.entities.Notification.filter({ user_id: p.user_id, type: 'event_reminder', link });
          if (existing && existing.length > 0) continue;
        } catch { /* ignore */ }

        await admin.entities.Notification.create({
          user_id: p.user_id,
          type: 'event_reminder',
          actor_name: event.title || label,
          title: `${emoji} Your ${label} event starts in 30 minutes`,
          body: `${event.location_name || 'Location'} · ${time}`,
          link,
        });
        // event_reminder is high-signal — also fire a native lock-screen push.
        await sendPush(
          admin,
          p.user_id,
          'event_reminder',
          `${emoji} Your ${label} event starts in 30 minutes`,
          `${event.location_name || 'Location'} · ${time}`,
          link,
          profile,
        );
        sent++;
      }
    }

    return Response.json({ checked: upcoming.length, sent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}