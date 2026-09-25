import { differenceInCalendarDays } from 'date-fns';

// Calendar-day grace window a pending challenge stays visible after its
// scheduled date. Day 0 = scheduled day, day 3 = last grace day,
// day 4+ = expired/hidden.
const PENDING_GRACE_DAYS = 3;

// A pending challenge is expired once its scheduled date has passed by MORE
// than 3 calendar days, evaluated in the viewer's local timezone so it rolls
// over at midnight, not at an arbitrary UTC instant. Challenges without a
// scheduled date never auto-expire, and only `pending` challenges are affected.
export function isPendingChallengeExpired(challenge) {
  if (!challenge || challenge.status !== 'pending' || !challenge.scheduled_time) return false;
  const daysPast = differenceInCalendarDays(new Date(), new Date(challenge.scheduled_time));
  return daysPast > PENDING_GRACE_DAYS;
}