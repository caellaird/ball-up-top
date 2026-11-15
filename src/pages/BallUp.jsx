import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Star, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { SPORTS, SERIES_TYPES, GAMES_TO_WIN, CUSTOM_SPORT_EMOJIS, getSportDisplay } from '@/lib/constants';
import { sendNotification } from '@/lib/notify';
import { otherPartyId, otherPartyName } from '@/lib/friendsHelpers';
import { loadProfileDirectory } from '@/lib/userDirectory';
import { useGoBack } from '@/hooks/useGoBack';
import HighlightComposerSheet from '@/components/feed/HighlightComposerSheet';
import AllFriendsSheet from '@/components/challenges/AllFriendsSheet';
import PlayerPickRow from '@/components/challenges/PlayerPickRow';
import { loadCompletedChallenges, buildRecentOpponents, buildMostPlayedFriends } from '@/lib/challengeOpponents';

export default function BallUp() {
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const goBack = useGoBack();
  const reduce = useReducedMotion();
  const [step, setStep] = useState(1);
  const [sport, setSport] = useState(null);
  const [friends, setFriends] = useState(null);
  const [directory, setDirectory] = useState([]);
  const [completedChallenges, setCompletedChallenges] = useState([]);
  const [showAllFriends, setShowAllFriends] = useState(false);
  const [opponents, setOpponents] = useState([]);
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [seriesType, setSeriesType] = useState('single');
  const [seriesName, setSeriesName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [customSportName, setCustomSportName] = useState('');
  const [customSportEmoji, setCustomSportEmoji] = useState('');
  const [sending, setSending] = useState(false);
  const [showHighlight, setShowHighlight] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      // One cached profile directory powers both the friend rows and search.
      const profiles = await loadProfileDirectory().catch(() => []);
      const all = await base44.entities.Friend.filter({ status: 'accepted' });
      const mine = all.filter((f) => f.created_by_id === user.id || f.addressee_id === user.id);
      const profileMap = new Map((profiles || []).map((p) => [p.created_by_id, p]));
      const enriched = mine.map((f) => {
        const otherId = otherPartyId(f, user.id);
        return {
          friendRecordId: f.id,
          userId: otherId,
          name: otherPartyName(f, user.id),
          profile: profileMap.get(otherId) || null,
        };
      });
      if (!alive) return;
      setFriends(enriched);
      setDirectory(profiles || []);
      // Completed history drives both Recently Challenged and Most Played, so it
      // is re-read every time this composer opens.
      const completed = await loadCompletedChallenges(user.id);
      if (alive) setCompletedChallenges(completed);
    })();
    return () => { alive = false; };
  }, [user.id]);

  const back = () => {
    if (step === 1 && sport === 'custom') { setSport(null); return; }
    if (step > 1) setStep(step - 1);
    else goBack();
  };

  const profileById = new Map((directory || []).map((p) => [p.created_by_id, p]));
  // Recently Challenged: 7 unique opponents, newest completed game first, each
  // with their current profile photo and name when a profile exists.
  const recentOpponents = buildRecentOpponents(completedChallenges, user.id, friends || [], 7).map((p) => {
    const profile = profileById.get(p.userId);
    return {
      ...p,
      avatar: p.avatar || profile?.avatar_url || null,
      username: p.username || profile?.username || null,
    };
  });
  const topFriends = buildMostPlayedFriends(completedChallenges, friends || [], user.id, 5).filter((f) => f.plays > 0);

  const toggleOpponent = (p) => {
    const id = p.userId || p.id;
    const exists = opponents.some((o) => o.id === id);
    if (exists) setOpponents(opponents.filter((o) => o.id !== id));
    else setOpponents([...opponents, { id, name: p.name, username: p.username || p.profile?.username }]);
  };

  const sportDisplay = getSportDisplay({ sport, custom_sport_name: customSportName, custom_sport_emoji: customSportEmoji });

  const send = async () => {
    setSending(true);
    const primary = opponents[0];
    const challenge = await base44.entities.Challenge.create({
      sport,
      custom_sport_name: sport === 'custom' ? customSportName : undefined,
      custom_sport_emoji: sport === 'custom' ? (customSportEmoji || '🏆') : undefined,
      creator_name: user.full_name,
      opponent_id: primary.id,
      opponent_name: primary.name,
      opponent_ids: opponents.map((o) => o.id),
      opponent_names: opponents.map((o) => o.name),
      participant_statuses: opponents.map((o) => ({ user_id: o.id, name: o.name, status: 'pending' })),
      location_name: location,
      scheduled_time: date ? new Date(date).toISOString() : undefined,
      series_type: seriesType,
      series_name: seriesType !== 'single' ? seriesName : undefined,
      group_name: opponents.length > 1 ? groupName.trim() : undefined,
      games_to_win: GAMES_TO_WIN[seriesType],
    });
    base44.analytics.track({ eventName: 'challenge_sent' });
    await Promise.all(opponents.map((o) =>
      sendNotification({ userId: o.id, type: 'challenge_invite', actorName: user.full_name, title: `${user.full_name} challenged you to ${sportDisplay.label}!`, link: `/challenges/${challenge.id}` })
    ));
    setSending(false);
    navigate(`/challenges/${challenge.id}`);
  };

  return (
    <div className="min-h-full flex flex-col">
      <div className="flex items-center justify-between px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <button onClick={back} aria-label="Go back" className="flex items-center justify-center min-w-[44px] min-h-[44px] -ml-2 text-foreground"><ChevronLeft className="w-6 h-6" /></button>
        <span className="font-heading font-bold">Step {step} of 5</span>
        <button onClick={goBack} aria-label="Close" className="flex items-center justify-center min-w-[44px] min-h-[44px] -mr-2 text-foreground"><X className="w-6 h-6" /></button>
      </div>

      <div className="flex-1 px-5 pb-6">
        {step === 1 && sport !== 'custom' && (
          <div>
            <h1 className="font-heading text-2xl font-extrabold mb-1">BALL UP TOP</h1>
            <p className="text-muted-foreground mb-6">Pick Your Game</p>
            <motion.button
              onClick={() => setShowHighlight(true)}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={reduce ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              whileTap={reduce ? undefined : { scale: 0.97 }}
              className="w-full flex items-center gap-3 rounded-3xl border-2 border-primary/40 bg-primary/5 p-4 mb-6 text-left"
            >
              <span className="w-12 h-12 rounded-2xl brand-gradient flex items-center justify-center shrink-0">
                <Star className="w-6 h-6 text-white fill-white" />
              </span>
              <span className="flex-1">
                <span className="block font-heading font-bold">Post a Scorecard</span>
                <span className="block text-xs text-muted-foreground">Log your own stats & highlights — no challenge needed</span>
              </span>
            </motion.button>
            <Link
              to="/leagues"
              className="w-full flex items-center gap-3 rounded-3xl border-2 border-border bg-card p-4 mb-6 text-left active:scale-[0.97] transition"
            >
              <span className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-primary" />
              </span>
              <span className="flex-1">
                <span className="block font-heading font-bold">Leagues</span>
                <span className="block text-xs text-muted-foreground">Create a league, add players & set game times</span>
              </span>
              <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
            </Link>
            <div className="grid grid-cols-3 gap-3">
              {SPORTS.map((s, i) => (
                <motion.button
                  key={s.key}
                  onClick={() => { setSport(s.key); if (s.key !== 'custom') setStep(2); }}
                  initial={reduce ? false : { opacity: 0, y: 12 }}
                  animate={reduce ? {} : { opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.3), duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  whileTap={reduce ? undefined : { scale: 0.94 }}
                  className={`aspect-square rounded-3xl flex flex-col items-center justify-center gap-1 border-2 ${sport === s.key ? 'border-accent bg-accent/10' : 'border-border bg-card'}`}
                >
                  <span className="text-3xl">{s.emoji}</span>
                  <span className="text-xs font-semibold text-center px-1">{s.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && sport === 'custom' && (
          <div>
            <h1 className="font-heading text-2xl font-extrabold mb-1">Create Challenge Details</h1>
            <p className="text-muted-foreground mb-6">Give your custom challenge a name and icon</p>
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Challenge name</p>
              <Input placeholder="e.g. King of the Court" value={customSportName} onChange={(e) => setCustomSportName(e.target.value)} className="h-12 rounded-2xl" />
              <p className="text-xs font-semibold text-muted-foreground mb-2">Pick an emoji</p>
              <div className="flex flex-wrap gap-2">
                {CUSTOM_SPORT_EMOJIS.map((e) => (
                  <button key={e} onClick={() => setCustomSportEmoji(e)} className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl border-2 ${customSportEmoji === e ? 'border-accent bg-accent/10' : 'border-border'}`}>{e}</button>
                ))}
              </div>
              <Button onClick={() => setStep(2)} disabled={!customSportName.trim()} className="w-full rounded-full h-12">Continue</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="font-heading text-2xl font-extrabold mb-1">Who's Getting Cooked?</h1>
            <p className="text-muted-foreground text-sm mb-4">Challenge your friends to a game.</p>
            {friends === null ? (
              <p className="text-muted-foreground text-sm">Loading friends...</p>
            ) : (
              <div className="space-y-5">
                <section>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Recently Challenged</p>
                  {recentOpponents.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Your finished games show up here.</p>
                  ) : (
                    <div className="space-y-2">
                      {recentOpponents.map((p) => (
                        <PlayerPickRow
                          key={p.userId}
                          name={p.name}
                          username={p.username}
                          avatar={p.avatar}
                          selected={opponents.some((o) => o.id === p.userId)}
                          onSelect={() => toggleOpponent(p)}
                        />
                      ))}
                    </div>
                  )}
                </section>

                <section>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Top 5 Most Played</p>
                  {topFriends.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No finished games with friends yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {topFriends.map((f) => (
                        <PlayerPickRow
                          key={f.userId}
                          name={f.name}
                          username={f.profile?.username}
                          avatar={f.profile?.avatar_url}
                          selected={opponents.some((o) => o.id === f.userId)}
                          onSelect={() => toggleOpponent(f)}
                          badge={`${f.plays} played`}
                        />
                      ))}
                    </div>
                  )}
                  <Button variant="secondary" size="sm" className="w-full rounded-full h-10 mt-3" onClick={() => setShowAllFriends(true)}>
                    All Friends
                  </Button>
                </section>
              </div>
            )}
            {opponents.length > 1 && (
              <div className="mt-5">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Group name</p>
                <Input placeholder="e.g. Tuesday Night Run" value={groupName} onChange={(e) => setGroupName(e.target.value)} className="h-12 rounded-2xl" />
                <p className="text-[11px] text-muted-foreground mt-1.5">This shows as the challenge title instead of a long list of names.</p>
              </div>
            )}
            <Button onClick={() => setStep(3)} disabled={opponents.length === 0} className="w-full rounded-full h-12 mt-6">
              {opponents.length === 0 ? 'Select friends' : `Continue${opponents.length > 1 ? ` (${opponents.length})` : ''}`}
            </Button>
          </div>
        )}

        {step === 3 && (
          <div>
            <h1 className="font-heading text-2xl font-extrabold mb-6">Where?</h1>
            <p className="text-xs font-semibold text-muted-foreground mb-2">Location</p>
            <Input placeholder="Where are you playing?" value={location} onChange={(e) => setLocation(e.target.value)} className="h-12 rounded-2xl mb-4" />
            <Button onClick={() => setStep(4)} disabled={!location} className="w-full rounded-full h-12">Next</Button>
          </div>
        )}

        {step === 4 && (
          <div>
            <h1 className="font-heading text-2xl font-extrabold mb-6">Pick a Time</h1>
            <p className="text-xs font-semibold text-muted-foreground mb-2">Date & time</p>
            <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="h-12 rounded-2xl mb-4" />
            <p className="text-xs font-semibold text-muted-foreground mb-2">Series</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {SERIES_TYPES.map((s) => (
                <button key={s.key} onClick={() => setSeriesType(s.key)} className={`text-xs font-semibold px-3 py-2 rounded-full border ${seriesType === s.key ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground'}`}>{s.label}</button>
              ))}
            </div>
            {seriesType !== 'single' && (
              <div className="mb-6">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Series name</p>
                <Input placeholder="e.g. Summer Basketball Series" value={seriesName} onChange={(e) => setSeriesName(e.target.value)} className="h-12 rounded-2xl" />
              </div>
            )}
            <Button onClick={() => setStep(5)} disabled={seriesType !== 'single' && !seriesName.trim()} className="w-full rounded-full h-12">Next</Button>
          </div>
        )}

        {step === 5 && (
          <div>
            <h1 className="font-heading text-2xl font-extrabold mb-6">Review Challenge</h1>
            <div className="bg-card rounded-3xl shadow-sm p-5 space-y-3 mb-6">
              <Row label="Sport" value={sport === 'custom' ? (customSportName || 'Custom') : SPORTS.find((s) => s.key === sport)?.label} />
              <Row label="Opponent(s)" value={opponents.map((o) => o.name).join(', ')} />
              {opponents.length > 1 && groupName.trim() && <Row label="Group Name" value={groupName.trim()} />}
              <Row label="Location" value={location} />
              <Row label="Date" value={date ? new Date(date).toLocaleString() : '—'} />
              <Row label="Series" value={SERIES_TYPES.find((s) => s.key === seriesType)?.label} />
              {seriesType !== 'single' && <Row label="Series Name" value={seriesName} />}
            </div>
            <Button onClick={send} disabled={sending} className="w-full rounded-full h-12 brand-gradient font-bold">
              {sending ? 'Sending...' : 'SEND CHALLENGE'}
            </Button>
          </div>
        )}
      </div>

      <HighlightComposerSheet
        open={showHighlight}
        onOpenChange={setShowHighlight}
        onPosted={() => navigate('/')}
      />

      <AllFriendsSheet
        open={showAllFriends}
        onOpenChange={setShowAllFriends}
        friends={friends || []}
        selectedIds={opponents.map((o) => o.id)}
        onToggle={toggleOpponent}
        userId={user.id}
      />
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm gap-3">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-semibold text-right truncate">{value || '—'}</span>
    </div>
  );
}