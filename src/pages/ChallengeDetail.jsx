import React, { useEffect, useState } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ChallengeDetail() {
  const { id } = useParams();
  const { user } = useOutletContext();
  const [challenge, setChallenge] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [myParticipant, setMyParticipant] = useState(null);
  const [scoreInput, setScoreInput] = useState('');

  useEffect(() => {
    load();
  }, [id]);

  const load = async () => {
    const c = await base44.entities.Challenge.get(id);
    setChallenge(c);
    const p = await base44.entities.ChallengeParticipant.filter({ challenge_id: id }, '-score');
    setParticipants(p);
    setMyParticipant(p.find((x) => x.created_by_id === user.id) || null);
  };

  const join = async () => {
    const p = await base44.entities.ChallengeParticipant.create({ challenge_id: id, user_name: user.full_name });
    setParticipants([...participants, p]);
    setMyParticipant(p);
  };

  const logScore = async () => {
    const score = Number(scoreInput);
    if (Number.isNaN(score)) return;
    const updated = await base44.entities.ChallengeParticipant.update(myParticipant.id, { score });
    setParticipants(participants.map((p) => (p.id === updated.id ? updated : p)));
    setMyParticipant(updated);
    setScoreInput('');
  };

  const completeChallenge = async () => {
    const winner = [...participants].sort((a, b) => b.score - a.score)[0];
    const updated = await base44.entities.Challenge.update(id, { status: 'completed', winner_name: winner?.user_name });
    setChallenge(updated);
  };

  if (!challenge) return <div className="text-center text-muted-foreground py-10">Loading challenge...</div>;

  const isCreator = challenge.created_by_id === user.id;

  return (
    <div>
      <h1 className="font-heading text-2xl mb-2">{challenge.title}</h1>
      <p className="text-sm text-muted-foreground mb-4">{challenge.type.replace('_', ' ')} · {challenge.status}</p>
      {challenge.description && <p className="text-sm mb-4">{challenge.description}</p>}
      {challenge.winner_name && <p className="text-sm font-semibold text-primary mb-4">🏆 Winner: {challenge.winner_name}</p>}

      {!myParticipant && challenge.status === 'active' && <Button onClick={join} className="rounded-full mb-6">Join Challenge</Button>}
      {myParticipant && challenge.status === 'active' && (
        <div className="flex gap-2 mb-6">
          <Input type="number" placeholder="Your score" value={scoreInput} onChange={(e) => setScoreInput(e.target.value)} />
          <Button onClick={logScore}>Log Score</Button>
        </div>
      )}
      {isCreator && challenge.status === 'active' && (
        <Button onClick={completeChallenge} variant="secondary" className="rounded-full mb-6">Complete Challenge</Button>
      )}

      <h3 className="font-semibold mb-3">Standings</h3>
      <div className="space-y-2">
        {participants.map((p, i) => (
          <div key={p.id} className="flex items-center justify-between text-sm bg-muted rounded-lg px-3 py-2">
            <span>#{i + 1} {p.user_name}</span>
            <span className="font-semibold">{p.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}