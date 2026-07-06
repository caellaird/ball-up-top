import React, { useEffect, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/shared/EmptyState';
import { formatDistanceToNow } from 'date-fns';

export default function Notifications() {
  const { user } = useOutletContext();
  const [notifications, setNotifications] = useState(null);

  useEffect(() => {
    base44.entities.Notification.filter({ user_id: user.id }, '-created_date', 50).then(setNotifications);
  }, []);

  const markAllRead = async () => {
    await base44.entities.Notification.updateMany({ user_id: user.id, read: false }, { $set: { read: true } });
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  if (notifications === null) return <div className="text-center text-muted-foreground py-10">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl">Notifications</h1>
        {notifications.some((n) => !n.read) && <Button variant="secondary" size="sm" onClick={markAllRead}>Mark all read</Button>}
      </div>
      {notifications.length === 0 ? (
        <EmptyState title="No notifications" description="You're all caught up!" />
      ) : (
        notifications.map((n) => (
          <Link key={n.id} to={n.link || '#'} className={`block px-4 py-3 rounded-xl mb-2 border ${n.read ? 'border-border bg-card' : 'border-primary/40 bg-primary/5'}`}>
            <p className="text-sm font-medium">{n.title}</p>
            {n.body && <p className="text-xs text-muted-foreground">{n.body}</p>}
            <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(n.created_date), { addSuffix: true })}</p>
          </Link>
        ))
      )}
    </div>
  );
}