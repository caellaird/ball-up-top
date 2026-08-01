import React, { useEffect, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/shared/EmptyState';
import { MessageCircle, Trophy, UserPlus, Swords, Bell, Check, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sendNotification } from '@/lib/notify';

const ICON_MAP = {
  friend_request: UserPlus,
  friend_response: UserPlus,
  message: MessageCircle,
  challenge_invite: Swords,
  challenge_response: Swords,
  challenge: Swords,
  award: Trophy,
};

export default function Notifications() {
  const { user } = useOutletContext();
  const [notifications, setNotifications] = useState(null);
  const [actingId, setActingId] = useState(null);

  useEffect(() => {
    load();
    const unsub = base44.entities.Notification.subscribe((event) => {
      if (event?.data?.user_id === user.id) load();
    });
    return unsub;
  }, []);

  const load = async () => {
    const data = await base44.entities.Notification.filter({ user_id: user.id }, '-created_date', 50);
    setNotifications(data);
  };

  const markAllRead = async () => {
    await base44.entities.Notification.updateMany({ user_id: user.id, read: false }, { $set: { read: true } });
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const handleClick = async (n) => {
    if (!n.read) {
      await base44.entities.Notification.update(n.id, { read: true });
    }
  };

  const respondToFriendRequest = async (n, accept) => {
    setActingId(n.id);
    try {
      const records = await base44.entities.Friend.filter({ created_by_id: n.actor_id, addressee_id: user.id, status: 'pending' });
      if (records[0]) {
        await base44.entities.Friend.update(records[0].id, { status: accept ? 'accepted' : 'declined' });
      }
      if (accept && n.actor_id) {
        await sendNotification({
          userId: n.actor_id,
          type: 'friend_response',
          actorId: user.id,
          actorName: user.full_name,
          title: `${user.full_name} accepted your friend request`,
          link: '/friends',
        });
      }
      const updated = await base44.entities.Notification.update(n.id, { read: true, handled: true });
      setNotifications(notifications.map((x) => (x.id === n.id ? updated : x)));
    } finally {
      setActingId(null);
    }
  };

  if (notifications === null) return <div className="text-center text-muted-foreground py-10">Loading...</div>;

  return (
    <div className="px-4 pt-4" style={{ paddingBottom: 'calc(7rem + env(safe-area-inset-bottom))' }}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-heading text-2xl">Notifications</h1>
        {notifications.some((n) => !n.read) && <Button variant="secondary" size="sm" className="rounded-full" onClick={markAllRead}>Mark all read</Button>}
      </div>
      {notifications.length === 0 ? (
        <EmptyState title="No notifications" description="You're all caught up!" />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = ICON_MAP[n.type] || Bell;
            const isFriendRequest = n.type === 'friend_request' && !n.handled;
            const card = (
              <div className={`flex items-start gap-3 p-3 rounded-2xl border transition ${!isFriendRequest ? 'active:scale-[0.98]' : ''} ${n.read ? 'border-border bg-card' : 'border-primary/30 bg-primary/5'}`}>
                <div className="relative shrink-0">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={n.actor_avatar} />
                    <AvatarFallback>{n.actor_name?.[0] || 'B'}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center border-2 border-card">
                    <Icon className="w-2.5 h-2.5 text-primary-foreground" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${n.read ? 'font-medium' : 'font-bold'}`}>{n.title}</p>
                  {n.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>}
                  <p className="text-[11px] text-muted-foreground mt-1">{formatDistanceToNow(new Date(n.created_date), { addSuffix: true })}</p>
                  {isFriendRequest && (
                    <div className="flex gap-2 mt-2" onClick={(e) => e.preventDefault()}>
                      <Button size="sm" className="rounded-full h-8" disabled={actingId === n.id} onClick={() => respondToFriendRequest(n, true)}>
                        <Check className="w-3.5 h-3.5 mr-1" /> Accept
                      </Button>
                      <Button size="sm" variant="secondary" className="rounded-full h-8" disabled={actingId === n.id} onClick={() => respondToFriendRequest(n, false)}>
                        <X className="w-3.5 h-3.5 mr-1" /> Decline
                      </Button>
                    </div>
                  )}
                  {n.type === 'friend_request' && n.handled && (
                    <p className="text-xs text-muted-foreground mt-1 italic">Handled</p>
                  )}
                </div>
                {!n.read && <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 mt-1.5" />}
              </div>
            );
            if (isFriendRequest) {
              return <div key={n.id} onClick={() => handleClick(n)}>{card}</div>;
            }
            return n.link ? (
              <Link key={n.id} to={n.link} onClick={() => handleClick(n)}>{card}</Link>
            ) : (
              <div key={n.id} onClick={() => handleClick(n)}>{card}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}