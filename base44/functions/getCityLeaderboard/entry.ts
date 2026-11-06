import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getYearKey, resolveUserCity } from '../../shared/cityScore.ts';

// Returns the current year's city competition leaderboard:
//   - topCities: top 5 cities by points this year
//   - cityOfYear: the #1 city (hero "City of the Year")
//   - userCity: the requesting user's city, its rank, and how far behind #5 it is
//
// All aggregation reads from CityYearScore (one row per city per year), so the
// leaderboard loads in a single query regardless of activity history size.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = base44.asServiceRole;
    const year = getYearKey();

    const scores = await admin.entities.CityYearScore.filter({ year });
    scores.sort((a, b) => (b.points || 0) - (a.points || 0));

    const topCities = scores.slice(0, 5).map((s, i) => ({
      rank: i + 1,
      city: s.city_display,
      cityKey: s.city_key,
      points: s.points || 0,
    }));

    let userCity = null;
    try {
      const profiles = await admin.entities.Profile.filter({ created_by_id: user.id });
      const { key, display } = resolveUserCity(profiles?.[0]);
      if (key) {
        const userScoreIdx = scores.findIndex((s) => s.city_key === key);
        const userScore = userScoreIdx >= 0 ? scores[userScoreIdx] : null;
        const userRank = userScore ? userScoreIdx + 1 : null;
        const userPoints = userScore?.points || 0;
        userCity = {
          city: userScore?.city_display || display,
          cityKey: key,
          points: userPoints,
          rank: userRank,
          behindFifth: (userRank && userRank > 5 && topCities.length === 5)
            ? Math.max(topCities[4].points - userPoints, 0)
            : null,
        };
      }
    } catch { /* best-effort */ }

    return Response.json({
      year,
      topCities,
      userCity,
      cityOfYear: topCities[0] || null,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}