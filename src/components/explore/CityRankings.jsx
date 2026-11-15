import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import ListSkeleton from '@/components/shared/ListSkeleton';
import PullToRefresh from '@/components/shared/PullToRefresh';

const MEDALS = ['🥇', '🥈', '🥉'];
const REFRESH_MS = 60000;

function RankRow({ index, title, subtitle, count, highlight }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl p-3.5 border transition ${
        highlight ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border bg-card'
      } ${index === 0 ? 'ring-2 ring-yellow-400/40' : ''}`}
    >
      <div className="w-9 text-center text-xl font-bold shrink-0">
        {index < 3 ? MEDALS[index] : <span className="text-muted-foreground text-lg">{index + 1}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate">{title}</p>
        {subtitle && (
          <p className="text-[10px] font-bold text-primary uppercase tracking-wide truncate">{subtitle}</p>
        )}
      </div>
      <div className="text-right shrink-0">
        <p className="font-extrabold text-lg leading-none">{count}</p>
        <p className="text-[9px] text-muted-foreground uppercase tracking-wide mt-0.5">Challenges</p>
      </div>
    </div>
  );
}

export default function CityRankings({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const inFlight = useRef(false);

  const load = useCallback(async (silent = false) => {
    if (inFlight.current) return;
    inFlight.current = true;
    if (!silent) setLoading(true);
    try {
      const res = await base44.functions.invoke('getCityLeaderboard', {});
      setData(res.data);
    } catch (e) {
      if (!silent) setData(null);
    } finally {
      inFlight.current = false;
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Live rankings: refresh every 60s while the screen is visible, immediately
  // when the app comes back to the foreground, and never while backgrounded.
  useEffect(() => {
    let timer = null;
    const start = () => {
      if (timer) return;
      timer = setInterval(() => {
        if (document.visibilityState === 'visible') load(true);
      }, REFRESH_MS);
    };
    const stop = () => {
      if (timer) { clearInterval(timer); timer = null; }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        load(true);
        start();
      } else {
        stop();
      }
    };

    if (document.visibilityState === 'visible') start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [load]);

  if (loading) {
    return (
      <div className="h-full overflow-y-auto app-scroll">
        <div className="px-4 pt-6"><ListSkeleton count={3} /></div>
      </div>
    );
  }

  const { topCities = [], topStates = [], userCity, userState, cityOfYear } = data || {};
  const hasCities = topCities.length > 0;
  const hasStates = topStates.length > 0;

  return (
    <PullToRefresh className="h-full overflow-y-auto overscroll-contain app-scroll" onRefresh={() => load(true)}>
      {/* Hero header */}
      <div className="px-4 pt-5 pb-2">
        <h1 className="font-heading text-3xl font-extrabold tracking-tight">WHO'S ON TOP?</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Every completed challenge scores one for each player's city and state.
        </p>
      </div>

      {/* Top City */}
      {cityOfYear ? (
        <div className="px-4 mb-5">
          <div className="rounded-3xl brand-gradient p-6 text-white text-center arena-shadow">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 mb-2">
              🏆 Top City
            </p>
            <h2 className="font-heading text-2xl font-extrabold mb-3 leading-tight">
              {cityOfYear.city}
            </h2>
            <div className="text-5xl mb-2">🏆</div>
            <p className="text-3xl font-extrabold">{cityOfYear.count}</p>
            <p className="text-xs opacity-80 uppercase tracking-wide font-semibold">Completed Challenges</p>
            <p className="text-[11px] opacity-70 mt-3 leading-snug">
              The most competitive city on Ball Up Top.
            </p>
          </div>
        </div>
      ) : (
        <div className="px-4 mb-5">
          <div className="rounded-3xl border-2 border-dashed border-border p-6 text-center">
            <div className="text-4xl mb-2">🏆</div>
            <p className="font-bold text-sm">No cities ranked yet.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Compete to put your city on top!
            </p>
          </div>
        </div>
      )}

      {/* Top Cities */}
      <div className="px-4 mb-5">
        <h3 className="font-heading text-lg font-bold mb-3">🌎 Top Cities</h3>
        {hasCities ? (
          <>
            <div className="space-y-2">
              {topCities.map((city, i) => (
                <RankRow
                  key={city.cityKey || city.city}
                  index={i}
                  title={city.city}
                  subtitle={userCity?.cityKey === city.cityKey ? 'Your City' : ''}
                  count={city.count}
                  highlight={userCity?.cityKey === city.cityKey}
                />
              ))}
            </div>
            {topCities.length < 5 && (
              <p className="text-center text-sm text-muted-foreground mt-3">More cities are coming.</p>
            )}
          </>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-border p-4 text-center">
            <p className="text-xs text-muted-foreground">Completed challenges will rank cities here.</p>
          </div>
        )}
      </div>

      {/* Top States */}
      <div className="px-4 mb-5">
        <h3 className="font-heading text-lg font-bold mb-3">🇺🇸 Top States</h3>
        {hasStates ? (
          <div className="space-y-2">
            {topStates.map((state, i) => (
              <RankRow
                key={state.stateCode}
                index={i}
                title={state.stateName}
                subtitle={userState?.stateCode === state.stateCode ? 'Your State' : ''}
                count={state.count}
                highlight={userState?.stateCode === state.stateCode}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-border p-4 text-center">
            <p className="text-xs text-muted-foreground">Completed challenges will rank states here.</p>
          </div>
        )}
      </div>

      {/* Your Location */}
      {userCity ? (
        <div className="px-4 mb-5">
          <h3 className="font-heading text-lg font-bold mb-3">Your City & State</h3>
          <div className="rounded-2xl p-4 border-2 border-border bg-card space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="font-bold text-lg">{userCity.city}</p>
                {userCity.rank === 1 && <span className="text-2xl">🏆</span>}
              </div>
              <p className="text-sm font-bold text-primary">
                {userCity.rank === 1
                  ? '🏆 #1 City'
                  : userCity.rank
                    ? `#${userCity.rank} City`
                    : 'Unranked city'}
              </p>
              <p className="text-sm text-muted-foreground">
                {userCity.count} {userCity.count === 1 ? 'Completed Challenge' : 'Completed Challenges'}
              </p>
            </div>
            {userState && (
              <div className="pt-3 border-t border-border">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-bold text-lg">{userState.stateName}</p>
                  {userState.rank === 1 && <span className="text-2xl">🏆</span>}
                </div>
                <p className="text-sm font-bold text-primary">
                  {userState.rank === 1
                    ? '🏆 #1 State'
                    : userState.rank
                      ? `#${userState.rank} State`
                      : 'Unranked state'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {userState.count} {userState.count === 1 ? 'Completed Challenge' : 'Completed Challenges'}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="px-4 mb-5">
          <h3 className="font-heading text-lg font-bold mb-3">Your City & State</h3>
          <div className="rounded-2xl border-2 border-dashed border-border p-4 text-center">
            <div className="text-3xl mb-2">📍</div>
            <p className="font-bold text-sm mb-1">Add Your Location</p>
            <p className="text-xs text-muted-foreground mb-3 leading-snug">
              Add your city and state so every game you complete scores for them.
            </p>
            <Button asChild variant="secondary" className="rounded-full" size="sm">
              <Link to="/profile/me">Add Location</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Motivational CTA */}
      <div className="px-4 pb-8 pt-1">
        <div className="rounded-2xl bg-muted/60 p-4 text-center mb-4">
          <p className="text-sm font-semibold text-muted-foreground leading-snug">
            Every completed challenge scores one for each player's city and state. Rep your area and climb.
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