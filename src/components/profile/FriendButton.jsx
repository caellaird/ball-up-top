import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { UserPlus, Check, X, Clock, Loader2, Ban } from 'lucide-react';
import { sendNotification } from '@/lib/notify';

// Per-user-pair relation cache so feed cards don't refetch on every mount/re-render.
const cache = new Map();
const CACHE_TTL = 15000;

export default function FriendButton({ currentUserId, currentUserName, currentUserAvatar, targetUserId, targetUserName }) {
  const [relation, setRelation] = useState(null);
  const [friendRecord, setFriendRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    load();
  }, [targetUserId]);

  const load = async () => {
    setLoading(true);
    const key = `${currentUserId}:${targetUserId}`;
    const cached = cache.get(key);
    if (cached && Date.now() - cached.t < CACHE_TTL) {
      applyRecord(cached.rec);
      return;
    }
    // Single query covers both directions — halves the request count vs two parallel filters.
    const rows = await base44.entities.Friend.filter({
      $or: [
        { addressee_id: targetUserId, created_by_id: currentUserId },
        { addressee_id: currentUserId, created_by_id: targetUserId },
      ],
    });
    const rec = rows[0] || null;
    cache.set(key, { rec, t: Date.now() });
    applyRecord(rec);
  };

  const applyRecord = (rec) => {
    setFriendRecord(rec || null);
    if (!rec || rec.status === 'cancelled' || rec.status === 'declined') {
      setRelation(null);
    } else if (rec.status === 'blocked') {
      setRelation('blocked');
    } else if (rec.status === 'accepted') {
      setRelation('accepted');
    } else if (rec.created_by_id === currentUserId) {
      setRelation('pending_outgoing');
    } else {
      setRelation('pending_incoming');
    }
    setLoading(false);
  };

  const sendRequest = async () => {
    setSending(true);
    try {
      if (friendRecord) {
        await base44.entities.Friend.update(friendRecord.id, {
          status: 'pending',
          requester_name: currentUserName,
          addressee_name: targetUserName,
        });
      } else {
        await base44.entities.Friend.create({
          requester_name: currentUserName,
          addressee_id: targetUserId,
          addressee_name: targetUserName,
        });
      }
      await sendNotification({
        userId: targetUserId,
        type: 'friend_request',
        actorId: currentUserId,
        actorName: currentUserName,
        actorAvatar: currentUserAvatar,
        title: `${currentUserName} sent you a friend request`,
        link: '/friends',
      });
      cache.delete(`${currentUserId}:${targetUserId}`);
      load();
    } catch {
      // Error handled by load
    } finally {
      setSending(false);
    }
  };

  const acceptRequest = async () => {
    setSending(true);
    try {
      await base44.entities.Friend.update(friendRecord.id, { status: 'accepted' });
      await sendNotification({
        userId: targetUserId,
        type: 'friend_response',
        actorId: currentUserId,
        actorName: currentUserName,
        actorAvatar: currentUserAvatar,
        title: `${currentUserName} accepted your friend request`,
        link: '/friends',
      });
      cache.delete(`${currentUserId}:${targetUserId}`);
      load();
    } catch {
      // Error handled by load
    } finally {
      setSending(false);
    }
  };

  const declineRequest = async () => {
    setSending(true);
    try {
      await base44.entities.Friend.update(friendRecord.id, { status: 'declined' });
      cache.delete(`${currentUserId}:${targetUserId}`);
      load();
    } catch {
      // Error handled by load
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <Button size="sm" variant="secondary" className="rounded-full" disabled>
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      </Button>
    );
  }

  if (relation === 'accepted') {
    return (
      <Button size="sm" variant="secondary" className="rounded-full" disabled>
        <Check className="w-3.5 h-3.5 mr-1" /> Friends
      </Button>
    );
  }

  if (relation === 'blocked') {
    return (
      <Button size="sm" variant="secondary" className="rounded-full" disabled>
        <Ban className="w-3.5 h-3.5 mr-1" /> Blocked
      </Button>
    );
  }

  if (relation === 'pending_outgoing') {
    return (
      <Button size="sm" variant="secondary" className="rounded-full" disabled>
        <Clock className="w-3.5 h-3.5 mr-1" /> Request Sent
      </Button>
    );
  }

  if (relation === 'pending_incoming') {
    return (
      <div className="flex gap-1.5">
        <Button size="sm" className="rounded-full" onClick={acceptRequest} disabled={sending}>
          {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 mr-1" />}
          Accept
        </Button>
        <Button size="sm" variant="secondary" className="rounded-full" onClick={declineRequest} disabled={sending}>
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <Button size="sm" variant="secondary" className="rounded-full" onClick={sendRequest} disabled={sending}>
      {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5 mr-1" />}
      Add Friend
    </Button>
  );
}