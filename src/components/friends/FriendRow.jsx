import React from 'react';
import { Link } from 'react-router-dom';
import UserAvatar from '@/components/shared/UserAvatar';
import { SPORT_EMOJI } from '@/lib/constants';

export default function FriendRow({ friend }) {
  const { profile, stats, name } = friend;
  const username = profile?.username;

  return (
    <Link
      to={username ? `/profile/${username}` : '#'}
      className="flex items-center gap-3 bg-card rounded-2xl shadow-sm p-3 mb-2 mx-4"
    >
      <div className="relative">
        <UserAvatar userId={profile?.created_by_id} src={profile?.avatar_url} name={name} className="w-12 h-12" />
        {profile?.ready_to_ball && (
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-accent border-2 border-card" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {username ? `@${username}` : ''}
          {profile?.ready_to_ball ? ' · Ready to Ball' : ''}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
          {profile?.favorite_sport && <span>{SPORT_EMOJI[profile.favorite_sport] || ''} {profile.favorite_sport}</span>}
          {stats && <span>{stats.games_won || 0}W - {stats.losses || 0}L</span>}
          {stats?.current_streak > 0 && <span>🔥{stats.current_streak}</span>}
        </div>
      </div>
    </Link>
  );
}