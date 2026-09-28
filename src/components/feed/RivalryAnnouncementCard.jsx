import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import UserAvatar from '@/components/shared/UserAvatar';
import { Button } from '@/components/ui/button';
import { Swords, Flame } from 'lucide-react';
import ReactionBar from '@/components/feed/ReactionBar';
import { fetchRivalry } from '@/lib/rivalries';
import { formatDistanceToNow } from 'date-fns';

export default function RivalryAnnouncementCard({ post, reactionCounts, myEmoji, onReact, userId }) {
  const [rivalry, setRivalry] = useState(null);

  useEffect(() => {
    if (!post.rivalry_id) return;
    fetchRivalry(post.rivalry_id).then(setRivalry).catch(() => {});
  }, [post.rivalry_id]);

  const userA = rivalry
    ? { id: rivalry.user_a_id, name: rivalry.user_a_name, avatar: rivalry.user_a_avatar, wins: rivalry.user_a_wins }
    : { id: post.tagged_user_ids?.[0], name: post.tagged_user_names?.[0], avatar: null, wins: 0 };
  const userB = rivalry
    ? { id: rivalry.user_b_id, name: rivalry.user_b_name, avatar: rivalry.user_b_avatar, wins: rivalry.user_b_wins }
    : { id: post.tagged_user_ids?.[1], name: post.tagged_user_names?.[1], avatar: null, wins: 0 };

  const handleShare = async () => {
    const text = `${userA.name} vs ${userB.name} — ${userA.wins} to ${userB.wins}. LET THE RIVALRY BEGIN!`;
    if (navigator.share) {
      await navigator.share({ title: 'Ball Up Top Rivalry', text, url: window.location.origin });
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  return (
    <article className="mb-4 mx-4">
      <div className="brand-gradient rounded-3xl arena-shadow overflow-hidden relative">
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

        <div className="relative p-4 text-white">
          {/* Header */}
          <div className="flex items-center justify-center gap-2 mb-1">
            <Swords className="w-5 h-5" />
            <span className="font-heading font-extrabold text-sm uppercase tracking-wider">Rivalry Alert</span>
          </div>
          <p className="text-center text-[10px] uppercase tracking-widest opacity-70 mb-4">
            {formatDistanceToNow(new Date(post.created_date), { addSuffix: true })}
          </p>

          {/* Players */}
          <div className="flex items-center justify-around text-center mb-4">
            <div className="flex flex-col items-center gap-1">
              <UserAvatar userId={userA.id} src={userA.avatar} name={userA.name} className="w-14 h-14 border-2 border-white/40" fallbackClassName="bg-white/20 text-white" />
              <p className="font-heading font-bold text-xs truncate max-w-[80px]">{userA.name}</p>
              <p className="font-heading font-extrabold text-xl">{userA.wins}</p>
              <p className="text-[9px] uppercase opacity-70">Wins</p>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-heading text-lg font-bold opacity-60">VS</span>
              {rivalry && (
                <span className="text-[10px] opacity-70 mt-1">{rivalry.total_games} Games</span>
              )}
            </div>
            <div className="flex flex-col items-center gap-1">
              <UserAvatar userId={userB.id} src={userB.avatar} name={userB.name} className="w-14 h-14 border-2 border-white/40" fallbackClassName="bg-white/20 text-white" />
              <p className="font-heading font-bold text-xs truncate max-w-[80px]">{userB.name}</p>
              <p className="font-heading font-extrabold text-xl">{userB.wins}</p>
              <p className="text-[9px] uppercase opacity-70">Wins</p>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mb-3">
            <p className="font-heading font-extrabold text-base flex items-center justify-center gap-1.5">
              <Flame className="w-4 h-4" /> LET THE RIVALRY BEGIN
            </p>
          </div>

          {/* Challenge buttons */}
          <div className="flex gap-2">
            <Link to={`/profile/${userA.name?.toLowerCase().replace(/\s/g, '')}`} className="flex-1">
              <Button size="sm" variant="secondary" className="w-full rounded-full text-xs">
                <Swords className="w-3 h-3 mr-1" /> Challenge {userA.name?.split(' ')[0]}
              </Button>
            </Link>
            <Link to={`/profile/${userB.name?.toLowerCase().replace(/\s/g, '')}`} className="flex-1">
              <Button size="sm" variant="secondary" className="w-full rounded-full text-xs">
                <Swords className="w-3 h-3 mr-1" /> Challenge {userB.name?.split(' ')[0]}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Reaction bar — matches PostCard's style */}
      <div className="bg-card rounded-b-3xl border border-t-0 border-border/50 px-4 py-2.5">
        <ReactionBar
          post={post}
          counts={reactionCounts}
          myEmoji={myEmoji}
          onReact={onReact}
          commentCount={post.comment_count}
          onShare={handleShare}
        />
      </div>
    </article>
  );
}