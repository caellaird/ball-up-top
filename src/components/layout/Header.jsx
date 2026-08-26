import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, ArrowLeft } from 'lucide-react';
import { LOGO_URL } from '@/lib/constants';
import NotificationBadge from '@/components/layout/NotificationBadge';

export default function Header({ title, onBack }) {
  return (
    <header className="sticky top-0 z-30 px-4 pt-[env(safe-area-inset-top)] pb-2">
      <div className="flex items-center justify-between h-12 px-3 rounded-full border border-border/60 bg-background/80 backdrop-blur-xl arena-shadow">
        <div className="flex items-center gap-2 min-w-0">
          {onBack && (
            <button onClick={onBack} className="p-1.5 -ml-1 text-foreground shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <img src={LOGO_URL} alt="Ball Up Top" className="w-8 h-8 rounded-lg shrink-0" />
            <span className="font-heading font-extrabold text-lg truncate">{title || 'Ball Up Top'}</span>
          </Link>
        </div>
        <Link to="/notifications" className="relative p-2 rounded-full hover:bg-muted shrink-0">
          <Bell className="w-5 h-5" />
          <NotificationBadge />
        </Link>
      </div>
    </header>
  );
}