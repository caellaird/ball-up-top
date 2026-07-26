import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { AWARD_TYPES, getSportDisplay } from '@/lib/constants';
import { recordGameResult } from '@/lib/ensureProfile';

export default function CompleteChallengeSheet({ open, onOpenChange, challenge, user, onCompleted }) {
  const [scoreCreator, setScoreCreator] = useState('');
  const [scoreOpponent, setScoreOpponent] = useState('');
  const [caption, setCaption] = useState('');
  const [award, setAward] = useState('');
  const [photos, setPhotos] = useState([]);
  const [finalGame, setFinalGame] = useState(false);
  const [saving, setSaving] = useState(false);

  const isSeries = challenge.series_type !== 'single';
  const gameNumber = (challenge.creator_games_won || 0) + (challenge.opponent_games_won || 0) + 1;
  const isOpenEnded = isSeries && !challenge.games_to_win;
  const sportDisplay = getSportDisplay(challenge);

  const uploadPhotos = async (files) => {
    const uploads = await Promise.all(
      Array.from(files).slice(0, 5 - photos.length).map((file) => base44.integrations.Core.UploadFile({ file }))
    );
    setPhotos([...photos, ...uploads.map((u) => u.file_url)]);
  };

  const finalizeSeries = async (creatorWins, opponentWins, opponentUsername, myUsername) => {
    const isCreatorWinner = creatorWins > opponentWins;
    const scoreWinnerId = creatorWins === opponentWins ? '' : isCreatorWinner ? challenge.created_by_id : challenge.opponent_id;
    // Use pre-selected winner if set, otherwise derive from scores
    const winnerId = challenge.winner_id || scoreWinnerId;
    const winnerName = winnerId === challenge.created_by_id ? challenge.creator_name : winnerId === challenge.opponent_id ? challenge.opponent_name : '';

    const updated = await base44.entities.Challenge.update(challenge.id, {
      status: 'completed',
      creator_games_won: creatorWins,
      opponent_games_won: opponentWins,
      score_creator: creatorWins,
      score_opponent: opponentWins,
      winner_id: winnerId,
      winner_name: winnerName,
      photos: [...(challenge.photos || []), ...photos],
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
      author_username: myUsername,
      body: caption || (isSeries
        ? `${challenge.series_name || sportDisplay.label}: ${challenge.creator_name} vs ${challenge.opponent_name} — Final! ${winnerName ? winnerName + ' takes the series!' : 'Series complete!'}`
        : `${challenge.creator_name} vs ${challenge.opponent_name} — ${winnerName ? winnerName + ' wins!' : 'Final'}`),
      media_urls: photos,
      challenge_id: challenge.id,
      game_emoji: sportDisplay.emoji,
      location_name: challenge.location_name,
      score_text: `${winnerId === challenge.created_by_id ? '👑 ' : ''}${challenge.creator_name} ${creatorWins} - ${opponentWins} ${challenge.opponent_name}${winnerId === challenge.opponent_id ? ' 👑' : ''}`,
      tagged_user_ids: [challenge.opponent_id],
      tagged_user_names: [challenge.opponent_name],
      tagged_usernames: [opponentUsername],
    });

    const creatorWon = winnerId === challenge.created_by_id;
    await Promise.all([
      recordGameResult(challenge.created_by_id, challenge.creator_name, creatorWon),
      recordGameResult(challenge.opponent_id, challenge.opponent_name, !creatorWon),
    ]);

    return updated;
  };

  const submit = async () => {
    const sc = Number(scoreCreator);
    const so = Number(scoreOpponent);
    if (Number.isNaN(sc) || Number.isNaN(so)) return;
    setSaving(true);

    const [opponentProfiles, myProfiles] = await Promise.all([
      base44.entities.Profile.filter({ created_by_id: challenge.opponent_id }),
      base44.entities.Profile.filter({ created_by_id: user.id }),
    ]);
    const opponentUsername = opponentProfiles[0]?.username || '';
    const myUsername = myProfiles[0]?.username || '';

    if (!isSeries) {
      const updated = await finalizeSeries(sc, so, opponentUsername, myUsername);
      setSaving(false);
      onCompleted(updated);
      return;
    }

    const isCreatorGameWinner = sc > so;
    const gameWinnerName = sc === so ? '' : isCreatorGameWinner ? challenge.creator_name : challenge.opponent_name;
    await base44.entities.SeriesGame.create({
      challenge_id: challenge.id,
      game_number: gameNumber,
      score_creator: sc,
      score_opponent: so,
      winner_name: gameWinnerName,
      caption,
      photos,
    });

    const creatorWins = (challenge.creator_games_won || 0) + (isCreatorGameWinner ? 1 : 0);
    const opponentWins = (challenge.opponent_games_won || 0) + (!isCreatorGameWinner && sc !== so ? 1 : 0);

    const seriesClinched = challenge.games_to_win
      ? creatorWins >= challenge.games_to_win || opponentWins >= challenge.games_to_win
      : finalGame;

    if (seriesClinched) {
      const updated = await finalizeSeries(creatorWins, opponentWins, opponentUsername, myUsername);
      setSaving(false);
      onCompleted(updated);
    } else {
      await base44.entities.Post.create({
        author_name: user.full_name,
        author_username: myUsername,
        body: caption || `${challenge.series_name || sportDisplay.label}: Game ${gameNumber} — ${gameWinnerName ? gameWinnerName + ' takes it!' : 'Tied!'} Series ${creatorWins}-${opponentWins}`,
        media_urls: photos,
        challenge_id: challenge.id,
        game_emoji: sportDisplay.emoji,
        location_name: challenge.location_name,
        score_text: `Game ${gameNumber}: ${challenge.creator_name} ${sc} - ${so} ${challenge.opponent_name} · Series ${creatorWins}-${opponentWins}`,
        tagged_user_ids: [challenge.opponent_id],
        tagged_user_names: [challenge.opponent_name],
        tagged_usernames: [opponentUsername],
      });

      const updated = await base44.entities.Challenge.update(challenge.id, {
        creator_games_won: creatorWins,
        opponent_games_won: opponentWins,
      });
      setSaving(false);
      onCompleted(updated);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading">{isSeries ? `Log Game ${gameNumber}` : 'Complete Challenge'}</SheetTitle>
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

          {isOpenEnded && (
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={finalGame} onChange={(e) => setFinalGame(e.target.checked)} />
              This is the final game of the series
            </label>
          )}

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
            {saving ? 'Publishing...' : isSeries ? 'Save Game Result' : 'Publish Result'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}