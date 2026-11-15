import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check } from 'lucide-react';

export default function PlayerPickRow({ name, username, avatar, selected, onSelect, badge }) {
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-2xl border-2 ${selected ? 'border-accent bg-accent/10' : 'border-border bg-card'}`}
    >
      <Avatar className="w-10 h-10">
        <AvatarImage src={avatar || undefined} />
        <AvatarFallback>{name?.[0] || 'U'}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {username ? `@${username}` : ''}
          {badge ? `${username ? ' · ' : ''}${badge}` : ''}
        </p>
      </div>
      {selected && (
        <span className="w-5 h-5 rounded-full bg-accent flex items-center justify-center shrink-0">
          <Check className="w-3 h-3 text-white" strokeWidth={3} />
        </span>
      )}
    </button>
  );
}