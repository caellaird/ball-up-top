import { STATE_NAMES } from './usStates.ts';

// Shared city/state completed-challenge tallying.
//
// Every completed challenge credits ONE count to each participant's saved home
// city and ONE count to their state — so two players from Durham, NC completing
// a challenge produce Durham +2 and North Carolina +2.
//
// Idempotency: a ChallengeLocationCredit row is written per (challenge, user)
// before any total changes. Re-processing the same completion skips the row's
// user, so retries, result edits and duplicate workflow runs never double-count.
//
// Consistency: if the state total can't be written after the city total was,
// the city total is rolled back and the credit row removed, so the next attempt
// re-applies both cleanly instead of leaving the two totals out of sync.

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Resolves a profile's saved city + state into the canonical keys used by the
// rankings. Returns empty keys when the profile has no usable location, so an
// incomplete profile never credits an invented or partial location.
export function resolveUserLocation(profile: any): {
  cityKey: string;
  cityDisplay: string;
  stateCode: string;
  stateName: string;
} {
  const rawCity = (profile?.city || '').toString().trim();
  const rawDisplay = (profile?.city_display || '').toString().trim();
  const parts = (rawDisplay || rawCity).split(',').map((s) => s.trim()).filter(Boolean);

  const cityName = (rawCity.split(',')[0] || parts[0] || '').trim();
  let stateCode = (profile?.state_code || '').toString().trim().toUpperCase();
  if (!stateCode) {
    const fromText = (parts[1] || '').toUpperCase();
    if (STATE_NAMES[fromText]) stateCode = fromText;
  }

  if (!cityName || !stateCode || !STATE_NAMES[stateCode]) {
    return { cityKey: '', cityDisplay: '', stateCode: '', stateName: '' };
  }

  const displayCity = titleCase(cityName);
  return {
    cityKey: `${displayCity.toLowerCase()}, ${stateCode.toLowerCase()}`,
    cityDisplay: `${displayCity}, ${stateCode}`,
    stateCode,
    stateName: STATE_NAMES[stateCode],
  };
}

async function incrementCity(admin: any, location: { cityKey: string; cityDisplay: string; stateCode: string; stateName: string }) {
  const rows = await admin.entities.CityChallengeScore.filter({ city_key: location.cityKey });
  const row = rows?.[0];
  if (!row) {
    return await admin.entities.CityChallengeScore.create({
      city_key: location.cityKey,
      city_display: location.cityDisplay,
      state_code: location.stateCode,
      state_name: location.stateName,
      completed_count: 1,
    });
  }
  return await admin.entities.CityChallengeScore.update(row.id, {
    city_display: location.cityDisplay,
    state_code: location.stateCode,
    state_name: location.stateName,
    completed_count: (row.completed_count || 0) + 1,
  });
}

async function incrementState(admin: any, location: { stateCode: string; stateName: string }) {
  const rows = await admin.entities.StateChallengeScore.filter({ state_code: location.stateCode });
  const row = rows?.[0];
  if (!row) {
    return await admin.entities.StateChallengeScore.create({
      state_code: location.stateCode,
      state_name: location.stateName,
      completed_count: 1,
    });
  }
  return await admin.entities.StateChallengeScore.update(row.id, {
    state_name: location.stateName,
    completed_count: (row.completed_count || 0) + 1,
  });
}

function participantIds(challenge: any): string[] {
  const ids = [
    challenge?.created_by_id,
    ...(challenge?.opponent_ids?.length
      ? challenge.opponent_ids
      : (challenge?.opponent_id ? [challenge.opponent_id] : [])),
  ].filter(Boolean);
  return Array.from(new Set(ids));
}

export async function creditChallengeParticipants(admin: any, challenge: any) {
  if (!challenge || challenge.status !== 'completed') {
    return { credited: 0, skipped: [], reason: 'not_completed' };
  }

  let credited = 0;
  const skipped: string[] = [];

  for (const userId of participantIds(challenge)) {
    let existing: any[] = [];
    try {
      existing = await admin.entities.ChallengeLocationCredit.filter({
        challenge_id: challenge.id,
        user_id: userId,
      });
    } catch {
      skipped.push(userId);
      continue;
    }
    if (existing?.length) {
      skipped.push(userId);
      continue;
    }

    const profiles = await admin.entities.Profile.filter({ created_by_id: userId });
    const location = resolveUserLocation(profiles?.[0]);
    if (!location.cityKey) {
      // No saved city/state — contribute nothing rather than guessing.
      skipped.push(userId);
      continue;
    }

    let creditId = '';
    try {
      const credit = await admin.entities.ChallengeLocationCredit.create({
        challenge_id: challenge.id,
        user_id: userId,
        city_key: location.cityKey,
        state_code: location.stateCode,
      });
      creditId = credit?.id || '';
    } catch {
      skipped.push(userId);
      continue;
    }

    // Concurrency guard: if another run wrote a credit for this same pair at the
    // same moment, keep the oldest row and drop this one.
    const after = await admin.entities.ChallengeLocationCredit.filter({
      challenge_id: challenge.id,
      user_id: userId,
    });
    if ((after?.length || 0) > 1) {
      await admin.entities.ChallengeLocationCredit.delete(creditId).catch(() => ({}));
      skipped.push(userId);
      continue;
    }

    let cityRow: any = null;
    try {
      cityRow = await incrementCity(admin, location);
      await incrementState(admin, location);
      credited += 1;
    } catch {
      if (cityRow?.id) {
        await admin.entities.CityChallengeScore.update(cityRow.id, {
          completed_count: Math.max((cityRow.completed_count || 1) - 1, 0),
        }).catch(() => ({}));
      }
      if (creditId) await admin.entities.ChallengeLocationCredit.delete(creditId).catch(() => ({}));
      skipped.push(userId);
    }
  }

  return { credited, skipped };
}