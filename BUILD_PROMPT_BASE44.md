# BUILD_PROMPT_BASE44.md

## Ball Up Top — Complete Implementation Specification

> This document is a single, exhaustive implementation prompt for the Base44 platform to generate the Ball Up Top application from scratch in one generation. It functions simultaneously as a Product Requirements Document (PRD), Technical Design Document (TDD), System Architecture Specification, UI/UX Specification, Database Design, API Specification, Engineering Guide, and Deployment Guide. No placeholders. No summaries. Every ambiguity is resolved with an explicit, production-ready decision.

---

## 1. Product Vision

### Mission

Ball Up Top is the social home court for hoopers — a platform that fuses basketball culture, friendly competition, and community into a single daily ritual. The mission is to give every basketball player, captain, organizer, and fan a place to talk trash, back it up with stats, prove they know the game, and build real-world connections through challenges, games, and community.

### Brand Positioning

Ball Up Top positions itself as the authentic, culture-first basketball social network. It is not a stat-tracking utility, a league management tool, or a generic social network. It is the intersection of all three, wrapped in the language, energy, and ritual of pickup basketball culture. The brand voice is confident, playful, competitive, and knowledgeable — it speaks the language of the game without being exclusionary.

### Product Philosophy

1. **Daily Ritual First.** The product is built around a compulsive daily loop: open the app, answer the Daily Ball Knower question, fill out the Daily Grid, check leaderboards, talk trash in DMs and group chats, and challenge your friends. If a user opens the app once a day and completes the daily loop, the product has succeeded.
2. **Competition is Social.** Every feature has a competitive layer. Challenges, leaderboards, streaks, and trash talk are not features bolted onto a social network — they are the social network.
3. **Stats Back Up Talk.** Trash talk without stats is just noise. Ball Up Top lets players back up their talk with real numbers — win rates, streak counts, challenge records, and community rankings.
4. **Community is Local.** Basketball is inherently local — your court, your run, your city. Communities are geo-anchored and culturally specific.
5. **Frictionless Game Creation.** Finding a run, joining a game, or organizing a pickup session should take seconds, not a group text thread of 40 messages.

### Competitive Analysis

| Competitor | Strength | Gap Ball Up Top Fills |
|---|---|---|
| Strava | Activity tracking, social feed | Not basketball-specific, no trash talk culture, no daily trivia |
| ESPN / NBA apps | Pro content, stats | Passive consumption, no personal competition or social layer |
| TeamSnap / League apps | Team management | Utility-only, no culture, no daily engagement loop |
| Discord / GroupMe | Real-time chat | Generic, no basketball context, no stat-backed competition |
| Athletes / Hudl | Video highlights | Pro/amateur focus, expensive, no casual social layer |

Ball Up Top's differentiation: a daily engagement loop (Daily Ball Knower + Daily Grid + Leaderboards), stat-backed trash talk, basketball-native community structure, and a game discovery layer that connects digital competition to real-world pickup runs.

### Target Audience

- **Primary:** Basketball players aged 16–40, urban and suburban, who play pickup or organized ball 1–5 times per week and are active on social media.
- **Secondary:** Team captains and league organizers who need lightweight tools to manage runs, communicate with players, and track informal competition.
- **Tertiary:** Basketball fans and "ball knowers" who may not play regularly but follow the game closely and want to prove their basketball IQ through daily questions and predictions.
- **Quaternary:** Local basketball-adjacent businesses (sneaker shops, training facilities, courtside cafes) that want to reach the local hooper community.

### Success Metrics

| Metric | Target (Year 1) | Definition |
|---|---|---|
| DAU/MAU ratio | ≥ 0.45 | Daily active users divided by monthly active users |
| D1 Retention | ≥ 40% | Percentage of new users who return on day 1 |
| D7 Retention | ≥ 25% | Percentage of new users who return on day 7 |
| D30 Retention | ≥ 15% | Percentage of new users who return on day 30 |
| Daily Loop Completion | ≥ 60% of DAU | Percentage of daily active users who complete Daily Ball Knower + Daily Grid |
| Challenge Participation | ≥ 30% of DAU | Percentage of daily active users who participate in or complete a challenge daily |
| Messages Sent per DAU | ≥ 5 | Average messages sent per daily active user |
| Game Creation Rate | ≥ 0.5 games per 100 DAU | Games created per day normalized by DAU |
| Community Membership | ≥ 70% of MAU | Percentage of monthly active users who are a member of at least one community |
| Notification Opt-in | ≥ 55% | Percentage of users who enable push notifications |

### User Value Proposition

"Ball Up Top is where you prove you're the best on your court. Answer daily basketball trivia, back up your trash talk with stats, challenge your friends, find a run, and build your reputation in your local basketball community — every single day."

---

## 2. User Personas

### 2.1 Casual Player — "Marcus, 24"

- **Profile:** Plays pickup 2–3 times a week at the local YMCA. Follows the NBA casually. Uses Instagram and group chats to organize runs.
- **Goals:** Find a run quickly without texting 10 people. Talk a little trash with friends. Feel connected to the local basketball scene.
- **Frustrations:** Group texts are chaotic. Hard to know who's actually showing up. No easy way to settle "who's better" debates.
- **Daily Workflow:** Opens app at lunch. Checks Daily Ball Knower. Skims the feed. Checks if any games are posted near him. Sends a couple DMs. Maybe joins a challenge.
- **Primary Actions:** Answer Daily Ball Knower, browse feed, join a game, send DMs, check leaderboard rank.
- **Success Criteria:** Finds a run within 2 minutes of opening the app. Answers the daily question. Feels a sense of belonging to his court community.

### 2.2 Team Captain — "Jasmine, 28"

- **Profile:** Captains a women's rec league team. Organizes weekly practices and game schedules. Competitive but organized.
- **Goals:** Manage team communication in one place. Track who's available for games. Build team chemistry through shared challenges.
- **Frustrations:** Players don't check group chats. Availability is a mystery until game time. No way to track informal team stats.
- **Daily Workflow:** Opens app in the morning. Posts a team availability poll in the team group chat. Checks challenge leaderboard to see which teammates are active. Reviews the Daily Grid for team discussion topics.
- **Primary Actions:** Create/manage team, send group messages, create challenges, post in community feed, track team stats.
- **Success Criteria:** 90% of roster responds to availability within 24 hours. Team challenge participation ≥ 75%.

### 2.3 League Organizer — "Derek, 35"

- **Profile:** Runs a 16-team summer league at the park. Handles scheduling, communication, and disputes. Volunteered because nobody else would.
- **Goals:** Streamline league communication. Post schedules and standings. Resolve disputes fairly. Keep players engaged between games.
- **Frustrations:** Scheduling is a nightmare. Disputes escalate in group chats. Engagement drops between game days. No central record of league activity.
- **Daily Workflow:** Opens app in the evening. Posts schedule updates to the league community. Reviews reports/moderation queue. Checks leaderboard to verify stats. Sends a league-wide notification about the next game day.
- **Primary Actions:** Create/manage community, post announcements, manage schedule, moderate content, view admin dashboard, send notifications.
- **Success Criteria:** Schedule disputes reduced by 50%. Community engagement on non-game days up 30%. All reports resolved within 48 hours.

### 2.4 Trash Talker — "Devon, 21"

- **Profile:** The loudest player at the run. Backs up talk with game, but also loves the verbal warfare. Social media native.
- **Goals:** Talk trash and have receipts. Prove superiority through challenges and stats. Get reactions from the community.
- **Frustrations:** Trash talk in group chats disappears. No way to prove a win streak. People forget the great lines.
- **Daily Workflow:** Opens app after a run. Posts a trash-talk clip/photo to the feed. Tags rivals in a challenge. Checks DMs for responses. Reviews his trophy case. Answers the Daily Ball Knower to prove IQ.
- **Primary Actions:** Post media to feed, create/tag challenges, send DMs, check trophy case, comment on posts.
- **Success Criteria:** Posts at least 3x per week. Wins ≥ 60% of challenges entered. Trophy case grows monthly.

### 2.5 Statistician — "Priya, 30"

- **Profile:** Data-driven player who tracks everything. Spreadsheet lover. Wants the app to be the source of truth for her basketball life.
- **Goals:** Track personal and team stats over time. Identify trends. Back up arguments with data.
- **Frustrations:** No basketball app combines social and stats well. Manual tracking is tedious. Existing stat apps are ugly and clunky.
- **Daily Workflow:** Opens app after every game. Logs game results and stats. Reviews trends on profile. Checks community and league leaderboards. Exports/shares stat highlights.
- **Primary Actions:** Log game results, view statistics, check leaderboards, view profile trends, share stat cards.
- **Success Criteria:** Logs 100% of games played. Can view trend data across a full season. Stats are accurate and verifiable.

### 2.6 Ball Knower — "Tony, 45"

- **Profile:** Former player, current coach and basketball junkie. Knows every stat, every player, every play. Doesn't play pickup anymore but lives for the discourse.
- **Goals:** Prove basketball IQ daily. Engage in basketball discourse. Earn reputation as a top ball knower.
- **Frustrations:** NBA Twitter is toxic. No structured way to test and rank basketball knowledge. Casual fans don't respect real knowledge.
- **Daily Workflow:** Opens app first thing in the morning. Answers Daily Ball Knower immediately. Checks the Daily Grid. Comments on feed posts with analysis. Checks his ball knower leaderboard rank. DMs with fellow knowers.
- **Primary Actions:** Answer Daily Ball Knower, fill Daily Grid, comment on posts, check ball knower leaderboard, DM.
- **Success Criteria:** Top 1% on the Ball Knower leaderboard. Daily streak ≥ 30 days. High engagement on analytical comments.

### 2.7 Community Moderator — "Aisha, 27"

- **Profile:** Runs the largest women's basketball community in the city. Trusted, fair, and active. Volunteers to keep the community healthy.
- **Goals:** Keep the community safe and active. Surface great content. Remove spam and toxicity. Grow membership.
- **Frustrations:** Toxic users ruin the vibe. Spam posts clutter the feed. No good tools to moderate at scale. Hard to identify great content to pin.
- **Daily Workflow:** Opens app multiple times daily. Reviews the moderation queue. Pins great posts. Removes/hides rule-breaking content. Warns or bans repeat offenders. Posts a daily community prompt.
- **Primary Actions:** Review moderation queue, pin/hide/delete posts, warn/ban users, post community prompts, manage community settings.
- **Success Criteria:** Moderation queue cleared daily. Community growth ≥ 5% per month. Report resolution time < 24 hours.

### 2.8 Local Business Partner — "Carlos, 40"

- **Profile:** Owns a sneaker shop near the main downtown courts. Sponsors a weekly run. Wants to reach hoopers authentically.
- **Goals:** Promote the shop to local hoopers without being spammy. Sponsor challenges and games. Build goodwill in the community.
- **Frustrations:** Facebook/Instagram ads don't reach the right audience. No way to sponsor local basketball events. Word of mouth is slow.
- **Daily Workflow:** Opens app weekly. Checks sponsored challenge performance. Posts a shop promotion to the community. Reviews engagement metrics. Sponsors an upcoming game or challenge.
- **Primary Actions:** Create sponsored posts, sponsor challenges/games, view engagement analytics, manage business profile.
- **Success Criteria:** Reach 1,000+ local hoopers per month via sponsored content. Convert ≥ 5% to store visits.

---

## 3. Functional Requirements

### 3.1 Social Feed

- A reverse-chronological, algorithmically-boosted feed of posts from communities, teams, and friends the user follows.
- Post types: text, image, video, stat card, challenge result, game recap, trash talk, poll.
- Each post supports likes, comments, shares (to DM or community), and bookmarks.
- Algorithm boosts: recency, engagement velocity, relationship proximity, challenge result significance, streak milestones.
- Feed supports infinite scroll with cursor-based pagination (limit 20, cursor = last post's `feed_score` + `created_date`).
- Feed filters: All, Communities, Friends, Teams, Challenges, Trash Talk.
- Users can compose posts with a rich composer supporting text, media upload (up to 4 images or 1 video ≤ 60s), stat card embed, challenge tag, game tag, community tag, and mention (@user) and hashtag (#topic) support.
- Posts can be pinned by community moderators.
- Posts reportable; reports enter moderation queue.

### 3.2 Communities

- Communities are geo-anchored or interest-based groups (e.g., "Downtown Run", "Women's Hoops NYC", "Over 35 League").
- Community fields: name, slug, description, type (public, private, invite-only), category, location (lat/lng + city), banner image, avatar image, member count, rules, created_by, created_date.
- Public communities are discoverable and joinable by anyone. Private communities are discoverable but require approval to join. Invite-only communities are not discoverable and require an invite link.
- Community features: feed, members list, leaderboards, challenges, games, group chat, settings, moderation tools.
- Community roles: Owner, Admin, Moderator, Member, Business Partner.
- Community settings: name, description, avatar, banner, rules, category, location, privacy type, join approval (auto/manual), member permissions (who can post, create challenges, create games).

### 3.3 Teams

- Teams are persistent groups of players that compete together in challenges, games, and leagues.
- Team fields: name, slug, sport, description, avatar, banner, home court location, captain (user), roster (users with roles), created_by, created_date.
- Team roster roles: Captain, Co-Captain, Player.
- Team features: team feed, roster management, team group chat, team challenges, team stats, team leaderboard rank.
- Captains can invite players, set lineup, create team challenges, and manage team settings.
- Teams can be associated with a community (optional) and participate in community leaderboards.

### 3.4 Challenges

- Challenges are competitive tasks with a defined goal, timeframe, and scoring mechanism.
- Challenge types:
  - **Head-to-Head:** Two players or teams compete directly (e.g., "First to 21", "3-point shootout").
  - **Group Challenge:** Multiple participants compete simultaneously (e.g., "Most games played this week").
  - **Streak Challenge:** Participants maintain a streak (e.g., "Play 5 days in a row").
  - **Skill Challenge:** A specific skill task (e.g., "Make 50 free throws in a row").
  - **Trash Talk Challenge:** A wager-based challenge where the loser must post a concession (e.g., "Loser changes profile pic to opponent's team logo for 24h").
- Challenge fields: title, description, type, sport, creator, participants, start_date, end_date, status (draft, active, completed, cancelled), rules, wager (optional), winner(s), scores, created_date.
- Challenges can be public (discoverable), private (invite-only), or community-scoped.
- Challenge lifecycle: created → active (participants joined) → in progress (scores being logged) → completed (winner determined) → archived.
- Winners are determined by highest score, first to threshold, or moderator adjudication depending on type.
- Completed challenges update participant stats, trophy cases, and leaderboards.

### 3.5 Daily Questions (Daily Ball Knower)

- A single basketball trivia question published every day at 6:00 AM local time (user's timezone).
- Questions are multiple choice (4 options) with one correct answer.
- Question categories: NBA History, Current NBA, College Hoops, International, Rules & Officiating, Basketball Culture, Player Trivia, Statistical Records.
- Difficulty tiers: Easy, Medium, Hard. The daily question rotates difficulty in a weekly pattern (M=Easy, T=Medium, W=Hard, T=Medium, F=Easy, S=Hard, S=Hard).
- Users earn Ball Knower Points for correct answers: Easy=10, Medium=20, Hard=30. Streak bonuses: 3-day streak +5, 7-day streak +10, 30-day streak +25.
- After answering, the user sees: correct/incorrect, the answer explanation, the percentage of users who chose each option, and their updated Ball Knower rank.
- Questions are generated by AI (see Section 13) and reviewed/curated before publication.
- Users can see their question history and streak on their profile.

### 3.6 Daily Grid

- A 3×3 grid of basketball-themed prompts/squares published daily alongside the Daily Ball Knower.
- Each square contains a prompt like: "Post a clip of your best move today", "Tag someone who owes you a rematch", "Share your game score from today", "Rate today's NBA games", "Who's the most underrated player in your community?".
- Users complete squares by posting to the feed with the grid square tagged, or by performing the action (tag, rate, share).
- Completing a square awards Grid Points. Completing all 9 (a full grid) awards a bonus and a "Perfect Grid" badge for the day.
- Grid completion is displayed on the profile as a calendar heatmap.
- Grids are themed weekly (e.g., "Playoff Week", "Streetball Week", "Rivalry Week").

### 3.7 Sprint Mode

- A fast-paced, time-limited competition mode where users race to complete a set of basketball-related micro-tasks.
- A Sprint is a 60-second session containing 5–10 rapid-fire tasks: trivia questions, quick predictions, stat comparisons, "who said it" quotes, photo challenges.
- Sprints can be solo (beat your own time/score) or head-to-head (race a friend in real-time).
- Sprint scores contribute to a weekly Sprint Leaderboard.
- Sprint Mode features: daily sprint, head-to-head sprint, community sprint, sprint streaks.
- Sprints are designed for high replayability and are the primary vehicle for quick engagement when a user has only 1–2 minutes.

### 3.8 Leaderboards

- Multiple leaderboard types:
  - **Global Ball Knower Leaderboard:** Ranked by total Ball Knower Points. Resets monthly with an all-time leaderboard preserved.
  - **Community Leaderboards:** Ranked by points earned within a community (challenges, posts, games, daily questions).
  - **Challenge Leaderboards:** Ranked by wins/win rate within a specific challenge type or community.
  - **Streak Leaderboards:** Ranked by current and longest daily streaks.
  - **Sprint Leaderboards:** Ranked by weekly sprint scores.
  - **Game Stats Leaderboards:** Ranked by games won, points scored, win rate (filterable by community, sport, timeframe).
  - **Grid Leaderboards:** Ranked by daily grid completion and total grid points.
- Leaderboards support: top 100 visible, user's rank always visible, rank change indicators (up/down/flat), timeframe filters (daily, weekly, monthly, all-time), friend filter.
- Leaderboards update in real-time via Supabase Realtime subscriptions.

### 3.9 Direct Messages (DMs)

- One-to-one encrypted-in-transit messaging between users who are friends or have mutually enabled DMs.
- Message types: text, image, video, voice note, stat card embed, challenge invite, game invite, post share, profile share.
- Features: read receipts (optional), typing indicators, message reactions, reply-to-message, edit (within 5 minutes), delete (soft delete, shows "message deleted"), message search within a conversation.
- DM list sorted by most recent message. Unread badge counts.
- Users can block other users from DMing them. Blocked users cannot send messages, view profiles, or see the blocker's content.

### 3.10 Group Chats

- Multi-user messaging within a thread. Created for teams, communities, or ad-hoc groups.
- Group chat fields: name, avatar, description, members (users), admins (users), type (team, community, custom), created_by, created_date.
- Features: all DM features plus: member management (add/remove), admin promotion, group settings, pinned messages, mentions (@user, @all), message search, mute notifications, leave group.
- Team and community group chats are auto-created with the entity and sync membership automatically.
- Group chats support up to 200 members.

### 3.11 Friends

- Bidirectional friend relationships. A friend request must be accepted to establish the connection.
- Friend features: friend list, friend requests (incoming/outgoing), suggested friends (AI-recommended based on mutual friends, communities, games, location), remove friend, block user.
- Friends can see each other's feed posts (subject to privacy settings), challenge each other, invite to games, and DM (subject to DM settings).
- Friend activity is surfaced in the notifications feed and a "Friends Activity" section.

### 3.12 Notifications

- Notification types: like, comment, friend request, friend accept, challenge invite, challenge result, game invite, game update, daily ball knower (push), daily grid (push), achievement unlock, leaderboard rank change, mention, group message, DM, community announcement, streak reminder, streak milestone, trash talk received.
- Delivery channels: in-app (bell icon + dropdown), push (FCM), email (Resend, for digests and critical events only).
- Notification settings: per-type toggles for push and email. Global quiet hours (user-configurable time window).
- Notifications are grouped by type when multiple of the same type arrive within a short window (e.g., "3 users liked your post").
- In-app notification dropdown shows latest 20; full list on a dedicated notifications page with mark-all-read and filter-by-type.

### 3.13 Trophy Case

- A visual showcase of a user's earned achievements, challenge victories, and milestone badges.
- Trophy case is displayed on the user's profile and is visible to other users (subject to privacy).
- Trophies are categorized: Challenges, Streaks, Ball Knower, Grid, Games, Community, Special.
- Each trophy displays: icon, title, description, date earned, rarity (percentage of users who have it).
- Trophies are earned automatically based on defined triggers (see Section 13 and Database Schema).

### 3.14 Player Profiles

- User profile fields: avatar, banner, display name, username (slug), bio, location, favorite team, favorite player, position, height, skill level (self-rated 1–10), joined date, privacy level (public, friends-only, private).
- Profile sections: stats summary, trophy case, recent posts, challenge history, game history, ball knower streak/calendar, grid calendar heatmap, friends list, communities, teams.
- Profile stats: games played, games won, win rate, total points scored, challenge wins, challenge win rate, current ball knower streak, longest ball knower streak, ball knower rank, grid completion rate, total grid points, sprint high score, community rankings.
- Profile is the user's "basketball card" — a shareable, downloadable stat card image.

### 3.15 Achievements

- A system of badges/trophies earned by completing specific milestones.
- Achievement categories and examples:
  - **Streaks:** 3-day, 7-day, 30-day, 100-day, 365-day Ball Knower streak.
  - **Challenges:** First Win, 10 Wins, 50 Wins, 100 Wins, Undefeated (10-0), Comeback King (win after being down).
  - **Games:** First Game, 50 Games, 100 Games, 500 Games, Sharpshooter (100 3-pointers logged), Double-Double, Triple-Double.
  - **Ball Knower:** 100 Correct, 500 Correct, 1000 Correct, Perfect Week (7/7), Perfect Month (30/30 or adjusted).
  - **Grid:** First Grid, Perfect Grid (all 9), 7 Perfect Grids in a Row, 30 Perfect Grids.
  - **Community:** First Post, 100 Posts, 1000 Likes Received, Community Leader (top 3 in community), Verified Baller.
  - **Social:** First Friend, 50 Friends, 100 Friends, Social Butterfly (post every day for a week).
  - **Special:** Founding Member (joined in first 1000 users), Beta Tester, Tournament Champion, Season MVP.
- Achievements trigger notifications and update the trophy case automatically.

### 3.16 Game Creation

- A "game" is a pickup or organized basketball session that users can create, discover, and join.
- Game fields: title, sport (always basketball by default, extensible), type (pickup, full-court 5v5, half-court 3v3, 1v1, organized/scrimmage), location (court name + lat/lng + address), date/time, duration, max players, current players, skill level, cost (free/paid + amount), description, creator, status (open, full, started, completed, cancelled), created_date.
- Game creation flow: select type → set location (map picker or saved court) → set date/time → set player count and skill level → add description → set cost → publish.
- Games can be public (discoverable), private (invite-only), or community-scoped.
- Game creator is the organizer and can: edit game details, invite players, approve join requests, remove players, start the game, log results, cancel the game.
- Once a game is "started," the creator can log the result: winning team, final score, individual stats (optional), player of the game.
- Logging a game result updates all participants' stats, leaderboards, and may trigger achievements.

### 3.17 Game Discovery

- A map-based and list-based discovery interface for finding nearby games.
- Discovery features: map view with game pins (color-coded by type/status), list view sorted by distance/start time, filters (type, skill level, distance radius, date range, free/paid, full/not-full), search by court name or location.
- Each game card shows: title, type, location, distance, date/time, player count (x/max), skill level, cost, creator avatar.
- Users can tap a game to view details and join (if public) or request to join (if private/community).
- Saved/favorite courts for quick game creation and discovery.

### 3.18 Invitations

- Invitation types: friend request, challenge invite, game invite, community invite, team invite, group chat invite.
- Invitations are delivered as notifications and also collected in a dedicated "Invitations" inbox.
- Invitations support: accept, decline, ignore (auto-expire after 7 days).
- Challenge and game invites can include a custom message.
- Community and team invites use shareable links with embedded tokens for off-platform sharing.

### 3.19 Push Notifications

- Powered by Firebase Cloud Messaging (FCM).
- Push notification triggers: daily ball knower (6 AM local), daily grid (6 AM local, if ball knower already answered), challenge invite, challenge result, game reminder (1 hour before), game start, friend request, DM (if enabled), group mention (@user), achievement unlock, streak reminder (if streak at risk), leaderboard milestone, trash talk received.
- Push notification settings: master toggle, per-type toggles, quiet hours.
- Deep linking: every push notification opens the app to the relevant screen (challenge detail, game detail, DM thread, etc.).
- Users can register multiple devices; push tokens are stored per-device.

### 3.20 Presence

- Real-time online/offline status using Supabase Realtime presence.
- Online status shown as a green dot on avatars in DM list, group chats, friend list, and game participant lists.
- "Last seen" timestamp shown when offline (subject to privacy setting: show last seen / hide).
- Typing indicators in DMs and group chats.
- Presence heartbeats every 15 seconds; offline after 30 seconds of no heartbeat.

### 3.21 Realtime Messaging

- All DM and group chat messages are delivered in real-time via Supabase Realtime.
- Messages are sent optimistically (UI updates immediately, reverts on failure).
- Realtime events: message_received, message_updated, message_deleted, typing_started, typing_stopped, user_joined, user_left, reaction_added.
- Message delivery status: sending → sent → delivered → read.

### 3.22 Media Uploads

- Users can upload images and videos to posts, messages, profiles, and game results.
- Upload pipeline: client selects file → client-side validation (type, size) → upload to Supabase Storage → receive URL → attach to entity.
- Image constraints: JPEG, PNG, WebP; max 10 MB; auto-resized to max 2048px on longest side; thumbnails generated at 400px and 800px.
- Video constraints: MP4, MOV, WebM; max 100 MB; max 60 seconds; auto-transcoded to 720p H.264; thumbnail generated from first frame.
- Voice notes: audio/m4a; max 5 minutes; max 10 MB.
- Media is stored in Supabase Storage buckets: `posts`, `messages`, `avatars`, `banners`, `game-media`, `voice-notes`.
- Storage paths: `{bucket}/{user_id}/{entity_id}/{uuid}.{ext}`.

### 3.23 Search

- Global search across: users, communities, teams, games, challenges, posts, hashtags.
- Search supports: text query, type filter, location filter (for games/communities), sort (relevance, recent, distance).
- Search uses PostgreSQL full-text search with tsvector columns and GIN indexes.
- Search history (last 10 searches) stored locally for quick re-query.
- Trending searches displayed on the search screen.

### 3.24 Settings

- Account: edit profile, change email, change password, linked accounts (Google, Apple), delete account.
- Privacy: profile visibility, DM permissions (everyone/friends/none), show online status, show last seen, show game history, searchable by email/username.
- Notifications: push toggles, email toggles, quiet hours, per-type settings.
- Appearance: dark/light/system theme, reduced motion toggle.
- Blocked users: list, unblock.
- Data: download my data, export stats.
- About: version, terms, privacy policy, community guidelines, support, rate the app.

### 3.25 Moderation

- Content reporting: users can report posts, comments, messages, users, games, challenges. Report reasons: spam, harassment, hate speech, violence, nudity, misinformation, other (with text).
- Moderation queue: accessible to community moderators (community-scoped reports) and platform admins (all reports).
- Moderator actions: dismiss report, warn user, remove content, hide content, mute user (temporary), ban user (from community or platform), shadowban (content hidden from others but visible to author).
- Automated moderation: AI-powered content classification (see Section 13) flags potentially violative content for review before it's visible.
- Appeal system: users can appeal moderation actions; appeals reviewed by platform admins.
- Audit log: all moderation actions are logged with actor, target, action, reason, timestamp.

### 3.26 Admin Dashboard

- Platform-level admin dashboard accessible only to users with the `admin` role.
- Dashboard sections: overview (DAU, MAU, new signups, posts, games, challenges — today/7d/30d), user management (search, view, suspend, ban, role change), content moderation (all reports, queue, actions), community management (view, edit, suspend, transfer ownership), analytics (engagement, retention, funnels), system health (API response times, error rates, realtime connections), feature flags (toggle features on/off), announcements (platform-wide notifications), audit log (all admin actions).
- Admin dashboard is a separate route group `/admin/*` accessible only to admins.

---

## 4. Non-Functional Requirements

### 4.1 Performance

- **Page Load:** First Contentful Paint < 1.5s on 4G. Time to Interactive < 3s.
- **API Response:** 95th percentile API response time < 200ms for reads, < 500ms for writes.
- **Realtime Latency:** Message delivery latency < 500ms end-to-end.
- **Feed Scroll:** 60 FPS scroll performance. No jank.
- **Image Loading:** Lazy-loaded with blur-up placeholders. LCP image loaded within 1s.
- **Database Queries:** No query exceeds 100ms. All list queries use indexes and cursor pagination.

### 4.2 Accessibility

- WCAG 2.2 AA compliance across all screens.
- All interactive elements have accessible names and roles.
- Color contrast ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text and UI components.
- Full keyboard navigation with visible focus indicators.
- Screen reader support via semantic HTML and ARIA labels.
- 44px minimum touch target for all interactive elements on mobile.
- Reduced motion support via `prefers-reduced-motion` media query.

### 4.3 Scalability

- Database: Supabase PostgreSQL with read replicas for heavy read paths (feed, leaderboards).
- Connection pooling via PgBouncer (Supabase default).
- Horizontal scalability via stateless API functions and Supabase Edge Functions.
- Storage: Supabase Storage with CDN delivery for all media.
- Realtime: Supabase Realtime with channel-based subscriptions; graceful degradation under load.
- Target capacity: 100,000 concurrent users, 10,000 concurrent realtime connections per instance.

### 4.4 Offline Support

- PWA with service worker caching the app shell.
- Offline-readable: last viewed feed, cached DM conversations, cached profile, cached leaderboards.
- Offline-writable: messages, posts, game logs are queued and synced when connection is restored.
- Optimistic UI updates for all writes; conflict resolution is last-write-wins for messages, server-wins for stats/scores.
- Offline indicator banner when network is unavailable.

### 4.5 Caching

- **Client-side:** React Query for all data fetching with stale-while-revalidate. Cache keys are entity + query params. Default stale time: 30s for feeds, 60s for leaderboards, 5m for profiles.
- **CDN:** All media served via CDN with long-lived cache headers (1 year, content-addressed).
- **Server-side:** Supabase query result caching for expensive aggregations (leaderboards) with 60s TTL.
- **Invalidation:** Cache invalidated via realtime events on entity changes.

### 4.6 Security

- **Authentication:** Supabase Auth with JWT. Access tokens (15-min TTL) and refresh tokens (7-day TTL).
- **Authorization:** Row Level Security (RLS) on every table. Policy-based access control.
- **Input Validation:** All API inputs validated against Zod schemas. No raw SQL from client.
- **Rate Limiting:** Per-user rate limits on writes (see 4.8).
- **Encryption:** TLS 1.3 in transit. AES-256 at rest (Supabase default). Media URLs are signed for private content.
- **Upload Security:** File type and size validation client-side and server-side. MIME type verification. Virus scanning via Supabase storage hooks.
- **Secret Management:** All secrets in environment variables. Never committed to code. Supabase Vault for sensitive secrets.
- **Audit Logging:** All sensitive actions (auth, moderation, admin, data export) logged immutably.

### 4.7 Rate Limits

| Action | Limit | Window |
|---|---|---|
| Feed posts | 10 | per hour |
| Comments | 30 | per hour |
| DM messages | 100 | per hour |
| Group messages | 200 | per hour |
| Challenge creation | 20 | per day |
| Game creation | 20 | per day |
| Friend requests | 50 | per day |
| Media uploads | 50 | per hour |
| API reads (general) | 1000 | per minute |
| API writes (general) | 200 | per minute |
| Daily Ball Knower answer | 1 | per day |
| Sprint attempts | 50 | per day |

Rate limit responses return HTTP 429 with `Retry-After` header and a `X-RateLimit-Remaining` header.

### 4.8 Analytics

- **PostHog** for product analytics: page views, feature usage, funnels, retention, user properties.
- **Custom events:** `daily_question_answered`, `grid_completed`, `challenge_created`, `challenge_joined`, `challenge_completed`, `game_created`, `game_joined`, `game_completed`, `message_sent`, `post_created`, `sprint_completed`, `achievement_unlocked`, `friend_added`, `community_joined`.
- No PII in analytics events. User IDs are hashed.
- Analytics consent: users can opt out of analytics in settings.

### 4.9 SEO

- Server-side rendering / pre-rendering for public pages (community pages, public profiles, landing pages).
- Meta tags: title, description, Open Graph, Twitter Card for every public page.
- Sitemap.xml for public communities and public profiles.
- robots.txt allowing public pages, blocking private/app routes.
- Canonical URLs on all pages.
- Structured data (JSON-LD) for communities, events (games), and organizations.

### 4.10 PWA

- Installable PWA with manifest.json.
- Service worker: app shell caching, runtime caching for media, offline fallback page.
- Add to home screen prompt after 3rd visit with engagement.
- Push notification support via FCM when installed as PWA.
- Splash screen with Ball Up Top branding.

### 4.11 Cross-Device Synchronization

- All data synced via Supabase Realtime and React Query cache invalidation.
- Multi-device sessions: a user can be logged in on multiple devices simultaneously.
- Read positions synced across devices (last read message, last viewed feed position).
- Theme and settings synced via the `settings` table.

### 4.12 Error Recovery

- **Network errors:** Automatic retry with exponential backoff (3 attempts). Offline queue for writes.
- **Realtime disconnection:** Automatic reconnection with backoff. Missed events fetched via REST on reconnect.
- **API errors:** User-friendly error messages. Error boundary catches render errors and shows a fallback UI with "Reload" button.
- **Conflict resolution:** Optimistic updates reverted on server error with toast notification.
- **Data integrity:** Database transactions for multi-table writes. Rollback on failure.

### 4.13 Monitoring

- **Sentry** for error tracking (frontend and backend). Source maps uploaded on deploy.
- **Supabase** dashboard for database performance, auth, storage, and realtime metrics.
- **Vercel** analytics for web vitals (LCP, FID, CLS, TTFB).
- **Custom health checks:** `/health` endpoint returning system status. Uptime monitoring via Vercel cron + Sentry.

### 4.14 Logging

- Structured JSON logs for all API function calls: `timestamp`, `user_id`, `action`, `duration_ms`, `status`, `error`.
- Log levels: debug, info, warn, error. Production logs at info level.
- PII never logged. User IDs are hashed in logs.
- Logs retained for 90 days.

---

## 5. Technology Stack

### Frontend
- **React 18** (via Vite) — UI framework.
- **TypeScript** — type safety (Base44 generates TypeScript interfaces from entity schemas).
- **Tailwind CSS** — utility-first styling with custom design tokens (see Section 8).
- **shadcn/ui** — component primitives (dialog, dropdown, sheet, tabs, toast, etc.).
- **lucide-react** — icon library.
- **framer-motion** — animations and transitions.
- **react-router-dom** — client-side routing.
- **@tanstack/react-query** — data fetching, caching, and optimistic updates.
- **react-hook-form + zod** — form handling and validation.
- **recharts** — charts for stats and analytics.
- **react-leaflet** — maps for game discovery (Mapbox tiles).
- **react-markdown** — rendering rich text/markdown in posts and messages.
- **date-fns** — date/time formatting and manipulation.
- **moment** — supplementary date handling where needed.
- **@hello-pangea/dnd** — drag-and-drop (lineup management, grid reordering).
- **three.js** — 3D trophy case rendering and celebratory effects.
- **canvas-confetti** — celebration animations (challenge wins, achievements).
- **sonner** — toast notifications.
- **react-hot-toast** — supplementary toasts.
- **jspdf + html2canvas** — stat card PDF export.

### Backend
- **Base44 generated backend** — entities, API endpoints, and server-side logic generated from entity schemas.
- **Supabase PostgreSQL** — primary database.
- **Supabase Auth** — authentication (email/password, Google, Apple, magic links).
- **Supabase Storage** — media storage with CDN.
- **Supabase Realtime** — realtime subscriptions, presence, and broadcast.

### AI
- **Gemini** (via Base44 `InvokeLLM` integration with `add_context_from_internet: true`) — daily question generation, daily grid generation, content moderation, friend recommendations, natural language search, highlight generation.
- **OpenAI compatibility layer** — fallback model for tasks where Gemini is unavailable.

### Maps
- **Mapbox** — map tiles and geocoding for game discovery and community locations. Accessed via react-leaflet with Mapbox tile URLs. Mapbox access token stored as an environment variable.

### Push Notifications
- **Firebase Cloud Messaging (FCM)** — push notification delivery. Firebase Admin SDK used in backend functions to send pushes. FCM server key stored as an environment variable.

### Email
- **Resend** — transactional and digest emails. Accessed via Base44 `SendEmail` integration or direct Resend API in backend functions. Resend API key stored as an environment variable.

### Analytics
- **PostHog** — product analytics. PostHog project API key and host stored as environment variables. Integrated via `posthog-js` on the frontend.

### Monitoring
- **Sentry** — error tracking and performance monitoring. Sentry DSN stored as an environment variable. Integrated via `@sentry/react` on the frontend and `@sentry/node` in backend functions.

### Hosting
- **Vercel** — frontend hosting and serverless function deployment. Vercel project configured with environment variables for all services. Preview deployments on every pull request. Production deployment on merge to main.

### Environment Variables

| Variable | Purpose |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon/public key (frontend) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (backend only) |
| `MAPBOX_ACCESS_TOKEN` | Mapbox API token |
| `FCM_SERVER_KEY` | Firebase Cloud Messaging server key |
| `RESEND_API_KEY` | Resend email API key |
| `POSTHOG_KEY` | PostHog project API key |
| `POSTHOG_HOST` | PostHog host URL |
| `SENTRY_DSN` | Sentry data source name |
| `GEMINI_API_KEY` | (if direct Gemini access needed beyond Base44) |
| `APP_URL` | Canonical app URL (for deep links, email links) |
| `STORAGE_BASE_URL` | Supabase storage base URL |

---

## 6. Information Architecture

### 6.1 Route Map

```
/                           → Home (Social Feed)
/login                      → Login
/register                   → Register
/forgot-password            → Forgot Password
/reset-password             → Reset Password (reads ?token=)
/notifications              → Notifications (full list)
/search                     → Global Search
/daily                      → Daily Ball Knower + Daily Grid (combined daily hub)
/daily/question             → Daily Ball Knower (standalone)
/daily/grid                 → Daily Grid (standalone)
/sprint                     → Sprint Mode hub
/sprint/daily               → Daily Sprint
/sprint/head-to-head/:id    → Head-to-head sprint session
/challenges                 → Challenges list (discover + mine)
/challenges/:id             → Challenge detail
/challenges/create          → Create challenge
/games                      → Game Discovery (map + list)
/games/:id                  → Game detail
/games/create               → Create game
/communities                → Communities list (discover + mine)
/communities/:slug          → Community detail (feed)
/communities/:slug/leaderboard → Community leaderboard
/communities/:slug/members  → Community members
/communities/:slug/challenges → Community challenges
/communities/:slug/games    → Community games
/communities/:slug/settings → Community settings (admin/mod)
/communities/:slug/moderation → Community moderation queue
/teams                      → Teams list (mine + discover)
/teams/:slug                → Team detail
/teams/:slug/roster         → Team roster
/teams/:slug/stats          → Team stats
/teams/:slug/settings       → Team settings (captain)
/leaderboards               → Global leaderboards hub
/leaderboards/:type         → Specific leaderboard (ball-knower, challenges, streaks, sprint, games, grid)
/messages                   → DM list + group chat list
/messages/:threadId         → Conversation view
/friends                    → Friends list + requests
/friends/suggestions        → Friend suggestions
/profile/:username          → Public profile
/profile/:username/trophies → Trophy case
/profile/:username/stats    → Detailed stats
/settings                   → Settings hub
/settings/account           → Account settings
/settings/privacy           → Privacy settings
/settings/notifications     → Notification settings
/settings/appearance        → Theme/appearance
/settings/blocked           → Blocked users
/settings/data              → Data export
/achievements               → All achievements (catalog + earned)
/invitations                → Invitations inbox
/admin                      → Admin dashboard (overview)
/admin/users                → User management
/admin/moderation           → Platform moderation queue
/admin/communities          → Community management
/admin/analytics            → Analytics
/admin/system               → System health
/admin/audit                → Audit log
/about                      → About / legal
/about/privacy              → Privacy Policy
/about/terms                → Terms of Service
/about/guidelines           → Community Guidelines
```

### 6.2 Navigation Hierarchy

**Mobile — Bottom Navigation (5 tabs):**
1. **Home** (feed icon) → `/`
2. **Daily** (calendar/flame icon) → `/daily`
3. **Play** (center, elevated, basketball icon) → `/games` (game discovery)
4. **Messages** (chat icon, badge) → `/messages`
5. **Profile** (avatar) → `/profile/:me`

**Desktop — Left Sidebar:**
- Logo (top)
- Home
- Daily
- Challenges
- Games
- Communities
- Teams
- Leaderboards
- Messages (with unread badge)
- Friends
- Search
- Notifications (bell with badge)
- Profile
- Settings (bottom)
- Admin (bottom, admin-only)

**Top Bar (all screens):**
- Left: Page title or back button (mobile)
- Center: Ball Up Top logo (mobile) / search bar (desktop)
- Right: Notifications bell (badge), avatar dropdown (profile, settings, logout)

### 6.3 Deep Linking

- All routes are deep-linkable URLs.
- Push notifications include `url` field that maps to the relevant route.
- Shareable links: profile (`/profile/:username`), community (`/communities/:slug`), game (`/games/:id`), challenge (`/challenges/:id`), post (`/post/:id` — modal route over feed).
- Invite links: `/invite/:token` → resolves to community/team/game/challenge invite and prompts accept/decline.

### 6.4 Modal Routing

- Post detail: `/post/:id` rendered as a modal overlay on the feed (or standalone on mobile).
- Create flows: `/challenges/create`, `/games/create`, `/communities/create` rendered as full-screen sheets on mobile, modals on desktop.
- Image/media viewer: `/media/:id` as a full-screen modal.

### 6.5 Authentication Gates

- **Public routes:** `/login`, `/register`, `/forgot-password`, `/reset-password`, `/about/*`, public community pages (read-only), public profiles (read-only).
- **Authenticated routes:** Everything else. Wrapped in `<ProtectedRoute>`.
- **Admin routes:** `/admin/*` requires `role === 'admin'`. Wrapped in `<AdminRoute>`.
- **Ownership routes:** `/settings/*` (self only), `/communities/:slug/settings` (community admin/mod only), `/teams/:slug/settings` (captain only) — enforced by RLS and client-side guards.

---

## 7. Screen-by-Screen Specification

### 7.1 Login Screen

- **Purpose:** Authenticate existing users.
- **Layout:** Centered card on a full-bleed basketball court background image. Card contains: Ball Up Top logo, email field, password field, "Forgot password?" link, "Sign In" button, divider, "Continue with Google" button, "Continue with Apple" button, "Don't have an account? Sign up" link.
- **Loading State:** "Sign In" button shows spinner and is disabled during auth call.
- **Empty State:** N/A.
- **Error State:** Inline error message below the form for invalid credentials. Red border on the relevant field.
- **Animations:** Card fades in + slides up (framer-motion). Background image subtle Ken Burns zoom.
- **Accessibility:** All inputs have labels, error messages are aria-live, focus moves to first input on mount.
- **Validation:** Email format (Zod), password min 8 chars. Validation on blur and submit.
- **Responsive:** Card max-width 400px, centered. Full-screen on mobile.
- **Transitions:** On success, hard redirect to `/` (or `?from=` URL).

### 7.2 Register Screen

- **Purpose:** Create a new account.
- **Layout:** Multi-step flow. Step 1: email + password + confirm password. Step 2: display name + username (with availability check) + favorite NBA team. Step 3: OTP verification (6-digit code sent to email).
- **Loading State:** Spinner on "Continue" button. OTP "Verify" button shows spinner.
- **Empty State:** N/A.
- **Error State:** Inline errors per field. OTP error: "Invalid code, try again" with "Resend code" link (60s cooldown).
- **Animations:** Slide transitions between steps (framer-motion `AnimatePresence`).
- **Accessibility:** Step progress indicator with aria-current. OTP input is accessible (input-otp).
- **Validation:** Email format, password min 8 chars with 1 number, username 3–20 chars alphanumeric/underscore, display name 2–40 chars.
- **Responsive:** Same card layout as login.
- **Transitions:** On OTP success, hard redirect to `/` with onboarding flow triggered.

### 7.3 Onboarding Flow

- **Purpose:** Guide new users through initial setup.
- **Layout:** Full-screen step-by-step flow. Step 1: Welcome + avatar upload. Step 2: Select location (city/zip → auto-detect via browser geolocation). Step 3: Select interests (NBA teams, play style, skill level). Step 4: Join a community (suggested based on location). Step 5: Add friends (suggested based on location/contacts). Step 6: "You're all set" → first Daily Ball Knower prompt.
- **Loading State:** Next button spinner during data saves.
- **Empty State:** If no communities/friends suggested, show a message and skip option.
- **Error State:** Geolocation denied → manual city input fallback.
- **Animations:** Slide transitions, confetti on completion.
- **Accessibility:** Skip option on each step. Progress indicator.
- **Validation:** Avatar file type/size. Location required.
- **Responsive:** Full-screen, mobile-first.
- **Transitions:** On completion, redirect to `/` with welcome toast.

### 7.4 Home (Social Feed)

- **Purpose:** The primary daily destination — a social feed of posts from communities, friends, and teams.
- **Layout:** Top bar (logo, search, notifications). Feed filter tabs (All, Communities, Friends, Teams, Challenges, Trash Talk). Floating compose button (bottom right, above bottom nav on mobile). Infinite scroll feed of post cards.
- **Components:** TopBar, FeedFilterTabs, PostCard, ComposeButton, BottomNav, PostComposer (modal).
- **Loading State:** Skeleton feed cards (5 shimmer placeholders matching PostCard layout).
- **Empty State:** "Your feed is empty. Join a community or add friends to see posts here." with CTA buttons to discover communities / find friends.
- **Error State:** "Couldn't load your feed. Pull to retry." with retry button.
- **Animations:** Post cards fade-in on scroll into view (framer-motion `whileInView`). Compose button scales on tap. New posts animate in at top when created.
- **Accessibility:** Feed is a semantic `<main>` with `<article>` per post. Filter tabs are radio buttons. All actions have aria-labels.
- **Validation:** N/A (read view).
- **Responsive:** Single column on mobile (max-width 640px centered). On desktop, feed centered with left sidebar nav and right sidebar (trending, suggested friends).
- **Transitions:** Tab switches animate feed with a crossfade.

### 7.5 Post Composer (Modal)

- **Purpose:** Create a new post.
- **Layout:** Full-screen sheet on mobile, centered modal on desktop. Text area with placeholder "What's on your court?". Toolbar: photo/video upload, stat card embed, challenge tag, game tag, community selector, mention, hashtag. Privacy selector (public/friends/community). Post button.
- **Loading State:** Post button shows spinner. Image uploads show progress bars.
- **Empty State:** N/A.
- **Error State:** Upload errors show inline. Post failure shows toast and retains content.
- **Animations:** Sheet slides up from bottom (mobile). Modal fades + scales in (desktop).
- **Accessibility:** Trap focus within modal. Esc to close (with unsaved changes confirmation). All toolbar buttons labeled.
- **Validation:** Post must have text (min 1 char) or media. Max text 2000 chars. Max 4 images or 1 video.
- **Responsive:** Full-screen on mobile, 600px modal on desktop.

### 7.6 Daily Hub (`/daily`)

- **Purpose:** The combined daily engagement destination — Daily Ball Knower + Daily Grid.
- **Layout:** Two-section layout. Top section: Daily Ball Knower card (question, options, or result if already answered). Bottom section: Daily Grid (3×3 grid of squares). Streak indicator at top.
- **Components:** DailyQuestionCard, DailyGrid, StreakBadge.
- **Loading State:** Skeleton question card + skeleton grid.
- **Empty State:** N/A (always has content by 6 AM).
- **Error State:** "Couldn't load today's daily. Tap to retry."
- **Animations:** Question options scale on tap. Correct answer → confetti + green flash. Incorrect → red flash + shake. Grid squares flip on completion.
- **Accessibility:** Question options are radio buttons. Grid squares are buttons with descriptive labels.
- **Validation:** One option selectable per question.
- **Responsive:** Stacked on mobile. Side-by-side or stacked on tablet/desktop.
- **Transitions:** Smooth section reveal.

### 7.7 Daily Ball Knower Result

- **Purpose:** Show the result after answering.
- **Layout:** Replaces the question card. Shows: correct/incorrect banner, correct answer highlighted, explanation text, percentage breakdown (bar chart of option choices), updated streak, updated rank, "Share result" button, "Discuss in community" button.
- **Loading State:** Brief spinner while result is submitted.
- **Empty State:** N/A.
- **Error State:** "Couldn't submit your answer. Tap to retry."
- **Animations:** Correct → confetti burst + bounce. Incorrect → subtle shake. Rank change → arrow up/down animation.
- **Accessibility:** Result announced via aria-live. Chart has data table fallback.
- **Validation:** N/A.
- **Responsive:** Single column, max-width 600px.

### 7.8 Daily Grid

- **Purpose:** Complete 9 daily prompts for grid points.
- **Layout:** 3×3 grid of square cards. Each square: icon, prompt text, completion checkmark. Completed squares are highlighted with a gradient. "Perfect Grid" progress bar at top.
- **Loading State:** Skeleton grid.
- **Empty State:** N/A.
- **Error State:** Retry button.
- **Animations:** Square flip on completion. Perfect grid → full-screen confetti + special badge.
- **Accessibility:** Each square is a button. Completed state announced.
- **Validation:** N/A.
- **Responsive:** Grid scales to viewport. Min square size 100px on mobile.

### 7.9 Sprint Mode Hub (`/sprint`)

- **Purpose:** Entry point for fast-paced mini-games.
- **Layout:** Hero card: "Daily Sprint" with start button + today's high score. Below: "Head-to-Head Sprint" (select a friend to challenge). Below: "Sprint Leaderboard" (weekly, top 10 + user's rank). Below: "Sprint History" (last 5 sprints).
- **Loading State:** Skeleton cards.
- **Empty State:** "No sprints yet. Start your first daily sprint!"
- **Error State:** Retry.
- **Animations:** Cards stagger in. Start button pulses.
- **Accessibility:** All cards are buttons or contain buttons.
- **Validation:** N/A.
- **Responsive:** Single column mobile, 2-column desktop.

### 7.10 Sprint Session

- **Purpose:** Play a 60-second sprint.
- **Layout:** Full-screen, immersive. Timer at top (countdown from 60s). Current task in center (question text + 4 options, or stat comparison, or "who said it"). Score counter. Progress bar (task x of N).
- **Loading State:** "Get ready... 3, 2, 1, GO!" countdown.
- **Empty State:** N/A.
- **Error State:** "Connection lost. Your progress is saved." with retry.
- **Animations:** Correct answer → green flash + score bump. Incorrect → red flash. Timer pulses red in last 10 seconds. End screen → score reveal + rank update + confetti if new high score.
- **Accessibility:** Large text, high contrast. Keyboard accessible (1-4 keys for options).
- **Validation:** One option per task.
- **Responsive:** Full-screen all devices.

### 7.11 Challenges List (`/challenges`)

- **Purpose:** Discover and manage challenges.
- **Layout:** Tabs: "Discover" (public challenges), "Active" (challenges I'm in), "Completed" (history). Filter bar: type, sport, community, status. Grid/list of ChallengeCards. "Create Challenge" button.
- **Loading State:** Skeleton cards.
- **Empty State:** "No challenges yet. Create one or join a public challenge!" with CTA.
- **Error State:** Retry.
- **Animations:** Cards stagger in. Tab switch crossfade.
- **Accessibility:** Tabs are tablist. Filter is a form.
- **Validation:** N/A.
- **Responsive:** 1 column mobile, 2-3 columns desktop.

### 7.12 Challenge Detail (`/challenges/:id`)

- **Purpose:** View and participate in a challenge.
- **Layout:** Header: title, type badge, creator, status, description, rules, wager (if any), dates. Participants section (avatars + scores). Actions: Join/Leave, Log Score, View Results. Comments/activity thread. If completed: winner banner, final standings, trash talk section.
- **Loading State:** Skeleton.
- **Empty State:** N/A.
- **Error State:** "Challenge not found" or retry.
- **Animations:** Winner banner slides in. Score updates animate.
- **Accessibility:** Semantic sections. Action buttons labeled.
- **Validation:** Score input must be numeric.
- **Responsive:** Single column, max-width 800px.

### 7.13 Create Challenge

- **Purpose:** Create a new challenge.
- **Layout:** Form sheet. Fields: title, description, type (select), sport, rules (rich text), participants (user/team picker), start date, end date, wager (optional, select type), privacy (public/private/community). Preview card. Create button.
- **Loading State:** Create button spinner.
- **Empty State:** N/A.
- **Error State:** Inline field errors.
- **Animations:** Sheet slide-up. Preview card updates live.
- **Accessibility:** All fields labeled. Form is a `<form>` with submit.
- **Validation:** Title required (3–80 chars). Description max 500. Type required. At least 1 participant (or public). End date after start date.
- **Responsive:** Full-screen sheet mobile, 600px modal desktop.

### 7.14 Game Discovery (`/games`)

- **Purpose:** Find nearby basketball games.
- **Layout:** Toggle: Map View / List View. Map view: full-bleed map (react-leaflet + Mapbox tiles) with game pins. Pin color: green=open, yellow=filling, red=full, blue=started. Tapping a pin shows a mini game card. List view: sorted by distance, each item a GameCard. Filter bar: type, skill, distance radius, date, free/paid. Search by court/location.
- **Loading State:** Map skeleton / list skeleton.
- **Empty State:** "No games near you. Create one and get the run started!" with CTA.
- **Error State:** "Couldn't load games. Tap to retry." or geolocation error with manual search fallback.
- **Animations:** Pins drop in. List cards stagger.
- **Accessibility:** Map has a text alternative (list view). Pins have aria-labels. List view is fully accessible.
- **Validation:** N/A.
- **Responsive:** Full-screen mobile. Desktop: map left (60%), list right (40%) in split pane.
- **Transitions:** Map ↔ list crossfade.

### 7.15 Game Detail (`/games/:id`)

- **Purpose:** View game details and join.
- **Layout:** Header: title, type, status badge, creator. Map snippet with court location. Details: date/time, duration, location address, player count (x/max), skill level, cost, description. Participants list (avatars). Actions: Join/Leave/Request to Join, Share, Get Directions (opens maps app). If creator: Edit, Start Game, Log Result, Cancel. If started/completed: score, player of the game, stats.
- **Loading State:** Skeleton.
- **Empty State:** N/A.
- **Error State:** "Game not found" or retry.
- **Animations:** Status changes animate. Join → participant avatar slides in.
- **Accessibility:** Semantic. Map has address text alternative.
- **Validation:** N/A.
- **Responsive:** Single column, max-width 800px.

### 7.16 Create Game

- **Purpose:** Create a pickup game.
- **Layout:** Form sheet. Fields: title, type (select), location (map picker or saved court search), date/time picker, duration, max players, skill level (slider 1-10), cost (free/paid + amount), description, privacy. Preview. Create button.
- **Loading State:** Spinner. Geocoding spinner for location.
- **Empty State:** N/A.
- **Error State:** Field errors. Geocoding error → manual address input.
- **Animations:** Sheet slide-up. Map picker interactive.
- **Accessibility:** All fields labeled. Map picker has text search alternative.
- **Validation:** Title required. Location required. Date must be in the future. Max players 2–20. Cost amount ≥ 0 if paid.
- **Responsive:** Full-screen mobile, 600px modal desktop.

### 7.17 Communities List (`/communities`)

- **Purpose:** Discover and manage communities.
- **Layout:** Tabs: "Discover" (nearby + searchable), "My Communities". Discover: search bar, category filters, nearby communities (map + list), trending communities. My Communities: list of CommunityCards.
- **Loading State:** Skeleton cards.
- **Empty State:** "You haven't joined any communities. Discover one near you!" with CTA.
- **Error State:** Retry.
- **Animations:** Cards stagger. Tab crossfade.
- **Accessibility:** Tabs, search form.
- **Validation:** N/A.
- **Responsive:** 1 column mobile, 2-3 columns desktop.

### 7.18 Community Detail (`/communities/:slug`)

- **Purpose:** Community home — feed, info, and navigation.
- **Layout:** Community header: banner, avatar, name, member count, location, join/leave button (or settings if admin). Sub-navigation: Feed, Leaderboard, Members, Challenges, Games, Settings (admin/mod). Feed tab is default — same as Home feed but scoped to community.
- **Loading State:** Skeleton header + feed.
- **Empty State:** "No posts in this community yet. Be the first to post!" with CTA.
- **Error State:** Retry.
- **Animations:** Header parallax on scroll. Tab transitions.
- **Accessibility:** Semantic header. Sub-nav is tablist.
- **Validation:** N/A.
- **Responsive:** Single column mobile. Desktop: feed center, sidebar right (community info, top members).

### 7.19 Community Leaderboard

- **Purpose:** Rank community members.
- **Layout:** Timeframe filter (weekly, monthly, all-time). Top 3 podium (visual). Ranked list (4–100) with avatar, name, points, rank change indicator. User's own rank pinned at bottom if not in top 100.
- **Loading State:** Skeleton list.
- **Empty State:** "No leaderboard data yet. Start participating to climb the ranks!"
- **Error State:** Retry.
- **Animations:** Podium animate up. Rank changes animate.
- **Accessibility:** Ranked list is a semantic table or list. Rank change announced.
- **Validation:** N/A.
- **Responsive:** Single column, max-width 600px.

### 7.20 Teams List (`/teams`)

- **Purpose:** Discover and manage teams.
- **Layout:** Tabs: "My Teams", "Discover". My Teams: list of TeamCards. Discover: search + suggested teams.
- **Loading State:** Skeleton.
- **Empty State:** "You're not on a team yet. Create one or join a community to find teammates!" with CTA.
- **Error State:** Retry.
- **Animations:** Cards stagger.
- **Accessibility:** Tabs, search.
- **Validation:** N/A.
- **Responsive:** 1 column mobile, 2 columns desktop.

### 7.21 Team Detail (`/teams/:slug`)

- **Purpose:** Team home.
- **Layout:** Team header: banner, avatar, name, sport, captain, record (W-L). Sub-nav: Feed, Roster, Stats, Group Chat, Settings (captain). Feed tab: team-scoped feed. Roster: player list with roles, stats, and availability. Stats: team aggregate stats with charts.
- **Loading State:** Skeleton.
- **Empty State:** "No posts yet. Start the team chat!" with CTA.
- **Error State:** Retry.
- **Animations:** Header parallax. Tab transitions.
- **Accessibility:** Semantic. Sub-nav tablist.
- **Validation:** N/A.
- **Responsive:** Single column mobile. Desktop: feed center, sidebar right (roster summary, next game).

### 7.22 Leaderboards Hub (`/leaderboards`)

- **Purpose:** Global leaderboard navigation.
- **Layout:** Grid of leaderboard type cards: Ball Knower, Challenges, Streaks, Sprint, Games, Grid. Each card shows: icon, title, user's current rank, top 3 preview. Tapping a card navigates to the full leaderboard.
- **Loading State:** Skeleton cards.
- **Empty State:** "Start playing to appear on the leaderboards!"
- **Error State:** Retry.
- **Animations:** Cards stagger. Rank previews animate.
- **Accessibility:** Cards are links.
- **Validation:** N/A.
- **Responsive:** 2 columns mobile, 3 columns desktop.

### 7.23 Specific Leaderboard (`/leaderboards/:type`)

- **Purpose:** Full leaderboard view.
- **Layout:** Title, timeframe filter (daily, weekly, monthly, all-time), friend filter toggle. Top 3 podium. Ranked list (4–100). User's rank pinned at bottom. "Share rank" button (generates a stat card image).
- **Loading State:** Skeleton.
- **Empty State:** "No data for this timeframe yet."
- **Error State:** Retry.
- **Animations:** Podium, rank changes.
- **Accessibility:** Semantic list/table.
- **Validation:** N/A.
- **Responsive:** Single column, max-width 600px.

### 7.24 Messages List (`/messages`)

- **Purpose:** DM and group chat list.
- **Layout:** Search bar. Tabs: "All", "DMs", "Groups". List of conversation cards: avatar (individual or group), name, last message preview, timestamp, unread badge. New message button (compose → user picker → new DM or group).
- **Loading State:** Skeleton list.
- **Empty State:** "No conversations yet. Start a DM or create a group chat!" with CTA.
- **Error State:** Retry.
- **Animations:** New messages bump conversation to top with subtle highlight.
- **Accessibility:** List is semantic. Unread counts announced.
- **Validation:** N/A.
- **Responsive:** Full-screen list on mobile (navigates to conversation on tap). Desktop: list left (350px), conversation right (split pane).

### 7.25 Conversation (`/messages/:threadId`)

- **Purpose:** Real-time messaging.
- **Layout:** Header: avatar, name, online status, call/menu button. Message list (reverse chronological, newest at bottom). Message bubbles: sent (right, primary color), received (left, card color). Each bubble: text/media, timestamp, read receipt (DMs), reactions, reply-to preview. Typing indicator. Message input bar: text field, emoji, attach (photo/video/voice), send button.
- **Loading State:** Skeleton messages.
- **Empty State:** "Say something! Start the conversation." with a suggested icebreaker.
- **Error State:** "Couldn't load messages. Tap to retry." Send failure → bubble shows retry icon.
- **Animations:** Messages slide up + fade in. Typing indicator animated dots. Send → optimistic bubble appears immediately.
- **Accessibility:** Messages in a semantic list. Input is a labeled textarea. Reactions accessible.
- **Validation:** Message max 4000 chars. Media constraints per Section 3.22.
- **Responsive:** Full-screen mobile. Desktop: right pane of split layout.

### 7.26 Friends (`/friends`)

- **Purpose:** Manage friends and requests.
- **Layout:** Tabs: "Friends", "Requests" (incoming/outgoing), "Suggestions". Friends: searchable list with avatars, status, message/challenge/remove actions. Requests: accept/decline. Suggestions: AI-recommended, add button.
- **Loading State:** Skeleton.
- **Empty State:** "No friends yet. Check out our suggestions or search for players!" with CTA.
- **Error State:** Retry.
- **Animations:** List items stagger. Accept → friend slides into Friends tab.
- **Accessibility:** Tabs, lists, action buttons labeled.
- **Validation:** N/A.
- **Responsive:** Single column, max-width 600px.

### 7.27 Player Profile (`/profile/:username`)

- **Purpose:** The user's basketball card.
- **Layout:** Header: banner, avatar, display name, username, bio, location, favorite team, skill level, joined date. Edit button (if self). Action buttons (if other): Message, Challenge, Add Friend, Block (in menu). Stats summary row: games played, win rate, challenge wins, ball knower streak, rank. Tabs: Posts, Trophies, Stats, Activity. Posts: user's feed posts. Trophies: trophy case grid. Stats: detailed stats with charts (games over time, win rate trend, challenge record, ball knower calendar). Activity: recent challenges, games, achievements.
- **Loading State:** Skeleton.
- **Empty State:** (Own profile, new user) "Welcome! Start playing to fill up your profile." (Other, empty) "This player hasn't posted yet."
- **Error State:** "User not found."
- **Animations:** Header parallax. Stat counters animate up. Trophy grid items pop in.
- **Accessibility:** Semantic sections. Tabs. Charts have data tables.
- **Validation:** N/A.
- **Responsive:** Single column mobile. Desktop: header full-width, content in 2-column layout (posts left, stats sidebar right).

### 7.28 Trophy Case (`/profile/:username/trophies`)

- **Purpose:** Showcase earned achievements.
- **Layout:** Category filter (All, Challenges, Streaks, Ball Knower, Grid, Games, Community, Special). Grid of trophy cards: icon, title, description, date earned, rarity badge. Locked trophies shown greyed with a lock icon. 3D trophy case view toggle (three.js) for a premium showcase.
- **Loading State:** Skeleton grid.
- **Empty State:** "No trophies yet. Start playing to earn your first!" with CTA to achievements catalog.
- **Error State:** Retry.
- **Animations:** Trophy cards pop in. 3D view: orbit controls, trophies on shelves, lighting.
- **Accessibility:** Grid of buttons/cards. 3D view has text fallback (grid).
- **Validation:** N/A.
- **Responsive:** 2-3 columns mobile, 4-5 columns desktop.

### 7.29 Achievements Catalog (`/achievements`)

- **Purpose:** Browse all possible achievements.
- **Layout:** Category filter. Grid of achievement cards: icon, title, description, requirement, progress bar (if in progress), earned badge (if earned), rarity percentage.
- **Loading State:** Skeleton.
- **Empty State:** N/A (catalog always has items).
- **Error State:** Retry.
- **Animations:** Progress bars animate. Earned achievements have a shimmer effect.
- **Accessibility:** Cards with progress announced.
- **Validation:** N/A.
- **Responsive:** 2 columns mobile, 3-4 columns desktop.

### 7.30 Notifications (`/notifications`)

- **Purpose:** Full notification list.
- **Layout:** Filter tabs (All, Likes, Comments, Challenges, Games, Friends, Messages, System). Mark all read button. List of NotificationCards: icon, text, avatar (actor), timestamp, tap action (navigates to relevant screen). Unread notifications have a left border accent.
- **Loading State:** Skeleton.
- **Empty State:** "No notifications. You're all caught up!"
- **Error State:** Retry.
- **Animations:** Items stagger. Marking read → accent fades.
- **Accessibility:** List semantic. Filter tabs.
- **Validation:** N/A.
- **Responsive:** Single column, max-width 600px.

### 7.31 Search (`/search`)

- **Purpose:** Global search.
- **Layout:** Search bar (autofocus). Recent searches (chips). Trending searches. Type filter (All, Users, Communities, Teams, Games, Challenges, Posts, Hashtags). Results: grouped by type with "See all" links. Each result is a card.
- **Loading State:** Skeleton results.
- **Empty State:** (No query) Recent + trending. (No results) "No results for '{query}'. Try a different search."
- **Error State:** Retry.
- **Animations:** Results fade in. Type filter crossfade.
- **Accessibility:** Search is a labeled input. Results are semantic.
- **Validation:** Query min 2 chars to search.
- **Responsive:** Single column, max-width 800px.

### 7.32 Settings Hub (`/settings`)

- **Purpose:** Settings navigation.
- **Layout:** List of setting categories: Account, Privacy, Notifications, Appearance, Blocked Users, Data, About. Each item navigates to a sub-page.
- **Loading State:** N/A.
- **Empty State:** N/A.
- **Error State:** N/A.
- **Animations:** List items fade in.
- **Accessibility:** List of links.
- **Validation:** N/A.
- **Responsive:** Single column, max-width 600px.

### 7.33 Account Settings (`/settings/account`)

- **Purpose:** Edit account.
- **Layout:** Form: avatar upload, banner upload, display name, username (availability check), bio, location, favorite NBA team, favorite player, position, height, skill level. Email (read-only, change via separate flow). Change password section. Linked accounts (Google/Apple connect/disconnect). Delete account section (confirmation modal).
- **Loading State:** Save button spinner. Upload progress.
- **Empty State:** N/A.
- **Error State:** Field errors. Upload errors.
- **Animations:** Avatar upload → circular progress. Save → success toast.
- **Accessibility:** All fields labeled. Delete confirmation is a dialog.
- **Validation:** Username 3–20 chars, unique. Display name 2–40 chars. Bio max 200 chars.
- **Responsive:** Single column, max-width 600px.

### 7.34 Notification Settings (`/settings/notifications`)

- **Purpose:** Configure notifications.
- **Layout:** Master push toggle. Per-type toggles (push + email columns): likes, comments, friend requests, challenge invites, challenge results, game invites, game reminders, DMs, group mentions, daily ball knower, daily grid, achievement unlocks, leaderboard updates, streak reminders. Quiet hours: enable toggle, start time, end time. Email digest frequency (none, daily, weekly).
- **Loading State:** N/A (local + saved).
- **Empty State:** N/A.
- **Error State:** Save error toast.
- **Animations:** Toggle switches animate.
- **Accessibility:** Toggles are switches with labels.
- **Validation:** Quiet hours: end time after start time (or overnight allowed).
- **Responsive:** Single column, max-width 600px.

### 7.35 Admin Dashboard (`/admin`)

- **Purpose:** Platform administration.
- **Layout:** Sidebar nav (Overview, Users, Moderation, Communities, Analytics, System, Audit, Announcements). Overview: metric cards (DAU, MAU, new signups, posts today, games today, challenges today), charts (signup trend, engagement trend, retention curve). Quick actions: send announcement, toggle feature flag.
- **Loading State:** Skeleton cards + charts.
- **Empty State:** N/A.
- **Error State:** Retry.
- **Animations:** Charts animate. Cards stagger.
- **Accessibility:** Semantic dashboard. Charts have tables.
- **Validation:** N/A.
- **Responsive:** Full-width desktop. Tables on mobile (stacked).

### 7.36 Admin User Management (`/admin/users`)

- **Purpose:** Manage users.
- **Layout:** Search + filter (role, status). Table: avatar, name, email, role, status, joined date, actions (view, suspend, ban, change role). User detail modal: profile, stats, moderation history, actions.
- **Loading State:** Skeleton table.
- **Empty State:** "No users found."
- **Error State:** Retry.
- **Animations:** Table rows stagger.
- **Accessibility:** Table semantic. Actions are menu buttons.
- **Validation:** N/A.
- **Responsive:** Table on desktop, cards on mobile.

### 7.37 Admin Moderation Queue (`/admin/moderation`)

- **Purpose:** Review reports.
- **Layout:** Filter (type, status, severity). Queue of report cards: reported content preview, reporter, reason, timestamp, actions (dismiss, remove content, warn, mute, ban, shadowban). Bulk actions.
- **Loading State:** Skeleton.
- **Empty State:** "No reports in the queue. The community is clean!"
- **Error State:** Retry.
- **Animations:** Cards slide in. Action → card animates out.
- **Accessibility:** Cards semantic. Actions labeled.
- **Validation:** N/A.
- **Responsive:** Single column, max-width 800px.

---

## 8. Design System

### 8.1 Brand

- **Name:** Ball Up Top
- **Tagline:** "Prove it on the court."
- **Voice:** Confident, playful, competitive, knowledgeable, authentic.
- **Logo:** A basketball with an upward arrow motif, symbolizing "up top" (the top of the key in basketball, and rising to the top). Wordmark in a bold, condensed sans-serif.
- **Logo Variations:** Full color (orange + dark), monochrome (white on dark, dark on light), icon-only (basketball + arrow).

### 8.2 Typography

- **Display/Heading Font:** "Anton" (Google Fonts) — a bold, condensed sans-serif with athletic, sporty energy. Used for hero text, page titles, stat numbers, and marketing.
- **Body Font:** "Inter" (Google Fonts) — a clean, highly legible sans-serif. Used for body text, UI labels, and messages.
- **Mono Font:** "JetBrains Mono" — used for stat codes, debug info, and technical labels.
- **Type Scale (rem, 1rem=16px):**
  - Display XL: 4.5rem / 1.0 / 900
  - Display L: 3.5rem / 1.05 / 900
  - Heading 1: 2.5rem / 1.1 / 800
  - Heading 2: 2rem / 1.15 / 700
  - Heading 3: 1.5rem / 1.2 / 700
  - Heading 4: 1.25rem / 1.3 / 600
  - Body L: 1.125rem / 1.5 / 400
  - Body: 1rem / 1.5 / 400
  - Body S: 0.875rem / 1.4 / 400
  - Caption: 0.75rem / 1.3 / 500
  - Overline: 0.6875rem / 1.2 / 700 / uppercase / letter-spacing 0.1em

### 8.3 Spacing

- Base unit: 4px. Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128.
- Page padding: 16px mobile, 24px tablet, 32px desktop.
- Card padding: 16px mobile, 20px desktop.
- Section gaps: 24px mobile, 32px desktop.

### 8.4 Color Palette

**Primary (Basketball Orange):**
- 50: #FFF4ED
- 100: #FFE6D5
- 200: #FFC8AA
- 300: #FFA170
- 400: #FF7438
- 500: #FF4F0F (Primary)
- 600: #F03A06
- 700: #C72C08
- 800: #9E260F
- 900: #7F230F
- 950: #440F05

**Dark (Court Black):**
- 50: #F6F7F9
- 100: #EBEDF2
- 200: #D4D8E3
- 300: #AE2B62
- 400: #828DB0
- 500: #627098
- 600: #4D597F
- 700: #3F4868
- 800: #373E58
- 900: #0F1117 (Court Black — primary dark surface)
- 950: #08090D

**Accent (Neon Court Line — electric green):**
- 400: #4ADE80
- 500: #22C55E
- 600: #16A34A

**Warning:** #F59E0B
**Danger:** #EF4444
**Success:** #22C55E
**Info:** #3B82F6

**Semantic mappings (CSS variables):**
- `--background`: Light mode #FFFFFF / Dark mode #0F1117
- `--foreground`: Light #0F1117 / Dark #F6F7F9
- `--card`: Light #FFFFFF / Dark #1A1D28
- `--primary`: #FF4F0F (both modes)
- `--primary-foreground`: #FFFFFF
- `--muted`: Light #F6F7F9 / Dark #1A1D28
- `--muted-foreground`: Light #627098 / Dark #828DB0
- `--border`: Light #EBEDF2 / Dark #373E58
- `--accent`: #22C55E (both modes)

### 8.5 Elevation & Shadows

- `shadow-xs`: `0 1px 2px rgba(0,0,0,0.05)`
- `shadow-sm`: `0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)`
- `shadow-md`: `0 4px 6px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)`
- `shadow-lg`: `0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)`
- `shadow-xl`: `0 20px 25px rgba(0,0,0,0.12), 0 10px 10px rgba(0,0,0,0.04)`
- `shadow-glow`: `0 0 20px rgba(255,79,15,0.3)` (for primary CTAs and highlights)

### 8.6 Icons

- **Library:** lucide-react
- **Style:** Outline (default), 1.5px stroke.
- **Sizes:** 16px (inline), 20px (UI), 24px (navigation), 32px (hero).
- **Custom icons:** Basketball, hoop, whistle, jersey, trophy — custom SVGs in `/src/components/icons/` for basketball-specific concepts not in lucide.

### 8.7 Illustrations

- Custom, flat-style illustrations with the brand color palette. Used for empty states, onboarding, and error states. Style: bold outlines, orange/dark/green palette, dynamic basketball-themed characters and scenes. Stored as SVG in `/src/components/illustrations/`.

### 8.8 Gradients

- **Primary Gradient:** `linear-gradient(135deg, #FF4F0F 0%, #FF7438 100%)` — used for CTAs, hero backgrounds, and accents.
- **Dark Gradient:** `linear-gradient(135deg, #0F1117 0%, #1A1D28 100%)` — used for dark surfaces.
- **Court Gradient:** `linear-gradient(180deg, #C72C08 0%, #FF4F0F 50%, #FF7438 100%)` — used for celebration backgrounds.
- **Victory Gradient:** `linear-gradient(135deg, #22C55E 0%, #4ADE80 100%)` — used for win states.
- **Stat Card Gradient:** `linear-gradient(135deg, #0F1117 0%, #373E58 100%)` with orange accent — used for shareable stat cards.

### 8.9 Motion

- **Duration:** Fast=150ms, Normal=250ms, Slow=400ms, Celebration=600ms.
- **Easing:** `ease-out` for entrances, `ease-in` for exits, `cubic-bezier(0.34, 1.56, 0.64, 1)` for playful bounces (trophies, celebrations).
- **Principles:** Smooth and athletic. No gratuitous animation. Every motion communicates state change. Reduced motion respected.
- **Common patterns:** Fade-in on scroll (`whileInView`), slide-up for sheets, scale for taps, confetti for wins, shimmer for loading, pulse for live indicators.

### 8.10 Buttons

- **Primary:** Primary gradient background, white text, `shadow-glow`, rounded-full, hover: scale 1.02 + glow increase, active: scale 0.98.
- **Secondary:** Card background, foreground text, border, hover: muted background.
- **Ghost:** Transparent, foreground text, hover: muted background.
- **Destructive:** Danger background, white text.
- **Icon:** Transparent, icon-only, 44x44px touch target, hover: muted background.
- **Sizes:** sm (h-36px, text-sm), default (h-44px, text-base), lg (h-52px, text-lg).
- **States:** default, hover, active, focus-visible (ring-2 ring-primary), disabled (opacity-50, cursor-not-allowed), loading (spinner, disabled).

### 8.11 Forms

- **Inputs:** Card background, border, rounded-lg, h-44px, focus: ring-2 ring-primary, border-primary. Placeholder: muted-foreground.
- **Labels:** Above input, text-sm, font-medium.
- **Errors:** Red border + red text below, aria-live.
- **Selects:** shadcn Select component, consistent styling.
- **Toggles:** shadcn Switch, primary color when on.
- **Sliders:** shadcn Slider, primary thumb.
- **Date/Time:** Native pickers or shadcn DatePicker.

### 8.12 Cards

- **Base:** Card background, rounded-xl (12px), border, shadow-sm, padding 16-20px.
- **Hover:** shadow-md, slight translateY(-2px) on interactive cards.
- **Types:** PostCard, GameCard, ChallengeCard, CommunityCard, TeamCard, StatCard, LeaderboardRow, NotificationCard, TrophyCard.
- **Variations:** Default (light surface), Elevated (dark surface for hero sections), Gradient (primary gradient for CTAs).

### 8.13 Badges

- **Base:** Rounded-full, text-xs, font-medium, padding 2px 8px.
- **Variants:** default (muted bg), primary (primary bg, white text), success (green), warning (amber), danger (red), outline (border only).
- **Use cases:** Challenge type, game status, achievement rarity, online status, streak count, rank.

### 8.14 Charts

- **Library:** recharts
- **Types:** Line (trends), Bar (comparisons), Area (cumulative), Pie/Donut (distribution), Calendar heatmap (streaks/grid).
- **Styling:** Primary color for main series, muted for secondary. Grid lines subtle. Tooltips with card styling. Animations on mount.

### 8.15 Navigation

- **Bottom Nav (mobile):** Fixed bottom, 5 items, active item: primary color + filled icon + label. Elevated center "Play" button. Safe area padding.
- **Sidebar (desktop):** Fixed left, 240px width, collapsible to 64px (icon-only). Active item: primary bg tint + primary text + left border accent.
- **Top Bar:** Sticky top, card background with backdrop blur, border-bottom. Height 56px.

### 8.16 Dialogs

- shadcn Dialog. Centered, card background, rounded-xl, shadow-xl. Backdrop: black 50% opacity with blur. Close button (X) top-right. Esc to close. Focus trap.

### 8.17 Toasts

- **Library:** sonner (primary) + shadcn Toaster (fallback).
- **Position:** Bottom-center on mobile, bottom-right on desktop.
- **Types:** default, success (green icon), error (red icon), info (blue icon).
- **Duration:** 4000ms default, 6000ms for errors. Dismissible.

### 8.18 Sheets

- shadcn Sheet. Bottom sheet on mobile (slide up), side sheet on desktop (slide from right or center modal). Drag handle at top (mobile). Backdrop dismiss.

### 8.19 Tabs

- shadcn Tabs. Underline style for primary navigation (active: primary color underline + primary text). Pill style for filters (active: primary bg).

### 8.20 Dark Mode & Light Mode

- **Default:** Dark mode (court black) — matches the basketball culture aesthetic and is the primary brand mode.
- **Toggle:** System / Light / Dark in settings. `class="dark"` on `<html>`.
- **Implementation:** CSS variables (HSL) for all semantic colors. `next-themes` or custom theme provider.
- **Contrast:** Both modes meet WCAG AA. Dark mode uses #0F1117 background with #F6F7F9 text. Light mode uses #FFFFFF background with #0F1117 text.

*(Sections 14–24 and Appendices A–D continue in BUILD_PROMPT_BASE44_PART2.md. Both files together constitute the complete implementation specification.)*