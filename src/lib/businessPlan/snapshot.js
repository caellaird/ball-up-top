import { base44 } from '@/api/base44Client';

const TRACKED = [
  { key: 'Post', label: 'Posts' },
  { key: 'Challenge', label: 'Challenges' },
  { key: 'Profile', label: 'Player profiles' },
  { key: 'League', label: 'Leagues' },
  { key: 'Thread', label: 'Conversations' },
  { key: 'Message', label: 'Messages' },
  { key: 'Comment', label: 'Comments' },
  { key: 'Rivalry', label: 'Rivalries' },
  { key: 'CityChallengeScore', label: 'Cities on the board' },
  { key: 'Notification', label: 'Notifications' },
];

// Live record counts for the appendix. Sequential and individually guarded so a
// single unavailable entity never fails the document, and so the platform rate
// limiter is never hit by a burst.
export async function loadPlanSnapshot() {
  const rows = [];
  for (const item of TRACKED) {
    try {
      const entity = base44.entities[item.key];
      if (!entity?.count) continue;
      const result = await entity.count({});
      const value = typeof result === 'number' ? result : result?.count;
      if (typeof value === 'number') {
        rows.push({ label: item.label, value: value.toLocaleString('en-US') });
      }
    } catch {
      // Skip entities the account cannot count.
    }
  }

  if (!rows.length) return null;

  return {
    rows,
    generatedAt: new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }),
  };
}