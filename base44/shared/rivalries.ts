// Rivalry processing logic — called from recordGameResult after a challenge completes.
// Tracks head-to-head records between users and auto-activates rivalries when
// two users complete 6+ challenges against each other within a rolling 7-day window.

import { sendIfAllowed } from "./notifPrefs.ts";

const SPORT_EMOJI: Record<string, string> = {
  basketball: '🏀',
  golf: '⛳',
  pickleball: '🥒',
  darts: '🎯',
  disc_golf: '🥏',
  cornhole: '🌽',
  trivia: '🧠',
  chugging: '🍺',
  custom: '🏆',
};

const RIVALRY_THRESHOLD = 6; // more than 5 → activates at 6
const RIVALRY_WINDOW_DAYS = 7;

interface UserInfo {
  id: string;
  name: string;
}

function getSportDisplay(challenge: any): { label: string; emoji: string } {
  if (challenge.sport === 'custom') {
    return {
      label: challenge.custom_sport_name || 'Custom',
      emoji: challenge.custom_sport_emoji || '🏆',
    };
  }
  return {
    label: challenge.sport || 'Custom',
    emoji: SPORT_EMOJI[challenge.sport] || '🏆',
  };
}

function buildSummary(challenge: any, winnerId: string | null, isDraw: boolean, a: UserInfo, b: UserInfo): string {
  if (isDraw) return 'Draw';
  const winner = winnerId === a.id ? a.name : b.name;
  return `${winner} won`;
}

async function fetchUserAvatar(admin: any, userId: string): Promise<string> {
  try {
    const profiles = await admin.entities.Profile.filter({ created_by_id: userId });
    return profiles?.[0]?.avatar_url || '';
  } catch {
    return '';
  }
}

// Counts completed challenges between two users within the rolling 7-day window.
async function countRecentGames(admin: any, aId: string, bId: string): Promise<number> {
  const [aCreated, bCreated] = await Promise.all([
    admin.entities.Challenge.filter({ created_by_id: aId, status: 'completed' }),
    admin.entities.Challenge.filter({ created_by_id: bId, status: 'completed' }),
  ]);
  const between = [
    ...aCreated.filter((c: any) => c.opponent_id === bId || c.opponent_ids?.includes(bId)),
    ...bCreated.filter((c: any) => c.opponent_id === aId || c.opponent_ids?.includes(aId)),
  ];
  const cutoff = Date.now() - RIVALRY_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  return between.filter((c: any) => new Date(c.completed_at || c.updated_date).getTime() > cutoff).length;
}

async function updateRivalry(
  admin: any,
  userA: UserInfo,
  userB: UserInfo,
  challenge: any,
  winnerId: string | null,
  isDraw: boolean,
  completingUser: any,
) {
  // Canonical ordering: user_a_id is always the lexicographically smaller ID.
  const [a, b] = [userA, userB].sort((x, y) => x.id.localeCompare(y.id));
  const aWon = !isDraw && winnerId === a.id;
  const bWon = !isDraw && winnerId === b.id;
  const display = getSportDisplay(challenge);
  const summary = buildSummary(challenge, winnerId, isDraw, a, b);
  const now = new Date().toISOString();

  let existing = await admin.entities.Rivalry.filter({ user_a_id: a.id, user_b_id: b.id });
  let rivalry = existing[0];

  if (!rivalry) {
    // Fetch avatars for both users
    const [avatarA, avatarB] = await Promise.all([
      fetchUserAvatar(admin, a.id),
      fetchUserAvatar(admin, b.id),
    ]);
    rivalry = await admin.entities.Rivalry.create({
      user_a_id: a.id,
      user_b_id: b.id,
      user_a_name: a.name,
      user_b_name: b.name,
      user_a_avatar: avatarA,
      user_b_avatar: avatarB,
      user_a_wins: aWon ? 1 : 0,
      user_b_wins: bWon ? 1 : 0,
      total_games: 1,
      draws: isDraw ? 1 : 0,
      current_streak_user_id: isDraw ? null : winnerId,
      current_streak_count: isDraw ? 0 : 1,
      last_game_at: now,
      last_game_summary: summary,
      last_winner_id: winnerId || null,
      primary_sport: display.label,
      primary_sport_emoji: display.emoji,
      status: 'active',
    });
  } else {
    const newAWins = (rivalry.user_a_wins || 0) + (aWon ? 1 : 0);
    const newBWins = (rivalry.user_b_wins || 0) + (bWon ? 1 : 0);
    const newTotal = (rivalry.total_games || 0) + 1;
    const newDraws = (rivalry.draws || 0) + (isDraw ? 1 : 0);

    let streakUserId = rivalry.current_streak_user_id;
    let streakCount = rivalry.current_streak_count || 0;
    if (!isDraw) {
      if (streakUserId === winnerId) {
        streakCount++;
      } else {
        streakUserId = winnerId;
        streakCount = 1;
      }
    }

    // Refresh avatars if missing
    let avatarUpdates: any = {};
    if (!rivalry.user_a_avatar || !rivalry.user_b_avatar) {
      const [avatarA, avatarB] = await Promise.all([
        rivalry.user_a_avatar || fetchUserAvatar(admin, a.id),
        rivalry.user_b_avatar || fetchUserAvatar(admin, b.id),
      ]);
      avatarUpdates = { user_a_avatar: avatarA, user_b_avatar: avatarB };
    }

    await admin.entities.Rivalry.update(rivalry.id, {
      user_a_wins: newAWins,
      user_b_wins: newBWins,
      total_games: newTotal,
      draws: newDraws,
      current_streak_user_id: streakUserId,
      current_streak_count: streakCount,
      last_game_at: now,
      last_game_summary: summary,
      last_winner_id: winnerId || null,
      primary_sport: display.label,
      primary_sport_emoji: display.emoji,
      ...avatarUpdates,
    });

    rivalry = {
      ...rivalry,
      user_a_wins: newAWins,
      user_b_wins: newBWins,
      total_games: newTotal,
      draws: newDraws,
      current_streak_user_id: streakUserId,
      current_streak_count: streakCount,
    };

    // --- Lead change notification (active rivalries only) ---
    // Fires when the winner was behind or tied and now leads, or evened up
    // from behind — only for established rivalries with an announcement post.
    if (rivalry.announcement_post_id && !isDraw && winnerId) {
      const oldAWins = rivalry.user_a_wins ?? 0;
      const oldBWins = rivalry.user_b_wins ?? 0;
      const winnerIsA = winnerId === a.id;
      const winnerIsB = winnerId === b.id;
      const tookLead =
        (winnerIsA && oldAWins <= oldBWins && newAWins > newBWins) ||
        (winnerIsB && oldBWins <= oldAWins && newBWins > newAWins);
      const evenedUp =
        (winnerIsA && oldAWins < oldBWins && newAWins === newBWins) ||
        (winnerIsB && oldBWins < oldAWins && newBWins === newAWins);

      if (tookLead || evenedUp) {
        const mover = winnerIsA ? a : b;
        const other = winnerIsA ? b : a;
        const moverWins = winnerIsA ? newAWins : newBWins;
        const otherWins = winnerIsA ? newAWins : newBWins;
        const rivalLink = `/rivalry/${rivalry.id}`;
        const headline = tookLead
          ? `📈 ${mover.name} took the lead!`
          : `📈 ${mover.name} evened it up!`;
        const body = `${mover.name} ${moverWins} — ${other.name} ${otherWins}. The rivalry just shifted.`;
        await Promise.all([
          sendIfAllowed(admin, {
            user_id: mover.id,
            type: "rivalry_lead_change",
            actor_name: other.name,
            title: `You moved up on ${other.name}!`,
            body,
            link: rivalLink,
          }),
          sendIfAllowed(admin, {
            user_id: other.id,
            type: "rivalry_lead_change",
            actor_name: mover.name,
            title: headline,
            body,
            link: rivalLink,
          }),
        ]);
      }
    }
  }

  // --- Rivalry activation: 6+ completed games in 7 days ---
  if (!rivalry.announcement_post_id) {
    const recentCount = await countRecentGames(admin, a.id, b.id);
    if (recentCount >= RIVALRY_THRESHOLD) {
      const authorName = completingUser?.full_name || a.name;
      const body = `⚔️ RIVALRY ALERT\n\n${a.name} and ${b.name} have played ${rivalry.total_games} games against each other.\n\n${a.name}: ${rivalry.user_a_wins} Wins\n${b.name}: ${rivalry.user_b_wins} Wins\n\n🔥 LET THE RIVALRY BEGIN`;

      const post = await admin.entities.Post.create({
        author_name: authorName,
        body,
        game_emoji: '⚔️',
        sport_label: display.label,
        score_text: `${a.name} ${rivalry.user_a_wins} — ${b.name} ${rivalry.user_b_wins}`,
        tagged_user_ids: [a.id, b.id],
        tagged_user_names: [a.name, b.name],
        post_type: 'rivalry_announcement',
        rivalry_id: rivalry.id,
      });

      await admin.entities.Rivalry.update(rivalry.id, {
        announcement_post_id: post.id,
        activated_at: now,
      });

      // Notify both users that a new rivalry has been activated.
      const rivalLink = `/rivalry/${rivalry.id}`;
      await Promise.all([
        sendIfAllowed(admin, {
          user_id: a.id,
          type: "rivalry_activated",
          actor_name: b.name,
          title: `⚔️ New rivalry with ${b.name}!`,
          body: `You've played ${rivalry.total_games} games. The rivalry is official.`,
          link: rivalLink,
        }),
        sendIfAllowed(admin, {
          user_id: b.id,
          type: "rivalry_activated",
          actor_name: a.name,
          title: `⚔️ New rivalry with ${a.name}!`,
          body: `You've played ${rivalry.total_games} games. The rivalry is official.`,
          link: rivalLink,
        }),
      ]);
    }
  }

  // --- Rivalry win: formal series conclusion ---
  // When a series challenge (bo3/bo5/bo7) completes between rivals with an active
  // rivalry, the series winner gets +1 rivalries_won on their UserStats.
  if (challenge.series_type && challenge.series_type !== 'single' && challenge.series_type !== 'open' && winnerId && rivalry.announcement_post_id) {
    try {
      const statsList = await admin.entities.UserStats.filter({ created_by_id: winnerId });
      const stats = statsList[0];
      if (stats) {
        await admin.entities.UserStats.update(stats.id, {
          rivalries_won: (stats.rivalries_won || 0) + 1,
        });
      }
    } catch {
      // Best-effort
    }
  }
}

// Main entry point — called from recordGameResult after challenge completion.
// Processes a rivalry update for each (creator, opponent) pair in the challenge.
export async function processRivalries(
  admin: any,
  challenge: any,
  winnerId: string | null,
  isDraw: boolean,
  completingUser: any,
): Promise<void> {
  const opponentIds = challenge.opponent_ids?.length
    ? challenge.opponent_ids
    : challenge.opponent_id
      ? [challenge.opponent_id]
      : [];
  const opponentNames = challenge.opponent_names?.length
    ? challenge.opponent_names
    : challenge.opponent_name
      ? [challenge.opponent_name]
      : [];

  const creator = { id: challenge.created_by_id, name: challenge.creator_name };
  if (!creator.id || !creator.name) return;

  for (let i = 0; i < opponentIds.length; i++) {
    const opp = { id: opponentIds[i], name: opponentNames[i] || '' };
    if (!opp.id || !opp.name) continue;
    // Skip if opponent is the same as creator (shouldn't happen, but guard)
    if (opp.id === creator.id) continue;
    try {
      await updateRivalry(admin, creator, opp, challenge, winnerId, isDraw, completingUser);
    } catch {
      // Best-effort per pair — continue processing other pairs
    }
  }
}