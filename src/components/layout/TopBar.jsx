import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { base44 } from '@/api/base44Client';

export default function TopBar({ user }) {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    base44.entities.Notification.filter({ user_id: user.id, read: false }).then((n) => setUnread(n.length));
  }, [user]);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 border-b border-border backdrop-blur bg-[#b3ccf5]">
      <span className="font-display text-xl md:hidden text-[hsl(var(--primary))]">Ball Up Top</span>
      <div className="hidden md:block" />
      <div className="flex items-center gap-3">
        <Link to="/notifications" className="relative p-2 rounded-full hover:bg-muted">
          <Bell className="w-5 h-5" />
          {unread > 0 && <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-primary" />}
        </Link>
        <Link to="/profile/me">
          <Avatar className="w-8 h-8">
            <AvatarFallback>{user?.full_name?.[0] || 'U'}</AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>);

}