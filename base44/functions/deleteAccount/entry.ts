import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const uid = user.id;
    const admin = base44.asServiceRole;

    // Purge all of the user's own data (service role bypasses RLS).
    await Promise.all([
      admin.entities.Post.deleteMany({ created_by_id: uid }),
      admin.entities.Comment.deleteMany({ created_by_id: uid }),
      admin.entities.Like.deleteMany({ created_by_id: uid }),
      admin.entities.Vote.deleteMany({ created_by_id: uid }),
      admin.entities.MessageReaction.deleteMany({ created_by_id: uid }),
      admin.entities.UserStats.deleteMany({ created_by_id: uid }),
      admin.entities.Profile.deleteMany({ created_by_id: uid }),
      admin.entities.SeriesGame.deleteMany({ created_by_id: uid }),
      admin.entities.ChallengeParticipant.deleteMany({ created_by_id: uid }),
      admin.entities.DailyQuestionAnswer.deleteMany({ created_by_id: uid }),
      admin.entities.Notification.deleteMany({ user_id: uid }),
      admin.entities.Message.deleteMany({ created_by_id: uid }),
      admin.entities.ThreadRead.deleteMany({ created_by_id: uid }),
      admin.entities.Friend.deleteMany({ $or: [{ created_by_id: uid }, { addressee_id: uid }] }),
      admin.entities.Award.deleteMany({ $or: [{ created_by_id: uid }, { recipient_id: uid }] }),
      admin.entities.Challenge.deleteMany({ $or: [{ created_by_id: uid }, { opponent_id: uid }, { opponent_ids: uid }] }),
    ]);

    // Remove solo threads (where this user is the only participant).
    const threads = await admin.entities.Thread.filter({ participant_ids: uid });
    const solo = threads.filter((t) => (t.participant_ids || []).length <= 1);
    if (solo.length) await admin.entities.Thread.deleteMany({ id: { $in: solo.map((t) => t.id) } });

    // Remove the account record itself (service role only — satisfies Apple's full-deletion requirement).
    await admin.entities.User.delete(uid);

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}