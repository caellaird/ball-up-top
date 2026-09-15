import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { normalizeCity, getWeekKey } from '../../shared/cityScore.ts';

// Returns the current week's city competition leaderboard:
//   - topCities: top 5 cities by completed challenges this week
//   - cityOfWeek: the #1 city (hero "City of the Week")
//   - userCity: the requesting user's city, its rank, and how far behind #5 it is
//
// All aggregation reads from CityWeeklyScore (one row per city per week),
// so the leaderboard loads in a single query regardless of challenge history size.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = base44.asServiceRole;
    const weekKey = getWeekKey();

    const scores = await admin.entities.CityWeeklyScore.filter({ week: weekKey });
    scores.sort((a, b) => (b.completed_count || 0) - (a.completed_count || 0));

    const topCities = scores.slice(0, 5).map((s, i) => ({
      rank: i + 1,
      city: s.city_display,
      cityKey: s.city_key,
      completedCount: s.completed_count || 0,
    }));

    let userCity = null;
    try {
      const profiles = await admin.entities.Profile.filter({ created_by_id: user.id });
      const profile = profiles?.[0];
      const rawCity = profile?.city?.trim();
      if (rawCity) {
        const { key, display } = normalizeCity(rawCity);
        const userScoreIdx = scores.findIndex((s) => s.city_key === key);
        const userScore = userScoreIdx >= 0 ? scores[userScoreIdx] : null;
        const userRank = userScore ? userScoreIdx + 1 : null;
        const userCount = userScore?.completed_count || 0;
        userCity = {
          city: display,
          cityKey: key,
          completedCount: userCount,
          rank: userRank,
          behindFifth: (userRank && userRank > 5 && topCities.length === 5)
            ? Math.max(topCities[4].completedCount - userCount, 0)
            : null,
        };
      }
    } catch { /* best-effort */ }

    return Response.json({
      weekStart: weekKey,
      topCities,
      userCity,
      cityOfWeek: topCities[0] || null,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}