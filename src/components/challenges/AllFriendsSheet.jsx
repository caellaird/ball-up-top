import React, { useEffect, useMemo, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Loader2, Search } from 'lucide-react';
import PlayerPickRow from '@/components/challenges/PlayerPickRow';
import { loadProfileDirectory } from '@/lib/userDirectory';
import { searchUsers } from '@/lib/searchUsers';

// Full friend list + whole-directory search for picking challenge opponents.
// Selecting a player hands them back to the existing multi-select challenge flow.
export default function AllFriendsSheet({ open, onOpenChange, friends = [], selectedIds = [], onToggle, userId }) {
  const [query, setQuery] = useState('');
  const [profiles, setProfiles] = useState(null);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    let alive = true;
    setProfiles(null);
    loadProfileDirectory()
      .then((list) => { if (alive) setProfiles(list); })
      .catch(() => { if (alive) setProfiles([]); });
    return () => { alive = false; };
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return null;
    return searchUsers(q, { friends, profiles: profiles || [], userId });
  }, [query, friends, profiles, userId]);

  const sortedFriends = useMemo(
    () => [...friends].sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''))),
    [friends],
  );

  const rows = results ?? sortedFriends;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl h-[88dvh] flex flex-col p-0">
        <SheetHeader className="px-4 pt-4 pb-3 border-b border-border pr-12 text-left">
          <SheetTitle className="font-heading">All Friends</SheetTitle>
          <p className="text-xs text-muted-foreground">Tap players to select. Search finds anyone on Ball Up Top.</p>
          <div className="relative mt-2">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              autoFocus
              placeholder="Search players..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-11 rounded-full pl-9"
            />
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {query.trim() && results === null ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {query.trim() ? `No players found for "${query.trim()}".` : 'Add friends first to challenge them.'}
            </p>
          ) : (
            rows.map((p) => (
              <PlayerPickRow
                key={p.userId}
                name={p.name}
                username={p.username || p.profile?.username}
                avatar={p.avatar || p.profile?.avatar_url}
                selected={selectedIds.includes(p.userId)}
                onSelect={() => onToggle(p)}
                badge={p.isFriend === false ? 'Player' : 'Friend'}
              />
            ))
          )}
          {!query.trim() && profiles === null && friends.length > 0 && (
            <p className="text-[11px] text-muted-foreground text-center pt-2">Loading player search...</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}