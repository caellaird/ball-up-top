import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, ArrowLeft } from 'lucide-react';
import { LOGO_URL } from '@/lib/constants';

export default function Header({ title, onBack }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 border-b border-border bg-background/90 backdrop-blur pt-[env(safe-area-inset-top)]">
      <div className="flex items-center gap-2 min-w-0">
        {onBack && (
          <button onClick={onBack} className="p-1 -ml-1 text-foreground shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <Link to="/" className="flex items-center gap-2 min-w-0">
          <img src={LOGO_URL} alt="Ball Up Top" className="w-8 h-8 rounded-lg shrink-0" />
          <span className="font-heading font-extrabold text-lg truncate">{title || 'Ball Up Top'}</span>
        </Link>
      </div>
      <Link to="/notifications" className="p-2 rounded-full hover:bg-muted shrink-0">
        <Bell className="w-5 h-5" />
      </Link>
    </header>
  );
}