import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import FriendRow from '@/components/friends/FriendRow';
import { enrichFriends } from '@/lib/friendsHelpers';

export default function FriendsTab({ friendRecords, userId, isSelf, pendingCount }) {
  const [enriched, setEnriched] = useState(null);

  useEffect(() => {
    setEnriched(null);
    enrichFriends(friendRecords, userId).then(setEnriched);
  }, [friendRecords, userId]);

  return (
    <div className="pt-4 pb-6">
      {isSelf && (
        <div className="px-4 mb-3">
          <Link
            to="/friends"
            className="block w-full text-center bg-primary/10 text-primary font-heading font-bold text-sm rounded-xl py-3 hover:bg-primary/20 transition"
          >
            {pendingCount > 0 ? `${pendingCount} pending request${pendingCount > 1 ? 's' : ''}` : 'Manage Friends'}
          </Link>
        </div>
      )}
      {enriched === null ? (
        <p className="text-center text-sm text-muted-foreground py-8">Loading friends...</p>
      ) : enriched.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">No friends yet.</p>
      ) : (
        enriched.map((f) => <FriendRow key={f.friendRecordId} friend={f} />)
      )}
    </div>
  );
}