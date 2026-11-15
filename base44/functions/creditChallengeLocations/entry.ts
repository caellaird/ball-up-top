import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { creditChallengeParticipants } from '../../shared/locationTally.ts';

// Credits one completed-challenge count to every participant's home city and
// state. Called by the "Credit Challenge Locations" workflow the moment a
// challenge's status flips to completed, and safe to call repeatedly —
// ChallengeLocationCredit rows make each participant's credit idempotent.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const challengeId = body?.challengeId || body?.challenge_id;
    if (!challengeId) return Response.json({ error: 'challengeId is required' }, { status: 400 });

    const admin = base44.asServiceRole;
    const challenge = await admin.entities.Challenge.get(challengeId)
      .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!challenge) return Response.json({ error: 'Challenge not found' }, { status: 404 });

    const participantIds = [
      challenge.created_by_id,
      ...(challenge.opponent_ids?.length
        ? challenge.opponent_ids
        : (challenge.opponent_id ? [challenge.opponent_id] : [])),
    ];
    if (user.role !== 'admin' && !participantIds.includes(user.id)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (challenge.status !== 'completed') {
      return Response.json({ credited: 0, skipped: [], reason: 'not_completed' });
    }

    const result = await creditChallengeParticipants(admin, challenge);
    return Response.json({ challengeId, ...result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}