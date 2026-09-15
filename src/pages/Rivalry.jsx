import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useOutletContext, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import UserAvatar from '@/components/shared/UserAvatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Swords, Flame, RefreshCw, BarChart3 } from 'lucide-react';
import { fetchRivalry, fetchRivalryHistory } from '@/lib/rivalries';
import { getSportDisplay } from '@/lib/constants';
import { computeRivalryBreakdown, generateRivalryStory, generateRivalryInsights, sportKeyToChallengeProps } from '@/lib/rivalryBreakdown';
import { format, formatDistanceToNow } from 'date-fns';
import { useGoBack } from '@/hooks/useGoBack';
import { useMotionVariants } from '@/lib/motion';
import BackButton from '@/components/shared/BackButton';
import SportBreakdownCard from '@/components/rivalry/SportBreakdownCard';
import RivalryInsights from '@/components/rivalry/RivalryInsights';
import ChallengeFromProfileSheet from '@/components/profile/ChallengeFromProfileSheet';

const FILTER_ALL = 'all';
const FILTER_WINS = 'wins';
const FILTER_LOSSES = 'losses';
const FILTER_TIES = 'ties';
const FILTER_SPORT = 'sport';

const TIME_ALL = 'all';
const TIME_30 = '30d';
const TIME_7 = '7d';

export default function Rivalry() {
  const { rivalryId } = useParams();
  const { user } = useOutletContext();
  const goBack = useGoBack();
  const { staggerParent, fadeUp, tapProps, reduce } = useMotionVariants();

  const [rivalry, setRivalry] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showChallenge, setShowChallenge] = useState(false);
  const [challengeOpp, setChallengeOpp] = useState(null); // { id, name, username }

  // Filters
  const [filterType, setFilterType] = useState(FILTER_ALL); // all | sport | wins | losses | ties
  const [activeSportKey, setActiveSportKey] = useState(null);
  const [timeRange, setTimeRange] = useState(TIME_ALL);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const r = await fetchRivalry(rivalryId);
        if (cancelled) return;
        setRivalry(r);
        if (r) {
          const h = await fetchRivalryHistory(r.user_a_id, r.user_b_id);
          if (!cancelled) setHistory(h);
        }
      } catch { /* */ } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [rivalryId]);

  const breakdown = useMemo(() => {
    if (!rivalry || history.length === 0) return null;
    return computeRivalryBreakdown(history, rivalry.user_a_id, rivalry.user_b_id);
  }, [rivalry, history]);

  const userA = rivalry
    ? { id: rivalry.user_a_id, name: rivalry.user_a_name, avatar: rivalry.user_a_avatar }
    : null;
  const userB = rivalry
    ? { id: rivalry.user_b_id, name: rivalry.user_b_name, avatar: rivalry.user_b_avatar }
    : null;

  const overall = breakdown?.overall;
  const aWins = overall?.aWins ?? rivalry?.user_a_wins ?? 0;
  const bWins = overall?.bWins ?? rivalry?.user_b_wins ?? 0;
  const totalGames = overall?.totalGames ?? rivalry?.total_games ?? 0;
  const draws = overall?.draws ?? rivalry?.draws ?? 0;
  const isTied = aWins === bWins;

  const streakName = overall?.currentStreakUserId && userA && userB
    ? (overall.currentStreakUserId === userA.id ? userA.name
      : overall.currentStreakUserId === userB.id ? userB.name : null)
    : null;
  const streakCount = overall?.currentStreakCount ?? 0;

  const story = breakdown && userA && userB
    ? generateRivalryStory(breakdown, userA.name, userB.name) : '';
  const insights = breakdown && userA && userB
    ? generateRivalryInsights(breakdown, rivalry.user_a_id, rivalry.user_b_id, user?.id, userA.name, userB.name)
    : [];

  // Filtered history for display
  const filteredHistory = useMemo(() => {
    if (!history.length) return [];
    let result = [...history];

    // Sport filter
    if (filterType === FILTER_SPORT && activeSportKey) {
      result = result.filter((c) => {
        const key = activeSportKey;
        if (key.startsWith('custom:')) {
          return c.sport === 'custom'
            && `custom:${c.custom_sport_name || 'Custom'}|${c.custom_sport_emoji || '🏆'}` === key;
        }
        return c.sport === key;
      });
    }

    // Win/Loss/Tie filter (from current user's perspective, or A's perspective for third-party)
    const perspectiveId = user?.id === userA?.id || user?.id === userB?.id
      ? user.id
      : userA?.id; // third party views from A's perspective

    if (filterType === FILTER_WINS) {
      result = result.filter((c) => !c.is_draw && c.winner_id === perspectiveId);
    } else if (filterType === FILTER_LOSSES) {
      const otherId = perspectiveId === userA?.id ? userB?.id : userA?.id;
      result = result.filter((c) => !c.is_draw && c.winner_id === otherId);
    } else if (filterType === FILTER_TIES) {
      result = result.filter((c) => c.is_draw);
    }

    // Time range filter
    if (timeRange !== TIME_ALL) {
      const days = timeRange === TIME_7 ? 7 : 30;
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
      result = result.filter((c) => new Date(c.completed_at || c.updated_date).getTime() > cutoff);
    }

    return result; // already sorted newest-first from fetchRivalryHistory
  }, [history, filterType, activeSportKey, timeRange, user, userA, userB]);

  const handleSportTap = (sportKey) => {
    if (activeSportKey === sportKey && filterType === FILTER_SPORT) {
      // Toggle off
      setFilterType(FILTER_ALL);
      setActiveSportKey(null);
    } else {
      setFilterType(FILTER_SPORT);
      setActiveSportKey(sportKey);
    }
  };

  const challengeOpponent = async (opp) => {
    const profiles = await base44.entities.Profile.filter({ created_by_id: opp.id });
    const p = profiles?.[0];
    setChallengeOpp({ id: opp.id, name: opp.name, username: p?.username || '' });
    setShowChallenge(true);
  };

  // Pre-select sport for Run It Back
  const challengeDefaults = useMemo(() => {
    if (filterType === FILTER_SPORT && activeSportKey) {
      return sportKeyToChallengeProps(activeSportKey);
    }
    if (breakdown?.mostPlayedSport) {
      return sportKeyToChallengeProps(breakdown.mostPlayedSport.key);
    }
    return {};
  }, [filterType, activeSportKey, breakdown]);

  const activeSportLabel = breakdown?.sports.find((s) => s.key === activeSportKey)?.label;

  if (loading) return (
    <div className="px-4 space-y-4 pt-4">
      <Skeleton className="w-full h-40 rounded-3xl" />
      <Skeleton className="w-full h-24 rounded-2xl" />
      <Skeleton className="w-full h-24 rounded-2xl" />
    </div>
  );

  if (!rivalry) return (
    <div className="flex flex-col items-center justify-center h-full px-4">
      <p className="text-muted-foreground">Rivalry not found.</p>
      <Button variant="secondary" className="mt-4 rounded-full" onClick={goBack}>Go Back</Button>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 flex items-center px-4 pt-3 pb-2">
        <BackButton fallback="/" className="-ml-1 text-foreground" />
        <span className="font-heading font-bold ml-1">Rivalry</span>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-6">
        {/* 1. HEAD-TO-HEAD HERO */}
        <motion.div
          initial={reduce ? false : "hidden"}
          animate="visible"
          variants={reduce ? undefined : fadeUp}
          className="brand-gradient rounded-3xl p-5 text-white arena-shadow relative overflow-hidden mb-4"
        >
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="relative">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Swords className="w-5 h-5" />
              <span className="font-heading font-extrabold text-sm uppercase tracking-wider">
                {isTied ? 'Dead Even' : 'Head to Head'}
              </span>
            </div>
            <p className="text-center text-[10px] uppercase tracking-widest opacity-70 mb-4">
              {breakdown && breakdown.sports.length > 1
                ? `${breakdown.sports.length} Activities · ${totalGames} Games`
                : 'Who\'s On Top?'}
            </p>

            <div className="flex items-center justify-around text-center mb-4">
              <Link to={`/profile/${userA.name?.toLowerCase().replace(/\s/g, '')}`} className="flex flex-col items-center gap-1">
                <UserAvatar userId={userA.id} src={userA.avatar} name={userA.name} className="w-16 h-16 border-2 border-white/40" fallbackClassName="bg-white/20 text-white text-xl" />
                <p className="font-heading font-bold text-sm mt-1">{userA.name}</p>
                <p className="font-heading font-extrabold text-2xl">{aWins}</p>
                <p className="text-[9px] uppercase opacity-70">Wins</p>
              </Link>
              <div className="flex flex-col items-center">
                <span className="font-heading text-xl font-bold opacity-60">{totalGames}</span>
                <span className="text-[9px] uppercase opacity-70">Games</span>
                {draws > 0 && <span className="text-[10px] opacity-60 mt-1">🤝 {draws} draws</span>}
              </div>
              <Link to={`/profile/${userB.name?.toLowerCase().replace(/\s/g, '')}`} className="flex flex-col items-center gap-1">
                <UserAvatar userId={userB.id} src={userB.avatar} name={userB.name} className="w-16 h-16 border-2 border-white/40" fallbackClassName="bg-white/20 text-white text-xl" />
                <p className="font-heading font-bold text-sm mt-1">{userB.name}</p>
                <p className="font-heading font-extrabold text-2xl">{bWins}</p>
                <p className="text-[9px] uppercase opacity-70">Wins</p>
              </Link>
            </div>

            {isTied && (
              <p className="text-center font-heading font-bold text-sm mb-3">🔥 Nobody is on top</p>
            )}

            {/* Overall current streak */}
            {streakName && streakCount >= 2 && (
              <div className="flex items-center justify-center gap-1.5 mb-3">
                <Flame className="w-4 h-4" />
                <span className="font-heading font-bold text-sm">{streakName} W{streakCount}</span>
              </div>
            )}

            <div className="flex gap-2">
              <Button size="sm" variant="secondary" className="flex-1 rounded-full text-xs" onClick={() => challengeOpponent(userA)}>
                <Swords className="w-3 h-3 mr-1" /> Challenge {userA.name?.split(' ')[0]}
              </Button>
              <Button size="sm" variant="secondary" className="flex-1 rounded-full text-xs" onClick={() => challengeOpponent(userB)}>
                <Swords className="w-3 h-3 mr-1" /> Challenge {userB.name?.split(' ')[0]}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* 2. SPORT/ACTIVITY BREAKDOWN */}
        {breakdown && breakdown.sports.length > 0 && (
          <div className="mb-4">
            <h3 className="font-heading font-bold text-sm uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-primary" /> Sport Breakdown
            </h3>
            <motion.div
              variants={reduce ? undefined : staggerParent}
              initial="hidden"
              animate="visible"
              className="space-y-2"
            >
              {breakdown.sports.map((sport) => (
                <motion.div key={sport.key} variants={fadeUp}>
                  <SportBreakdownCard
                    sport={sport}
                    userA={userA}
                    userB={userB}
                    active={filterType === FILTER_SPORT && activeSportKey === sport.key}
                    onClick={() => handleSportTap(sport.key)}
                  />
                </motion.div>
              ))}
            </motion.div>
            {breakdown.sports.length > 1 && (
              <p className="text-[11px] text-muted-foreground text-center mt-2">
                Tap a sport to filter the matchup history
              </p>
            )}
          </div>
        )}

        {/* 3. RIVALRY STORY */}
        {story && (
          <div className="bg-card rounded-2xl border border-border/50 p-3.5 mb-4">
            <p className="text-sm leading-relaxed text-foreground/90">{story}</p>
          </div>
        )}

        {/* 4. RIVALRY INSIGHTS */}
        <RivalryInsights insights={insights} />

        {/* 5. RECENT MATCHUPS + FILTERS */}
        <h3 className="font-heading font-bold text-sm uppercase tracking-wide mb-2 mt-2">
          {activeSportLabel ? `${activeSportLabel} Matchups` : 'Recent Matchups'}
        </h3>

        {/* Filter chips */}
        <div className="flex gap-1.5 flex-wrap mb-3">
          <FilterChip label="All" active={filterType === FILTER_ALL} onClick={() => { setFilterType(FILTER_ALL); setActiveSportKey(null); }} />
          <FilterChip label="Wins" active={filterType === FILTER_WINS} onClick={() => { setFilterType(FILTER_WINS); setActiveSportKey(null); }} />
          <FilterChip label="Losses" active={filterType === FILTER_LOSSES} onClick={() => { setFilterType(FILTER_LOSSES); setActiveSportKey(null); }} />
          {draws > 0 && (
            <FilterChip label="Ties" active={filterType === FILTER_TIES} onClick={() => { setFilterType(FILTER_TIES); setActiveSportKey(null); }} />
          )}
          <div className="w-px bg-border mx-0.5" />
          <FilterChip label="7d" active={timeRange === TIME_7} onClick={() => setTimeRange(timeRange === TIME_7 ? TIME_ALL : TIME_7)} small />
          <FilterChip label="30d" active={timeRange === TIME_30} onClick={() => setTimeRange(timeRange === TIME_30 ? TIME_ALL : TIME_30)} small />
        </div>

        {/* Matchup list with AnimatePresence for filter transitions */}
        <AnimatePresence mode="popLayout">
          {filteredHistory.length === 0 ? (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm text-muted-foreground text-center py-6"
            >
              {history.length === 0
                ? 'No games recorded yet.'
                : 'No matchups match this filter.'}
            </motion.p>
          ) : (
            <motion.div
              key={`${filterType}-${activeSportKey}-${timeRange}`}
              variants={reduce ? undefined : staggerParent}
              initial="hidden"
              animate="visible"
              className="space-y-2"
            >
              {filteredHistory.map((c) => {
                const display = getSportDisplay(c);
                const winnerName = c.is_draw ? 'Draw' : c.winner_name || '—';
                const gameNum = history.length - history.indexOf(c);
                return (
                  <motion.div
                    key={c.id}
                    variants={fadeUp}
                    className="bg-card rounded-2xl border border-border/50 p-3 flex items-center gap-3"
                  >
                    <span className="text-xl">{display.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {winnerName}{c.is_draw ? '' : ' W'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {display.label}{c.score_text ? ` · ${c.score_text}` : ''}
                      </p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {format(new Date(c.completed_at || c.updated_date), 'MMM d')}
                    </span>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 6. RUN IT BACK */}
        <motion.div
          {...tapProps}
          className="mt-5"
        >
          <Button
            className="w-full rounded-full h-12 brand-gradient font-bold"
            onClick={() => challengeOpponent(user?.id === userA?.id ? userB : userA)}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Run It Back{(() => {
              const sportKey = filterType === FILTER_SPORT ? activeSportKey : breakdown?.mostPlayedSport?.key;
              const sport = breakdown?.sports.find((s) => s.key === sportKey);
              return sport ? ` · ${sport.emoji} ${sport.label}` : '';
            })()}
          </Button>
        </motion.div>
      </div>

      {challengeOpp && (
        <ChallengeFromProfileSheet
          key={`${challengeOpp.id}-${challengeDefaults.sport || 'default'}`}
          open={showChallenge}
          onOpenChange={setShowChallenge}
          opponentId={challengeOpp.id}
          opponentName={challengeOpp.name}
          opponentUsername={challengeOpp.username}
          defaultSport={challengeDefaults.sport}
          defaultCustomName={challengeDefaults.customName}
          defaultCustomEmoji={challengeDefaults.customEmoji}
        />
      )}
    </div>
  );
}

function FilterChip({ label, active, onClick, small }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full font-semibold transition-colors ${
        small ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'
      } ${
        active
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground'
      }`}
    >
      {label}
    </button>
  );
}