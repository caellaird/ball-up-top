import React, { useEffect, useState } from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';
import { MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { SPORT_EMOJI } from '@/lib/constants';
import { sendNotification } from '@/lib/notify';
import CompleteChallengeSheet from '@/components/challenges/CompleteChallengeSheet';

export default function ChallengeDetail() {
  const { id } = useParams();
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState(null);
  const [showComplete, setShowComplete] = useState(false);

  useEffect(() => {
    base44.entities.Challenge.get(id).then(setChallenge);
  }, [id]);

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

  return (
    <div>
      <Header title="Challenge" />
      <div className="p-4">
        <div className="bg-card rounded-3xl shadow-sm p-5 mb-5 text-center">
          <span className="text-4xl">{SPORT_EMOJI[challenge.sport] || '🏆'}</span>
          <h1 className="font-heading text-xl font-bold mt-2">{challenge.creator_name} vs {challenge.opponent_name}</h1>
          <p className="text-sm text-muted-foreground capitalize mt-1">{challenge.sport?.replace('_', ' ')} · {challenge.series_type}</p>

          <div className="flex justify-center gap-4 text-sm text-muted-foreground mt-3">
            {challenge.location_name && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{challenge.location_name}</span>}
            {challenge.scheduled_time && <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{format(new Date(challenge.scheduled_time), 'MMM d, h:mm a')}</span>}
          </div>

          {challenge.status === 'completed' && (
            <div className="mt-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-3">
              <p className="font-heading font-bold text-lg">{challenge.score_creator} - {challenge.score_opponent}</p>
              {challenge.winner_name && <p className="text-sm text-accent font-semibold">🏆 {challenge.winner_name} wins</p>}
              {challenge.caption && <p className="text-sm mt-2">{challenge.caption}</p>}
            </div>
          )}
        </div>

        {challenge.photos?.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-5">
            {challenge.photos.map((p) => <img key={p} src={p} alt="" className="rounded-2xl object-cover w-full h-32" />)}
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
            Complete Challenge
          </Button>
        )}
      </div>

      {challenge && (
        <CompleteChallengeSheet
          open={showComplete}
          onOpenChange={setShowComplete}
          challenge={challenge}
          user={user}
          onCompleted={(updated) => {
            setChallenge(updated);
            setShowComplete(false);
            navigate(`/challenges/${id}`);
          }}
        />
      )}
    </div>
  );
}