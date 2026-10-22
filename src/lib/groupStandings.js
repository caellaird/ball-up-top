import { getParticipants } from './challengeGroup';

// Computes ranked win-loss-draw standings for a group challenge across every
// game played. For a series it aggregates each SeriesGame; for a single
// (non-series) group challenge it uses the one recorded result. Points use a
// soccer-style table: 3 for a win, 1 for a draw. Returns rows sorted by points,
// then wins, then total points-for, each with an assigned rank.
export function computeGroupStandings(challenge, games = []) {
  const participants = getParticipants(challenge);
  const records = participants.map((p) => ({
    user_id: p.id,
    name: p.name,
    wins: 0,
    losses: 0,
    draws: 0,
    points: 0,
    points_for: 0,
    games: 0,
  }));
  const byId = Object.fromEntries(records.map((r) => [r.user_id, r]));

  const applyResult = (winnerId, isDraw, scores) => {
    participants.forEach((p) => {
      const r = byId[p.user_id];
      if (!r) return;
      r.games += 1;
      if (isDraw) {
        r.draws += 1;
        r.points += 1;
      } else if (winnerId && p.id === winnerId) {
        r.wins += 1;
        r.points += 3;
      } else {
        r.losses += 1;
      }
      const sc = scores?.find((s) => s.user_id === p.id);
      if (sc) r.points_for += Number(sc.score) || 0;
    });
  };

  if (challenge.series_type !== 'single' && games.length > 0) {
    games.forEach((g) => applyResult(g.winner_id, g.is_draw, g.participant_scores));
  } else if (challenge.status === 'completed') {
    applyResult(challenge.winner_id, challenge.is_draw, challenge.participant_scores);
  }

  records.sort((a, b) =>
    b.points - a.points || b.wins - a.wins || b.points_for - a.points_for
  );
  return records.map((r, i) => ({ ...r, rank: i + 1 }));
}