import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';
import TabContainer from './TabContainer';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const TAB_PATHS = ['/', '/challenges', '/groups', '/profile/me'];

export default function MobileShell() {
  const { user, loading } = useCurrentUser();
  const location = useLocation();

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  const isTabRoute = TAB_PATHS.includes(location.pathname);

  return (
    <div className="min-h-screen bg-muted/50 flex justify-center">
      <div className="relative w-full max-w-[430px] h-[100dvh] bg-background flex flex-col shadow-2xl overflow-hidden">
        {/* Content area — the only part that scrolls. Bottom nav below is a fixed sibling. */}
        <div className="relative flex-1 min-h-0">
          <TabContainer user={user} pathname={location.pathname} />
          {!isTabRoute && (
            <div className="absolute inset-0 bg-background overflow-y-auto overscroll-contain pb-4 z-10">
              <Outlet context={{ user }} />
            </div>
          )}
        </div>
        <BottomNav />
      </div>
    </div>
  );
}