import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { haversineMiles, NEARBY_RADIUS_MILES, NEARBY_WINDOW_HOURS } from '../../shared/geo.ts';

// Returns active public events within 25 miles of the caller that start within
// the next 12 hours. Time + distance filtering happen server-side so the client
// only receives eligible events.
export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { latitude, longitude } = body || {};
    if (latitude == null || longitude == null) {
      return Response.json({ error: 'latitude and longitude are required' }, { status: 400 });
    }
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const admin = base44.asServiceRole;

    const now = Date.now();
    const windowMs = NEARBY_WINDOW_HOURS * 3600 * 1000;
    const events = await admin.entities.PublicEvent.filter({ status: 'active' });
    const nearby = events
      .filter((e) => e.latitude != null && e.longitude != null && e.start_datetime)
      .filter((e) => {
        const t = new Date(e.start_datetime).getTime();
        if (t <= now) return false;
        if (t > now + windowMs) return false;
        return haversineMiles(latitude, longitude, e.latitude, e.longitude) <= NEARBY_RADIUS_MILES;
      })
      .sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime));

    return Response.json({ events: nearby });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}