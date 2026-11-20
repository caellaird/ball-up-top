import React from 'react';
import { Link } from 'react-router-dom';
import { Swords } from 'lucide-react';

// Renders the merged "game summary" box for multiplayer (3+ player) competition
// posts: the game title row (with crossed-swords icon) sits above a ranked
// leaderboard of every player's score, all in one tinted rounded card.
export default function GroupGameSummary({ post }) {
  const scores = post.participant_scores || [];
  // The recorded winner is authoritative. Sports like golf and disc golf are
  // scored by fewest strokes, so the top of a plain descending sort is not
  // always the winner: rank in the direction the winner's own score implies.
  const winnerName = post.score_text?.includes('🏆') ? post.score_text.split('🏆').pop().trim() : '';
  const values = scores.map((s) => s.score ?? 0);
  const winnerScore = winnerName ? scores.find((s) => s.name === winnerName)?.score : undefined;
  const lowerWins = winnerScore !== undefined
    && winnerScore === Math.min(...values)
    && winnerScore !== Math.max(...values);
  const ranked = [...scores].sort((a, b) => (
    lowerWins ? (a.score ?? 0) - (b.score ?? 0) : (b.score ?? 0) - (a.score ?? 0)
  ));
  const isCrowned = (s, i) => (winnerName ? s.name === winnerName : i === 0);
  const challengeLink = post.challenge_id ? `/challenges/${post.challenge_id}` : null;
  const Wrapper = challengeLink ? Link : 'div';

  return (
    <Wrapper
      to={challengeLink || undefined}
      className={`block bg-primary/[0.06] rounded-2xl px-4 py-3 mb-2 ${challengeLink ? 'active:scale-[0.98] transition' : ''}`}
    >
      {post.score_text && (
        <div className="flex items-center justify-between mb-2">
          <span className="font-heading font-bold text-sm">{post.score_text}</span>
          <Swords className="w-4 h-4 text-muted-foreground shrink-0" />
        </div>
      )}
      <div className="space-y-1">
        {ranked.map((s, i) => (
          <div key={s.user_id || i} className="flex items-center justify-between text-sm">
            <span className={`truncate flex items-center gap-1.5 ${isCrowned(s, i) ? 'font-bold' : 'font-medium'}`}>
              {isCrowned(s, i) && <span className="leading-none">👑</span>}
              {s.name}
            </span>
            <span className="font-heading font-bold ml-2 shrink-0">{s.score}</span>
          </div>
        ))}
      </div>
    </Wrapper>
  );
}