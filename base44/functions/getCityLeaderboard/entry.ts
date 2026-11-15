import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { STATE_NAMES } from '../../shared/usStates.ts';
import { resolveUserLocation } from '../../shared/locationTally.ts';

// Explore rankings — completed challenges accumulated by city and by state.
//
// Every participant's home city and state receives one count per completed
// challenge (see shared/locationTally.ts), so these totals are read straight
// from the pre-aggregated CityChallengeScore / StateChallengeScore rows.
//
// Returns:
//   - topCities: top 5 cities by completed challenges
//   - topStates: top 5 states by completed challenges
//   - cityOfYear: the #1 city (hero card)
//   - userCity / userState: the requesting user's location and rank
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = base44.asServiceRole;

    const cityPage = await admin.entities.CityChallengeScore.filter({}, { sort: '-completed_count', limit: 100 });
    const statePage = await admin.entities.StateChallengeScore.filter({}, { sort: '-completed_count', limit: 100 });
    const cities = (cityPage?.items || []).filter((c) => (c.completed_count || 0) > 0);
    const states = (statePage?.items || []).filter((s) => (s.completed_count || 0) > 0);

    const topCities = cities.slice(0, 5).map((c, i) => ({
      rank: i + 1,
      city: c.city_display || c.city_key,
      cityKey: c.city_key,
      stateCode: c.state_code || '',
      count: c.completed_count || 0,
    }));

    const topStates = states.slice(0, 5).map((s, i) => ({
      rank: i + 1,
      stateCode: s.state_code,
      stateName: s.state_name || STATE_NAMES[s.state_code] || s.state_code,
      count: s.completed_count || 0,
    }));

    let userCity = null;
    let userState = null;
    try {
      const profiles = await admin.entities.Profile.filter({ created_by_id: user.id });
      const location = resolveUserLocation(profiles?.[0]);
      if (location.cityKey) {
        const cityIdx = cities.findIndex((c) => c.city_key === location.cityKey);
        const row = cityIdx >= 0 ? cities[cityIdx] : null;
        userCity = {
          city: row?.city_display || location.cityDisplay,
          cityKey: location.cityKey,
          stateCode: location.stateCode,
          count: row?.completed_count || 0,
          rank: row ? cityIdx + 1 : null,
        };

        const stateIdx = states.findIndex((s) => s.state_code === location.stateCode);
        const stateRow = stateIdx >= 0 ? states[stateIdx] : null;
        userState = {
          stateCode: location.stateCode,
          stateName: location.stateName,
          count: stateRow?.completed_count || 0,
          rank: stateRow ? stateIdx + 1 : null,
        };
      }
    } catch { /* best-effort — the rankings still render without a user row */ }

    return Response.json({
      topCities,
      topStates,
      cityOfYear: topCities[0] || null,
      userCity,
      userState,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}