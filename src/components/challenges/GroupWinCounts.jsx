import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { getGroupWinCounts } from '@/lib/groupStandings';

// Renders each player's individual win count for a group (multiplayer)
// challenge, ranked most wins first. Used in place of an aggregate
// "creator — opponents" series score, which is meaningless for 3+ players.
// Pass `games` when the parent already has them (e.g. ChallengeDetail);
// otherwise the component fetches the series games itself (list cards).
export default function GroupWinCounts({ challenge, games: gamesProp }) {
  const [games, setGames] = useState(gamesProp || []);
  const [loading, setLoading] = useState(!gamesProp);

  useEffect(() => {
    if (gamesProp) { setGames(gamesProp); return; }
    let active = true;
    (async () => {
      try {
        const g = await base44.entities.SeriesGame.filter({ challenge_id: challenge.id }, 'game_number');
        if (active) setGames(g);
      } catch { /* ignore — show empty */ }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [challenge.id, gamesProp]);

  if (loading) {
    return <p className="text-xs text-muted-foreground">Loading wins…</p>;
  }

  const wins = getGroupWinCounts(challenge, games);
  if (wins.length === 0) {
    return <p className="text-xs text-muted-foreground">No games logged yet</p>;
  }

  return (
    <div className="space-y-1 text-left">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1">Series Wins</p>
      {wins.map((p, i) => (
        <div key={p.user_id} className="flex items-center justify-between text-sm">
          <span className={`flex items-center gap-1.5 truncate ${i === 0 && p.wins > 0 ? 'font-bold' : 'font-medium'}`}>
            {i === 0 && p.wins > 0 && <span className="leading-none">👑</span>}
            {p.name}
          </span>
          <span className="font-heading font-bold ml-2 shrink-0">{p.wins}</span>
        </div>
      ))}
    </div>
  );
}