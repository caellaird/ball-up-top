import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';
import { getAwardMeta, RARITY_CLASSES, RARITY_ORDER } from '@/lib/awards';
import AchievementShareCard from '@/components/profile/AchievementShareCard';

// Sport display info (label + emoji) comes from profileStats via a.sport and a.emoji

function AwardBadge({ award, onClick }) {
  const meta = getAwardMeta(award.type);
  return (
    <button
      onClick={() => onClick(award)}
      className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow"
    >
      <span className="text-3xl">{meta.emoji}</span>
      <span className="text-[10px] font-semibold text-center leading-tight line-clamp-2">{award.type}</span>
    </button>
  );
}

export default function TrophyCase({ topActivities, awards, ownerId, ownerName, ownerUsername, ownerAvatar }) {
  const [selectedAward, setSelectedAward] = useState(null);
  const [showShare, setShowShare] = useState(false);

  const sortedAwards = (awards || [])
    .slice()
    .sort((a, b) => (RARITY_ORDER[getAwardMeta(b.type).rarity] || 0) - (RARITY_ORDER[getAwardMeta(a.type).rarity] || 0));

  return (
    <div className="mt-6">
      {/* Top Activities */}
      {topActivities && topActivities.length > 0 && (
        <>
          <h3 className="font-heading font-bold mb-3">Top Activities</h3>
          <div className="space-y-3">
            {topActivities.map((a) => (
              <div key={a.sport} className="bg-card rounded-2xl shadow-sm p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{a.emoji || '🏆'}</span>
                  <span className="font-heading font-bold">{a.sport}</span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-center">
                  <div>
                    <p className="font-heading text-base font-bold text-green-600">{a.wins}</p>
                    <p className="text-[9px] text-muted-foreground uppercase">Wins</p>
                  </div>
                  <div>
                    <p className="font-heading text-base font-bold text-red-500">{a.losses}</p>
                    <p className="text-[9px] text-muted-foreground uppercase">Losses</p>
                  </div>
                  <div>
                    <p className="font-heading text-base font-bold text-accent">{a.currentStreak}</p>
                    <p className="text-[9px] text-muted-foreground uppercase">Streak</p>
                  </div>
                  <div>
                    <p className="font-heading text-base font-bold">{a.winPct}%</p>
                    <p className="text-[9px] text-muted-foreground uppercase">Win %</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Trophy Case — award badges */}
      <h3 className="font-heading font-bold mb-3 mt-6">Trophy Case</h3>
      {sortedAwards.length === 0 ? (
        <p className="text-sm text-muted-foreground">No awards yet. Complete a challenge and earn an achievement!</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {sortedAwards.map((a) => (
            <AwardBadge key={a.id} award={a} onClick={setSelectedAward} />
          ))}
        </div>
      )}

      {/* Badge detail modal */}
      <Dialog open={!!selectedAward} onOpenChange={(v) => { if (!v) setSelectedAward(null); }}>
        <DialogContent className="max-w-[360px] p-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Achievement Details</DialogTitle>
          </DialogHeader>
          {selectedAward && (() => {
            const meta = getAwardMeta(selectedAward.type);
            const rarityClass = RARITY_CLASSES[meta.rarity] || RARITY_CLASSES.Common;
            return (
              <div className="flex flex-col items-center pt-8 pb-6 px-6">
                <div className="w-20 h-20 rounded-full brand-gradient flex items-center justify-center mb-4 arena-shadow">
                  <span className="text-4xl">{meta.emoji}</span>
                </div>
                <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full border ${rarityClass} mb-2`}>{meta.rarity}</span>
                <h2 className="font-heading text-xl font-bold text-center">{selectedAward.type}</h2>
                <p className="text-sm text-muted-foreground mt-1 text-center">Achievement Unlocked</p>
                {selectedAward.awarded_by_name && (
                  <p className="text-xs text-muted-foreground mt-3">Awarded by {selectedAward.awarded_by_name}</p>
                )}
                <Button
                  onClick={() => { setShowShare(true); }}
                  className="w-full rounded-full h-11 mt-5"
                >
                  <Zap className="w-4 h-4 mr-1.5" /> Flex Achievement
                </Button>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Flex share card */}
      <AchievementShareCard
        open={showShare}
        onOpenChange={setShowShare}
        award={selectedAward}
        ownerId={ownerId}
        ownerName={ownerName}
        ownerUsername={ownerUsername}
      />
    </div>
  );
}