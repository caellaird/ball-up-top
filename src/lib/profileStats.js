import { base44 } from '@/api/base44Client';

export async function computeProfileStats(userId) {
  const [asCreator, asOpponent] = await Promise.all([
    base44.entities.Challenge.filter({ created_by_id: userId }),
    base44.entities.Challenge.filter({ opponent_id: userId }),
  ]);

  const all = [...asCreator, ...asOpponent];
  const completed = all.filter((c) => c.status === 'completed');
  const createdCount = all.filter((c) => c.created_by_id === userId).length;

  const wins = completed.filter((c) => c.winner_id === userId).length;
  const losses = completed.filter((c) => c.winner_id && c.winner_id !== userId).length;
  const winPct = completed.length > 0 ? Math.round((wins / completed.length) * 100) : 0;

  const sortedCompleted = [...completed].sort(
    (a, b) => new Date(b.updated_date) - new Date(a.updated_date)
  );

  let currentStreak = 0;
  for (const c of sortedCompleted) {
    if (c.winner_id === userId) currentStreak++;
    else if (c.winner_id) break;
  }

  let longestStreak = 0;
  let tempStreak = 0;
  [...sortedCompleted].reverse().forEach((c) => {
    if (c.winner_id === userId) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else if (c.winner_id) {
      tempStreak = 0;
    }
  });

  const sportMap = {};
  sortedCompleted.forEach((c) => {
    const sport = c.sport || 'custom';
    if (!sportMap[sport]) sportMap[sport] = { sport, games: 0, wins: 0, losses: 0, results: [] };
    sportMap[sport].games++;
    if (c.winner_id === userId) { sportMap[sport].wins++; sportMap[sport].results.push('W'); }
    else if (c.winner_id) { sportMap[sport].losses++; sportMap[sport].results.push('L'); }
  });

  const sportBreakdown = Object.values(sportMap).map((s) => {
    let streak = 0;
    for (const r of [...s.results].reverse()) {
      if (r === 'W') streak++;
      else break;
    }
    return {
      sport: s.sport,
      games: s.games,
      wins: s.wins,
      losses: s.losses,
      currentStreak: streak,
      winPct: s.games > 0 ? Math.round((s.wins / s.games) * 100) : 0,
    };
  });

  sportBreakdown.sort((a, b) => b.games - a.games);

  return {
    wins,
    losses,
    winPct,
    currentStreak,
    longestStreak,
    challengesCompleted: completed.length,
    challengesCreated: createdCount,
    topActivities: sportBreakdown.slice(0, 3),
    favoriteCompetition: sportBreakdown[0]?.sport || null,
  };
}

export async function computeHeadToHead(currentUserId, profileOwnerId) {
  const [asCreator, asOpponent] = await Promise.all([
    base44.entities.Challenge.filter({ created_by_id: currentUserId, opponent_id: profileOwnerId, status: 'completed' }),
    base44.entities.Challenge.filter({ created_by_id: profileOwnerId, opponent_id: currentUserId, status: 'completed' }),
  ]);

  const all = [...asCreator, ...asOpponent];
  const myWins = all.filter((c) => c.winner_id === currentUserId).length;
  const theirWins = all.filter((c) => c.winner_id === profileOwnerId).length;

  const sportMap = {};
  all.forEach((c) => {
    const sport = c.sport || 'custom';
    if (!sportMap[sport]) sportMap[sport] = { sport, myWins: 0, theirWins: 0, total: 0 };
    sportMap[sport].total++;
    if (c.winner_id === currentUserId) sportMap[sport].myWins++;
    else if (c.winner_id === profileOwnerId) sportMap[sport].theirWins++;
  });

  return {
    total: all.length,
    myWins,
    theirWins,
    bySport: Object.values(sportMap).sort((a, b) => b.total - a.total),
  };
}