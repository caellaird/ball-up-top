import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Swords, Trophy, Users, BarChart3, MessageCircle, UserPlus, Settings } from 'lucide-react';

const items = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/daily', icon: Calendar, label: 'Daily' },
  { to: '/challenges', icon: Swords, label: 'Challenges' },
  { to: '/games', icon: Trophy, label: 'Games' },
  { to: '/communities', icon: Users, label: 'Communities' },
  { to: '/leaderboards', icon: BarChart3, label: 'Leaderboards' },
  { to: '/messages', icon: MessageCircle, label: 'Messages' },
  { to: '/friends', icon: UserPlus, label: 'Friends' },
];

export default function Sidebar() {
  const location = useLocation();
  return (
    <aside className="hidden md:flex md:flex-col md:w-60 md:fixed md:inset-y-0 border-r border-border bg-card px-4 py-6">
      <div className="mb-8 px-2">
        <span className="font-display text-2xl text-primary">Ball Up Top</span>
      </div>
      <nav className="flex-1 flex flex-col gap-1">
        {items.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
          return (
            <Link key={to} to={to} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}>
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          );
        })}
      </nav>
      <Link to="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted">
        <Settings className="w-5 h-5" />
        Settings
      </Link>
    </aside>
  );
}