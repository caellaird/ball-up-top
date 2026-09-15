import React, { useEffect, useRef } from 'react';
import Home from '@/pages/Home';
import Challenges from '@/pages/Challenges';
import Groups from '@/pages/Groups';
import Profile from '@/pages/Profile';

// Each of these stays permanently mounted so switching tabs never resets
// scroll position or re-fetches data — exactly like a native app's tab bar.
const TABS = [
  { path: '/', Component: Home, scroll: true },
  { path: '/challenges', Component: Challenges, scroll: true },
  { path: '/groups', Component: Groups, scroll: true },
  { path: '/profile/me', Component: Profile, scroll: true, extraProps: { usernameOverride: 'me' } },
];

export default function TabContainer({ user, pathname }) {
  const activeScrollRef = useRef(null);

  // BottomNav dispatches 'scroll-to-top' when the active tab is tapped again.
  // Smoothly scroll the active tab's scroll container to the top.
  useEffect(() => {
    const handler = () => {
      const el = activeScrollRef.current;
      if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('scroll-to-top', handler);
    return () => window.removeEventListener('scroll-to-top', handler);
  }, []);

  return (
    <>
      {TABS.map(({ path, Component, scroll, extraProps }) => {
        const active = pathname === path;
        return (
          <div
            key={path}
            ref={active ? activeScrollRef : null}
            className={`absolute inset-0 pb-4 ${scroll ? 'overflow-y-auto overscroll-contain' : 'overflow-hidden'}`}
            style={{ display: active ? 'block' : 'none' }}
          >
            <Component user={user} {...(extraProps || {})} />
          </div>
        );
      })}
    </>
  );
}