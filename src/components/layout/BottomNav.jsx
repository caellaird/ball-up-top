import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Trophy, MessageCircle, User } from 'lucide-react';

const items = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/daily', icon: Calendar, label: 'Daily' },
  { to: '/games', icon: Trophy, label: 'Play' },
  { to: '/messages', icon: MessageCircle, label: 'Messages' },
  { to: '/profile/me', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const location = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-border bg-card/95 backdrop-blur px-2 py-2 md:hidden">
      {items.map(({ to, icon: Icon, label }) => {
        const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
        return (
          <Link key={to} to={to} className="flex flex-col items-center gap-1 px-3 py-1">
            <Icon className={`w-6 h-6 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={`text-[10px] font-medium ${active ? 'text-primary' : 'text-muted-foreground'}`}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}