import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy } from 'lucide-react';
import { getAwardMeta, RARITY_CLASSES } from '@/lib/awards';
import { LOGO_URL } from '@/lib/constants';

export default function AwardPage() {
  const { awardId } = useParams();
  const [searchParams] = useSearchParams();
  const userIdParam = searchParams.get('user');

  const [award, setAward] = useState(null);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const a = await base44.entities.Award.get(awardId);
        if (cancelled) return;
        setAward(a);

        const recipientId = a.recipient_id || userIdParam;
        if (!recipientId) { setLoading(false); return; }

        const [profiles, statsList] = await Promise.all([
          base44.entities.Profile.filter({ created_by_id: recipientId }),
          base44.entities.UserStats.filter({ created_by_id: recipientId }),
        ]);
        if (cancelled) return;
        setProfile(profiles[0] || null);
        setStats(statsList[0] || null);
      } catch { /* award not found */ }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [awardId, userIdParam]);

  const meta = award ? getAwardMeta(award.type) : { emoji: '🏆', rarity: 'Common' };
  const rarityClass = RARITY_CLASSES[meta.rarity] || RARITY_CLASSES.Common;
  const name = profile?.nickname || award?.recipient_name || 'Player';
  const username = profile?.username || '';
  const wins = stats?.games_won ?? 0;
  const losses = stats?.losses ?? 0;
  const winPct = wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <div className="sticky top-0 safe-top bg-background/95 backdrop-blur border-b border-border z-10">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">Back</Link>
          <img src={LOGO_URL} alt="Ball Up Top" className="h-7 w-7 rounded-lg" />
          <Link to="/register" className="text-sm font-semibold text-primary">Sign up</Link>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 pb-28">
        {loading ? (
          <div className="flex flex-col items-center py-16">
            <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : !award ? (
          <div className="text-center py-16">
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h1 className="font-heading text-xl font-bold">Award not found</h1>
            <p className="text-sm text-muted-foreground mt-1">This achievement may have been removed.</p>
          </div>
        ) : (
          <>
            {/* Achievement badge hero */}
            <div className="text-center mb-6">
              <div className="w-24 h-24 rounded-full brand-gradient mx-auto flex items-center justify-center mb-4 arena-shadow">
                <span className="text-5xl">{meta.emoji}</span>
              </div>
              <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full border ${rarityClass} mb-2`}>{meta.rarity}</span>
              <h1 className="font-heading text-2xl font-bold">{award.type}</h1>
              <p className="text-sm text-muted-foreground mt-1">Achievement Unlocked on Ball Up Top</p>
            </div>

            {/* Player card */}
            <div className="bg-card border border-border rounded-2xl p-5 mb-4">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="w-14 h-14 border-2 border-border">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="text-lg font-heading">{name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-heading font-bold text-lg truncate">{name}</p>
                  {username && <p className="text-sm text-muted-foreground truncate">@{username}</p>}
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-muted/50 rounded-xl py-3">
                  <p className="font-heading text-xl font-bold text-green-600">{wins}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Wins</p>
                </div>
                <div className="bg-muted/50 rounded-xl py-3">
                  <p className="font-heading text-xl font-bold text-red-500">{losses}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Losses</p>
                </div>
                <div className="bg-muted/50 rounded-xl py-3">
                  <p className="font-heading text-xl font-bold">{winPct}%</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Win %</p>
                </div>
              </div>

              {award.awarded_by_name && (
                <p className="text-xs text-muted-foreground text-center mt-4">Awarded by {award.awarded_by_name}</p>
              )}
            </div>

            {/* What is Ball Up Top */}
            <div className="bg-muted/30 rounded-2xl p-5 mb-6">
              <h2 className="font-heading font-bold mb-1">What is Ball Up Top?</h2>
              <p className="text-sm text-muted-foreground">Ball Up Top is the social hub for pickup sports — challenge players near you, track your stats, and climb local leaderboards.</p>
            </div>
          </>
        )}

        {/* Registration CTA */}
        <div className="rounded-2xl brand-gradient p-6 text-center text-white arena-shadow">
          <h2 className="font-heading text-lg font-bold mb-1">Claim your free Baller Profile</h2>
          <p className="text-sm text-white/90 mb-4">Join Ball Up Top, challenge players near you, and start collecting achievements.</p>
          <Link
            to="/register"
            className="inline-flex items-center justify-center h-11 px-6 rounded-full bg-white text-primary font-heading font-bold text-sm"
          >
            Get Started — It's Free
          </Link>
        </div>
      </div>
    </div>
  );
}