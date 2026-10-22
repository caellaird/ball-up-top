import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { getSportDisplay } from '@/lib/constants';
import { Crown } from 'lucide-react';
import { toast } from 'sonner';

// Lets a participant fix a series game's winner and scores after it was posted.
// Updates the SeriesGame record, recomputes the series tally (and the overall
// winner if the series is already completed), and syncs the linked feed post.
// Per-player W/L stats are not re-corrected retroactively.
export default function EditSeriesGameSheet({ open, onOpenChange, challenge, game, user, onSaved }) {
  const [scoreCreator, setScoreCreator] = useState('');
  const [scoreOpponent, setScoreOpponent] = useState('');
  const [gameWinnerId, setGameWinnerId] = useState('');
  const [participantScores, setParticipantScores] = useState({});
  const [caption, setCaption] = useState('');
  const [saving, setSaving] = useState(false);

  const sportDisplay = getSportDisplay(challenge);
  const opponentIds = challenge.opponent_ids?.length ? challenge.opponent_ids : [challenge.opponent_id];
  const opponentNames = challenge.opponent_names?.length ? challenge.opponent_names : [challenge.opponent_name];
  const opponentsLabel = opponentNames.join(', ');
  const participants = [
    { id: challenge.created_by_id, name: challenge.creator_name },
    ...opponentIds.map((id, i) => ({ id, name: opponentNames[i] })),
  ].filter((p) => p.id && p.name);
  const isMultiplayer = participants.length > 2;

  // Seed the form from the game being edited whenever it changes.
  useEffect(() => {
    if (!open || !game) return;
    setScoreCreator(game.score_creator != null ? String(game.score_creator) : '');
    setScoreOpponent(game.score_opponent != null ? String(game.score_opponent) : '');
    setGameWinnerId(game.is_draw ? 'draw' : (game.winner_id || ''));
    setCaption(game.caption || '');
    const ps = {};
    (game.participant_scores || []).forEach((s) => { ps[s.user_id] = String(s.score); });
    setParticipantScores(ps);
  }, [open, game?.id]);

  if (!game) return null;

  // Builds the score_text + body for the linked post, matching the formats used
  // when the game was first published. `isFinalPost` switches to the series-final
  // framing used for the clinching game's post.
  const buildPostText = (winnerId, isDraw, sc, so, creatorWins, opponentWins, scoresArr, isFinalPost) => {
    const winnerName = isDraw ? '' : (participants.find((p) => p.id === winnerId)?.name || '');
    const gameNum = game.game_number;
    const seriesName = challenge.series_name || sportDisplay.label;
    if (isMultiplayer) {
      const scoreText = isFinalPost
        ? `🏆 ${winnerName || 'No winner set'}`
        : `Game ${gameNum}: 🏆 ${winnerName || 'No winner set'}`;
      const body = caption || (isFinalPost
        ? `${seriesName}: ${challenge.creator_name} vs ${opponentsLabel} — Final! ${winnerName ? winnerName + ' takes the series!' : 'Series complete!'}`
        : `${seriesName}: Game ${gameNum} — ${winnerName ? winnerName + ' takes it!' : 'Tied!'}`);
      return { scoreText, body, scoresArr };
    }
    const scoreText = isFinalPost
      ? `${winnerId === challenge.created_by_id ? '👑 ' : ''}${challenge.creator_name} ${creatorWins} - ${opponentWins} ${opponentsLabel}${winnerId === challenge.opponent_id ? ' 👑' : ''}`
      : `Game ${gameNum}: ${challenge.creator_name} ${sc} - ${so} ${opponentsLabel} · Series ${creatorWins}-${opponentWins}`;
    const body = caption || (isFinalPost
      ? `${seriesName}: ${challenge.creator_name} vs ${opponentsLabel} — Final! ${winnerName ? winnerName + ' takes the series!' : 'Series complete!'}`
      : `${seriesName}: Game ${gameNum} — ${winnerName ? winnerName + ' takes it!' : 'Tied!'} Series ${creatorWins}-${opponentWins}`);
    return { scoreText, body, scoresArr };
  };

  const submit = async () => {
    if (saving) return;
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

    const scoresArr = isMultiplayer
      ? participants.map((p) => ({ user_id: p.id, name: p.name, score: Number(participantScores[p.id]) || 0 }))
      : [];
    const isDrawGame = isMultiplayer ? gameWinnerId === 'draw' : sc === so;
    const winnerIdThisGame = isDrawGame ? '' : (isMultiplayer ? gameWinnerId : (sc > so ? challenge.created_by_id : challenge.opponent_id));
    const winnerName = isDrawGame ? '' : (participants.find((p) => p.id === winnerIdThisGame)?.name || '');

    try {
      await base44.entities.SeriesGame.update(game.id, {
        score_creator: sc,
        score_opponent: so,
        participant_scores: isMultiplayer ? scoresArr : undefined,
        winner_id: winnerIdThisGame || undefined,
        winner_name: winnerName,
        is_draw: isDrawGame,
        caption,
      });

      // Recompute the series tally from every game so the series score stays
      // consistent with the edited game result.
      const allGames = await base44.entities.SeriesGame.filter({ challenge_id: challenge.id }, 'game_number');
      const creatorWins = allGames.filter((g) => g.winner_id === challenge.created_by_id).length;
      const opponentWins = allGames.filter((g) => g.winner_id && g.winner_id !== challenge.created_by_id).length;

      const challengeUpdate = {
        creator_games_won: creatorWins,
        opponent_games_won: opponentWins,
      };

      // If the series is already completed, recompute the overall winner/draw
      // from the new tally so the crowned winner stays accurate.
      let isFinalPost = false;
      if (challenge.status === 'completed') {
        isFinalPost = true;
        const seriesIsDraw = creatorWins === opponentWins;
        const seriesWinnerId = seriesIsDraw ? '' : (creatorWins > opponentWins ? challenge.created_by_id : (opponentIds[0] || challenge.opponent_id));
        const seriesWinnerName = seriesIsDraw ? '' : (participants.find((p) => p.id === seriesWinnerId)?.name || '');
        Object.assign(challengeUpdate, {
          score_creator: creatorWins,
          score_opponent: opponentWins,
          winner_id: seriesWinnerId,
          winner_name: seriesWinnerName,
          is_draw: seriesIsDraw,
        });
      }

      await base44.entities.Challenge.update(challenge.id, challengeUpdate);

      // Sync the linked feed post (if it exists) to the corrected result.
      try {
        const posts = await base44.entities.Post.filter({ series_game_id: game.id });
        const post = posts[0];
        if (post) {
          // A clinching game's post uses the series-final framing; detect it by
          // the absence of a "Game N:" prefix on the existing score_text.
          if (!isFinalPost) isFinalPost = !/^Game \d+:/.test(post.score_text || '');
          const { scoreText, body } = buildPostText(winnerIdThisGame, isDrawGame, sc, so, creatorWins, opponentWins, scoresArr, isFinalPost);
          await base44.entities.Post.update(post.id, {
            score_text: scoreText,
            participant_scores: isMultiplayer ? scoresArr : undefined,
            body,
            is_edited: true,
          });
        }
      } catch { /* post sync is best-effort */ }

      toast.success('Result updated');
      onSaved?.();
      onOpenChange(false);
    } catch (e) {
      toast.error('Could not update result');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading">Edit Game {game.game_number}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          {isMultiplayer ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-bold mb-2">Scores</p>
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

          <Button onClick={submit} disabled={saving || (isMultiplayer && !gameWinnerId)} className="w-full rounded-full h-12 bg-gradient-to-r from-[hsl(var(--accent))] to-[hsl(var(--secondary))]">
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}