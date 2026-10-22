import React, { forwardRef } from 'react';
import { LOGO_URL } from '@/lib/constants';
import { isGroupChallenge, getChallengeTitle } from '@/lib/challengeGroup';
import { getGroupWinCounts } from '@/lib/groupStandings';

// A branded, self-contained card rendered as a styled div. Uses inline styles
// for reliable html2canvas capture across light/dark themes. Visible on the
// challenge detail page so users can screenshot it; captured to a PNG for sharing.
const ResultShareCard = forwardRef(({ challenge, sportDisplay, creatorWins, opponentWins, games = [] }, ref) => {
  const isSeries = challenge.series_type !== 'single';
  const isDraw = challenge.is_draw;
  const isGroup = isGroupChallenge(challenge);
  const opponentNames = challenge.opponent_names?.length ? challenge.opponent_names : [challenge.opponent_name];
  const rankedScores = (challenge.participant_scores || []).slice().sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  // For group series, show each player's individual win count instead of the
  // aggregate "creator — opponents" series score (which is meaningless for 3+
  // players). For 1v1, keep the classic "wins - wins" series score.
  const groupWins = isGroup && isSeries ? getGroupWinCounts(challenge, games) : [];
  const scoreText = isSeries
    ? `${creatorWins} - ${opponentWins}`
    : (rankedScores.length > 0
        ? rankedScores.map((s) => `${s.score}`).join(' · ')
        : `${challenge.score_creator} - ${challenge.score_opponent}`);
  const subtitle = challenge.group_name || getChallengeTitle(challenge);

  return (
    <div ref={ref} style={{
      width: '100%',
      maxWidth: '340px',
      boxSizing: 'border-box',
      padding: '32px 24px',
      borderRadius: '28px',
      background: 'linear-gradient(135deg, #0EA5E9 0%, #EF4444 100%)',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      fontFamily: 'Inter, sans-serif',
      boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <img src={LOGO_URL} alt="Ball Up Top" crossOrigin="anonymous" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
        <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '18px', letterSpacing: '-0.02em' }}>Ball Up Top</span>
      </div>

      <div style={{ height: '1px', width: '100%', background: 'rgba(255,255,255,0.25)', margin: '16px 0 20px' }} />

      <span style={{ fontSize: '60px', lineHeight: 1, marginBottom: '6px' }}>{sportDisplay.emoji}</span>
      <span style={{ fontSize: '15px', fontWeight: 600, opacity: 0.9, marginBottom: '24px' }}>{sportDisplay.label}</span>

      {isDraw ? (
        <span style={{ fontSize: '15px', fontWeight: 700, opacity: 0.9, marginBottom: '4px' }}>🤝 Draw</span>
      ) : (
        <span style={{ fontSize: '13px', fontWeight: 600, opacity: 0.85, marginBottom: '4px' }}>👑 Winner</span>
      )}
      <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '26px', textAlign: 'center', marginBottom: '14px' }}>
        {isDraw ? 'Tied' : (challenge.winner_name || 'Result')}
      </span>

      {groupWins.length > 0 ? (
        <div style={{ width: '100%', marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', textAlign: 'left' }}>Series Wins</div>
          {groupWins.map((s, i) => (
            <div key={s.user_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', fontWeight: 600, opacity: 0.95, padding: '3px 0' }}>
              <span style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {i === 0 && s.wins > 0 && <span style={{ fontSize: '13px' }}>👑</span>}
                {s.name}
              </span>
              <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '16px' }}>{s.wins}</span>
            </div>
          ))}
        </div>
      ) : rankedScores.length > 0 && !isSeries ? (
        <div style={{ width: '100%', marginBottom: '12px' }}>
          {rankedScores.map((s) => (
            <div key={s.user_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 600, opacity: 0.95, padding: '2px 0' }}>
              <span style={{ textAlign: 'left' }}>{s.name}</span>
              <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700 }}>{s.score}</span>
            </div>
          ))}
        </div>
      ) : (
        <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '38px', marginBottom: '12px' }}>{scoreText}</span>
      )}

      <span style={{ fontSize: '13px', opacity: 0.85, textAlign: 'center' }}>
        {isGroup && challenge.group_name ? challenge.group_name : `${challenge.creator_name} vs ${opponentNames.join(', ')}`}
      </span>
    </div>
  );
});

ResultShareCard.displayName = 'ResultShareCard';
export default ResultShareCard;