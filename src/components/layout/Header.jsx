import React from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { LOGO_URL } from '@/lib/constants';

export default function Header({ title }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 border-b border-border bg-background/90 backdrop-blur pt-[env(safe-area-inset-top)]">
      <div className="flex items-center gap-2">
        <img src={LOGO_URL} alt="Ball Up Top" className="w-8 h-8 rounded-lg" />
        <span className="font-heading font-extrabold text-lg">{title || 'Ball Up Top'}</span>
      </div>
      <Link to="/notifications" className="p-2 rounded-full hover:bg-muted">
        <Bell className="w-5 h-5" />
      </Link>
    </header>
  );
}