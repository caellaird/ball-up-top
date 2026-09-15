import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Share2, Swords, Pencil, Trash2, Flag } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { base44 } from '@/api/base44Client';
import { format, formatDistanceToNow } from 'date-fns';
import { getOrCreateProfile } from '@/lib/ensureProfile';
import { usePhotoViewer } from '@/lib/photoViewer';
import PostEditSheet from '@/components/feed/PostEditSheet';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import ReportSheet from '@/components/shared/ReportSheet';
import FriendButton from '@/components/profile/FriendButton';

export default function PostCard({ post, reactions, onReact, userId, currentUserName, onDeleted, friendRecordByUserId }) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const { open: openPhotoViewer } = usePhotoViewer();
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editState, setEditState] = useState({});

  const loadComments = async () => {
    const data = await base44.entities.Comment.filter({ post_id: post.id }, '-created_date');
    setComments(data);
    setShowComments(true);
  };

  const body = editState.body ?? post.body;
  const scoreText = editState.score_text ?? post.score_text;
  const mediaUrls = editState.media_urls ?? post.media_urls;
  const isEdited = editState.is_edited ?? post.is_edited;

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
    const c = await base44.entities.Comment.create({ post_id: post.id, author_name: user.full_name, author_username: profile.username, author_avatar: profile.avatar_url, body: commentText });
    await base44.entities.Post.update(post.id, { comment_count: (post.comment_count || 0) + 1 });
    setComments([c, ...comments]);
    setCommentText('');
  };

  const deletePost = async () => {
    setDeleting(true);
    await base44.entities.Post.delete(post.id);
    setDeleting(false);
    setShowDelete(false);
    onDeleted?.(post.id);
  };

  const allNames = post.tagged_user_names?.length ? [post.author_name, ...post.tagged_user_names] : null;

  return (
    <article className="bg-card rounded-3xl arena-shadow border border-border/50 p-4 mb-4 mx-4">
      <div className="flex items-center gap-3 mb-3">
        <Link to={`/profile/${post.author_username || 'me'}`}>
          <Avatar className="w-11 h-11 border-2 border-primary/20">
            <AvatarImage src={post.author_avatar} />
            <AvatarFallback>{post.author_name?.[0] || 'U'}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={`/profile/${post.author_username || 'me'}`}><p className="font-semibold text-sm">{post.author_name}</p></Link>
          <p className="text-xs text-muted-foreground truncate">
            {post.location_name ? `📍 ${post.location_name} · ` : ''}
            {formatDistanceToNow(new Date(post.created_date), { addSuffix: true })}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isEdited && <span className="text-[10px] text-muted-foreground italic">edited</span>}
          {post.created_by_id && post.created_by_id !== userId && (
            <>
              <FriendButton
                currentUserId={userId}
                currentUserName={currentUserName}
                targetUserId={post.created_by_id}
                targetUserName={post.author_name}
                record={friendRecordByUserId ? (friendRecordByUserId[post.created_by_id] ?? null) : undefined}
              />
              <button onClick={() => setShowReport(true)} className="p-1 text-muted-foreground hover:text-destructive" aria-label="Report post">
                <Flag className="w-4 h-4" />
              </button>
            </>
          )}
          {post.created_by_id === userId && (
            <>
              <button onClick={() => setShowEdit(true)} className="p-1 text-muted-foreground hover:text-foreground">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={() => setShowDelete(true)} className="p-1 text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
          {post.game_emoji && <span className="text-2xl">{post.game_emoji}</span>}
        </div>
      </div>

      {scoreText && (
        <Link to={post.challenge_id ? `/challenges/${post.challenge_id}` : '#'} className={`bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl px-4 py-2 mb-2 flex items-center justify-between ${post.challenge_id ? 'active:scale-[0.98] transition' : ''}`}>
          <span className="font-heading font-bold text-sm">{scoreText}</span>
          <Swords className="w-4 h-4 text-secondary" />
        </Link>
      )}

      {post.challenge_id && (post.sport_label || post.challenge_type) && (
        <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5 flex-wrap">
          {post.sport_label && <span>{post.sport_label}</span>}
          {post.challenge_type && <span>· {post.challenge_type === 'series' ? 'Series' : 'Single Game'}</span>}
          <span>· {format(new Date(post.created_date), 'MMM d, yyyy')}</span>
        </p>
      )}

      <p className="text-sm whitespace-pre-wrap mb-3">{body}</p>

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

      {mediaUrls?.length > 0 && (
        <div className={`grid gap-1.5 mb-3 ${mediaUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {mediaUrls.slice(0, 5).map((url, i) => (
            <button key={url} onClick={() => openPhotoViewer(mediaUrls, i)} className="block">
              <img src={url} alt="" className="rounded-2xl object-cover w-full h-40" />
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 text-muted-foreground text-sm pt-1">
        <button onClick={() => onReact(post, 'like')} className={`py-1.5 flex items-center gap-1.5 ${reactions.liked ? 'text-primary font-semibold' : ''}`}>
          ❤️ {post.like_count || 0}
        </button>
        <button onClick={() => onReact(post, 'fire')} className={`py-1.5 flex items-center gap-1.5 ${reactions.fired ? 'text-accent font-semibold' : ''}`}>
          🔥 {post.fire_count || 0}
        </button>
        <button onClick={() => onReact(post, 'trophy')} className={`py-1.5 flex items-center gap-1.5 ${reactions.trophied ? 'text-accent font-semibold' : ''}`}>
          🏆 {post.trophy_count || 0}
        </button>
        <button onClick={() => onReact(post, 'trash_talk')} className={`py-1.5 flex items-center gap-1.5 ${reactions.trashed ? 'text-secondary font-semibold' : ''}`}>
          🗑️ {post.trash_count || 0}
        </button>
        <button onClick={loadComments} className="py-1.5 flex items-center gap-1.5">
          <MessageCircle className="w-4 h-4" /> {post.comment_count || 0}
        </button>
        <button className="py-1.5 ml-auto" onClick={handleShare}><Share2 className="w-4 h-4" /></button>
      </div>

      {showEdit && (
        <PostEditSheet
          open={showEdit}
          onOpenChange={setShowEdit}
          post={post}
          onSaved={(updated) => {
            setEditState(updated);
            setShowEdit(false);
          }}
        />
      )}

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        onConfirm={deletePost}
        title="Delete this post?"
        description="Are you sure you want to delete this? This action cannot be undone."
      />

      <ReportSheet
        open={showReport}
        onOpenChange={setShowReport}
        targetType="post"
        targetId={post.id}
        targetOwnerName={post.author_name}
      />

      {showComments && (
        <div className="mt-3 pt-3 border-t border-border space-y-2">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2 text-sm">
              <Avatar className="w-6 h-6 mt-0.5">
                <AvatarImage src={c.author_avatar} />
                <AvatarFallback className="text-[10px]">{c.author_name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <p><Link to={`/profile/${c.author_username || 'me'}`} className="font-semibold">{c.author_name}</Link><span>: </span><span>{c.body}</span></p>
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 text-base bg-muted rounded-full px-3 py-1.5 outline-none"
              onKeyDown={(e) => e.key === 'Enter' && submitComment()}
            />
            <button onClick={submitComment} className="text-primary text-sm font-semibold px-2 py-1.5">Post</button>
          </div>
        </div>
      )}
    </article>
  );
}