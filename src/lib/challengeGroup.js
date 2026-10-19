// Helpers for group (multiplayer) challenges. A "group" challenge is one with
// more than one opponent. Group challenges show a group name as their title and
// record a per-player score for each participant instead of a single 1v1 score.

export const isGroupChallenge = (challenge) => {
  if (!challenge) return false;
  const ids = challenge.opponent_ids?.length
    ? challenge.opponent_ids
    : (challenge.opponent_id ? [challenge.opponent_id] : []);
  return ids.length > 1;
};

// All participants (creator first), each with id + name.
export const getParticipants = (challenge) => {
  if (!challenge) return [];
  const ids = challenge.opponent_ids?.length
    ? challenge.opponent_ids
    : (challenge.opponent_id ? [challenge.opponent_id] : []);
  const names = challenge.opponent_names?.length
    ? challenge.opponent_names
    : (challenge.opponent_name ? [challenge.opponent_name] : []);
  const list = [
    { id: challenge.created_by_id, name: challenge.creator_name },
    ...ids.map((id, i) => ({ id, name: names[i] || '' })),
  ];
  return list.filter((p) => p.id && p.name);
};

// Title shown on cards / headers: the group name for group challenges,
// otherwise "Creator vs Opponent(s)".
export const getChallengeTitle = (challenge) => {
  if (challenge?.group_name) return challenge.group_name;
  const names = challenge.opponent_names?.length
    ? challenge.opponent_names
    : (challenge.opponent_name ? [challenge.opponent_name] : []);
  const opponentsLabel = names.join(', ');
  return `${challenge?.creator_name || ''} vs ${opponentsLabel}`;
};

// Per-player scores for a completed game/challenge, sorted highest-first.
// Returns [] when no per-player scores were recorded.
export const rankedScores = (participantScores, isDraw = false) => {
  if (!Array.isArray(participantScores) || participantScores.length === 0) return [];
  return [...participantScores].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
};