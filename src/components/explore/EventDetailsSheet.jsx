import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SPORT_EMOJI, SPORT_LABEL } from '@/lib/constants';
import { Loader2, MapPin, Clock, Users, Heart } from 'lucide-react';

function fmtStart(iso, now) {
  const d = new Date(iso);
  const today = new Date(now);
  const isToday = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return { label: isToday ? `Today · ${time}` : `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} · ${time}` };
}

export default function EventDetailsSheet({ event, user, onClose, onOpenChat }) {
  const [participants, setParticipants] = useState([]);
  const [joined, setJoined] = useState(false);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!event) return;
    setBusy(false);
    base44.entities.EventParticipant.filter({ event_id: event.id, status: 'accepted' })
      .then(setParticipants)
      .catch(() => setParticipants([]));
  }, [event]);

  useEffect(() => {
    setJoined(participants.some((p) => p.user_id === user.id));
  }, [participants, user]);

  // Explore map favorite (saved event). Persisted per user/event; deduped by
  // delete-before-create. Gating notifications for favorited-event changes is
  // handled server-side via the notif_explore_favorites preference.
  const [fav, setFav] = useState(false);
  const [favBusy, setFavBusy] = useState(false);
  useEffect(() => {
    if (!event) return;
    base44.entities.EventFavorite.filter({ user_id: user.id, event_id: event.id })
      .then((rows) => setFav(rows.length > 0))
      .catch(() => setFav(false));
  }, [event]);
  const toggleFav = async () => {
    setFavBusy(true);
    try {
      if (fav) {
        const rows = await base44.entities.EventFavorite.filter({ user_id: user.id, event_id: event.id });
        await Promise.all(rows.map((r) => base44.entities.EventFavorite.delete(r.id)));
        setFav(false);
      } else {
        await base44.entities.EventFavorite.create({ user_id: user.id, event_id: event.id });
        setFav(true);
      }
    } catch (e) { /* ignore */ }
    setFavBusy(false);
  };

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 20000);
    return () => clearInterval(t);
  }, []);

  if (!event) return null;

  const start = new Date(event.start_datetime).getTime();
  const ended = start <= now;
  const cancelled = event.status === 'cancelled';
  const isCreator = event.created_by_id === user.id;
  const mins = Math.max(0, Math.round((start - now) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const countdown = ended ? 'Started' : `Starts in ${h > 0 ? `${h}h ` : ''}${m}m`;

  const emoji = event.competition_type === 'custom'
    ? (event.custom_sport_emoji || '🏆')
    : (SPORT_EMOJI[event.competition_type] || '🏆');
  const sportLabel = event.competition_type === 'custom'
    ? (event.custom_sport_name || 'Custom')
    : (SPORT_LABEL[event.competition_type] || event.competition_type);
  const { label: whenLabel } = fmtStart(event.start_datetime, now);

  const accept = async () => {
    setBusy(true);
    try {
      const res = await base44.functions.invoke('acceptPublicEvent', { event_id: event.id });
      setJoined(true);
      onOpenChat(res.data.chat_id);
    } catch (e) {
      setBusy(false);
    }
  };

  const cancel = async () => {
    setBusy(true);
    try {
      await base44.functions.invoke('cancelPublicEvent', { event_id: event.id });
      onClose();
    } catch (e) {
      setBusy(false);
    }
  };

  let ctaLabel = 'ACCEPT';
  let ctaDisabled = false;
  if (cancelled) { ctaLabel = 'CANCELLED'; ctaDisabled = true; }
  else if (ended) { ctaLabel = 'EVENT ENDED'; ctaDisabled = true; }
  else if (joined) { ctaLabel = 'OPEN CHAT'; }

  const onCta = () => {
    if (ctaDisabled) return;
    if (joined) onOpenChat(event.chat_id);
    else accept();
  };

  return (
    <>
      <div className="fixed inset-0 z-[1100] bg-black/50" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-[1101] bg-background/85 backdrop-blur-xl border-t border-border/60 shadow-2xl rounded-t-3xl max-h-[82vh] overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="sticky top-0 bg-background/0 pt-3 pb-1 flex justify-center">
          <span className="w-10 h-1.5 rounded-full bg-muted" />
        </div>
        <div className="px-5 pt-2">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-2xl shrink-0">{emoji}</div>
            <div className="flex-1 min-w-0">
              <h2 className="font-heading text-xl font-extrabold leading-tight">{sportLabel}</h2>
              <p className="text-sm text-muted-foreground">{event.title && event.title !== `${emoji} ${sportLabel} – ${event.location_name}` ? event.title : null}</p>
            </div>
            <button
              onClick={toggleFav}
              disabled={favBusy}
              aria-label={fav ? 'Unsave event' : 'Save event'}
              className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center shrink-0"
            >
              <Heart className={`w-5 h-5 ${fav ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
            </button>
          </div>

          <div className="space-y-2.5 mb-4">
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">{event.location_name}</p>
                {event.verified_address && <p className="text-xs text-muted-foreground">{event.verified_address}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="font-semibold">{whenLabel}</span>
              {!ended && !cancelled && <span className="text-xs text-accent font-medium">· {countdown}</span>}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="font-semibold">{participants.length} accepted</span>
            </div>
          </div>

          {event.description && <p className="text-sm text-muted-foreground mb-4 whitespace-pre-wrap">{event.description}</p>}

          {participants.length > 0 && (
            <div className="flex items-center -space-x-2 mb-5">
              {participants.slice(0, 6).map((p) => (
                <Avatar key={p.id} className="w-8 h-8 border-2 border-background">
                  <AvatarImage src={p.user_avatar} />
                  <AvatarFallback>{p.user_name?.[0]}</AvatarFallback>
                </Avatar>
              ))}
              {participants.length > 6 && (
                <span className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-semibold">
                  +{participants.length - 6}
                </span>
              )}
            </div>
          )}

          <Button
            onClick={onCta}
            disabled={ctaDisabled || busy}
            className="w-full h-13 rounded-full text-base font-bold h-12"
          >
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : ctaLabel}
          </Button>

          {isCreator && !cancelled && !ended && (
            <button onClick={cancel} disabled={busy} className="w-full mt-2 h-10 text-sm font-semibold text-destructive">
              Cancel event
            </button>
          )}
        </div>
      </div>
    </>
  );
}