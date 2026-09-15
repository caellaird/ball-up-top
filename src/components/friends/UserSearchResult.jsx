import React from 'react';
import { Link } from 'react-router-dom';
import UserAvatar from '@/components/shared/UserAvatar';
import { Button } from '@/components/ui/button';

export default function UserSearchResult({ result, onAdd, onCancel }) {
  const { targetUser, profile, relation } = result;

  return (
    <div className="flex items-center gap-3 bg-card rounded-2xl shadow-sm p-3 mb-2 mx-4">
      <Link to={profile?.username ? `/profile/${profile.username}` : '#'}>
        <UserAvatar userId={targetUser.id} src={profile?.avatar_url} name={targetUser.full_name} className="w-11 h-11" />
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={profile?.username ? `/profile/${profile.username}` : '#'} className="block">
          <p className="font-semibold text-sm truncate hover:underline">{targetUser.full_name}</p>
        </Link>
        {profile?.username && <p className="text-xs text-muted-foreground truncate">@{profile.username}</p>}
      </div>
      {relation === 'accepted' && (
        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-accent/10 text-accent">Friends</span>
      )}
      {relation === 'pending_outgoing' && (
        <Button size="sm" variant="secondary" className="rounded-full" onClick={onCancel}>Cancel</Button>
      )}
      {relation === 'pending_incoming' && (
        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-muted text-muted-foreground">Respond below</span>
      )}
      {!relation && (
        <Button size="sm" className="rounded-full" onClick={onAdd}>Add Friend</Button>
      )}
    </div>
  );
}