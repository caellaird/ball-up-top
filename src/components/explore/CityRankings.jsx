import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import ListSkeleton from '@/components/shared/ListSkeleton';
import PullToRefresh from '@/components/shared/PullToRefresh';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function CityRankings({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('getCityLeaderboard', {});
      setData(res.data);
    } catch (e) {
      setData(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="px-4 pt-6"><ListSkeleton count={3} /></div>
      </div>
    );
  }

  const { topCities = [], userCity, cityOfYear, year } = data || {};
  const hasCities = topCities.length > 0;

  return (
    <PullToRefresh className="h-full overflow-y-auto overscroll-contain" onRefresh={load}>
      {/* Hero header */}
      <div className="px-4 pt-5 pb-2">
        <h1 className="font-heading text-3xl font-extrabold tracking-tight">WHO'S ON TOP?</h1>
        <p className="text-muted-foreground text-sm mt-1">
          See which cities are competing the hardest in {year || new Date().getFullYear()}.
        </p>
      </div>

      {/* City of the Year */}
      {cityOfYear ? (
        <div className="px-4 mb-5">
          <div className="rounded-3xl brand-gradient p-6 text-white text-center arena-shadow">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 mb-2">
              🏆 City of the Year
            </p>
            <h2 className="font-heading text-2xl font-extrabold mb-3 leading-tight">
              {cityOfYear.city}
            </h2>
            <div className="text-5xl mb-2">🏆</div>
            <p className="text-3xl font-extrabold">{cityOfYear.points}</p>
            <p className="text-xs opacity-80 uppercase tracking-wide font-semibold">City Points</p>
            <p className="text-[11px] opacity-70 mt-3 leading-snug">
              The most competitive city on Ball Up Top this year.
            </p>
          </div>
        </div>
      ) : (
        <div className="px-4 mb-5">
          <div className="rounded-3xl border-2 border-dashed border-border p-6 text-center">
            <div className="text-4xl mb-2">🏆</div>
            <p className="font-bold text-sm">No cities ranked yet this year.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Compete to put your city on top!
            </p>
          </div>
        </div>
      )}

      {/* Top Cities This Year */}
      {hasCities && (
        <div className="px-4 mb-5">
          <h3 className="font-heading text-lg font-bold mb-3">🌎 Top Cities This Year</h3>
          <div className="space-y-2">
            {topCities.map((city, i) => {
              const isUserCity = userCity?.cityKey === city.cityKey;
              return (
                <div
                  key={city.cityKey}
                  className={`flex items-center gap-3 rounded-2xl p-3.5 border transition ${
                    isUserCity
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border bg-card'
                  } ${i === 0 ? 'ring-2 ring-yellow-400/40' : ''}`}
                >
                  <div className="w-9 text-center text-xl font-bold shrink-0">
                    {i < 3 ? MEDALS[i] : <span className="text-muted-foreground text-lg">{i + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{city.city}</p>
                    {isUserCity && (
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wide">Your City</span>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-extrabold text-lg leading-none">{city.points}</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wide mt-0.5">Points</p>
                  </div>
                </div>
              );
            })}
          </div>
          {topCities.length < 5 && (
            <p className="text-center text-sm text-muted-foreground mt-3">More cities are coming.</p>
          )}
        </div>
      )}

      {/* Your City */}
      {userCity ? (
        <div className="px-4 mb-5">
          <h3 className="font-heading text-lg font-bold mb-3">Your City</h3>
          <div
            className={`rounded-2xl p-4 border-2 ${
              userCity.rank && userCity.rank <= 5
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="font-bold text-lg">{userCity.city}</p>
              {userCity.rank === 1 && <span className="text-2xl">🏆</span>}
            </div>
            <p className="text-sm font-bold text-primary">
              {userCity.rank === 1
                ? '🏆 #1 This Year'
                : userCity.rank
                  ? `#${userCity.rank} This Year`
                  : 'Unranked this year'}
            </p>
            <p className="text-sm text-muted-foreground">
              {userCity.points} {userCity.points === 1 ? 'City Point' : 'City Points'}
            </p>
            {userCity.behindFifth !== null && userCity.behindFifth > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {userCity.behindFifth} {userCity.behindFifth === 1 ? 'point' : 'points'} behind #5
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="px-4 mb-5">
          <h3 className="font-heading text-lg font-bold mb-3">Your City</h3>
          <div className="rounded-2xl border-2 border-dashed border-border p-4 text-center">
            <div className="text-3xl mb-2">📍</div>
            <p className="font-bold text-sm mb-1">Add Your City</p>
            <p className="text-xs text-muted-foreground mb-3 leading-snug">
              Pick where you're from so every game you play scores for your city.
            </p>
            <Button asChild variant="secondary" className="rounded-full" size="sm">
              <Link to="/profile/me">Add City</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Motivational CTA */}
      <div className="px-4 pb-8 pt-1">
        <div className="rounded-2xl bg-muted/60 p-4 text-center mb-4">
          <p className="text-sm font-semibold text-muted-foreground leading-snug">
            Challenges, scorecards and league recaps all score for your city. Rep your area and climb.
          </p>
        </div>
        <Button asChild className="w-full rounded-full h-12 font-bold">
          <Link to="/ball-up">Challenge a Friend</Link>
        </Button>
        <p className="text-center text-[11px] text-muted-foreground mt-3">
          Every game counts. Your city is competing too.
        </p>
      </div>
    </PullToRefresh>
  );
}