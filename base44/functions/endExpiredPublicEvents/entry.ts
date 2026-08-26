import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Scheduled by the "End Expired Public Events" workflow (every 5 minutes).
// Flips active public events to `ended` once their start time + 2 hours has
// passed. Ended events leave the Explore map (getNearbyEvents only returns
// active, future events) and move from the Challenges "Accepted" tab to the
// "Completed" tab, and each counts +1 toward participants' Public Events
// profile counter (computed from status in computeProfileStats).
//
// The owner-cancel path (cancelPublicEvent) handles the notify-on-cancel case;
// auto-end is silent by design.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const admin = base44.asServiceRole;
    const now = Date.now();
    const TWO_HOURS = 2 * 60 * 60 * 1000;

    const events = await admin.entities.PublicEvent.filter({ status: 'active' });
    const expired = events.filter((e) => {
      if (!e.start_datetime) return false;
      return new Date(e.start_datetime).getTime() + TWO_HOURS <= now;
    });

    let ended = 0;
    for (const event of expired) {
      try {
        await admin.entities.PublicEvent.update(event.id, { status: 'ended' });
        ended++;
      } catch { /* best-effort per event */ }
    }

    return Response.json({ checked: events.length, ended });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}