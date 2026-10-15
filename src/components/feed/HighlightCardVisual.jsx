import React from 'react';
import UserAvatar from '@/components/shared/UserAvatar';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

// Personal "trading card" visual for highlight_card posts: a photo-forward card
// with the event/league title, the author, and 1-3 custom stat rows.
export default function HighlightCardVisual({ post }) {
  const image = post.media_urls?.[0];
  const stats = (post.highlight_stats || []).filter((s) => s.label && s.value);

  return (
    <div className="rounded-3xl overflow-hidden border border-border/50 bg-card arena-shadow">
      <div className="relative">
        {image ? (
          <img src={image} alt="" className="w-full h-56 object-cover" />
        ) : (
          <div className="w-full h-56 brand-gradient" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-[11px] font-semibold text-white/80 uppercase tracking-wide">{format(new Date(post.created_date), 'MMM d, yyyy')}</p>
          <h3 className="font-heading font-extrabold text-xl text-white leading-tight drop-shadow">{post.highlight_title}</h3>
        </div>
      </div>

      <div className="px-4 pt-3 pb-1 flex items-center gap-2">
        <Link to={`/profile/${post.author_username || 'me'}`}>
          <UserAvatar userId={post.created_by_id} src={post.author_avatar} name={post.author_name} className="w-7 h-7 border border-primary/20" />
        </Link>
        <Link to={`/profile/${post.author_username || 'me'}`} className="text-sm font-semibold truncate">{post.author_name}</Link>
      </div>

      {stats.length > 0 && (
        <div className="grid grid-cols-3 gap-px bg-border/40 m-3 mt-2 rounded-2xl overflow-hidden">
          {stats.map((s, i) => (
            <div key={i} className="bg-card px-2 py-3 text-center">
              <p className="font-heading font-extrabold text-lg text-primary leading-none">{s.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-1 truncate">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {post.body && post.body !== post.highlight_title && (
        <p className="text-sm text-muted-foreground px-4 pb-3 whitespace-pre-wrap">{post.body}</p>
      )}
    </div>
  );
}