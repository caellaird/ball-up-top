import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Crown, Loader2, Handshake } from 'lucide-react';

export default function WinnerSelector({ challenge, onSaved }) {
  const [selectedWinner, setSelectedWinner] = useState(challenge.winner_id || '');
  const [isDraw, setIsDraw] = useState(!!challenge.is_draw);
  const [saving, setSaving] = useState(false);

  const opponentIds = challenge.opponent_ids?.length ? challenge.opponent_ids : [challenge.opponent_id];
  const opponentNames = challenge.opponent_names?.length ? challenge.opponent_names : [challenge.opponent_name];
  const participants = [
    { id: challenge.created_by_id, name: challenge.creator_name },
    ...opponentIds.map((id, i) => ({ id, name: opponentNames[i] })),
  ].filter((p) => p.id && p.name);

  const persist = async (payload, optimistic) => {
    if (saving) return;
    setSaving(true);
    const prevWinner = selectedWinner;
    const prevDraw = isDraw;
    setSelectedWinner(optimistic.winnerId);
    setIsDraw(optimistic.isDraw);
    try {
      const updated = await base44.entities.Challenge.update(challenge.id, payload);
      onSaved(updated);
    } catch {
      setSelectedWinner(prevWinner);
      setIsDraw(prevDraw);
    } finally {
      setSaving(false);
    }
  };

  const selectWinner = (winnerId, winnerName) =>
    persist({ winner_id: winnerId, winner_name: winnerName, is_draw: false }, { winnerId, isDraw: false });

  const selectDraw = () =>
    persist({ is_draw: true, winner_id: '', winner_name: '' }, { winnerId: '', isDraw: true });

  const PlayerButton = ({ name, isWinner, onClick }) => (
    <button
      onClick={onClick}
      disabled={saving}
      className={`flex-1 min-w-[90px] relative rounded-2xl p-4 border-2 transition active:scale-[0.97] ${
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
      <div className="flex gap-3 flex-wrap">
        {participants.map((p) => (
          <PlayerButton
            key={p.id}
            name={p.name}
            isWinner={!isDraw && selectedWinner === p.id}
            onClick={() => selectWinner(p.id, p.name)}
          />
        ))}
        <button
          onClick={selectDraw}
          disabled={saving}
          className={`flex-1 min-w-[90px] relative rounded-2xl p-4 border-2 transition active:scale-[0.97] ${
            isDraw
              ? 'border-secondary bg-secondary/10 shadow-md'
              : 'border-border bg-card hover:border-muted-foreground/40'
          }`}
        >
          {isDraw && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xl">
              <Handshake className="w-5 h-5 text-secondary" />
            </span>
          )}
          <p className={`text-sm font-bold truncate ${isDraw ? 'text-secondary' : 'text-muted-foreground'}`}>
            Draw
          </p>
          {saving && isDraw && <Loader2 className="w-3 h-3 animate-spin mx-auto mt-1 text-secondary" />}
        </button>
      </div>
    </div>
  );
}