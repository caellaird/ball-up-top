import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, MessageCircle, Share2, Swords } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { base44 } from '@/api/base44Client';
import { formatDistanceToNow } from 'date-fns';
import { getOrCreateProfile } from '@/lib/ensureProfile';
import MediaViewer from '@/components/feed/MediaViewer';
import ChallengeVote from '@/components/feed/ChallengeVote';

export default function PostCard({ post, reactions, onReact, userId }) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [viewerIndex, setViewerIndex] = useState(null);

  const loadComments = async () => {
    const data = await base44.entities.Comment.filter({ post_id: post.id }, '-created_date');
    setComments(data);
    setShowComments(true);
  };

  const handleShare = async () => {
    const shareText = post.score_text || post.body;
    const shareUrl = `${window.location.origin}/profile/${post.author_username || 'me'}`;
    if (navigator.share) {
      await navigator.share({ title: `${post.author_name} on Ball Up Top`, text: shareText, url: shareUrl });
    } else {
      await navigator.clipboard.writeText(`${shareText} — ${shareUrl}`);
    }
  };

  const submitComment = async () => {
    if (!commentText.trim()) return;
    const user = await base44.auth.me();
    const profile = await getOrCreateProfile(user);
    const c = await base44.entities.Comment.create({ post_id: post.id, author_name: user.full_name, author_avatar: profile.avatar_url, body: commentText });
    await base44.entities.Post.update(post.id, { comment_count: (post.comment_count || 0) + 1 });
    setComments([c, ...comments]);
    setCommentText('');
  };

  return (
    <article className="bg-card rounded-3xl shadow-sm p-4 mb-4 mx-4">
      <div className="flex items-center gap-3 mb-3">
        <Link to={`/profile/${post.author_username || 'me'}`}>
          <Avatar className="w-11 h-11 border-2 border-primary/20">
            <AvatarImage src={post.author_avatar} />
            <AvatarFallback>{post.author_name?.[0] || 'U'}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{post.author_name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {post.location_name ? `📍 ${post.location_name} · ` : ''}
            {formatDistanceToNow(new Date(post.created_date), { addSuffix: true })}
          </p>
        </div>
        {post.game_emoji && <span className="text-2xl">{post.game_emoji}</span>}
      </div>

      {post.score_text && (
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl px-4 py-2 mb-3 flex items-center justify-between">
          <span className="font-heading font-bold text-sm">{post.score_text}</span>
          <Swords className="w-4 h-4 text-secondary" />
        </div>
      )}

      {post.challenge_id && <ChallengeVote post={post} userId={userId} />}

      <p className="text-sm whitespace-pre-wrap mb-3">{post.body}</p>

      {post.tagged_user_names?.length > 0 && (
        <p className="text-xs text-muted-foreground mb-3">
          with{' '}
          {post.tagged_user_names.map((name, i) => {
            const username = post.tagged_usernames?.[i];
            return (
              <React.Fragment key={post.tagged_user_ids?.[i] || name}>
                {i > 0 && ', '}
                <Link to={username ? `/profile/${username}` : '#'} className="font-semibold text-primary">
                  {username ? `@${username}` : name}
                </Link>
              </React.Fragment>
            );
          })}
        </p>
      )}

      {post.media_urls?.length > 0 && (
        <div className={`grid gap-1.5 mb-3 ${post.media_urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {post.media_urls.slice(0, 5).map((url, i) => (
            <button key={url} onClick={() => setViewerIndex(i)} className="block">
              <img src={url} alt="" className="rounded-2xl object-cover w-full h-40" />
            </button>
          ))}
        </div>
      )}

      {viewerIndex !== null && (
        <MediaViewer urls={post.media_urls} initialIndex={viewerIndex} onClose={() => setViewerIndex(null)} />
      )}

      <div className="flex items-center gap-5 text-muted-foreground text-sm pt-1">
        <button onClick={() => onReact(post, 'like')} className={`flex items-center gap-1.5 ${reactions.liked ? 'text-primary font-semibold' : ''}`}>
          ❤️ {post.like_count || 0}
        </button>
        <button onClick={() => onReact(post, 'fire')} className={`flex items-center gap-1.5 ${reactions.fired ? 'text-accent font-semibold' : ''}`}>
          <Flame className={`w-4 h-4 ${reactions.fired ? 'fill-accent text-accent' : ''}`} /> {post.fire_count || 0}
        </button>
        <button onClick={() => onReact(post, 'trash_talk')} className={`flex items-center gap-1.5 ${reactions.trashed ? 'text-secondary font-semibold' : ''}`}>
          🗑️ {post.trash_count || 0}
        </button>
        <button onClick={loadComments} className="flex items-center gap-1.5">
          <MessageCircle className="w-4 h-4" /> {post.comment_count || 0}
        </button>
        <button className="ml-auto" onClick={handleShare}><Share2 className="w-4 h-4" /></button>
      </div>

      {showComments && (
        <div className="mt-3 pt-3 border-t border-border space-y-2">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2 text-sm">
              <Avatar className="w-6 h-6 mt-0.5">
                <AvatarImage src={c.author_avatar} />
                <AvatarFallback className="text-[10px]">{c.author_name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <p><span className="font-semibold">{c.author_name}: </span><span>{c.body}</span></p>
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 text-sm bg-muted rounded-full px-3 py-1.5 outline-none"
              onKeyDown={(e) => e.key === 'Enter' && submitComment()}
            />
            <button onClick={submitComment} className="text-primary text-sm font-semibold">Post</button>
          </div>
        </div>
      )}
    </article>
  );
}