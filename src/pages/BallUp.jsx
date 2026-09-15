import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { X, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { SPORTS, SERIES_TYPES, GAMES_TO_WIN, CUSTOM_SPORT_EMOJIS, SPORT_EMOJI, getSportDisplay } from '@/lib/constants';
import { sendNotification } from '@/lib/notify';
import { enrichFriends } from '@/lib/friendsHelpers';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useGoBack } from '@/hooks/useGoBack';

export default function BallUp() {
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const goBack = useGoBack();
  const reduce = useReducedMotion();
  const [step, setStep] = useState(1);
  const [sport, setSport] = useState(null);
  const [friends, setFriends] = useState(null);
  const [friendQuery, setFriendQuery] = useState('');
  const [recentOpponentIds, setRecentOpponentIds] = useState([]);
  const [opponents, setOpponents] = useState([]);
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [seriesType, setSeriesType] = useState('single');
  const [seriesName, setSeriesName] = useState('');
  const [customSportName, setCustomSportName] = useState('');
  const [customSportEmoji, setCustomSportEmoji] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    base44.entities.Friend.filter({ status: 'accepted' }).then(async (all) => {
      const mine = all.filter((f) => f.created_by_id === user.id || f.addressee_id === user.id);
      setFriends(await enrichFriends(mine, user.id));
    });
    base44.entities.Challenge.list('-created_date', 30).then((all) => {
      const mine = all.filter((c) => c.created_by_id === user.id);
      const ids = mine.flatMap((c) => (c.opponent_ids?.length ? c.opponent_ids : [c.opponent_id]));
      setRecentOpponentIds([...new Set(ids)]);
    });
  }, []);

  const back = () => {
    if (step === 1 && sport === 'custom') { setSport(null); return; }
    if (step > 1) setStep(step - 1);
    else goBack();
  };

  const filteredFriends = (friends || []).filter((f) => {
    const q = friendQuery.trim().toLowerCase();
    if (!q) return true;
    return f.name?.toLowerCase().includes(q) || f.profile?.username?.toLowerCase().includes(q);
  });
  const recentFriends = filteredFriends.filter((f) => recentOpponentIds.includes(f.userId));
  const otherFriends = filteredFriends.filter((f) => !recentOpponentIds.includes(f.userId));

  const toggleOpponent = (f) => {
    const exists = opponents.some((o) => o.id === f.userId);
    if (exists) setOpponents(opponents.filter((o) => o.id !== f.userId));
    else setOpponents([...opponents, { id: f.userId, name: f.name, username: f.profile?.username }]);
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
      <div className="flex items-center justify-between p-4">
        <button onClick={back}><ChevronLeft className="w-6 h-6" /></button>
        <span className="font-heading font-bold">Step {step} of 5</span>
        <button onClick={goBack}><X className="w-6 h-6" /></button>
      </div>

      <div className="flex-1 px-5 pb-6">
        {step === 1 && sport !== 'custom' && (
          <div>
            <h1 className="font-heading text-2xl font-extrabold mb-1">BALL UP TOP</h1>
            <p className="text-muted-foreground mb-6">Pick Your Game</p>
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
            <Input placeholder="Search friends..." value={friendQuery} onChange={(e) => setFriendQuery(e.target.value)} className="h-11 rounded-full mb-4" />
            {friends === null ? (
              <p className="text-muted-foreground text-sm">Loading friends...</p>
            ) : filteredFriends.length === 0 ? (
              <p className="text-muted-foreground text-sm">Add friends first to challenge them.</p>
            ) : (
              <div className="space-y-4">
                {recentFriends.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Recently Challenged</p>
                    <div className="space-y-2">{recentFriends.map((f) => <FriendPickCard key={f.userId} f={f} selected={opponents.some((o) => o.id === f.userId)} onSelect={() => toggleOpponent(f)} />)}</div>
                  </div>
                )}
                <div>
                  {recentFriends.length > 0 && <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">All Friends</p>}
                  <div className="space-y-2">{otherFriends.map((f) => <FriendPickCard key={f.userId} f={f} selected={opponents.some((o) => o.id === f.userId)} onSelect={() => toggleOpponent(f)} />)}</div>
                </div>
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

function FriendPickCard({ f, selected, onSelect }) {
  return (
    <button onClick={onSelect} className={`w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-2xl border-2 ${selected ? 'border-accent bg-accent/10' : 'border-border bg-card'}`}>
      <div className="relative">
        <Avatar className="w-10 h-10"><AvatarImage src={f.profile?.avatar_url} /><AvatarFallback>{f.name?.[0] || 'U'}</AvatarFallback></Avatar>
        {f.profile?.ready_to_ball && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-accent border-2 border-card" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{f.name}</p>
        <p className="text-xs text-muted-foreground truncate">{f.profile?.username ? `@${f.profile.username}` : ''}{f.profile?.favorite_sport ? ` · ${SPORT_EMOJI[f.profile.favorite_sport] || ''} ${f.profile.favorite_sport}` : ''}</p>
      </div>
      {selected && <span className="w-5 h-5 rounded-full bg-accent flex items-center justify-center shrink-0"><svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></span>}
    </button>
  );
}