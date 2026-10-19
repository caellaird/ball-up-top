import { base44 } from '@/api/base44Client';
import { getSportDisplay } from '@/lib/constants';

export async function computeProfileStats(userId) {
  try {
  // Sequential awaits (not Promise.all) to avoid rate-limit bursts.
  const asCreator = await base44.entities.Challenge.filter({ created_by_id: userId });
  const asOpponent = await base44.entities.Challenge.list('-created_date', 300);
  const asRivalA = await base44.entities.Rivalry.filter({ user_a_id: userId });
  const asRivalB = await base44.entities.Rivalry.filter({ user_b_id: userId });
  const userPosts = await base44.entities.Post.filter({ created_by_id: userId }, '-created_date', 100);

  const asOpponentMine = asOpponent.filter((c) => c.opponent_id === userId || c.opponent_ids?.includes(userId));
  const seen = new Set();
  const all = [...asCreator, ...asOpponentMine].filter((c) => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });
  const completed = all.filter((c) => c.status === 'completed');
  const createdCount = all.filter((c) => c.created_by_id === userId).length;
  const challengeById = new Map(all.map((c) => [c.id, c]));

  // Each result counts toward the player's overall record:
  //  - A single (non-series) completed challenge = ONE result (W/L/D).
  //  - A series challenge = ONE result PER published game (each SeriesGame),
  //    counted even while the series is still open. The series' overall
  //    outcome is NOT counted separately, so there is no double counting.
  const results = [];
  const seriesChallengeIds = new Set();

  all.forEach((c) => {
    const display = getSportDisplay(c);
    const isParticipant = c.created_by_id === userId || c.opponent_id === userId || c.opponent_ids?.includes(userId);
    if (!isParticipant) return;

    if (c.series_type !== 'single') {
      // Series — each published game is counted below via the SeriesGame fetch.
      seriesChallengeIds.add(c.id);
      return;
    }

    // Single game — only count when completed.
    if (c.status !== 'completed') return;
    if (c.is_draw) {
      results.push({ sport: display.label, emoji: display.emoji, date: c.completed_at || c.updated_date, won: false, draw: true });
      return;
    }
    if (!c.winner_id) return;
    results.push({ sport: display.label, emoji: display.emoji, date: c.completed_at || c.updated_date, won: c.winner_id === userId, draw: false });
  });

  // Fetch series games and count each one for series challenges the user is in.
  if (seriesChallengeIds.size) {
    const seriesGames = await base44.entities.SeriesGame.list('-created_date', 500);
    seriesGames.forEach((g) => {
      if (!seriesChallengeIds.has(g.challenge_id)) return;
      const c = challengeById.get(g.challenge_id);
      if (!c) return;
      const display = getSportDisplay(c);
      if (g.is_draw) {
        results.push({ sport: display.label, emoji: display.emoji, date: g.created_date, won: false, draw: true });
        return;
      }
      if (g.winner_id) {
        results.push({ sport: display.label, emoji: display.emoji, date: g.created_date, won: g.winner_id === userId, draw: false });
        return;
      }
      // Legacy series games (logged before winner_id was stored): derive the
      // winner side from the two scores so historical results still count.
      const sc = g.score_creator ?? 0;
      const so = g.score_opponent ?? 0;
      if (sc === so) return; // can't determine a winner
      const isCreator = c.created_by_id === userId;
      const creatorWon = sc > so;
      const won = isCreator ? creatorWon : !creatorWon;
      results.push({ sport: display.label, emoji: display.emoji, date: g.created_date, won, draw: false });
    });
  }

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

  // Unique opponents across all challenges
  const opponentIds = new Set();
  all.forEach((c) => {
    if (c.created_by_id === userId) {
      (c.opponent_ids?.length ? c.opponent_ids : c.opponent_id ? [c.opponent_id] : [])
        .forEach((id) => id && opponentIds.add(id));
    } else {
      opponentIds.add(c.created_by_id);
    }
  });

  const rivalries = [...asRivalA, ...asRivalB];
  const gameMoments = userPosts.filter((p) => p.challenge_id).length;

  return {
    wins,
    losses,
    draws,
    totalGames: wins + losses + draws,
    winPct,
    currentStreak,
    longestStreak,
    challengesCompleted: completed.length,
    challengesCreated: createdCount,
    topActivities: sportBreakdown.slice(0, 3),
    sportsBreakdown: sportBreakdown,
    favoriteCompetition: sportBreakdown[0]?.sport || null,
    rivalriesCount: rivalries.length,
    gameMoments,
    uniqueOpponents: opponentIds.size,
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