import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Swords, Pencil, Trash2, Flag } from 'lucide-react';
import UserAvatar from '@/components/shared/UserAvatar';
import { base44 } from '@/api/base44Client';
import ReactionBar from '@/components/feed/ReactionBar';
import { format, formatDistanceToNow } from 'date-fns';
import { parseServerDate } from '@/lib/utils';
import { getOrCreateProfile } from '@/lib/ensureProfile';
import { usePhotoViewer } from '@/lib/photoViewer';
import PostEditSheet from '@/components/feed/PostEditSheet';
import HighlightCardVisual from '@/components/feed/HighlightCardVisual';
import GroupGameSummary from '@/components/feed/GroupGameSummary';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import ReportSheet from '@/components/shared/ReportSheet';
import FriendButton from '@/components/profile/FriendButton';
import PostShareSheet from '@/components/feed/PostShareSheet';

export default function PostCard({ post, reactionCounts, myEmoji, onReact, userId, currentUserName, onDeleted, friendRecordByUserId }) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [addedComments, setAddedComments] = useState(0);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState(null);
  const { open: openPhotoViewer } = usePhotoViewer();
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editState, setEditState] = useState({});
  const [showShare, setShowShare] = useState(false);

  // Tapping the comment badge toggles the thread, and only fetches on open.
  const loadComments = async () => {
    if (showComments) { setShowComments(false); return; }
    setShowComments(true);
    const data = await base44.entities.Comment.filter({ post_id: post.id }, '-created_date');
    setComments(data);
  };

  const body = editState.body ?? post.body;
  const scoreText = editState.score_text ?? post.score_text;
  const mediaUrls = editState.media_urls ?? post.media_urls;
  const isEdited = editState.is_edited ?? post.is_edited;

  const handleShare = () => setShowShare(true);

  const submitComment = async () => {
    const body = commentText.trim();
    if (!body) return;
    // Guard against duplicate comments from a fast double tap / Enter.
    if (submittingComment) return;
    setSubmittingComment(true);
    setCommentError(null);
    try {
      const me = await base44.auth.me();
      const profile = await getOrCreateProfile(me);
      const c = await base44.entities.Comment.create({ post_id: post.id, author_name: me.full_name, author_username: profile.username, author_avatar: profile.avatar_url, body });
      await base44.entities.Post.update(post.id, { comment_count: (post.comment_count || 0) + addedComments + 1 });
      setComments((prev) => [c, ...prev]);
      setAddedComments((n) => n + 1);
      setCommentText('');
    } catch {
      setCommentError("Couldn't post your comment. Try again.");
    } finally {
      setSubmittingComment(false);
    }
  };

  const deletePost = async () => {
    setDeleting(true);
    await base44.entities.Post.delete(post.id);
    setDeleting(false);
    setShowDelete(false);
    onDeleted?.(post.id);
  };

  const commentCount = (post.comment_count || 0) + addedComments;

  return (
    <article className="bg-card rounded-3xl arena-shadow border border-border/50 p-4 mb-4 mx-4">
      {post.post_type === 'highlight_card' ? (
        <div className="flex items-center justify-end gap-2 mb-2">
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
        </div>
      ) : (
        <div className="flex items-center gap-3 mb-3">
          <Link to={`/profile/${post.author_username || 'me'}`}>
            <UserAvatar userId={post.created_by_id} src={post.author_avatar} name={post.author_name} className="w-11 h-11 border-2 border-primary/20" />
          </Link>
          <div className="flex-1 min-w-0">
            <Link to={`/profile/${post.author_username || 'me'}`}><p className="font-semibold text-sm">{post.author_name}</p></Link>
            <p className="text-xs text-muted-foreground truncate">
              {post.location_name ? `📍 ${post.location_name} · ` : ''}
              {formatDistanceToNow(parseServerDate(post.created_date), { addSuffix: true })}
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
      )}

      {post.post_type === 'highlight_card' ? (
        <HighlightCardVisual post={post} />
      ) : (
      <>
      {post.participant_scores?.length > 0 ? (
        <GroupGameSummary post={{ ...post, score_text: scoreText }} />
      ) : scoreText && (
        <Link to={post.challenge_id ? `/challenges/${post.challenge_id}` : '#'} className={`bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl px-4 py-2 mb-2 flex items-center justify-between ${post.challenge_id ? 'active:scale-[0.98] transition' : ''}`}>
          <span className="font-heading font-bold text-sm">{scoreText}</span>
          <Swords className="w-4 h-4 text-secondary" />
        </Link>
      )}

      {post.challenge_id && (post.sport_label || post.challenge_type) && (
        <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5 flex-wrap">
          {post.sport_label && <span>{post.sport_label}</span>}
          {post.challenge_type && <span>· {post.challenge_type === 'series' ? 'Series' : 'Single Game'}</span>}
          <span>· {format(parseServerDate(post.created_date), 'MMM d, yyyy')}</span>
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
      </>
      )}

      <ReactionBar
        post={post}
        counts={reactionCounts}
        myEmoji={myEmoji}
        onReact={onReact}
        commentCount={commentCount}
        onComment={loadComments}
        onShare={handleShare}
      />

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

      <PostShareSheet open={showShare} onOpenChange={setShowShare} post={post} />

      {showComments && (
        <div className="mt-3 pt-3 border-t border-border space-y-2">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2 text-sm">
              <UserAvatar userId={c.created_by_id} src={c.author_avatar} name={c.author_name} className="w-6 h-6 mt-0.5" fallbackClassName="text-[10px]" />
              <p><Link to={`/profile/${c.author_username || 'me'}`} className="font-semibold">{c.author_name}</Link><span>: </span><span>{c.body}</span></p>
            </div>
          ))}
          {comments.length === 0 && !commentError && (
            <p className="text-xs text-muted-foreground">No comments yet. Start the conversation.</p>
          )}
          <div className="flex gap-2 pt-1">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 text-base bg-muted rounded-full px-3 py-1.5 outline-none"
              onKeyDown={(e) => { if (e.key === 'Enter') submitComment(); }}
            />
            <button
              onClick={submitComment}
              disabled={submittingComment || !commentText.trim()}
              className="text-primary text-sm font-semibold px-2 py-1.5 disabled:opacity-40"
            >
              {submittingComment ? 'Posting…' : 'Post'}
            </button>
          </div>
          {commentError && <p className="text-xs text-destructive">{commentError}</p>}
        </div>
      )}
    </article>
  );
}