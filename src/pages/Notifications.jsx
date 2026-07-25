import React, { useEffect, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/shared/EmptyState';
import { MessageCircle, Trophy, UserPlus, Swords, Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const ICON_MAP = {
  message: MessageCircle,
  friend: UserPlus,
  challenge: Swords,
  award: Trophy,
};

export default function Notifications() {
  const { user } = useOutletContext();
  const [notifications, setNotifications] = useState(null);

  useEffect(() => {
    load();
    const unsub = base44.entities.Notification.subscribe(() => load());
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
            const inner = (
              <div className={`flex items-start gap-3 p-3 rounded-2xl border transition active:scale-[0.98] ${n.read ? 'border-border bg-card' : 'border-primary/30 bg-primary/5'}`}>
                <div className="relative shrink-0">
                  <Avatar className="w-10 h-10">
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
                </div>
                {!n.read && <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 mt-1.5" />}
              </div>
            );
            return n.link ? (
              <Link key={n.id} to={n.link} onClick={() => handleClick(n)}>{inner}</Link>
            ) : (
              <div key={n.id} onClick={() => handleClick(n)}>{inner}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}