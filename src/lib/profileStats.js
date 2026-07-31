import { base44 } from '@/api/base44Client';
import { getSportDisplay } from '@/lib/constants';

// Resolves the display name this user played under in a given challenge (creator name,
// or their entry in opponent_names/opponent_ids).
function myNameInChallenge(c, userId) {
  if (c.created_by_id === userId) return c.creator_name;
  const ids = c.opponent_ids?.length ? c.opponent_ids : [c.opponent_id];
  const names = c.opponent_names?.length ? c.opponent_names : [c.opponent_name];
  const idx = ids.indexOf(userId);
  return idx >= 0 ? names[idx] : null;
}

export async function computeProfileStats(userId) {
  const [asCreator, asOpponent] = await Promise.all([
    base44.entities.Challenge.filter({ created_by_id: userId }),
    base44.entities.Challenge.list('-created_date', 300),
  ]);

  const asOpponentMine = asOpponent.filter((c) => c.opponent_id === userId || c.opponent_ids?.includes(userId));
  const seen = new Set();
  const all = [...asCreator, ...asOpponentMine].filter((c) => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });
  const completed = all.filter((c) => c.status === 'completed');
  const createdCount = all.filter((c) => c.created_by_id === userId).length;

  const seriesCompleted = completed.filter((c) => c.series_type !== 'single');
  const singleCompleted = completed.filter((c) => c.series_type === 'single');

  // Series are made up of individual games — each game counts on its own toward the record,
  // not just the series' final outcome.
  let seriesGames = [];
  if (seriesCompleted.length > 0) {
    const challengeIds = new Set(seriesCompleted.map((c) => c.id));
    const allGames = await base44.entities.SeriesGame.list('-created_date', 500);
    seriesGames = allGames.filter((g) => challengeIds.has(g.challenge_id));
  }

  // Build a flat list of individual game results: { sport, emoji, date, won }
  const results = [];

  seriesCompleted.forEach((c) => {
    const myName = myNameInChallenge(c, userId);
    if (!myName) return;
    const display = getSportDisplay(c);
    seriesGames
      .filter((g) => g.challenge_id === c.id && g.winner_name)
      .forEach((g) => {
        results.push({
          sport: display.label,
          emoji: display.emoji,
          date: g.created_date,
          won: g.winner_name === myName,
        });
      });
  });

  singleCompleted.forEach((c) => {
    if (!c.winner_id) return;
    const display = getSportDisplay(c);
    results.push({
      sport: display.label,
      emoji: display.emoji,
      date: c.updated_date,
      won: c.winner_id === userId,
    });
  });

  results.sort((a, b) => new Date(b.date) - new Date(a.date));

  const wins = results.filter((r) => r.won).length;
  const losses = results.filter((r) => !r.won).length;
  const winPct = results.length > 0 ? Math.round((wins / results.length) * 100) : 0;

  let currentStreak = 0;
  for (const r of results) {
    if (r.won) currentStreak++;
    else break;
  }

  let longestStreak = 0;
  let tempStreak = 0;
  [...results].reverse().forEach((r) => {
    if (r.won) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  });

  const sportMap = {};
  [...results].reverse().forEach((r) => {
    if (!sportMap[r.sport]) sportMap[r.sport] = { sport: r.sport, emoji: r.emoji, games: 0, wins: 0, losses: 0, results: [] };
    sportMap[r.sport].games++;
    if (r.won) { sportMap[r.sport].wins++; sportMap[r.sport].results.push('W'); }
    else { sportMap[r.sport].losses++; sportMap[r.sport].results.push('L'); }
  });

  const sportBreakdown = Object.values(sportMap).map((s) => {
    let streak = 0;
    for (const r of [...s.results].reverse()) {
      if (r === 'W') streak++;
      else break;
    }
    return {
      sport: s.sport,
      emoji: s.emoji,
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
    const display = getSportDisplay(c);
    const sport = display.label;
    if (!sportMap[sport]) sportMap[sport] = { sport, emoji: display.emoji, myWins: 0, theirWins: 0, total: 0 };
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