import React from 'react';
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
  { path: '/profile/me', Component: Profile, scroll: false, extraProps: { usernameOverride: 'me' } },
];

export default function TabContainer({ user, pathname }) {
  return (
    <>
      {TABS.map(({ path, Component, scroll, extraProps }) => {
        const active = pathname === path;
        return (
          <div
            key={path}
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