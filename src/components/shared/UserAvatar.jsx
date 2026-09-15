import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAvatar } from '@/lib/avatarStore';

// Drop-in replacement for <Avatar><AvatarImage/><AvatarFallback/></Avatar> that
// resolves the profile picture from the global avatar store (the live source of
// truth) instead of a stale cached field. Works inside lists/loops because the
// store hook is called at this component's top level.
export default function UserAvatar({ userId, src, name, className, fallbackClassName, onClick }) {
  const liveSrc = useAvatar(userId, src);
  return (
    <Avatar className={className} onClick={onClick}>
      <AvatarImage src={liveSrc} />
      <AvatarFallback className={fallbackClassName}>{name?.[0] || 'U'}</AvatarFallback>
    </Avatar>
  );
}