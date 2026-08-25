import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { SPORT_EMOJI, SPORT_LABEL } from '@/lib/constants';
import { Loader2 } from 'lucide-react';

// Shared public event card shown in the Friends feed when an event creator has
// "Share to friends" enabled. One-click accept drops the user into the event chat.
export default function PublicEventCard({ event, user }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [joined, setJoined] = useState(event.created_by_id === user.id);

  const emoji = event.competition_type === 'custom'
    ? (event.custom_sport_emoji || '🏆')
    : (SPORT_EMOJI[event.competition_type] || '🏆');
  const sportLabel = event.competition_type === 'custom'
    ? (event.custom_sport_name || 'Custom')
    : (SPORT_LABEL[event.competition_type] || event.competition_type);
  const d = new Date(event.start_datetime);
  const when = d.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

  const accept = async () => {
    setBusy(true);
    try {
      const res = await base44.functions.invoke('acceptPublicEvent', { event_id: event.id });
      navigate(`/messages/${res.data.chat_id}`);
    } catch (e) {
      setBusy(false);
    }
  };

  return (
    <div className="mx-4 mb-3 rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center text-xl shrink-0">{emoji}</div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{sportLabel} · Public Event</p>
          <p className="text-xs text-muted-foreground truncate">{event.location_name} · {when}</p>
          <p className="text-xs text-accent font-medium">{event.accepted_count || 0} accepted</p>
        </div>
        <button
          onClick={joined ? () => navigate(`/messages/${event.chat_id}`) : accept}
          disabled={busy}
          className="px-4 h-9 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : joined ? 'Open' : 'Accept'}
        </button>
      </div>
    </div>
  );
}