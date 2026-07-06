import React, { useState } from 'react';
import { Heart, MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { base44 } from '@/api/base44Client';
import { formatDistanceToNow } from 'date-fns';

export default function PostCard({ post, liked, onToggleLike }) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');

  const loadComments = async () => {
    const data = await base44.entities.Comment.filter({ post_id: post.id }, '-created_date');
    setComments(data);
    setShowComments(true);
  };

  const submitComment = async () => {
    if (!commentText.trim()) return;
    const user = await base44.auth.me();
    const c = await base44.entities.Comment.create({ post_id: post.id, author_name: user.full_name, body: commentText });
    await base44.entities.Post.update(post.id, { comment_count: (post.comment_count || 0) + 1 });
    setComments([c, ...comments]);
    setCommentText('');
  };

  return (
    <article className="bg-card border border-border rounded-xl p-4 mb-4">
      <div className="flex items-center gap-3 mb-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={post.author_avatar} />
          <AvatarFallback>{post.author_name?.[0] || 'U'}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-sm">{post.author_name}</p>
          <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(post.created_date), { addSuffix: true })}</p>
        </div>
      </div>
      <p className="text-sm whitespace-pre-wrap mb-3">{post.body}</p>
      <div className="flex items-center gap-6 text-muted-foreground text-sm border-t border-border pt-3">
        <button onClick={() => onToggleLike(post)} className={`flex items-center gap-1.5 ${liked ? 'text-primary' : ''}`}>
          <Heart className={`w-4 h-4 ${liked ? 'fill-primary' : ''}`} />
          {post.like_count || 0}
        </button>
        <button onClick={loadComments} className="flex items-center gap-1.5">
          <MessageCircle className="w-4 h-4" />
          {post.comment_count || 0}
        </button>
      </div>
      {showComments && (
        <div className="mt-3 pt-3 border-t border-border space-y-2">
          {comments.map((c) => (
            <div key={c.id} className="text-sm">
              <span className="font-semibold">{c.author_name}: </span>
              <span>{c.body}</span>
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