import React from 'react';
import UserAvatar from '@/components/shared/UserAvatar';
import { Link } from 'react-router-dom';
import InstagramStoryShareButton from '@/components/feed/InstagramStoryShareButton';

// Clean "scorecard" visual for highlight_card posts: a white card with the
// author header, a 3-column stats row (blue values, grey caps labels), and the
// caption below. Matches the requested mobile design.
export default function HighlightCardVisual({ post }) {
  const stats = (post.highlight_stats || []).filter((s) => s.label && s.value);

  return (
    <div className="rounded-3xl border border-border bg-card overflow-hidden">
      {post.media_urls?.[0] && (
        <img
          src={post.media_urls[0]}
          alt={post.highlight_title || post.body || 'highlight'}
          className="w-full aspect-[4/3] object-cover bg-muted"
        />
      )}
      <div className="px-4 pt-3 flex items-center gap-2.5">
        <Link to={`/profile/${post.author_username || 'me'}`}>
          <UserAvatar userId={post.created_by_id} src={post.author_avatar} name={post.author_name} className="w-9 h-9" />
        </Link>
        <Link to={`/profile/${post.author_username || 'me'}`} className="text-[15px] font-semibold text-foreground truncate">
          {post.author_name}
        </Link>
      </div>

      {stats.length > 0 && (
        <div className="mt-3 flex divide-x divide-border">
          {stats.map((s, i) => (
            <div key={i} className="flex-1 px-2 py-3 text-center">
              <p className="font-heading font-extrabold text-2xl text-primary leading-none">{s.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-1 truncate">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {post.body && (
        <p className="text-sm text-muted-foreground px-4 pb-3 pt-1 whitespace-pre-wrap">{post.body}</p>
      )}
      <div className="px-4 pb-4 flex items-center justify-end">
        <InstagramStoryShareButton post={post} />
      </div>
    </div>
  );
}