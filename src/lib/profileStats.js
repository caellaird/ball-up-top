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
  try {
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
      .filter((g) => g.challenge_id === c.id && (g.winner_name || g.is_draw))
      .forEach((g) => {
        results.push({
          sport: display.label,
          emoji: display.emoji,
          date: g.created_date,
          won: g.winner_name === myName,
          draw: !!g.is_draw,
        });
      });
  });

  singleCompleted.forEach((c) => {
    const display = getSportDisplay(c);
    if (c.is_draw) {
      results.push({
        sport: display.label,
        emoji: display.emoji,
        date: c.updated_date,
        won: false,
        draw: true,
      });
      return;
    }
    if (!c.winner_id) return;
    results.push({
      sport: display.label,
      emoji: display.emoji,
      date: c.updated_date,
      won: c.winner_id === userId,
      draw: false,
    });
  });

  results.sort((a, b) => new Date(b.date) - new Date(a.date));

  const wins = results.filter((r) => r.won).length;
  const draws = results.filter((r) => r.draw).length;
  const losses = results.filter((r) => !r.won && !r.draw).length;
  const winPct = wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;

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
    if (!sportMap[r.sport]) sportMap[r.sport] = { sport: r.sport, emoji: r.emoji, games: 0, wins: 0, losses: 0, draws: 0, results: [] };
    sportMap[r.sport].games++;
    if (r.won) { sportMap[r.sport].wins++; sportMap[r.sport].results.push('W'); }
    else if (r.draw) { sportMap[r.sport].draws++; sportMap[r.sport].results.push('D'); }
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
      draws: s.draws,
      currentStreak: streak,
      winPct: s.wins + s.losses > 0 ? Math.round((s.wins / (s.wins + s.losses)) * 100) : 0,
    };
  });

  sportBreakdown.sort((a, b) => b.games - a.games);

  // Public events the user participated in that have ended — either auto-ended
  // 2h after start, or cancelled by the owner. Creators count too, since the
  // creator is added as an accepted participant on event creation.
  let publicEvents = 0;
  try {
    const myPart = await base44.entities.EventParticipant.filter({ user_id: userId, status: 'accepted' });
    const myEventIds = new Set((myPart || []).map((p) => p.event_id).filter(Boolean));
    if (myEventIds.size > 0) {
      const [ended, cancelled] = await Promise.all([
        base44.entities.PublicEvent.filter({ status: 'ended' }),
        base44.entities.PublicEvent.filter({ status: 'cancelled' }),
      ]);
      const finished = [...(ended || []), ...(cancelled || [])].filter((e) => myEventIds.has(e.id));
      publicEvents = new Set(finished.map((e) => e.id)).size;
    }
  } catch { /* best-effort */ }

  return {
    wins,
    losses,
    draws,
    publicEvents,
    winPct,
    currentStreak,
    longestStreak,
    challengesCompleted: completed.length,
    challengesCreated: createdCount,
    topActivities: sportBreakdown.slice(0, 3),
    favoriteCompetition: sportBreakdown[0]?.sport || null,
  };
  } catch (e) {
    return null;
  }
}

export async function computeHeadToHead(currentUserId, profileOwnerId) {
  const [asCreator, asOpponent] = await Promise.all([
    base44.entities.Challenge.filter({ created_by_id: currentUserId, opponent_id: profileOwnerId, status: 'completed' }),
    base44.entities.Challenge.filter({ created_by_id: profileOwnerId, opponent_id: currentUserId, status: 'completed' }),
  ]);

  const all = [...asCreator, ...asOpponent];
  const myWins = all.filter((c) => c.winner_id === currentUserId).length;
  const theirWins = all.filter((c) => c.winner_id === profileOwnerId).length;
  const draws = all.filter((c) => c.is_draw).length;

  const sportMap = {};
  all.forEach((c) => {
    const display = getSportDisplay(c);
    const sport = display.label;
    if (!sportMap[sport]) sportMap[sport] = { sport, emoji: display.emoji, myWins: 0, theirWins: 0, draws: 0, total: 0 };
    sportMap[sport].total++;
    if (c.is_draw) sportMap[sport].draws++;
    else if (c.winner_id === currentUserId) sportMap[sport].myWins++;
    else if (c.winner_id === profileOwnerId) sportMap[sport].theirWins++;
  });

  return {
    total: all.length,
    myWins,
    theirWins,
    draws,
    bySport: Object.values(sportMap).sort((a, b) => b.total - a.total),
  };
}