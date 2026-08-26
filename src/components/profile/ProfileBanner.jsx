import React from 'react';
import { SPORT_EMOJI, SPORT_PIN_COLOR } from '@/lib/constants';
import { resolveSportKey, sportGradient } from '@/lib/favoriteSport';

// Display-only profile banner. Reflects the user's favorite sport as a
// color-matched gradient with a layered "outline" medallion of the sport's
// emoji. When no favorite sport is set (or it isn't recognized), the default
// orange→navy brand gradient is shown. There is no photo upload — the banner
// only changes when the user updates their favorite sport.
export default function ProfileBanner({ profile }) {
  const sportKey = resolveSportKey(profile?.favorite_sport);
  const gradient = sportKey ? sportGradient(sportKey) : null;
  const emoji = sportKey ? SPORT_EMOJI[sportKey] : null;
  const halo = sportKey && SPORT_PIN_COLOR[sportKey] ? `hsl(${SPORT_PIN_COLOR[sportKey]})` : null;

  return (
    <div
      className="h-32 arena-gradient relative overflow-hidden arena-shadow"
      style={gradient ? { backgroundImage: gradient } : {}}>
      
      {emoji &&
      <>
          {halo &&
        <div
          className="absolute -right-12 top-1/2 -translate-y-1/2 w-56 h-56 rounded-full blur-2xl opacity-40 pointer-events-none"
          style={{ background: halo }} />

        }
          <div className="absolute -right-10 top-1/2 -translate-y-1/2 w-36 h-36 rounded-full border-2 border-dashed border-white/15 pointer-events-none" />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-24 h-24 rounded-full border-2 border-white/30 bg-white/5 backdrop-blur-sm flex items-center justify-center shadow-lg pointer-events-none">
            <span className="text-5xl leading-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]">{emoji}</span>
          </div>
        </>
      }
    </div>);

}