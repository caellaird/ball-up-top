import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { X, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { SPORTS, SERIES_TYPES } from '@/lib/constants';
import { sendNotification } from '@/lib/notify';

export default function BallUp() {
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [sport, setSport] = useState(null);
  const [friends, setFriends] = useState([]);
  const [opponent, setOpponent] = useState(null);
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [seriesType, setSeriesType] = useState('single');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    base44.entities.Friend.filter({ status: 'accepted' }).then((all) => {
      setFriends(all.filter((f) => f.created_by_id === user.id || f.addressee_id === user.id));
    });
  }, []);

  const back = () => (step > 1 ? setStep(step - 1) : navigate(-1));

  const opponentInfo = (f) => ({
    id: f.created_by_id === user.id ? f.addressee_id : f.created_by_id,
    name: f.created_by_id === user.id ? f.addressee_name : f.requester_name,
  });

  const send = async () => {
    setSending(true);
    const challenge = await base44.entities.Challenge.create({
      sport,
      creator_name: user.full_name,
      opponent_id: opponent.id,
      opponent_name: opponent.name,
      location_name: location,
      scheduled_time: date ? new Date(date).toISOString() : undefined,
      series_type: seriesType,
    });
    await sendNotification({
      userId: opponent.id,
      type: 'challenge_invite',
      actorName: user.full_name,
      title: `${user.full_name} challenged you to ${sport}!`,
      link: `/challenges/${challenge.id}`,
    });
    setSending(false);
    navigate(`/challenges/${challenge.id}`);
  };

  return (
    <div className="min-h-full flex flex-col">
      <div className="flex items-center justify-between p-4">
        <button onClick={back}><ChevronLeft className="w-6 h-6" /></button>
        <span className="font-heading font-bold">Step {step} of 5</span>
        <button onClick={() => navigate(-1)}><X className="w-6 h-6" /></button>
      </div>

      <div className="flex-1 px-5 pb-6">
        {step === 1 && (
          <div>
            <h1 className="font-heading text-2xl font-extrabold mb-1">BALL UP TOP</h1>
            <p className="text-muted-foreground mb-6">Pick Your Game</p>
            <div className="grid grid-cols-3 gap-3">
              {SPORTS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => { setSport(s.key); setStep(2); }}
                  className={`aspect-square rounded-3xl flex flex-col items-center justify-center gap-1 border-2 ${sport === s.key ? 'border-accent bg-accent/10' : 'border-border bg-card'}`}
                >
                  <span className="text-3xl">{s.emoji}</span>
                  <span className="text-xs font-semibold text-center px-1">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="font-heading text-2xl font-extrabold mb-6">Who's Getting Cooked?</h1>
            {friends.length === 0 ? (
              <p className="text-muted-foreground text-sm">Add friends first to challenge them.</p>
            ) : (
              <div className="space-y-2">
                {friends.map((f) => {
                  const info = opponentInfo(f);
                  return (
                    <button
                      key={f.id}
                      onClick={() => { setOpponent(info); setStep(3); }}
                      className={`w-full text-left px-4 py-3 rounded-2xl border-2 ${opponent?.id === info.id ? 'border-accent bg-accent/10' : 'border-border bg-card'}`}
                    >
                      {info.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div>
            <h1 className="font-heading text-2xl font-extrabold mb-6">Where?</h1>
            <Input placeholder="Search location..." value={location} onChange={(e) => setLocation(e.target.value)} className="h-12 rounded-2xl mb-4" />
            <Button onClick={() => setStep(4)} disabled={!location} className="w-full rounded-full h-12">Next</Button>
          </div>
        )}

        {step === 4 && (
          <div>
            <h1 className="font-heading text-2xl font-extrabold mb-6">Pick a Time</h1>
            <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="h-12 rounded-2xl mb-4" />
            <p className="text-sm font-medium mb-2">Series</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {SERIES_TYPES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSeriesType(s.key)}
                  className={`text-xs font-semibold px-3 py-2 rounded-full border ${seriesType === s.key ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground'}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <Button onClick={() => setStep(5)} className="w-full rounded-full h-12 bg-gradient-to-r from-[hsl(var(--accent))] to-[hsl(var(--secondary))]">
              BALL UP TOP
            </Button>
          </div>
        )}

        {step === 5 && (
          <div>
            <h1 className="font-heading text-2xl font-extrabold mb-6">Review Challenge</h1>
            <div className="bg-card rounded-3xl shadow-sm p-5 space-y-3 mb-6">
              <Row label="Sport" value={SPORTS.find((s) => s.key === sport)?.label} />
              <Row label="Opponent" value={opponent?.name} />
              <Row label="Location" value={location} />
              <Row label="Date" value={date ? new Date(date).toLocaleString() : '—'} />
              <Row label="Series" value={SERIES_TYPES.find((s) => s.key === seriesType)?.label} />
            </div>
            <Button onClick={send} disabled={sending} className="w-full rounded-full h-12 bg-gradient-to-r from-[hsl(var(--accent))] to-[hsl(var(--secondary))] font-bold">
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
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value || '—'}</span>
    </div>
  );
}