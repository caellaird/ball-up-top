import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Records a single game result toward every participant's UserStats. Runs as the
// service role so it can update opponents' stats — UserStats.update is locked to
// owner-only on the client, so challenge completion must go through this function.
export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { challengeId, winnerId } = body || {};
    if (!challengeId || !winnerId) {
      return Response.json({ error: 'challengeId and winnerId are required' }, { status: 400 });
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

    for (const p of participants) {
      const won = p.id === winnerId;
      const existing = await admin.entities.UserStats.filter({ created_by_id: p.id });
      let stats = existing[0];
      if (!stats) {
        stats = await admin.entities.UserStats.create({
          user_name: p.name,
          games_played: 0,
          games_won: 0,
          losses: 0,
          current_streak: 0,
          longest_streak: 0,
        });
      }
      await admin.entities.UserStats.update(stats.id, {
        games_played: (stats.games_played || 0) + 1,
        games_won: (stats.games_won || 0) + (won ? 1 : 0),
        losses: (stats.losses || 0) + (won ? 0 : 1),
        current_streak: won ? (stats.current_streak || 0) + 1 : 0,
        longest_streak: won
          ? Math.max((stats.current_streak || 0) + 1, stats.longest_streak || 0)
          : stats.longest_streak || 0,
      });
    }

    return Response.json({ success: true, recorded: participants.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}