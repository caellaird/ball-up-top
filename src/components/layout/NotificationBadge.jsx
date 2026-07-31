import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

export default function NotificationBadge() {
  const outletCtx = useOutletContext();
  const user = outletCtx?.user;
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    load();
    const unsub = base44.entities.Notification.subscribe(() => load());
    return unsub;
  }, [user?.id]);

  const load = async () => {
    const unread = await base44.entities.Notification.filter({ user_id: user.id, read: false });
    setCount(unread.length);
  };

  if (!count) return null;

  return (
    <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
      {count > 9 ? '9+' : count}
    </span>
  );
}