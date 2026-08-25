import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, Users, Globe, MessageCircle } from 'lucide-react';
import { SPORT_EMOJI, SPORT_LABEL } from '@/lib/constants';

// A public event the current user has joined (or created), shown under
// Challenges → Accepted. Status is derived from the stored start time and the
// event's status field, so cards transition Upcoming → Starting Soon → Live →
// Completed / Cancelled automatically. Tapping "Open Chat" deep-links to the
// event's group chat.
function statusFor(event, now) {
  if (event.status === 'cancelled') return { key: 'cancelled', label: 'Cancelled', tone: 'cancelled' };
  if (event.status === 'ended') return { key: 'completed', label: 'Completed', tone: 'completed' };
  const start = new Date(event.start_datetime).getTime();
  if (start <= now) return { key: 'live', label: 'Live', tone: 'live' };
  const mins = Math.round((start - now) / 60000);
  if (mins <= 30) return { key: 'soon', label: 'Starting Soon', tone: 'soon' };
  return { key: 'upcoming', label: 'Upcoming', tone: 'upcoming' };
}

const TONE = {
  upcoming: 'bg-secondary/10 text-secondary',
  soon: 'bg-accent/15 text-accent',
  live: 'bg-green-500/15 text-green-600',
  completed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-destructive/15 text-destructive',
};

function fmtWhen(iso) {
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return isToday ? `Today · ${time}` : `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} · ${time}`;
}

function timeRemaining(iso, now) {
  const start = new Date(iso).getTime();
  const mins = Math.round((start - now) / 60000);
  if (mins <= 0) return 'Started';
  if (mins < 60) return `in ${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `in ${h}h ${m}m`;
}

export default function PublicEventChallengeCard({ event, now }) {
  const navigate = useNavigate();
  const emoji = event.competition_type === 'custom'
    ? (event.custom_sport_emoji || '🏆')
    : (SPORT_EMOJI[event.competition_type] || '🏆');
  const label = event.competition_type === 'custom'
    ? (event.custom_sport_name || 'Custom')
    : (SPORT_LABEL[event.competition_type] || event.competition_type);
  const status = statusFor(event, now);
  const dim = status.key === 'completed' || status.key === 'cancelled';

  return (
    <div className={`bg-card rounded-3xl shadow-sm p-4 mb-3 mx-4 ${dim ? 'opacity-70' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-2xl shrink-0">{emoji}</span>
          <div className="min-w-0">
            <h3 className="font-heading font-bold min-w-0 break-words leading-tight">{label}</h3>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{event.title && event.title !== `${emoji} ${label} – ${event.location_name}` ? event.title : null}</span>
          </div>
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide shrink-0 ${TONE[status.tone]}`}>{status.label}</span>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mb-2">
        {event.location_name && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{event.location_name}</span>}
        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{fmtWhen(event.start_datetime)}</span>
        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{event.accepted_count || 0} accepted</span>
      </div>

      <div className="flex items-center justify-between mt-1">
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-secondary/10 text-secondary uppercase tracking-wide">
          <Globe className="w-3 h-3" /> Public Event
        </span>
        {status.key !== 'cancelled' && status.key !== 'completed' && (
          <span className="text-xs text-accent font-semibold">{timeRemaining(event.start_datetime, now)}</span>
        )}
      </div>

      {event.chat_id && (
        <button
          onClick={() => navigate(`/messages/${event.chat_id}`)}
          className="w-full mt-3 h-11 rounded-full bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2"
        >
          <MessageCircle className="w-4 h-4" /> Open Chat
        </button>
      )}
    </div>
  );
}