import React from 'react';
import { resolveSportKey, sportGradient } from '@/lib/favoriteSport';

// Display-only profile banner. Reflects the user's favorite sport as a
// color-matched gradient. It is intentionally graphic-free so the avatar is the
// only focal point of the header.
export default function ProfileBanner({ profile }) {
  const sportKey = resolveSportKey(profile?.favorite_sport);
  const gradient = sportKey ? sportGradient(sportKey) : null;

  return (
    <div
      className="h-24 arena-gradient relative overflow-hidden arena-shadow"
      style={gradient ? { backgroundImage: gradient } : {}} />
  );
}