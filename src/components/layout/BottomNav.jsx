import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Swords, Users, User, Zap } from 'lucide-react';

const items = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/challenges', icon: Swords, label: 'Challenges' },
];
const rightItems = [
  { to: '/groups', icon: Users, label: 'Groups' },
  { to: '/profile/me', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (to) => location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  return (
    <nav className="sticky bottom-0 z-40 bg-card/95 backdrop-blur border-t border-border/70 arena-shadow pb-[env(safe-area-inset-bottom)]">
      <div className="relative flex items-end justify-around px-2 pt-2 pb-2">
        {items.map(({ to, icon: Icon, label }) => (
          <Link key={to} to={to} className="flex flex-col items-center gap-1 px-2 py-1 flex-1 min-w-0">
            <Icon className={`w-6 h-6 ${isActive(to) ? 'text-accent' : 'text-muted-foreground'}`} />
            <span className={`text-[10px] font-semibold ${isActive(to) ? 'text-accent' : 'text-muted-foreground'}`}>{label}</span>
          </Link>
        ))}

        <button onClick={() => navigate('/ball-up')} className="flex flex-col items-center -mt-8 w-16">
          <span className="w-16 h-16 rounded-full bg-gradient-to-br from-[hsl(var(--accent))] to-[hsl(var(--secondary))] shadow-lg shadow-[hsl(var(--accent)/0.4)] flex items-center justify-center border-4 border-background">
            <Zap className="w-7 h-7 text-white fill-white" />
          </span>
          <span className="text-[10px] font-bold text-secondary mt-1">BALL UP</span>
        </button>

        {rightItems.map(({ to, icon: Icon, label }) => (
          <Link key={to} to={to} className="flex flex-col items-center gap-1 px-2 py-1 flex-1 min-w-0">
            <Icon className={`w-6 h-6 ${isActive(to) ? 'text-accent' : 'text-muted-foreground'}`} />
            <span className={`text-[10px] font-semibold ${isActive(to) ? 'text-accent' : 'text-muted-foreground'}`}>{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}