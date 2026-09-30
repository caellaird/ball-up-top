import React, { useRef } from 'react';
import { useOutlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import BottomNav from './BottomNav';
import TabContainer from './TabContainer';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const TAB_PATHS = ['/', '/challenges', '/groups', '/profile/me'];

// Renders the overlay page's outlet. While the overlay animates out after
// navigating back to a tab route, the live outlet would render a SECOND copy
// of that tab page (e.g. Challenges) on top of the real one in TabContainer.
// Keep showing the last non-tab page instead, so there's only ever one copy.
function OverlayOutlet({ context }) {
  const location = useLocation();
  const outlet = useOutlet(context);
  const last = useRef(outlet);
  if (!TAB_PATHS.includes(location.pathname)) last.current = outlet;
  return last.current;
}

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
    <div className="min-h-screen bg-muted/50 flex min-[769px]:justify-center">
      <div className="relative w-full min-[769px]:max-w-[430px] h-[100dvh] bg-background animated-bg flex flex-col shadow-2xl overflow-hidden">
        {/* Content area — the only part that scrolls. Bottom nav below is a fixed sibling. */}
        <div className="relative flex-1 min-h-0">
          <TabContainer user={user} pathname={location.pathname} />
          <AnimatePresence mode="wait">
            {!isTabRoute && (
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="absolute inset-0 bg-background overflow-y-auto overscroll-contain pb-4 z-10"
              >
                <OverlayOutlet context={{ user }} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <BottomNav />
      </div>
    </div>
  );
}