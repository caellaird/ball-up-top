import React, { useEffect, useState } from 'react';
import { useParams, useOutletContext, useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';
import { MapPin, Clock, Pencil, CalendarPlus } from 'lucide-react';
import { format } from 'date-fns';
import { SPORT_EMOJI, getSportDisplay } from '@/lib/constants';
import { buildGoogleCalendarUrl } from '@/lib/calendarLink';
import { sendNotification } from '@/lib/notify';
import CompleteChallengeSheet from '@/components/challenges/CompleteChallengeSheet';
import ChallengeEditSheet from '@/components/challenges/ChallengeEditSheet';

export default function ChallengeDetail() {
  const { id } = useParams();
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState(null);
  const [games, setGames] = useState([]);
  const [showComplete, setShowComplete] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [creatorUsername, setCreatorUsername] = useState('');
  const [opponentUsername, setOpponentUsername] = useState('');

  useEffect(() => {
    load();
  }, [id]);

  const load = async () => {
    const c = await base44.entities.Challenge.get(id);
    setChallenge(c);
    const [creatorProfiles, opponentProfiles] = await Promise.all([
      base44.entities.Profile.filter({ created_by_id: c.created_by_id }),
      base44.entities.Profile.filter({ created_by_id: c.opponent_id }),
    ]);
    if (creatorProfiles[0]) setCreatorUsername(creatorProfiles[0].username);
    if (opponentProfiles[0]) setOpponentUsername(opponentProfiles[0].username);
    if (c.series_type !== 'single') {
      const g = await base44.entities.SeriesGame.filter({ challenge_id: id }, 'game_number');
      setGames(g);
    }
  };

  const respond = async (status) => {
    const updated = await base44.entities.Challenge.update(id, { status });
    setChallenge(updated);
    await sendNotification({
      userId: challenge.created_by_id,
      type: 'challenge_response',
      actorName: user.full_name,
      title: `${user.full_name} ${status} your challenge`,
      link: `/challenges/${id}`,
    });
  };

  if (!challenge) return <div className="text-center text-muted-foreground py-10">Loading challenge...</div>;

  const isOpponent = challenge.opponent_id === user.id;
  const isCreator = challenge.created_by_id === user.id;
  const isSeries = challenge.series_type !== 'single';
  const sportDisplay = getSportDisplay(challenge);
  const creatorWins = challenge.creator_games_won || 0;
  const opponentWins = challenge.opponent_games_won || 0;
  const totalGames = challenge.games_to_win ? challenge.games_to_win * 2 - 1 : null;

  return (
    <div>
      <Header title="Challenge" onBack={() => navigate(-1)} />
      <div className="p-4">
        <div className="bg-card rounded-3xl shadow-sm p-5 mb-5 text-center relative">
          {isCreator && challenge.status !== 'completed' && challenge.status !== 'declined' && (
            <button onClick={() => setShowEdit(true)} className="absolute top-4 right-4 text-muted-foreground">
              <Pencil className="w-4 h-4" />
            </button>
          )}
          <span className="text-4xl">{sportDisplay.emoji}</span>
          {isSeries && challenge.series_name && (
            <p className="font-heading text-sm font-bold text-[hsl(var(--accent))] mt-2">{challenge.series_name}</p>
          )}
          <h1 className="font-heading text-xl font-bold mt-1"><Link to={`/profile/${creatorUsername || 'me'}`} className="hover:underline">{challenge.creator_name}</Link> vs <Link to={`/profile/${opponentUsername || 'me'}`} className="hover:underline">{challenge.opponent_name}</Link></h1>
          <p className="text-sm text-muted-foreground capitalize mt-1">
            {sportDisplay.label} · {challenge.series_type}
          </p>

          <div className="flex justify-center gap-4 text-sm text-muted-foreground mt-3">
            {challenge.location_name && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{challenge.location_name}</span>}
            {challenge.scheduled_time && <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{format(new Date(challenge.scheduled_time), 'MMM d, h:mm a')}</span>}
          </div>
          {challenge.notes && <p className="text-sm mt-3 text-muted-foreground">{challenge.notes}</p>}

          {challenge.scheduled_time && challenge.status !== 'completed' && challenge.status !== 'declined' && challenge.status !== 'cancelled' && (
            <a
              href={buildGoogleCalendarUrl(challenge)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary mt-3"
            >
              <CalendarPlus className="w-4 h-4" /> Add to Google Calendar
            </a>
          )}

          {isSeries && (
            <div className="mt-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-3">
              <p className="font-heading font-bold text-lg">{creatorWins} — {opponentWins}</p>
              <p className="text-xs text-muted-foreground">
                {challenge.status === 'completed'
                  ? 'Series complete'
                  : totalGames ? `Game ${creatorWins + opponentWins + 1} of ${totalGames}` : `Game ${creatorWins + opponentWins + 1}`}
              </p>
              {challenge.status === 'completed' && challenge.winner_name && (
                <p className="text-sm text-accent font-semibold mt-1">🏆 {challenge.winner_name} wins the series</p>
              )}
            </div>
          )}

          {!isSeries && challenge.status === 'completed' && (
            <div className="mt-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-3">
              <p className="font-heading font-bold text-lg">{challenge.score_creator} - {challenge.score_opponent}</p>
              {challenge.winner_name && <p className="text-sm text-accent font-semibold">🏆 {challenge.winner_name} wins</p>}
              {challenge.caption && <p className="text-sm mt-2">{challenge.caption}</p>}
            </div>
          )}
        </div>

        {challenge.photos?.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-5">
            {challenge.photos.map((p, i) => <img key={i} src={p} alt="" className="rounded-2xl object-cover w-full h-32" />)}
          </div>
        )}

        {isSeries && games.length > 0 && (
          <div className="mb-5">
            <h3 className="font-heading font-bold mb-3">Games</h3>
            <div className="space-y-2">
              {games.map((g) => (
                <div key={g.id} className="bg-card rounded-2xl shadow-sm p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Game {g.game_number}</span>
                    {g.winner_name && <span className="text-xs font-bold text-accent">🏆 {g.winner_name}</span>}
                  </div>
                  <p className="font-heading font-bold mt-1">{g.score_creator} - {g.score_opponent}</p>
                  {g.caption && <p className="text-sm text-muted-foreground mt-1">{g.caption}</p>}
                  {g.photos?.length > 0 && (
                    <div className="grid grid-cols-3 gap-1.5 mt-2">
                      {g.photos.map((p, i) => <img key={i} src={p} alt="" className="rounded-lg object-cover w-full h-20" />)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {challenge.status === 'pending' && isOpponent && (
          <div className="flex gap-3">
            <Button onClick={() => respond('accepted')} className="flex-1 rounded-full h-12">Accept</Button>
            <Button onClick={() => respond('declined')} variant="secondary" className="flex-1 rounded-full h-12">Decline</Button>
          </div>
        )}
        {challenge.status === 'pending' && isCreator && (
          <p className="text-center text-sm text-muted-foreground">Waiting for {challenge.opponent_name} to respond...</p>
        )}
        {challenge.status === 'accepted' && (
          <Button onClick={() => setShowComplete(true)} className="w-full rounded-full h-12 bg-gradient-to-r from-[hsl(var(--accent))] to-[hsl(var(--secondary))]">
            {isSeries ? `Log Game ${creatorWins + opponentWins + 1}` : 'Complete Challenge'}
          </Button>
        )}
      </div>

      {challenge && (
        <>
          <CompleteChallengeSheet
            open={showComplete}
            onOpenChange={setShowComplete}
            challenge={challenge}
            user={user}
            onCompleted={() => {
              setShowComplete(false);
              load();
            }}
          />
          <ChallengeEditSheet
            open={showEdit}
            onOpenChange={setShowEdit}
            challenge={challenge}
            onSaved={(updated) => {
              setChallenge(updated);
              setShowEdit(false);
            }}
          />
        </>
      )}
    </div>
  );
}