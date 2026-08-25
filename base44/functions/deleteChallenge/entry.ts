import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Full cascade delete of a challenge and everything attached to it, across all owners.
// Runs as the service role so it can remove other participants' posts, series games,
// awards, and notifications — the client can only delete the caller's own records.
export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { challengeId } = body || {};
    if (!challengeId) return Response.json({ error: 'challengeId is required' }, { status: 400 });

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = base44.asServiceRole;
    const challenge = await admin.entities.Challenge.get(challengeId);
    if (!challenge) return Response.json({ error: 'Challenge not found' }, { status: 404 });

    const opponentIds = challenge.opponent_ids?.length
      ? challenge.opponent_ids
      : (challenge.opponent_id ? [challenge.opponent_id] : []);
    const isParticipant = challenge.created_by_id === user.id || opponentIds.includes(user.id);
    if (!isParticipant) return Response.json({ error: 'Forbidden' }, { status: 403 });

    await Promise.all([
      admin.entities.Post.deleteMany({ challenge_id: challengeId }),
      admin.entities.SeriesGame.deleteMany({ challenge_id: challengeId }),
      admin.entities.ChallengeParticipant.deleteMany({ challenge_id: challengeId }),
      admin.entities.Award.deleteMany({ challenge_id: challengeId }),
      admin.entities.Notification.deleteMany({ link: `/challenges/${challengeId}` }),
    ]);
    await admin.entities.Challenge.delete(challengeId);

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}