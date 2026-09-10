import React from 'react';
import { MapPin, Star } from 'lucide-react';

// A single location result / suggestion row with an inline favorite toggle.
export default function LocationResultRow({ result, distance, favorited, onPick, onToggleFav }) {
  return (
    <div
      onClick={onPick}
      className="w-full text-left px-4 py-3 hover:bg-muted/60 flex items-start gap-2 border-b border-border last:border-0 cursor-pointer"
    >
      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{result.name}</p>
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground truncate flex-1">{result.address}</p>
          {distance != null && (
            <span className="text-xs text-muted-foreground shrink-0">{distance.toFixed(1)} mi</span>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onToggleFav(); }}
        className="shrink-0 p-1 -mr-1 text-muted-foreground hover:text-accent transition-colors"
        aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Star className={`w-4 h-4 ${favorited ? 'fill-accent text-accent' : ''}`} />
      </button>
    </div>
  );
}