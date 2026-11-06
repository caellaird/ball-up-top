import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { awardCityPoints } from '../../shared/cityScore.ts';

// Adds a city point for a post that counts toward the yearly city competition.
// Eligible posts are scorecard posts (highlight cards) and league recap posts.
// Challenge result posts are excluded: recordGameResult already scores the
// completed challenge, so counting the post too would double-count.
//
// Idempotent through Post.city_points_awarded, so re-sends never double-count.
export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { postId } = body || {};
    if (!postId) return Response.json({ error: 'postId is required' }, { status: 400 });

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = base44.asServiceRole;
    const post = await admin.entities.Post.get(postId).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!post) return Response.json({ error: 'Post not found' }, { status: 404 });
    if (post.created_by_id !== user.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
    if (post.city_points_awarded) return Response.json({ awarded: false, reason: 'already_counted' });

    const isLeaguePost = !!post.league_id;
    const isScorecard = post.post_type === 'highlight_card';
    if (post.challenge_id || (!isLeaguePost && !isScorecard)) {
      return Response.json({ awarded: false, reason: 'not_eligible' });
    }

    try {
      const attribution = await awardCityPoints(admin, user.id, 1);
      await admin.entities.Post.update(post.id, {
        city_points_awarded: true,
        city_attribution: attribution?.key || '',
      });
      return Response.json({ awarded: !!attribution, city: attribution?.display || '' });
    } catch (e) {
      return Response.json({ awarded: false, error: e.message });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}