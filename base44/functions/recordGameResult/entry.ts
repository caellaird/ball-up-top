import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { normalizeCity, getWeekKey } from '../../shared/cityScore.ts';
import { processRivalries } from '../../shared/rivalries.ts';

// Records a single game result toward every participant's UserStats. Runs as the
// service role so it can update opponents' stats — UserStats.update is locked to
// owner-only on the client, so challenge completion must go through this function.
//
// Also counts the city competition score exactly once per completed challenge:
// when challenge.status === 'completed' and city_score_counted is not yet true,
// the completing user's profile city gets +1 on the weekly CityWeeklyScore row.
// The city_score_counted flag makes this idempotent — page refreshes, result
// edits, or repeated calls never double-count.
//
// endSeries: when true, computes the overall series winner from the challenge's
// creator_games_won / opponent_games_won, closes the series (status -> completed),
// and records exactly ONE result to each participant's record. Used by the
// "End Series" action so a series can be closed without logging another game.
// Refuses if the series is already completed (prevents double-ending).
export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { challengeId, winnerId: suppliedWinnerId, isDraw: suppliedIsDraw, skipStats, endSeries } = body || {};
    if (!challengeId) {
      return Response.json({ error: 'challengeId is required' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = base44.asServiceRole;
    const challenge = await admin.entities.Challenge.get(challengeId);
    if (!challenge) return Response.json({ error: 'Challenge not found' }, { status: 404 });

    const opponentIds = challenge.opponent_ids?.length
      ? challenge.opponent_ids
      : (challenge.opponent_id ? [challenge.opponent_id] : []);
    const opponentNames = challenge.opponent_names?.length
      ? challenge.opponent_names
      : (challenge.opponent_name ? [challenge.opponent_name] : []);

    // Only a participant may record results for this challenge.
    const isParticipant = challenge.created_by_id === user.id || opponentIds.includes(user.id);
    if (!isParticipant) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const participants = [
      { id: challenge.created_by_id, name: challenge.creator_name },
      ...opponentIds.map((id, i) => ({ id, name: opponentNames[i] || '' })),
    ].filter((p) => p.id && p.name);

    let winnerId = suppliedWinnerId || null;
    let isDraw = !!suppliedIsDraw;

    // --- End Series mode: compute winner from the series score and close it ---
    if (endSeries) {
      if (challenge.series_type === 'single') {
        return Response.json({ error: 'Not a series' }, { status: 400 });
      }
      if (challenge.status === 'completed') {
        return Response.json({ error: 'Series already ended' }, { status: 409 });
      }

      const creatorWins = challenge.creator_games_won || 0;
      const opponentWins = challenge.opponent_games_won || 0;
      const seriesIsDraw = creatorWins === opponentWins;
      // Opponent side is a group for multiplayer — use the first opponent as the
      // representative winner, matching the existing finalizeSeries behavior.
      const seriesWinnerId = seriesIsDraw
        ? ''
        : (creatorWins > opponentWins
            ? challenge.created_by_id
            : (opponentIds[0] || challenge.opponent_id));
      const winnerName = seriesIsDraw
        ? ''
        : (participants.find((p) => p.id === seriesWinnerId)?.name || '');

      await admin.entities.Challenge.update(challengeId, {
        status: 'completed',
        score_creator: creatorWins,
        score_opponent: opponentWins,
        winner_id: seriesWinnerId,
        winner_name: winnerName,
        is_draw: seriesIsDraw,
        completed_at: new Date().toISOString(),
      });

      // Reflect the update on the in-memory copy so the city/rivalry block below
      // sees status === 'completed'.
      challenge.status = 'completed';
      challenge.score_creator = creatorWins;
      challenge.score_opponent = opponentWins;
      challenge.winner_id = seriesWinnerId;
      challenge.winner_name = winnerName;
      challenge.is_draw = seriesIsDraw;

      winnerId = seriesWinnerId;
      isDraw = seriesIsDraw;
    }

    if (!skipStats && !isDraw && !winnerId) {
      return Response.json({ error: 'winnerId is required when not a draw' }, { status: 400 });
    }

    // --- Stats recording (skipped when skipStats=true) ---
    if (!skipStats) {
      for (const p of participants) {
        const won = !isDraw && p.id === winnerId;
        const existing = await admin.entities.UserStats.filter({ created_by_id: p.id });
        let stats = existing[0];
        if (!stats) {
          stats = await admin.entities.UserStats.create({
            user_name: p.name,
            games_played: 0,
            games_won: 0,
            losses: 0,
            draws: 0,
            current_streak: 0,
            longest_streak: 0,
          });
        }
        await admin.entities.UserStats.update(stats.id, {
          games_played: (stats.games_played || 0) + 1,
          games_won: (stats.games_won || 0) + (won ? 1 : 0),
          losses: (stats.losses || 0) + (!isDraw && !won ? 1 : 0),
          draws: (stats.draws || 0) + (isDraw ? 1 : 0),
          current_streak: won ? (stats.current_streak || 0) + 1 : 0,
          longest_streak: won
            ? Math.max((stats.current_streak || 0) + 1, stats.longest_streak || 0)
            : stats.longest_streak || 0,
        });
      }
    }

    // --- City competition score (idempotent, once per completed challenge) ---
    // Runs regardless of skipStats. Only fires when the challenge is actually
    // completed (status === 'completed') and hasn't been counted yet.
    if (challenge.status === 'completed' && !challenge.city_score_counted) {
      try {
        const profiles = await admin.entities.Profile.filter({ created_by_id: user.id });
        const profile = profiles?.[0];
        const rawCity = profile?.city?.trim();
        const weekKey = getWeekKey();

        if (rawCity) {
          const { key, display } = normalizeCity(rawCity);
          const existing = await admin.entities.CityWeeklyScore.filter({ city_key: key, week: weekKey });
          let score = existing[0];
          if (!score) {
            score = await admin.entities.CityWeeklyScore.create({
              city_key: key,
              city_display: display,
              week: weekKey,
              completed_count: 1,
            });
          } else {
            await admin.entities.CityWeeklyScore.update(score.id, {
              completed_count: (score.completed_count || 0) + 1,
            });
          }
          await admin.entities.Challenge.update(challengeId, {
            city_score_counted: true,
            city_attribution: key,
            leaderboard_week: weekKey,
            completed_at: new Date().toISOString(),
          });
        } else {
          // No city in profile — mark as counted to prevent future counting.
          // The user is prompted to add their city in the Explore page.
          await admin.entities.Challenge.update(challengeId, {
            city_score_counted: true,
            leaderboard_week: weekKey,
            completed_at: new Date().toISOString(),
          });
        }

        // Rivalry processing — runs after city_score_counted is set so it
        // only fires once per completed challenge. Wrapped in its own try
        // so a rivalry failure doesn't roll back city scoring.
        try {
          await processRivalries(admin, challenge, winnerId, isDraw, user);
        } catch (rErr) {
          // Best-effort: rivalry processing failure is non-fatal.
        }
      } catch (e) {
        // Best-effort: don't fail the result recording if city scoring fails.
      }
    }

    return Response.json({ success: true, recorded: skipStats ? 0 : participants.length, draw: !!isDraw, winnerId: winnerId || '' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}