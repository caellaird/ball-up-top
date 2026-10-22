import React, { useState, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { AWARD_TYPES, getSportDisplay } from '@/lib/constants';
import { Crown } from 'lucide-react';
import { sendNotification } from '@/lib/notify';
import CelebrationOverlay from '@/components/shared/CelebrationOverlay';

// Notifies every other participant that a result was published, gated by each
// recipient's "Challenge Results" notification preference.
const notifyResult = (challenge, participants, actingUser, winnerName) => {
  const others = participants.filter((p) => p.id !== actingUser.id);
  return Promise.all(
    others.map((p) =>
      sendNotification({
        userId: p.id,
        type: 'challenge_result',
        actorName: actingUser.full_name,
        title: `${actingUser.full_name} logged a result`,
        body: winnerName ? `${winnerName} won — ${sportLabel(challenge)}` : `Result posted — ${sportLabel(challenge)}`,
        link: `/challenges/${challenge.id}`,
      })
    )
  );
};
const sportLabel = (c) => getSportDisplay(c).label;

export default function CompleteChallengeSheet({ open, onOpenChange, challenge, user, onCompleted }) {
  const [scoreCreator, setScoreCreator] = useState('');
  const [scoreOpponent, setScoreOpponent] = useState('');
  const [gameWinnerId, setGameWinnerId] = useState('');
  const [participantScores, setParticipantScores] = useState({});
  const [caption, setCaption] = useState('');
  const [award, setAward] = useState('');
  const [photos, setPhotos] = useState([]);
  const [finalGame, setFinalGame] = useState(false);
  const [saving, setSaving] = useState(false);
  const [celebration, setCelebration] = useState(null);
  const completedRef = useRef(null);
  const submittingRef = useRef(false);

  // Determines win/loss/tie for the current user and fires the celebration
  // overlay before handing control back to the parent.
  const finishWithCelebration = (updated, gameWinnerId, isDraw) => {
    const userWon = isDraw ? false : (gameWinnerId || updated.winner_id) === user.id;
    const result = isDraw ? 'tie' : userWon ? 'win' : 'loss';
    completedRef.current = updated;
    setCelebration(result);
  };

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
  const finalizeSeries = async (creatorWins, opponentWins, opponentUsernames, myUsername, myAvatar, overrideWinnerId, isDraw = false, scoresArr = []) => {
    const isCreatorWinner = creatorWins > opponentWins;
    const scoreWinnerId = creatorWins === opponentWins ? '' : isCreatorWinner ? challenge.created_by_id : challenge.opponent_id;
    // Use pre-selected winner if set, otherwise derive from scores
    const winnerId = isDraw ? '' : (overrideWinnerId || challenge.winner_id || scoreWinnerId);
    const winnerName = isDraw ? '' : (participants.find((p) => p.id === winnerId)?.name || '');

    const updated = await base44.entities.Challenge.update(challenge.id, {
      status: 'completed',
      creator_games_won: creatorWins,
      opponent_games_won: opponentWins,
      score_creator: creatorWins,
      score_opponent: opponentWins,
      winner_id: winnerId,
      winner_name: winnerName,
      is_draw: isDraw,
      participant_scores: scoresArr.length ? scoresArr : undefined,
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
      participant_scores: isMultiplayer && scoresArr.length ? scoresArr : undefined,
      tagged_user_ids: opponentIds,
      tagged_user_names: opponentNames,
      tagged_usernames: opponentUsernames,
    });

    // For series, each individual game already recorded its own result as it was logged —
    // only record here for single (non-series) challenges to avoid double counting.
    // Runs through the service-role function so opponents' stats (locked to owner-only) update.
    if (!isSeries) {
      if (isDraw) {
        await base44.functions.invoke('recordGameResult', { challengeId: challenge.id, isDraw: true });
      } else if (winnerId) {
        await base44.functions.invoke('recordGameResult', { challengeId: challenge.id, winnerId });
      }
      base44.analytics.track({ eventName: 'game_played' });
    }

    return updated;
  };

  const submit = async () => {
    if (submittingRef.current) return;
    let sc = Number(scoreCreator);
    let so = Number(scoreOpponent);
    if (isMultiplayer) {
      if (!gameWinnerId) return;
      sc = 0;
      so = 0;
    } else if (Number.isNaN(sc) || Number.isNaN(so)) {
      return;
    }
    submittingRef.current = true;
    setSaving(true);

    const scoresArr = isMultiplayer
      ? participants.map((p) => ({ user_id: p.id, name: p.name, score: Number(participantScores[p.id]) || 0 }))
      : [];

    const [opponentProfileLists, myProfiles] = await Promise.all([
      Promise.all(opponentIds.map((oid) => base44.entities.Profile.filter({ created_by_id: oid }))),
      base44.entities.Profile.filter({ created_by_id: user.id }),
    ]);
    const opponentUsernames = opponentProfileLists.map((list) => list[0]?.username || '');
    const myUsername = myProfiles[0]?.username || '';
    const myAvatar = myProfiles[0]?.avatar_url || '';

    if (!isSeries) {
      const isDraw = isMultiplayer ? gameWinnerId === 'draw' : sc === so;
      const updated = await finalizeSeries(sc, so, opponentUsernames, myUsername, myAvatar, isMultiplayer && gameWinnerId !== 'draw' ? gameWinnerId : undefined, isDraw, scoresArr);
      const winnerName = isDraw ? '' : (participants.find((p) => p.id === updated.winner_id)?.name || '');
      await notifyResult(challenge, participants, user, winnerName);
      setSaving(false); submittingRef.current = false;
      finishWithCelebration(updated, undefined, isDraw);
      return;
    }

    // Determine this game's winner: picked directly for multiplayer, otherwise from the two scores.
    const isDrawGame = isMultiplayer ? gameWinnerId === 'draw' : sc === so;
    const winnerIdThisGame = isDrawGame ? '' : (isMultiplayer ? gameWinnerId : (sc > so ? challenge.created_by_id : challenge.opponent_id));
    const gameWinnerName = participants.find((p) => p.id === winnerIdThisGame)?.name || '';
    const isCreatorGameWinner = winnerIdThisGame === challenge.created_by_id;

    await base44.entities.SeriesGame.create({
      challenge_id: challenge.id,
      game_number: gameNumber,
      score_creator: sc,
      score_opponent: so,
      participant_scores: isMultiplayer ? scoresArr : undefined,
      winner_id: winnerIdThisGame || undefined,
      winner_name: gameWinnerName,
      is_draw: isDrawGame,
      caption,
      photos,
    });

    // Each published series game updates the series score AND each player's overall
    // record (recorded below per game). The series outcome (city score + rivalries)
    // is finalized once, when the series ends (auto-clinch below, or End Series).
    base44.analytics.track({ eventName: 'game_played' });

    const creatorWins = (challenge.creator_games_won || 0) + (isCreatorGameWinner ? 1 : 0);
    const opponentWins = (challenge.opponent_games_won || 0) + (winnerIdThisGame && !isCreatorGameWinner ? 1 : 0);

    const seriesClinched = challenge.games_to_win
      ? creatorWins >= challenge.games_to_win || opponentWins >= challenge.games_to_win
      : finalGame;

    if (seriesClinched) {
      // An open-ended series can end in a draw if the final game leaves it tied.
      const isSeriesDraw = !challenge.games_to_win && finalGame && creatorWins === opponentWins;

      // Record this clinching game's individual result to each player's stats first,
      // while the series is still open (so city/rivalry don't fire yet).
      if (isDrawGame) {
        await base44.functions.invoke('recordGameResult', { challengeId: challenge.id, isDraw: true });
      } else if (winnerIdThisGame) {
        await base44.functions.invoke('recordGameResult', { challengeId: challenge.id, winnerId: winnerIdThisGame });
      }

      const updated = await finalizeSeries(creatorWins, opponentWins, opponentUsernames, myUsername, myAvatar, isMultiplayer && winnerIdThisGame ? winnerIdThisGame : undefined, isSeriesDraw, scoresArr);

      // Close out the series: fire the city score + rivalry update once, without
      // double-counting stats (each game above already recorded its own W/L/D).
      await base44.functions.invoke('recordGameResult', {
        challengeId: challenge.id,
        winnerId: updated.winner_id,
        isDraw: updated.is_draw,
        skipStats: true,
      });
      const winnerName = isSeriesDraw ? '' : (participants.find((p) => p.id === updated.winner_id)?.name || '');
      await notifyResult(challenge, participants, user, winnerName);
      setSaving(false); submittingRef.current = false;
      finishWithCelebration(updated, undefined, isSeriesDraw);
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
        participant_scores: isMultiplayer ? scoresArr : undefined,
        tagged_user_ids: opponentIds,
        tagged_user_names: opponentNames,
        tagged_usernames: opponentUsernames,
      });

      const updated = await base44.entities.Challenge.update(challenge.id, {
        creator_games_won: creatorWins,
        opponent_games_won: opponentWins,
      });

      // Each published series game counts as a W/L/D toward every player's overall
      // record — even while the series is still open. City score and rivalries only
      // fire when the series completes, so this just updates per-player stats.
      if (isDrawGame) {
        await base44.functions.invoke('recordGameResult', { challengeId: challenge.id, isDraw: true });
      } else if (winnerIdThisGame) {
        await base44.functions.invoke('recordGameResult', { challengeId: challenge.id, winnerId: winnerIdThisGame });
      }

      await notifyResult(challenge, participants, user, gameWinnerName);
      setSaving(false); submittingRef.current = false;
      finishWithCelebration(updated, winnerIdThisGame, isDrawGame);
    }
  };

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading">{isSeries ? `Log Game ${gameNumber}` : 'Complete Challenge'}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          {isMultiplayer ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-bold mb-2">Scores</p>
                <p className="text-xs text-muted-foreground mb-2">Enter each player's score for {isSeries ? `Game ${gameNumber}` : 'this challenge'}.</p>
                <div className="space-y-2">
                  {participants.map((p) => (
                    <div key={p.id} className="flex items-center gap-3">
                      <span className="flex-1 text-sm font-medium truncate">{p.name}</span>
                      <Input
                        type="number"
                        value={participantScores[p.id] ?? ''}
                        onChange={(e) => setParticipantScores({ ...participantScores, [p.id]: e.target.value })}
                        placeholder="Score"
                        className="w-24 h-10 rounded-xl"
                      />
                    </div>
                  ))}
                </div>
              </div>
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
                  <button
                    onClick={() => setGameWinnerId('draw')}
                    className={`flex-1 min-w-[90px] rounded-2xl p-3 border-2 text-sm font-bold transition ${gameWinnerId === 'draw' ? 'border-secondary bg-secondary/10 text-secondary' : 'border-border text-muted-foreground'}`}
                  >
                    Draw 🤝
                  </button>
                </div>
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
    <CelebrationOverlay result={celebration} onDone={() => { setCelebration(null); onCompleted(completedRef.current); }} />
    </>
  );
}