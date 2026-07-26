import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { SPORTS, SERIES_TYPES, GAMES_TO_WIN, getSportDisplay, CUSTOM_SPORT_EMOJIS } from '@/lib/constants';
import { sendNotification } from '@/lib/notify';

export default function ChallengeFromProfileSheet({ open, onOpenChange, opponentId, opponentName, opponentUsername }) {
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const [sport, setSport] = useState('basketball');
  const [seriesType, setSeriesType] = useState('single');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [seriesName, setSeriesName] = useState('');
  const [customSportName, setCustomSportName] = useState('');
  const [customSportEmoji, setCustomSportEmoji] = useState('');
  const [sending, setSending] = useState(false);

  const reset = () => {
    setSport('basketball');
    setSeriesType('single');
    setLocation('');
    setDate('');
    setSeriesName('');
    setCustomSportName('');
    setCustomSportEmoji('');
  };

  const canSend = sport !== 'custom' || customSportName.trim();
  const needsSeriesName = seriesType !== 'single' && !seriesName.trim();

  const send = async () => {
    if (!canSend || needsSeriesName) return;
    setSending(true);
    const sportDisplay = getSportDisplay({ sport, custom_sport_name: customSportName, custom_sport_emoji: customSportEmoji });
    const challenge = await base44.entities.Challenge.create({
      sport,
      custom_sport_name: sport === 'custom' ? customSportName : undefined,
      custom_sport_emoji: sport === 'custom' ? (customSportEmoji || '🏆') : undefined,
      creator_name: user.full_name,
      opponent_id: opponentId,
      opponent_name: opponentName,
      location_name: location,
      scheduled_time: date ? new Date(date).toISOString() : undefined,
      series_type: seriesType,
      series_name: seriesType !== 'single' ? seriesName : undefined,
      games_to_win: GAMES_TO_WIN[seriesType],
    });
    await sendNotification({
      userId: opponentId,
      type: 'challenge_invite',
      actorName: user.full_name,
      title: `${user.full_name} challenged you to ${sportDisplay.label}!`,
      link: `/challenges/${challenge.id}`,
    });
    await base44.entities.Post.create({
      author_name: user.full_name,
      author_username: user.username || '',
      body: `Challenged ${opponentName} to ${sportDisplay.label}!`,
      challenge_id: challenge.id,
      game_emoji: sportDisplay.emoji,
      location_name: location,
      tagged_user_ids: [opponentId],
      tagged_user_names: [opponentName],
      tagged_usernames: opponentUsername ? [opponentUsername] : [],
    });
    setSending(false);
    reset();
    onOpenChange(false);
    navigate(`/challenges/${challenge.id}`);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
        <SheetHeader><SheetTitle className="font-heading">Challenge {opponentName}</SheetTitle></SheetHeader>
        <div className="space-y-4 mt-4">
          <div>
            <p className="text-sm font-semibold mb-2">Pick Your Game</p>
            <div className="grid grid-cols-3 gap-2">
              {SPORTS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSport(s.key)}
                  className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 border-2 ${sport === s.key ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
                >
                  <span className="text-2xl">{s.emoji}</span>
                  <span className="text-[10px] font-semibold text-center px-1">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {sport === 'custom' && (
            <div className="space-y-3">
              <Input
                placeholder="What are you playing?"
                value={customSportName}
                onChange={(e) => setCustomSportName(e.target.value)}
                className="h-12 rounded-2xl"
              />
              <div className="flex flex-wrap gap-2">
                {CUSTOM_SPORT_EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setCustomSportEmoji(e)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border-2 ${customSportEmoji === e ? 'border-primary bg-primary/10' : 'border-border'}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-sm font-semibold mb-2">Series</p>
            <div className="flex flex-wrap gap-2">
              {SERIES_TYPES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSeriesType(s.key)}
                  className={`text-xs font-semibold px-3 py-2 rounded-full border ${seriesType === s.key ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {seriesType !== 'single' && (
            <Input
              placeholder="Series Name (e.g. Summer Series)"
              value={seriesName}
              onChange={(e) => setSeriesName(e.target.value)}
              className="h-12 rounded-2xl"
            />
          )}

          <Input
            placeholder="Location (optional)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="h-12 rounded-2xl"
          />
          <Input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-12 rounded-2xl"
          />

          <Button
            onClick={send}
            disabled={!canSend || needsSeriesName || sending}
            className="w-full rounded-full h-12 bg-gradient-to-r from-primary to-accent font-bold"
          >
            {sending ? 'Sending...' : 'Send Challenge'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}