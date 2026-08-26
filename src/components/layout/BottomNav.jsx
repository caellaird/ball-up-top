import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Swords, Users, User } from 'lucide-react';
import { LOGO_URL } from '@/lib/constants';

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
          <Link
            key={to}
            to={to}
            onClick={(e) => { if (isActive(to)) { e.preventDefault(); window.dispatchEvent(new CustomEvent('scroll-to-top')); } }}
            className="flex flex-col items-center gap-1 px-2 py-1 flex-1 min-w-0"
          >
            <Icon className={`w-6 h-6 ${isActive(to) ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={`text-[10px] font-semibold ${isActive(to) ? 'text-primary' : 'text-muted-foreground'}`}>{label}</span>
          </Link>
        ))}

        <button onClick={() => navigate('/ball-up')} aria-label="Ball Up" className="flex flex-col items-center -mt-8 w-16">
          <span className="w-14 h-14 rounded-full brand-gradient arena-shadow flex items-center justify-center border-2 border-background overflow-hidden">
            <img src={LOGO_URL} alt="Ball Up Top" className="w-full h-full object-cover rounded-full" />
          </span>
          <span className="text-[10px] font-bold text-primary mt-1">BALL UP</span>
        </button>

        {rightItems.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            onClick={(e) => { if (isActive(to)) { e.preventDefault(); window.dispatchEvent(new CustomEvent('scroll-to-top')); } }}
            className="flex flex-col items-center gap-1 px-2 py-1 flex-1 min-w-0"
          >
            <Icon className={`w-6 h-6 ${isActive(to) ? 'text-accent' : 'text-muted-foreground'}`} />
            <span className={`text-[10px] font-semibold ${isActive(to) ? 'text-accent' : 'text-muted-foreground'}`}>{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}