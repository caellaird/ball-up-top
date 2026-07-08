import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { AWARD_TYPES, SPORT_EMOJI } from '@/lib/constants';
import { getOrCreateStats } from '@/lib/ensureProfile';

export default function CompleteChallengeSheet({ open, onOpenChange, challenge, user, onCompleted }) {
  const [scoreCreator, setScoreCreator] = useState('');
  const [scoreOpponent, setScoreOpponent] = useState('');
  const [caption, setCaption] = useState('');
  const [award, setAward] = useState('');
  const [photos, setPhotos] = useState([]);
  const [saving, setSaving] = useState(false);

  const uploadPhotos = async (files) => {
    const uploads = await Promise.all(
      Array.from(files).slice(0, 5 - photos.length).map((file) => base44.integrations.Core.UploadFile({ file }))
    );
    setPhotos([...photos, ...uploads.map((u) => u.file_url)]);
  };

  const submit = async () => {
    const sc = Number(scoreCreator);
    const so = Number(scoreOpponent);
    if (Number.isNaN(sc) || Number.isNaN(so)) return;
    setSaving(true);
    const isCreatorWinner = sc > so;
    const winnerName = sc === so ? '' : isCreatorWinner ? challenge.creator_name : challenge.opponent_name;
    const winnerId = sc === so ? '' : isCreatorWinner ? challenge.created_by_id : challenge.opponent_id;

    const updated = await base44.entities.Challenge.update(challenge.id, {
      status: 'completed',
      score_creator: sc,
      score_opponent: so,
      winner_id: winnerId,
      winner_name: winnerName,
      caption,
      photos,
    });

    if (award) {
      await base44.entities.Award.create({
        challenge_id: challenge.id,
        recipient_id: challenge.opponent_id,
        recipient_name: challenge.opponent_name,
        awarded_by_name: user.full_name,
        type: award,
      });
    }

    await base44.entities.Post.create({
      author_name: user.full_name,
      body: caption || `${challenge.creator_name} vs ${challenge.opponent_name}`,
      media_urls: photos,
      challenge_id: challenge.id,
      game_emoji: SPORT_EMOJI[challenge.sport] || '🏆',
      location_name: challenge.location_name,
      score_text: `${challenge.creator_name} ${sc} - ${so} ${challenge.opponent_name}`,
    });

    const stats = await getOrCreateStats(user);
    const won = challenge.created_by_id === user.id ? isCreatorWinner : !isCreatorWinner;
    await base44.entities.UserStats.update(stats.id, {
      games_played: (stats.games_played || 0) + 1,
      games_won: (stats.games_won || 0) + (won ? 1 : 0),
      losses: (stats.losses || 0) + (won ? 0 : 1),
      current_streak: won ? (stats.current_streak || 0) + 1 : 0,
      longest_streak: won ? Math.max((stats.current_streak || 0) + 1, stats.longest_streak || 0) : stats.longest_streak || 0,
    });

    setSaving(false);
    onCompleted(updated);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading">Complete Challenge</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">{challenge.creator_name}</p>
              <Input type="number" value={scoreCreator} onChange={(e) => setScoreCreator(e.target.value)} placeholder="Score" />
            </div>
            <span className="font-heading font-bold text-muted-foreground pt-4">VS</span>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">{challenge.opponent_name}</p>
              <Input type="number" value={scoreOpponent} onChange={(e) => setScoreOpponent(e.target.value)} placeholder="Score" />
            </div>
          </div>

          <Textarea placeholder="Caption" value={caption} onChange={(e) => setCaption(e.target.value)} />

          <div>
            <p className="text-sm font-medium mb-2">Photos (up to 5)</p>
            <div className="flex flex-wrap gap-2">
              {photos.map((p) => <img key={p} src={p} alt="" className="w-16 h-16 rounded-xl object-cover" />)}
              {photos.length < 5 && (
                <label className="w-16 h-16 rounded-xl border-2 border-dashed border-border flex items-center justify-center text-muted-foreground text-xs cursor-pointer">
                  +
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => uploadPhotos(e.target.files)} />
                </label>
              )}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Give {challenge.opponent_name} an award</p>
            <div className="flex flex-wrap gap-2">
              {AWARD_TYPES.map((a) => (
                <button
                  key={a}
                  onClick={() => setAward(award === a ? '' : a)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${award === a ? 'bg-accent text-white border-accent' : 'border-border text-muted-foreground'}`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={submit} disabled={saving} className="w-full rounded-full h-12 bg-gradient-to-r from-[hsl(var(--accent))] to-[hsl(var(--secondary))]">
            {saving ? 'Publishing...' : 'Publish Result'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}