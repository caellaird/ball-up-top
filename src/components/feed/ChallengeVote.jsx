import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Trophy } from 'lucide-react';

export default function ChallengeVote({ post, userId }) {
  const [challenge, setChallenge] = useState(null);
  const [votes, setVotes] = useState([]);

  const creatorId = post.created_by_id;
  const creatorName = post.author_name;
  const opponentId = post.tagged_user_ids?.[0];
  const opponentName = post.tagged_user_names?.[0];

  useEffect(() => {
    load();
  }, [post.id]);

  const load = async () => {
    try {
      const c = await base44.entities.Challenge.get(post.challenge_id);
      setChallenge(c);
    } catch { /* challenge may be deleted */ }
    const v = await base44.entities.Vote.filter({ post_id: post.id });
    setVotes(v);
  };

  const vote = async (votedForId, votedForName) => {
    const existing = votes.find((v) => v.created_by_id === userId);
    if (existing) {
      if (existing.voted_for_id === votedForId) return;
      await base44.entities.Vote.update(existing.id, { voted_for_id: votedForId, voted_for_name: votedForName });
    } else {
      await base44.entities.Vote.create({
        post_id: post.id,
        challenge_id: post.challenge_id,
        voted_for_id: votedForId,
        voted_for_name: votedForName,
      });
    }
    load();
  };

  if (!opponentId || !opponentName) return null;

  const myVote = votes.find((v) => v.created_by_id === userId);
  const creatorVotes = votes.filter((v) => v.voted_for_id === creatorId).length;
  const opponentVotes = votes.filter((v) => v.voted_for_id === opponentId).length;
  const total = creatorVotes + opponentVotes;
  const creatorPct = total > 0 ? Math.round((creatorVotes / total) * 100) : 50;
  const opponentPct = total > 0 ? 100 - creatorPct : 50;
  const isCompleted = challenge?.status === 'completed';

  return (
    <div className="bg-card border border-border rounded-2xl p-3 mb-3">
      <div className="flex items-center gap-1.5 mb-3">
        <Trophy className="w-4 h-4 text-accent" />
        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {isCompleted ? 'Final Result' : 'Who takes the W?'}
        </span>
      </div>
      <div className="flex gap-2">
        <VoteButton
          name={creatorName}
          votes={creatorVotes}
          pct={creatorPct}
          selected={myVote?.voted_for_id === creatorId}
          won={isCompleted && challenge?.winner_id === creatorId}
          onClick={() => !isCompleted && vote(creatorId, creatorName)}
          disabled={isCompleted}
        />
        <VoteButton
          name={opponentName}
          votes={opponentVotes}
          pct={opponentPct}
          selected={myVote?.voted_for_id === opponentId}
          won={isCompleted && challenge?.winner_id === opponentId}
          onClick={() => !isCompleted && vote(opponentId, opponentName)}
          disabled={isCompleted}
        />
      </div>
      {isCompleted && myVote && (
        <p className="text-xs text-center mt-2 font-medium text-muted-foreground">
          {myVote.voted_for_id === challenge?.winner_id ? '✅ You called it!' : 'Better luck next time!'}
        </p>
      )}
    </div>
  );
}

function VoteButton({ name, votes, pct, selected, won, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 rounded-xl p-3 text-center transition active:scale-95 border-2 ${
        won
          ? 'bg-green-50 border-green-400'
          : selected
            ? 'bg-primary/10 border-primary'
            : 'bg-muted/50 border-transparent'
      } ${disabled ? 'cursor-default' : ''}`}
    >
      <p className="font-semibold text-xs truncate">{name}</p>
      <p className="font-heading text-lg font-bold">{pct}%</p>
      <p className="text-[10px] text-muted-foreground">{votes} vote{votes !== 1 ? 's' : ''}</p>
    </button>
  );
}