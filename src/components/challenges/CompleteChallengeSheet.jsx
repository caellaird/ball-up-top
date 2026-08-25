import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { AWARD_TYPES, getSportDisplay } from '@/lib/constants';
import { Crown } from 'lucide-react';

export default function CompleteChallengeSheet({ open, onOpenChange, challenge, user, onCompleted }) {
  const [scoreCreator, setScoreCreator] = useState('');
  const [scoreOpponent, setScoreOpponent] = useState('');
  const [gameWinnerId, setGameWinnerId] = useState('');
  const [caption, setCaption] = useState('');
  const [award, setAward] = useState('');
  const [photos, setPhotos] = useState([]);
  const [finalGame, setFinalGame] = useState(false);
  const [saving, setSaving] = useState(false);

  const isSeries = challenge.series_type !== 'single';
  const gameNumber = (challenge.creator_games_won || 0) + (challenge.opponent_games_won || 0) + 1;
  const isOpenEnded = isSeries && !challenge.games_to_win;
  const sportDisplay = getSportDisplay(challenge);

  const opponentIds = challenge.opponent_ids?.length ? challenge.opponent_ids : [challenge.opponent_id];
  const opponentNames = challenge.opponent_names?.length ? challenge.opponent_names : [challenge.opponent_name];
  const opponentsLabel = opponentNames.join(', ');
  const participants = [
    { id: challenge.created_by_id, name: challenge.creator_name },
    ...opponentIds.map((id, i) => ({ id, name: opponentNames[i] })),
  ].filter((p) => p.id && p.name);
  const isMultiplayer = participants.length > 2;

  const uploadPhotos = async (files) => {
    const uploads = await Promise.all(
      Array.from(files).slice(0, 5 - photos.length).map((file) => base44.integrations.Core.UploadFile({ file }))
    );
    setPhotos([...photos, ...uploads.map((u) => u.file_url)]);
  };

  // Every participant gets an individual result — the winner gets a win, everyone else a loss.
  // For isMultiplayer challenges the winner is picked directly rather than derived from two scores.
  const finalizeSeries = async (creatorWins, opponentWins, opponentUsernames, myUsername, myAvatar, overrideWinnerId) => {
    const isCreatorWinner = creatorWins > opponentWins;
    const scoreWinnerId = creatorWins === opponentWins ? '' : isCreatorWinner ? challenge.created_by_id : challenge.opponent_id;
    // Use pre-selected winner if set, otherwise derive from scores
    const winnerId = overrideWinnerId || challenge.winner_id || scoreWinnerId;
    const winnerName = participants.find((p) => p.id === winnerId)?.name || '';

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
      author_avatar: myAvatar,
      body: caption || (isSeries
        ? `${challenge.series_name || sportDisplay.label}: ${challenge.creator_name} vs ${opponentsLabel} — Final! ${winnerName ? winnerName + ' takes the series!' : 'Series complete!'}`
        : `${challenge.creator_name} vs ${opponentsLabel} — ${winnerName ? winnerName + ' wins!' : 'Final'}`),
      media_urls: photos,
      challenge_id: challenge.id,
      game_emoji: sportDisplay.emoji,
      sport_label: sportDisplay.label,
      challenge_type: isSeries ? 'series' : 'single',
      location_name: challenge.location_name,
      score_text: isMultiplayer
        ? `🏆 ${winnerName || 'No winner set'}`
        : `${winnerId === challenge.created_by_id ? '👑 ' : ''}${challenge.creator_name} ${creatorWins} - ${opponentWins} ${opponentsLabel}${winnerId === challenge.opponent_id ? ' 👑' : ''}`,
      tagged_user_ids: opponentIds,
      tagged_user_names: opponentNames,
      tagged_usernames: opponentUsernames,
    });

    // For series, each individual game already recorded its own result as it was logged —
    // only record here for single (non-series) challenges to avoid double counting.
    // Runs through the service-role function so opponents' stats (locked to owner-only) update.
    if (!isSeries && winnerId) {
      await base44.functions.invoke('recordGameResult', { challengeId: challenge.id, winnerId });
    }

    return updated;
  };

  const submit = async () => {
    let sc = Number(scoreCreator);
    let so = Number(scoreOpponent);
    if (isMultiplayer) {
      if (!gameWinnerId) return;
      sc = 0;
      so = 0;
    } else if (Number.isNaN(sc) || Number.isNaN(so)) {
      return;
    }
    setSaving(true);

    const [opponentProfileLists, myProfiles] = await Promise.all([
      Promise.all(opponentIds.map((oid) => base44.entities.Profile.filter({ created_by_id: oid }))),
      base44.entities.Profile.filter({ created_by_id: user.id }),
    ]);
    const opponentUsernames = opponentProfileLists.map((list) => list[0]?.username || '');
    const myUsername = myProfiles[0]?.username || '';
    const myAvatar = myProfiles[0]?.avatar_url || '';

    if (!isSeries) {
      const updated = await finalizeSeries(sc, so, opponentUsernames, myUsername, myAvatar, isMultiplayer ? gameWinnerId : undefined);
      setSaving(false);
      onCompleted(updated);
      return;
    }

    // Determine this game's winner: picked directly for multiplayer, otherwise from the two scores.
    const winnerIdThisGame = isMultiplayer ? gameWinnerId : (sc === so ? '' : sc > so ? challenge.created_by_id : challenge.opponent_id);
    const gameWinnerName = participants.find((p) => p.id === winnerIdThisGame)?.name || '';
    const isCreatorGameWinner = winnerIdThisGame === challenge.created_by_id;

    await base44.entities.SeriesGame.create({
      challenge_id: challenge.id,
      game_number: gameNumber,
      score_creator: sc,
      score_opponent: so,
      winner_name: gameWinnerName,
      caption,
      photos,
    });

    // Record this individual game's result toward every participant's record immediately —
    // each game in a series counts on its own, not just the series' final outcome.
    // Runs through the service-role function so opponents' stats (locked to owner-only) update.
    if (winnerIdThisGame) {
      await base44.functions.invoke('recordGameResult', { challengeId: challenge.id, winnerId: winnerIdThisGame });
    }

    const creatorWins = (challenge.creator_games_won || 0) + (isCreatorGameWinner ? 1 : 0);
    const opponentWins = (challenge.opponent_games_won || 0) + (winnerIdThisGame && !isCreatorGameWinner ? 1 : 0);

    const seriesClinched = challenge.games_to_win
      ? creatorWins >= challenge.games_to_win || opponentWins >= challenge.games_to_win
      : finalGame;

    if (seriesClinched) {
      const updated = await finalizeSeries(creatorWins, opponentWins, opponentUsernames, myUsername, myAvatar, isMultiplayer ? winnerIdThisGame : undefined);
      setSaving(false);
      onCompleted(updated);
    } else {
      await base44.entities.Post.create({
        author_name: user.full_name,
        author_username: myUsername,
        author_avatar: myAvatar,
        body: caption || `${challenge.series_name || sportDisplay.label}: Game ${gameNumber} — ${gameWinnerName ? gameWinnerName + ' takes it!' : 'Tied!'}${!isMultiplayer ? ` Series ${creatorWins}-${opponentWins}` : ''}`,
        media_urls: photos,
        challenge_id: challenge.id,
        game_emoji: sportDisplay.emoji,
        sport_label: sportDisplay.label,
        challenge_type: 'series',
        location_name: challenge.location_name,
        score_text: isMultiplayer
          ? `Game ${gameNumber}: 🏆 ${gameWinnerName || 'No winner set'}`
          : `Game ${gameNumber}: ${challenge.creator_name} ${sc} - ${so} ${opponentsLabel} · Series ${creatorWins}-${opponentWins}`,
        tagged_user_ids: opponentIds,
        tagged_user_names: opponentNames,
        tagged_usernames: opponentUsernames,
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
          {isMultiplayer ? (
            <div>
              <p className="text-sm font-bold mb-2 flex items-center gap-1.5"><Crown className="w-4 h-4 text-accent" /> Who won?</p>
              <div className="flex gap-2 flex-wrap">
                {participants.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setGameWinnerId(p.id)}
                    className={`flex-1 min-w-[90px] rounded-2xl p-3 border-2 text-sm font-bold transition ${gameWinnerId === p.id ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted-foreground'}`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">{challenge.creator_name}</p>
                <Input type="number" value={scoreCreator} onChange={(e) => setScoreCreator(e.target.value)} placeholder="Score" />
              </div>
              <span className="font-heading font-bold text-muted-foreground pt-4">VS</span>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1 truncate">{opponentsLabel}</p>
                <Input type="number" value={scoreOpponent} onChange={(e) => setScoreOpponent(e.target.value)} placeholder="Score" />
              </div>
            </div>
          )}

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

          {!isMultiplayer && (
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
          )}

          <Button onClick={submit} disabled={saving || (isMultiplayer && !gameWinnerId)} className="w-full rounded-full h-12 bg-gradient-to-r from-[hsl(var(--accent))] to-[hsl(var(--secondary))]">
            {saving ? 'Publishing...' : isSeries ? 'Save Game Result' : 'Publish Result'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}