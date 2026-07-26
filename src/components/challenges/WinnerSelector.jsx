import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Crown, Loader2 } from 'lucide-react';

export default function WinnerSelector({ challenge, onSaved }) {
  const [selectedWinner, setSelectedWinner] = useState(challenge.winner_id || '');
  const [saving, setSaving] = useState(false);

  const selectWinner = async (winnerId, winnerName) => {
    if (selectedWinner === winnerId || saving) return;
    setSaving(true);
    setSelectedWinner(winnerId);
    try {
      const updated = await base44.entities.Challenge.update(challenge.id, {
        winner_id: winnerId,
        winner_name: winnerName,
      });
      onSaved(updated);
    } catch {
      // Revert on error
      setSelectedWinner(challenge.winner_id || '');
    } finally {
      setSaving(false);
    }
  };

  const creatorSelected = selectedWinner === challenge.created_by_id;
  const opponentSelected = selectedWinner === challenge.opponent_id;

  const PlayerButton = ({ name, isWinner, onClick }) => (
    <button
      onClick={onClick}
      disabled={saving}
      className={`flex-1 relative rounded-2xl p-4 border-2 transition active:scale-[0.97] ${
        isWinner
          ? 'border-accent bg-accent/10 shadow-md'
          : 'border-border bg-card hover:border-muted-foreground/40'
      }`}
    >
      {isWinner && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xl">
          <Crown className="w-5 h-5 text-accent fill-accent" />
        </span>
      )}
      <p className={`text-sm font-bold truncate ${isWinner ? 'text-accent' : 'text-muted-foreground'}`}>
        {name}
      </p>
      {saving && isWinner && <Loader2 className="w-3 h-3 animate-spin mx-auto mt-1 text-accent" />}
    </button>
  );

  return (
    <div className="bg-card rounded-2xl shadow-sm p-4 mb-4">
      <p className="text-sm font-bold mb-3 flex items-center gap-1.5">
        <Crown className="w-4 h-4 text-accent" /> Select Winner
      </p>
      <div className="flex gap-3">
        <PlayerButton
          name={challenge.creator_name}
          isWinner={creatorSelected}
          onClick={() => selectWinner(challenge.created_by_id, challenge.creator_name)}
        />
        <PlayerButton
          name={challenge.opponent_name}
          isWinner={opponentSelected}
          onClick={() => selectWinner(challenge.opponent_id, challenge.opponent_name)}
        />
      </div>
    </div>
  );
}