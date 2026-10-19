import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getSportDisplay } from '@/lib/constants';
import { sendNotification } from '@/lib/notify';

// Ends an active series without logging another game. Computes the overall
// result from the current series score and closes the series. Each already-
// logged game has already counted toward the players' records, so this only
// finalizes the series (city score + rivalries) server-side. Also publishes a
// feed post and notifies the other participants.
export default function EndSeriesDialog({ open, onOpenChange, challenge, user, onEnded }) {
  const [ending, setEnding] = useState(false);

  if (!challenge) return null;

  const creatorWins = challenge.creator_games_won || 0;
  const opponentWins = challenge.opponent_games_won || 0;
  const gamesPlayed = creatorWins + opponentWins;
  const sportDisplay = getSportDisplay(challenge);

  const opponentIds = challenge.opponent_ids?.length ? challenge.opponent_ids : [challenge.opponent_id];
  const opponentNames = challenge.opponent_names?.length ? challenge.opponent_names : [challenge.opponent_name];
  const opponentsLabel = opponentNames.join(', ');
  const participants = [
    { id: challenge.created_by_id, name: challenge.creator_name },
    ...opponentIds.map((id, i) => ({ id, name: opponentNames[i] })),
  ].filter((p) => p.id && p.name);

  const isDraw = creatorWins === opponentWins;
  const winnerSide = isDraw ? null : (creatorWins > opponentWins ? 'creator' : 'opponent');
  const resultText = isDraw
    ? 'Draw'
    : (winnerSide === 'creator' ? `${challenge.creator_name} wins` : `${opponentsLabel} wins`);

  const handleEnd = async () => {
    setEnding(true);
    try {
      const res = await base44.functions.invoke('recordGameResult', {
        challengeId: challenge.id,
        endSeries: true,
      });
      if (res?.error) throw new Error(res.error);

      const winnerId = res?.winnerId || '';
      const seriesIsDraw = !!res?.draw;
      const winnerName = seriesIsDraw
        ? ''
        : (participants.find((p) => p.id === winnerId)?.name || '');

      // Fetch profile + opponent usernames for the feed post.
      const [myProfiles, ...opponentProfileLists] = await Promise.all([
        base44.entities.Profile.filter({ created_by_id: user.id }),
        ...opponentIds.map((oid) => base44.entities.Profile.filter({ created_by_id: oid })),
      ]);
      const myUsername = myProfiles[0]?.username || '';
      const myAvatar = myProfiles[0]?.avatar_url || '';
      const opponentUsernames = opponentProfileLists.map((list) => list[0]?.username || '');

      await base44.entities.Post.create({
        author_name: user.full_name,
        author_username: myUsername,
        author_avatar: myAvatar,
        body: `${challenge.series_name || sportDisplay.label}: ${challenge.creator_name} vs ${opponentsLabel} — Series ended ${creatorWins}–${opponentWins}. ${seriesIsDraw ? 'Series drawn!' : winnerName + ' takes the series!'}`,
        challenge_id: challenge.id,
        game_emoji: sportDisplay.emoji,
        sport_label: sportDisplay.label,
        challenge_type: 'series',
        location_name: challenge.location_name,
        score_text: `${challenge.creator_name} ${creatorWins} - ${opponentWins} ${opponentsLabel}${seriesIsDraw ? ' · 🤝 Draw' : (winnerName ? ' · 👑 ' + winnerName : '')}`,
        tagged_user_ids: opponentIds,
        tagged_user_names: opponentNames,
        tagged_usernames: opponentUsernames,
      });

      // Notify the other participants that the series was ended.
      const others = participants.filter((p) => p.id !== user.id);
      await Promise.all(
        others.map((p) =>
          sendNotification({
            userId: p.id,
            type: 'challenge_result',
            actorName: user.full_name,
            title: `${user.full_name} ended the series`,
            body: seriesIsDraw
              ? `Series drawn ${creatorWins}–${opponentWins}`
              : `${winnerName || 'Series'} won ${creatorWins}–${opponentWins}`,
            link: `/challenges/${challenge.id}`,
          })
        )
      );

      base44.analytics.track({ eventName: 'game_played' });
      onEnded();
    } catch (e) {
      setEnding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!ending) onOpenChange(v); }}>
      <DialogContent className="max-w-[360px] p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>End Series?</DialogTitle>
        </DialogHeader>
        <div className="pt-6 px-6 pb-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-accent" />
            </div>
            <h2 className="font-heading text-xl font-bold">End Series?</h2>
          </div>

          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-4 text-center mb-4">
            <p className="font-heading font-extrabold text-2xl">{challenge.creator_name} {creatorWins} – {opponentWins} {opponentsLabel}</p>
            <p className="text-sm text-muted-foreground mt-1">{gamesPlayed} game{gamesPlayed !== 1 ? 's' : ''} played</p>
          </div>

          <div className="space-y-1.5 text-sm mb-4">
            <div className="flex justify-between"><span className="text-muted-foreground">Series</span><span className="font-semibold text-right">{challenge.series_name || sportDisplay.label}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Opponent</span><span className="font-semibold text-right">{opponentsLabel}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Result</span><span className="font-semibold text-right">{resultText}</span></div>
          </div>

          <p className="text-xs text-muted-foreground bg-muted rounded-xl p-3 leading-relaxed">
            ⚠️ The series will be closed and cannot receive additional games. Each game you already logged counts toward everyone's record; closing just finalizes the series.
          </p>
        </div>

        <div className="flex gap-3 px-6 pb-6 pt-1">
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={ending} className="flex-1 rounded-full h-11">
            Cancel
          </Button>
          <Button onClick={handleEnd} disabled={ending || gamesPlayed === 0} className="flex-1 rounded-full h-11">
            {ending ? 'Ending...' : 'End Series'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}