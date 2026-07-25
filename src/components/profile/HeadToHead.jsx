import React, { useEffect, useState } from 'react';
import { computeHeadToHead } from '@/lib/profileStats';
import { SPORT_EMOJI, SPORTS } from '@/lib/constants';

const SPORT_LABEL = SPORTS.reduce((acc, s) => ({ ...acc, [s.key]: s.label }), {});

export default function HeadToHead({ currentUserId, currentUserName, profileOwnerId, profileOwnerName }) {
  const [record, setRecord] = useState(null);

  useEffect(() => { load(); }, [currentUserId, profileOwnerId]);

  const load = async () => {
    setRecord(await computeHeadToHead(currentUserId, profileOwnerId));
  };

  if (!record || record.total === 0) return null;

  return (
    <div className="mt-6">
      <h3 className="font-heading font-bold mb-3">Head-to-Head</h3>
      <div className="bg-card rounded-2xl shadow-sm p-4">
        <div className="flex items-center justify-around text-center mb-4">
          <div>
            <p className="font-heading text-xl font-bold text-accent">{record.myWins}</p>
            <p className="text-[10px] text-muted-foreground uppercase truncate max-w-[80px]">{currentUserName}</p>
          </div>
          <div>
            <p className="font-heading text-xl font-bold">{record.total}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Played</p>
          </div>
          <div>
            <p className="font-heading text-xl font-bold text-secondary">{record.theirWins}</p>
            <p className="text-[10px] text-muted-foreground uppercase truncate max-w-[80px]">{profileOwnerName}</p>
          </div>
        </div>
        <div className="space-y-2 pt-3 border-t border-border">
          {record.bySport.map((s) => (
            <div key={s.sport} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span>{SPORT_EMOJI[s.sport] || '🏆'}</span>
                <span className="font-medium">{SPORT_LABEL[s.sport] || s.sport}</span>
              </span>
              <span className="font-heading font-bold">
                <span className={s.myWins >= s.theirWins && s.myWins > 0 ? 'text-accent' : ''}>{s.myWins}</span>
                <span className="text-muted-foreground mx-1">–</span>
                <span className={s.theirWins > s.myWins ? 'text-secondary' : ''}>{s.theirWins}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}