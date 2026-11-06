import React from 'react';
import { format } from 'date-fns';
import { Check, X } from 'lucide-react';

export default function SessionCard({ session, rsvps, myStatus, saving, onRsvp, isPast }) {
  const going = rsvps.filter((r) => r.session_id === session.id && r.status === 'going');
  const date = new Date(session.start_time);
  const goingLabel = going.length
    ? going.map((r) => r.user_name).slice(0, 3).join(', ') + (going.length > 3 ? ` +${going.length - 3}` : '')
    : 'No one has said yes yet';

  return (
    <div className="bg-card rounded-3xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-sm">{format(date, 'EEEE, MMM d')}</p>
          <p className="text-xs text-muted-foreground">
            {format(date, 'h:mm a')}
            {session.location_name ? ` · ${session.location_name}` : ''}
          </p>
        </div>
        <span className={`text-[11px] font-semibold px-2 py-1 rounded-full shrink-0 ${isPast ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
          {isPast ? 'Past' : `${going.length} going`}
        </span>
      </div>

      {session.note && <p className="text-sm text-muted-foreground mt-2">{session.note}</p>}
      <p className="text-xs text-muted-foreground mt-2 truncate">{goingLabel}</p>

      {!isPast && (
        <div className="flex gap-2 mt-3">
          <button
            type="button"
            disabled={saving}
            onClick={() => onRsvp(session, 'going')}
            className={`flex-1 flex items-center justify-center gap-1.5 h-10 rounded-full text-xs font-bold transition disabled:opacity-50 ${myStatus === 'going' ? 'brand-gradient text-white' : 'border border-border text-foreground'}`}
          >
            <Check className="w-4 h-4" /> I'm going
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => onRsvp(session, 'not_going')}
            className={`flex-1 flex items-center justify-center gap-1.5 h-10 rounded-full text-xs font-bold transition disabled:opacity-50 ${myStatus === 'not_going' ? 'bg-secondary text-secondary-foreground' : 'border border-border text-muted-foreground'}`}
          >
            <X className="w-4 h-4" /> Can't make it
          </button>
        </div>
      )}
    </div>
  );
}