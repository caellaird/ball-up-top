import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { SPORT_EMOJI, SPORTS } from '@/lib/constants';
import { format } from 'date-fns';

const SPORT_LABEL = SPORTS.reduce((acc, s) => ({ ...acc, [s.key]: s.label }), {});

export default function CompletedChallenges({ userId, userName }) {
  const [challenges, setChallenges] = useState(null);

  useEffect(() => { load(); }, [userId]);

  const load = async () => {
    const all = await base44.entities.Challenge.filter({ status: 'completed' }, '-updated_date', 200);
    const mine = all
      .filter((c) => c.created_by_id === userId || c.opponent_id === userId || c.opponent_ids?.includes(userId))
      .slice(0, 10);
    setChallenges(mine);
  };

  if (!challenges || challenges.length === 0) return null;

  return (
    <div className="mt-6">
      <h3 className="font-heading font-bold mb-3">Recent Matches</h3>
      <div className="space-y-3">
        {challenges.map((c) => {
          const isCreator = c.created_by_id === userId;
          const myScore = isCreator ? c.score_creator : c.score_opponent;
          const oppScore = isCreator ? c.score_opponent : c.score_creator;
          const oppName = isCreator
            ? (c.opponent_names?.length > 1 ? c.opponent_names.join(', ') : c.opponent_name)
            : c.creator_name;
          const won = c.winner_id === userId;
          return (
            <Link to={`/challenges/${c.id}`} key={c.id} className="block bg-card rounded-2xl shadow-sm p-4 active:scale-[0.98] transition">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{SPORT_EMOJI[c.sport] || '🏆'}</span>
                  <span className="text-xs text-muted-foreground">{SPORT_LABEL[c.sport] || c.sport}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${won ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {won ? 'WIN' : 'LOSS'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{userName}</p>
                  <p className="text-xs text-muted-foreground">vs {oppName}</p>
                </div>
                <div className="text-right">
                  <p className="font-heading text-lg font-bold">
                    {myScore != null ? myScore : '-'} - {oppScore != null ? oppScore : '-'}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{format(new Date(c.updated_date), 'MMM d, yyyy')}</p>
                </div>
              </div>
              {c.photos && c.photos.length > 0 && (
                <div className="flex gap-2 mt-3 overflow-x-auto">
                  {c.photos.map((p, i) => (
                    <img key={i} src={p} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                  ))}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}