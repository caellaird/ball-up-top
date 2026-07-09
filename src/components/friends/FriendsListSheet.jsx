import React, { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import FriendRow from './FriendRow';
import { enrichFriends } from '@/lib/friendsHelpers';

export default function FriendsListSheet({ open, onOpenChange, friendRecords, userId }) {
  const [enriched, setEnriched] = useState(null);

  useEffect(() => {
    if (open) {
      setEnriched(null);
      enrichFriends(friendRecords, userId).then(setEnriched);
    }
  }, [open, friendRecords, userId]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading">Friends ({friendRecords.length})</SheetTitle>
        </SheetHeader>
        <div className="mt-4 -mx-6 pb-4">
          {enriched === null ? (
            <p className="text-center text-sm text-muted-foreground py-8">Loading friends...</p>
          ) : enriched.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No friends yet.</p>
          ) : (
            enriched.map((f) => <FriendRow key={f.friendRecordId} friend={f} />)
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}