import { getSportDisplay } from '@/lib/constants';

// Unique grouping key for a challenge's sport/activity.
// Custom sports are grouped by name+emoji so two different custom games stay separate.
export function getSportKey(challenge) {
  if (challenge.sport === 'custom') {
    return `custom:${challenge.custom_sport_name || 'Custom'}|${challenge.custom_sport_emoji || '🏆'}`;
  }
  return challenge.sport;
}

// Returns the sport key broken into its component parts for pre-selecting in the
// challenge flow. For custom: { sport: 'custom', customName, customEmoji }.
// For standard: { sport: key }.
export function sportKeyToChallengeProps(key) {
  if (key && key.startsWith('custom:')) {
    const rest = key.slice(7);
    const [name, emoji] = rest.split('|');
    return { sport: 'custom', customName: name || '', customEmoji: emoji || '🏆' };
  }
  return { sport: key };
}

function sortByDateAsc(a, b) {
  return new Date(a.completed_at || a.updated_date) - new Date(b.completed_at || b.updated_date);
}

// Core stat computation for a sorted (oldest-first) list of challenges.
function computeStats(sorted, userAId, userBId) {
  let aWins = 0, bWins = 0, draws = 0, others = 0;
  let streakUid = null, streakCnt = 0;
  let longestStreakUid = null, longestStreakCnt = 0;
  let scoreSumA = 0, scoreSumB = 0, scoreCount = 0;

  for (const c of sorted) {
    if (c.is_draw) {
      draws++;
      streakUid = null; streakCnt = 0;
    } else if (c.winner_id === userAId) {
      aWins++;
      if (streakUid === userAId) streakCnt++; else { streakUid = userAId; streakCnt = 1; }
    } else if (c.winner_id === userBId) {
      bWins++;
      if (streakUid === userBId) streakCnt++; else { streakUid = userBId; streakCnt = 1; }
    } else {
      others++;
      streakUid = null; streakCnt = 0;
    }
    if (streakCnt > longestStreakCnt) {
      longestStreakCnt = streakCnt;
      longestStreakUid = streakUid;
    }
    if (typeof c.score_creator === 'number' && typeof c.score_opponent === 'number') {
      if (c.created_by_id === userAId) { scoreSumA += c.score_creator; scoreSumB += c.score_opponent; }
      else if (c.created_by_id === userBId) { scoreSumA += c.score_opponent; scoreSumB += c.score_creator; }
      scoreCount++;
    }
  }

  const totalGames = aWins + bWins + draws + others;
  const last = sorted[sorted.length - 1];
  return {
    totalGames,
    aWins, bWins, draws, others,
    winRateA: totalGames > 0 ? Math.round((aWins / totalGames) * 100) : 0,
    winRateB: totalGames > 0 ? Math.round((bWins / totalGames) * 100) : 0,
    currentStreakUserId: streakUid,
    currentStreakCount: streakCnt,
    longestStreakUserId: longestStreakUid,
    longestStreakCount: longestStreakCnt,
    lastGameAt: last ? (last.completed_at || last.updated_date) : null,
    lastResult: last
      ? (last.is_draw ? 'draw' : last.winner_id === userAId ? 'A' : last.winner_id === userBId ? 'B' : 'other')
      : null,
    avgScoreA: scoreCount > 0 ? Math.round((scoreSumA / scoreCount) * 10) / 10 : null,
    avgScoreB: scoreCount > 0 ? Math.round((scoreSumB / scoreCount) * 10) / 10 : null,
  };
}

// Computes the full rivalry breakdown from completed challenge history.
// Returns { overall, sports, mostPlayedSport } where overall is the SUM of all
// sport records — guaranteeing consistency between overall and per-sport numbers.
export function computeRivalryBreakdown(history, userAId, userBId) {
  const groups = {};
  for (const c of history) {
    const key = getSportKey(c);
    if (!groups[key]) groups[key] = { key, challenges: [], sample: c };
    groups[key].challenges.push(c);
  }

  const sports = Object.values(groups).map((group) => {
    const sorted = [...group.challenges].sort(sortByDateAsc);
    const display = getSportDisplay(group.sample);
    const stats = computeStats(sorted, userAId, userBId);
    return {
      key: group.key,
      label: display.label,
      emoji: display.emoji,
      challenges: sorted,
      ...stats,
    };
  });

  // Most-played sport first; tiebreak by most recent game.
  sports.sort((a, b) => b.totalGames - a.totalGames || new Date(b.lastGameAt) - new Date(a.lastGameAt));

  // Overall = sum of all sport records (guaranteed consistent).
  const overallSorted = [...history].sort(sortByDateAsc);
  const overallStats = computeStats(overallSorted, userAId, userBId);
  const overall = {
    ...overallStats,
    sportCount: sports.length,
  };

  return {
    overall,
    sports,
    mostPlayedSport: sports[0] || null,
  };
}

// Dynamically summarizes the rivalry from real data.
export function generateRivalryStory(breakdown, nameA, nameB) {
  const { overall, sports } = breakdown;
  if (overall.totalGames === 0) return 'The rivalry is just getting started — no games recorded yet.';

  const parts = [];

  // Overall leader
  if (overall.aWins > overall.bWins) {
    parts.push(`${nameA} leads the overall series ${overall.aWins}–${overall.bWins}.`);
  } else if (overall.bWins > overall.aWins) {
    parts.push(`${nameB} leads the overall series ${overall.bWins}–${overall.aWins}.`);
  } else {
    parts.push(`These two are dead even at ${overall.aWins}–${overall.bWins}.`);
  }

  // Multi-activity
  if (sports.length > 1) {
    parts.push(`The rivalry spans ${sports.length} different activities.`);
  }

  // Dominant sport (most played, clear leader)
  if (sports.length > 0 && sports[0].totalGames >= 2) {
    const top = sports[0];
    if (top.aWins > top.bWins) {
      parts.push(`${nameA} dominates in ${top.label}, leading ${top.aWins}–${top.bWins}.`);
    } else if (top.bWins > top.aWins) {
      parts.push(`${nameB} dominates in ${top.label}, leading ${top.bWins}–${top.aWins}.`);
    }
  }

  // Sport where the overall leader is actually behind
  const overallLeader = overall.aWins > overall.bWins ? 'A' : overall.bWins > overall.aWins ? 'B' : null;
  if (overallLeader && sports.length > 1) {
    for (const s of sports) {
      if (s.totalGames < 2) continue;
      const sLeader = s.aWins > s.bWins ? 'A' : s.bWins > s.aWins ? 'B' : null;
      if (sLeader && sLeader !== overallLeader) {
        const underdog = overallLeader === 'A' ? nameB : nameA;
        parts.push(`But ${underdog} has the edge in ${s.label}.`);
        break;
      }
    }
  }

  return parts.join(' ');
}

// Generates personalized insights from the sport breakdown, from the viewer's perspective.
// selfId should be one of userAId/userBId. If neither, returns neutral insights.
export function generateRivalryInsights(breakdown, userAId, userBId, selfId, nameA, nameB) {
  const { overall, sports } = breakdown;
  if (overall.totalGames === 0) return [];

  const selfIsA = selfId === userAId;
  const selfIsB = selfId === userBId;
  const isThirdParty = !selfIsA && !selfIsB;

  const selfName = selfIsA ? nameA : selfIsB ? nameB : null;
  const rivalName = selfIsA ? nameB : selfIsB ? nameA : null;

  const selfWins = (s) => (selfIsA ? s.aWins : selfIsB ? s.bWins : 0);
  const rivalWins = (s) => (selfIsA ? s.bWins : selfIsB ? s.aWins : 0);
  const selfIdFor = () => (selfIsA ? userAId : userBId);

  const insights = [];

  // Multi-activity
  if (overall.sportCount >= 2) {
    if (isThirdParty) {
      insights.push(`⚔️ These two have competed in ${overall.sportCount} different activities.`);
    } else {
      insights.push(`⚔️ You've competed against ${rivalName} in ${overall.sportCount} different activities.`);
    }
  }

  if (!isThirdParty) {
    // Rival's worst sport (self's best)
    let bestSport = null, bestRate = -1;
    for (const s of sports) {
      if (s.totalGames < 2) continue;
      const rate = selfWins(s) / s.totalGames;
      if (rate > bestRate) { bestRate = rate; bestSport = s; }
    }
    if (bestSport && bestRate >= 0.6 && selfWins(bestSport) > rivalWins(bestSport)) {
      insights.push(`${bestSport.emoji} This is ${rivalName}'s worst sport against you — ${selfWins(bestSport)}–${rivalWins(bestSport)}.`);
    }

    // Rival's best sport (self's worst)
    let rivalBest = null, rivalBestRate = -1;
    for (const s of sports) {
      if (s.totalGames < 2) continue;
      const rate = rivalWins(s) / s.totalGames;
      if (rate > rivalBestRate) { rivalBestRate = rate; rivalBest = s; }
    }
    if (rivalBest && rivalBestRate >= 0.67 && rivalWins(rivalBest) > selfWins(rivalBest)) {
      insights.push(`${rivalBest.emoji} ${rivalName} owns the ${rivalBest.label} rivalry ${rivalWins(rivalBest)}–${selfWins(rivalBest)}.`);
    }

    // Current win streak in a sport
    for (const s of sports) {
      if (s.currentStreakCount >= 2 && s.currentStreakUserId === selfIdFor()) {
        insights.push(`🔥 You've won ${s.currentStreakCount} straight ${s.label} games against ${rivalName}.`);
        break;
      }
    }

    // Tied sport
    for (const s of sports) {
      if (s.totalGames >= 2 && s.aWins === s.bWins) {
        insights.push(`🤝 You're perfectly tied in ${s.label} at ${s.aWins}–${s.bWins}.`);
        break;
      }
    }

    // Overall vs most-played discrepancy
    if (sports.length >= 2) {
      const top = sports[0];
      const sOverall = selfWins(overall);
      const rOverall = rivalWins(overall);
      const sTop = selfWins(top);
      const rTop = rivalWins(top);
      if (sOverall > rOverall && rTop > sTop) {
        insights.push(`👀 You're ${sOverall}–${rOverall} overall, but ${rivalName} leads ${rTop}–${sTop} in your most-played sport.`);
      }
    }
  } else {
    // Third-party neutral insights
    for (const s of sports) {
      if (s.currentStreakCount >= 2) {
        const streakName = s.currentStreakUserId === userAId ? nameA : nameB;
        insights.push(`🔥 ${streakName} has won ${s.currentStreakCount} straight ${s.label} games.`);
        break;
      }
    }
    for (const s of sports) {
      if (s.totalGames >= 2 && s.aWins === s.bWins) {
        insights.push(`🤝 Perfectly tied in ${s.label} at ${s.aWins}–${s.bWins}.`);
        break;
      }
    }
  }

  return insights;
}