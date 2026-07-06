# BUILD_PROMPT_BASE44.md — Part 2 (Sections 14–24 + Appendices)

> This is a continuation of BUILD_PROMPT_BASE44.md. Sections 1–13 are in the primary file. This file contains Sections 14 through 24 and Appendices A–D. Both files together constitute the complete implementation specification.

---

## 14. Notifications

### 14.1 Push Notifications (FCM)

- **Registration:** On app load (if push enabled and permission granted), the client registers the FCM token via `POST /api/push-tokens`.
- **Sending:** Backend functions send push notifications via Firebase Admin SDK. A push is sent when a notification record is created AND the user is not currently active in the app (no presence heartbeat in the last 60 seconds) AND push is enabled for that notification type AND the current time is outside quiet hours.
- **Deep Links:** Each push notification includes a `url` field. Tapping the notification opens the app and navigates to that URL.
- **Notification Types & Templates:**
  - Daily Ball Knower: "🏀 Today's Ball Knower is live. Prove you know the game!" → `/daily`
  - Daily Grid: "📋 Your Daily Grid is ready. Fill all 9 for a bonus!" → `/daily/grid`
  - Challenge Invite: "{actor} challenged you to '{challenge_title}'" → `/challenges/:id`
  - Challenge Result: "Challenge complete! You {won/lost} '{challenge_title}'" → `/challenges/:id`
  - Game Invite: "{actor} invited you to '{game_title}'" → `/games/:id`
  - Game Reminder: "⏰ '{game_title}' starts in 1 hour" → `/games/:id`
  - Friend Request: "{actor} wants to be your friend" → `/friends`
  - DM: "{actor}: {message_preview}" → `/messages/:threadId`
  - Group Mention: "{actor} mentioned you in {group_name}" → `/messages/:threadId`
  - Achievement Unlock: "🏆 You earned '{achievement_name}'!" → `/profile/:me/trophies`
  - Streak Reminder: "🔥 Your {streak_type} streak is at risk! Answer today to keep it alive." → `/daily`
  - Leaderboard Milestone: "📈 You're now #{rank} on the {leaderboard} leaderboard!" → `/leaderboards/:type`
  - Trash Talk: "{actor} sent you trash talk: '{message}'" → `/messages/:threadId`

### 14.2 Email Notifications (Resend)

- Sent for: email digests (daily/weekly), critical account events (password reset, account suspension), and weekly streak summaries.
- **Digest:** A summary of the user's activity and community updates, sent daily or weekly based on settings.
- **Templates:** HTML email templates with Ball Up Top branding. Stored in `/src/lib/email-templates/`.
- **Sent via:** Base44 `SendEmail` integration or direct Resend API in backend functions.

### 14.3 In-App Notifications

- Bell icon in the TopBar with an unread badge count.
- Dropdown shows latest 20 notifications with tap-to-navigate.
- Full list at `/notifications` with filters and mark-all-read.
- Real-time updates via the `notifications:{userId}` realtime channel.

### 14.4 Reminder Digests

- **Streak Reminder:** If a user has a streak of 3+ days and hasn't answered the Daily Ball Knower by 8:00 PM local time, send a push reminder.
- **Game Reminder:** 1 hour before a game the user has joined, send a push reminder.
- **Weekly Digest:** Every Sunday at 10:00 AM local time, send an email digest with: weekly stats, leaderboard rank, challenge results, community highlights, upcoming games.

### 14.5 Notification Triggers Summary

| Event | Push | Email | In-App |
|---|---|---|---|
| Like on post | If enabled | No | Yes |
| Comment on post | If enabled | No | Yes |
| Friend request | If enabled | No | Yes |
| Friend accept | If enabled | No | Yes |
| Challenge invite | If enabled | No | Yes |
| Challenge result | If enabled | No | Yes |
| Game invite | If enabled | No | Yes |
| Game reminder (1h before) | If enabled | No | Yes |
| DM received | If enabled | No | Yes |
| Group mention | If enabled | No | Yes |
| Daily Ball Knower (6 AM) | If enabled | No | Yes |
| Daily Grid (6 AM) | If enabled | No | Yes |
| Achievement unlock | If enabled | No | Yes |
| Streak at risk (8 PM) | If enabled | No | Yes |
| Leaderboard milestone | If enabled | No | Yes |
| Trash talk received | If enabled | No | Yes |
| Weekly digest (Sunday) | No | If enabled | No |
| Password reset | No | Yes | No |
| Account suspension | No | Yes | Yes |

---

## 15. Authentication

### 15.1 Email/Password

- Registration: email + password (min 8 chars, 1 number). Confirmation email with OTP (6-digit code). User must verify OTP before account is active.
- Login: email + password. JWT issued.
- Password reset: `POST /api/auth/forgot-password` → email with reset link (token). `POST /api/auth/reset-password` with token + new password.

### 15.2 Google OAuth

- "Continue with Google" button. Uses Supabase Auth Google provider.
- Redirects back to the app with token. New users complete onboarding flow.

### 15.3 Apple Sign-In

- "Continue with Apple" button. Uses Supabase Auth Apple provider.
- Required for iOS App Store compliance.

### 15.4 Magic Links

- "Sign in with magic link" option on login page. User enters email → receives email with a sign-in link → clicking the link authenticates the user.
- Uses Supabase Auth magic link flow.

### 15.5 Session Management

- Access token: 15-minute TTL. Stored in memory (not localStorage for XSS protection; httpOnly cookie if using server-side rendering).
- Refresh token: 7-day TTL. Stored securely.
- Token refresh: automatic via Supabase Auth client when access token expires.
- Multi-device: each device gets its own session. Sessions visible in settings with revoke option.
- Logout: revokes tokens, clears local state, redirects to login.

### 15.6 Role-Based Access

- **User (default):** Standard access to all app features within their permissions.
- **Moderator:** User + platform-wide moderation queue access (read-only on admin dashboard, full moderation actions).
- **Admin:** Full access to admin dashboard, user management, system settings, feature flags, audit log.
- Community and team roles are separate from platform roles (see Database Schema).

### 15.7 Permissions

Enforced via RLS policies:
- Users can only read/write their own data (profile, settings, push tokens).
- Users can only update/delete their own content (posts, comments, messages).
- Community admins/mods can manage community content and members.
- Team captains can manage team roster and settings.
- Platform admins/mods can access moderation queue and user management.
- Game creators can manage their games.
- Challenge creators can manage their challenges.

### 15.8 Admin Hierarchy

- **Admin > Moderator > User.**
- Admins can promote/demote users to moderator or admin.
- Admins can suspend/ban users.
- Admins can transfer community ownership.
- All admin actions are logged in the audit log.

---

## 16. Security

### 16.1 Row Level Security (RLS)

Enabled on every table. Policies use `auth.uid()` to identify the current user.

**Example policies:**

```sql
-- profiles: read
CREATE POLICY "profiles_read" ON profiles FOR SELECT
  USING (privacy_level = 'public'
    OR id = auth.uid()
    OR (privacy_level = 'friends' AND EXISTS (
      SELECT 1 FROM friends WHERE
        (requester_id = auth.uid() AND addressee_id = profiles.id AND status = 'accepted')
        OR (addressee_id = auth.uid() AND requester_id = profiles.id AND status = 'accepted')
    )));

-- profiles: update own
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  USING (id = auth.uid());

-- posts: read
CREATE POLICY "posts_read" ON posts FOR SELECT
  USING (deleted_at IS NULL AND (
    privacy = 'public'
    OR author_id = auth.uid()
    OR (privacy = 'friends' AND EXISTS (
      SELECT 1 FROM friends WHERE
        (requester_id = auth.uid() AND addressee_id = posts.author_id AND status = 'accepted')
        OR (addressee_id = auth.uid() AND requester_id = posts.author_id AND status = 'accepted')
    ))
    OR (privacy = 'community' AND EXISTS (
      SELECT 1 FROM community_members WHERE community_id = posts.community_id AND user_id = auth.uid() AND status = 'member'
    ))
  ));

-- posts: insert own
CREATE POLICY "posts_insert_own" ON posts FOR INSERT
  WITH CHECK (author_id = auth.uid());

-- posts: update/delete own
CREATE POLICY "posts_modify_own" ON posts FOR UPDATE
  USING (author_id = auth.uid());
CREATE POLICY "posts_delete_own" ON posts FOR DELETE
  USING (author_id = auth.uid());

-- messages: read (thread participants only)
CREATE POLICY "messages_read" ON messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM thread_participants
    WHERE thread_id = messages.thread_id AND user_id = auth.uid() AND left_at IS NULL
  ));

-- messages: insert own
CREATE POLICY "messages_insert_own" ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid() AND EXISTS (
    SELECT 1 FROM thread_participants
    WHERE thread_id = messages.thread_id AND user_id = auth.uid() AND left_at IS NULL
  ));

-- admin-only tables (audit_logs)
CREATE POLICY "audit_logs_read" ON audit_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator')));
```

### 16.2 Input Validation

- All client inputs validated with Zod schemas before submission.
- Server-side validation via Base44 entity schema validation (all fields typed and constrained).
- SQL injection prevention: parameterized queries only (Supabase client uses parameterized queries by default). No raw SQL from client input.
- XSS prevention: React escapes all rendered content. `dangerouslySetInnerHTML` never used. User-generated markdown rendered via `react-markdown` with sanitization.

### 16.3 Rate Limiting

- Implemented at the API gateway level (Supabase Edge Functions or Base44 middleware).
- Per-user rate limits as specified in Section 4.7.
- Rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.
- 429 response with `Retry-After` header.

### 16.4 Encryption

- **In Transit:** TLS 1.3 for all connections (HTTPS, WSS).
- **At Rest:** AES-256 (Supabase default for database and storage).
- **Media URLs:** Private media uses signed URLs with expiration (default 5 minutes for `CreateFileSignedUrl`).

### 16.5 Secure Uploads

- File type validation: client-side (accept attribute + MIME check) and server-side (Supabase Storage bucket policies restrict MIME types).
- File size limits: enforced client-side and server-side.
- Virus scanning: Supabase Storage hooks or post-upload scan.
- File names: randomized UUIDs (no user-provided file names in storage paths) to prevent path traversal.

### 16.6 Audit Logging

- All sensitive actions logged to `audit_logs`:
  - Authentication events (login, logout, password reset, role change).
  - Moderation actions (warn, mute, ban, content removal).
  - Admin actions (user suspension, feature flag toggle, community ownership transfer).
  - Data exports.
- Logs are immutable (no update/delete policies).
- Retained for 90 days (configurable).

### 16.7 JWT Validation

- Supabase Auth handles JWT issuance and validation.
- All API requests include `Authorization: Bearer <token>`.
- Base44 backend functions validate the JWT automatically.
- Expired tokens return 401; client refreshes or redirects to login.

### 16.8 Environment Variables & Secret Management

- All secrets stored as Vercel environment variables (frontend: public prefix `VITE_`, backend: no prefix).
- Supabase service role key NEVER exposed to the frontend.
- Supabase Vault for additional secrets (third-party API keys that need rotation).
- `.env` files in `.gitignore`. No secrets in code.

---

## 17. Background Jobs

All background jobs run as scheduled tasks (Supabase Edge Functions with Vercel Cron, or Base44 scheduled tasks).

### 17.1 Daily Ball Knower Refresh

- **Schedule:** Daily at 2:00 AM UTC.
- **Actions:**
  1. Generate tomorrow's question via AI (Section 13.1).
  2. Validate and store.
  3. If today's question wasn't reviewed by 5:00 AM, auto-approve.
  4. Schedule push notification dispatch for 6:00 AM per-user local time (batched by timezone).

### 17.2 Daily Grid Refresh

- **Schedule:** Weekly (Sunday at 2:00 AM UTC).
- **Actions:** Generate 7 grids for the upcoming week via AI (Section 13.2). Validate and store.

### 17.3 Leaderboard Recalculation

- **Schedule:** Every 15 minutes for daily leaderboards. Hourly for weekly. Daily at 1:00 AM UTC for monthly and all-time.
- **Actions:**
  1. Recalculate ranks for each leaderboard type/scope/timeframe.
  2. Update `leaderboards` table.
  3. Set `previous_rank` for rank-change indicators.
  4. Broadcast `rank:update` realtime events.
  5. If a user crossed a milestone (e.g., entered top 10, reached #1), create a notification.

### 17.4 Notification Queues

- **Schedule:** Continuous (event-driven + periodic flush).
- **Actions:** Process pending push notifications, respect quiet hours, batch where possible, send via FCM.

### 17.5 Email Digests

- **Schedule:** Daily at 8:00 AM UTC (for daily digest users), Sunday at 10:00 AM UTC (for weekly digest users).
- **Actions:** Compile user activity summary, render email template, send via Resend.

### 17.6 Media Optimization

- **Schedule:** Continuous (on upload).
- **Actions:** After media upload, trigger optimization: resize images to max 2048px, generate thumbnails (400px, 800px), transcode videos to 720p H.264, generate video thumbnails. Store optimized versions in Supabase Storage.

### 17.7 Cleanup Jobs

- **Schedule:** Daily at 3:00 AM UTC.
- **Actions:**
  1. Hard-delete soft-deleted records older than 30 days.
  2. Delete expired invites.
  3. Clean up orphaned media (media not associated with any entity).
  4. Clear old realtime presence entries.
  5. Archive completed challenges older than 90 days.
  6. Delete read notifications older than 60 days.

### 17.8 Analytics Aggregation

- **Schedule:** Hourly.
- **Actions:** Aggregate raw analytics events into hourly/daily summaries for the admin dashboard. Update DAU/MAU metrics.

### 17.9 Streak Management

- **Schedule:** Daily at 12:05 AM UTC (just after midnight).
- **Actions:** For each user with an active streak, check if they completed the daily activity (Ball Knower answer, grid completion, etc.) on the previous day. If not, reset `current_count` to 0. If yes, increment (already done on activity). Update `longest_count` if exceeded.

### 17.10 Achievement Check

- **Schedule:** Event-driven (after any stat-changing action: game log, challenge complete, daily answer, etc.).
- **Actions:** Check the user's stats against all achievement requirements. If a new achievement is earned, insert into `user_achievements`, create a notification, trigger push, and dispatch confetti on next app open.

---

## 18. Performance

### 18.1 Lazy Loading

- Route-level code splitting via `React.lazy()` and `Suspense`. Each page is a separate chunk.
- Below-the-fold components lazy-loaded (e.g., 3D trophy case, charts).
- Images lazy-loaded with `loading="lazy"` and Intersection Observer for blur-up effect.

### 18.2 Image Optimization

- All images served via CDN (Supabase Storage CDN).
- Responsive images: `srcset` with multiple sizes (400px, 800px, 2048px).
- Format: WebP for photos, SVG for icons and illustrations.
- Blur-up placeholder: a tiny (20px) blurred version is loaded first, then the full image fades in.

### 18.3 Code Splitting

- Vendor code split from app code.
- Large libraries (three.js, recharts, react-leaflet) loaded only on the pages that use them.
- Shared chunks extracted for common components.

### 18.4 Caching

- React Query for all data fetching with appropriate stale times.
- Service worker caches the app shell and static assets.
- CDN caching for media (1-year cache, content-addressed).
- Server-side query result caching for expensive aggregations.

### 18.5 Database Indexing

- All foreign keys indexed.
- All frequently queried fields indexed (see schema indexes).
- Composite indexes for common query patterns (feed pagination, message pagination, leaderboard queries).
- GIN indexes for full-text search and array contains queries.
- GIST indexes for geographic queries.

### 18.6 Realtime Optimization

- Channel subscriptions are scoped (per-thread, per-community, per-challenge) to minimize unnecessary events.
- Presence heartbeats throttled (15s).
- Typing indicators throttled (3s).
- Client filters events locally to avoid unnecessary re-renders.

### 18.7 Optimistic UI

- All writes (posts, messages, likes, joins) update the UI immediately.
- On server confirmation, the optimistic update is reconciled with the server response.
- On failure, the optimistic update is rolled back with an error toast.
- React Query's `onMutate` / `onError` / `onSettled` callbacks manage this.

### 18.8 Offline Caching

- Service worker caches: app shell, last viewed feed (HTML), recent DMs (data).
- IndexedDB for offline message queue and draft storage.
- Offline writes queued and synced on reconnection.
- Offline indicator banner.

---

## 19. Accessibility

### 19.1 WCAG 2.2 AA Compliance

- All pages meet WCAG 2.2 AA standards.
- Automated testing with axe-core in CI.
- Manual testing with screen readers (NVDA, VoiceOver).

### 19.2 Keyboard Navigation

- All interactive elements reachable via Tab key in logical order.
- Visible focus indicators (ring-2 ring-primary).
- Skip-to-content link at the top of every page.
- Modal focus trapping (focus stays within dialog while open).
- Esc key closes modals, sheets, and dropdowns.

### 19.3 Focus Management

- On route change, focus moves to the page heading or main content.
- On modal open, focus moves to the first interactive element.
- On modal close, focus returns to the triggering element.
- On list updates (e.g., new message), focus is not stolen from the current context.

### 19.4 Reduced Motion

- `prefers-reduced-motion` media query respected.
- When reduced motion is enabled: animations are minimal (instant transitions, no confetti, no parallax).
- Setting available in user preferences (overrides system preference if explicitly set).

### 19.5 Screen Readers

- Semantic HTML: `<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<footer>`, `<button>`, `<a>`, `<form>`, `<input>`, `<label>`.
- ARIA labels on icon-only buttons.
- ARIA live regions for dynamic content (notifications, toasts, score updates, typing indicators).
- ARIA roles for complex widgets (tabs, dialogs, menus, lists).
- Alt text on all meaningful images. Decorative images have empty alt.

### 19.6 Semantic HTML

- Headings hierarchy (h1 → h2 → h3) maintained on every page.
- Lists use `<ul>`/`<ol>`/`<li>`.
- Tables use proper `<table>`, `<thead>`, `<tbody>`, `<th scope>`.
- Forms use `<label>` associated with inputs via `htmlFor`/`id`.

### 19.7 Touch Targets

- All interactive elements have a minimum 44×44px touch target on mobile.
- Spacing between interactive elements ensures no accidental taps.

### 19.8 Color Contrast

- All text meets 4.5:1 (normal) or 3:1 (large) contrast ratio.
- All UI components (borders, icons) meet 3:1 contrast.
- Tested in both light and dark modes.

---

## 20. Deployment

### 20.1 Supabase

- **Project Setup:** Create a Supabase project. Note the project URL, anon key, and service role key.
- **Database:** Run migrations in order (see Appendix D). Apply RLS policies. Create storage buckets.
- **Auth:** Configure email templates (welcome, reset, OTP). Add Google and Apple OAuth providers with client IDs/secrets. Configure redirect URLs.
- **Storage:** Create buckets: `posts`, `messages`, `avatars`, `banners`, `game-media`, `voice-notes`. Set public read for `avatars` and `banners`; private for others (signed URLs).
- **Realtime:** Enable Realtime on tables: `messages`, `threads`, `posts`, `notifications`, `challenge_participants`, `leaderboards`, `game_participants`.
- **Edge Functions:** Deploy scheduled functions for background jobs.
- **Environment Variables (Supabase):** `FCM_SERVER_KEY`, `RESEND_API_KEY`, `MAPBOX_ACCESS_TOKEN`, `GEMINI_API_KEY` (if direct access).

### 20.2 Vercel

- **Project:** Import the Git repository. Framework preset: Vite.
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Environment Variables:** All `VITE_*` variables (frontend) + backend secrets (if using Vercel Serverless Functions for backend logic). See Section 5 for the full list.
- **Domains:** Configure custom domain (e.g., `balluptop.com`). Set up DNS (CNAME to Vercel).
- **Preview Deployments:** Enabled on every pull request. Production deployment on merge to `main`.

### 20.3 Environment Variables

Set in Vercel (and Supabase for backend-specific):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_MAPBOX_ACCESS_TOKEN`
- `VITE_POSTHOG_KEY`
- `VITE_POSTHOG_HOST`
- `VITE_SENTRY_DSN`
- `VITE_APP_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `FCM_SERVER_KEY` (server-only)
- `RESEND_API_KEY` (server-only)
- `GEMINI_API_KEY` (if needed beyond Base44)
- `VITE_STORAGE_BASE_URL`

### 20.4 Database Migrations

- Migrations are SQL files in `/supabase/migrations/`, numbered in order:
  1. `001_create_profiles.sql`
  2. `002_create_sports.sql`
  3. `003_create_communities.sql`
  4. `004_create_teams.sql`
  5. `005_create_games.sql`
  6. `006_create_challenges.sql`
  7. `007_create_threads_messages.sql`
  8. `008_create_posts_comments_likes.sql`
  9. `009_create_notifications.sql`
  10. `010_create_achievements.sql`
  11. `011_create_daily_questions_grids.sql`
  12. `012_create_leaderboards_statistics.sql`
  13. `013_create_streaks_presence.sql`
  14. `014_create_push_tokens_settings.sql`
  15. `015_create_reports_audit_logs.sql`
  16. `016_create_friends_blocked_invites.sql`
  17. `017_create_sprints.sql`
  18. `018_create_game_stats.sql`
  19. `019_create_indexes.sql`
  20. `020_create_rls_policies.sql`
  21. `021_create_triggers.sql`
  22. `022_seed_data.sql`

### 20.5 Seed Data

See Section 21. Seed data is applied via migration `022_seed_data.sql` or via the Base44 `create_entity_records` tool.

### 20.6 Monitoring

- Sentry: frontend errors (`@sentry/react`), backend errors (`@sentry/node` in Edge Functions). Source maps uploaded on deploy.
- Vercel Analytics: Web Vitals (LCP, FID, CLS, TTFB).
- Supabase Dashboard: database performance, auth metrics, storage usage, realtime connections.
- Custom health endpoint: `/api/health` returns `{ status: 'ok', timestamp, db: 'ok', realtime: 'ok' }`. Monitored by Vercel Cron + Sentry.

### 20.7 Backups

- Supabase automatic daily backups (Point-in-Time Recovery for 7 days on Pro plan).
- Weekly manual backup export to cold storage (AWS S3 or equivalent) for long-term retention.

### 20.8 Analytics

- PostHog: auto-capture page views + custom events (Section 4.8).
- PostHog dashboard: DAU/MAU, retention, funnels, feature usage.

### 20.9 CI/CD

- **Repository:** GitHub (or GitLab).
- **Workflow:**
  1. Developer creates a branch, makes changes, opens a PR.
  2. CI runs: lint (ESLint), type-check (TypeScript), unit tests, build.
  3. Vercel creates a preview deployment. Reviewer tests on the preview URL.
  4. On approval, PR is merged to `main`.
  5. Vercel deploys to production automatically.
  6. Supabase migrations run via CI (if schema changes) or manually via Supabase CLI.
  7. Sentry and PostHog verify no regression in production.

---

## 21. Seed Data

### 21.1 Demo Users (10)

1. Marcus Johnson — @marcusj — Casual Player — Brooklyn, NY
2. Jasmine Lee — @jasminlee — Team Captain — Los Angeles, CA
3. Derek Coleman — @dcoach — League Organizer — Chicago, IL
4. Devon Brooks — @devonb — Trash Talker — Atlanta, GA
5. Priya Sharma — @priyaball — Statistician — San Francisco, CA
6. Tony Russo — @ballknower — Ball Knower — Boston, MA
7. Aisha Williams — @aishaw — Community Moderator — Houston, TX
8. Carlos Mendez — @sneakercarlos — Business Partner — Miami, FL
9. Jordan Blake — @jblake — Competitive Player — Detroit, MI
10. Riley Chen — @rileychen — Casual Player — Seattle, WA

### 21.2 Demo Teams (5)

1. Brooklyn Ballers — Captain: Marcus Johnson — Brooklyn, NY
2. LA Sparks Rec — Captain: Jasmine Lee — Los Angeles, CA
3. Windy City Warriors — Captain: Derek Coleman — Chicago, IL
4. ATL Hustle — Captain: Devon Brooks — Atlanta, GA
5. Bay City Ballers — Captain: Priya Sharma — San Francisco, CA

### 21.3 Demo Challenges (10)

1. "First to 21" — Head-to-Head — Marcus vs Devon — Active
2. "Most Games This Week" — Group — Brooklyn Ballers community — Active
3. "Free Throw Streak: 50 in a Row" — Skill — Public — Active
4. "Loser Changes PFP" — Trash Talk — Jordan vs Riley — Active
5. "3-Point Shootout" — Head-to-Head — Priya vs Jasmine — Completed
6. "Play 5 Days in a Row" — Streak — Community — Active
7. "Most Points in a Game" — Group — Windy City Warriors — Active
8. "1v1 Tournament" — Group — ATL Hustle — Completed
9. "Assist Leader This Week" — Group — Bay City Ballers — Active
10. "Trash Talk Champion" — Trash Talk — Community — Completed

### 21.4 Daily Questions (7 days)

1. "Which NBA player has the most career points?" — Easy — Records — Options: Kareem Abdul-Jabbar, LeBron James, Karl Malone, Kobe Bryant
2. "What year was the 3-point line introduced in the NBA?" — Medium — Rules — Options: 1979, 1980, 1981, 1982
3. "Who won the NBA Finals MVP in 2024?" — Hard — Current NBA — (dynamic, needs context)
4. "Which college did Michael Jordan attend?" — Easy — College — Options: UNC, Duke, Kentucky, UCLA
5. "Who holds the record for most assists in a single NBA game?" — Hard — Records — Options: Scott Skiles, John Stockton, Magic Johnson, Rajon Rondo
6. "What is the diameter of a regulation basketball hoop?" — Medium — Rules — Options: 18 inches, 17 inches, 19 inches, 20 inches
7. "Which player is known as 'The Greek Freak'?" — Easy — Player Trivia — Options: Giannis Antetokounmpo, Luka Dončić, Nikola Jokić, Joel Embiid

### 21.5 Demo Communities (5)

1. Brooklyn Run — Public — Location — Brooklyn, NY — Owner: Marcus Johnson — 245 members
2. Women's Hoops LA — Private — Interest — Los Angeles, CA — Owner: Jasmine Lee — 120 members
3. Windy City League — Public — League — Chicago, IL — Owner: Derek Coleman — 500 members
4. ATL Streetball — Public — Location — Atlanta, GA — Owner: Devon Brooks — 320 members
5. Bay Area Ballers — Public — Location — San Francisco, CA — Owner: Priya Sharma — 180 members

### 21.6 Demo Messages (sample threads)

1. DM: Marcus ↔ Devon (trash talk about upcoming challenge)
2. Group: Brooklyn Ballers (team chat, game coordination)
3. Group: Windy City League (community announcements)
4. DM: Jasmine ↔ Priya (challenge result discussion)

### 21.7 Demo Leaderboards

- Ball Knower: 10 users ranked by points (Tony Russo #1, Marcus #5, etc.)
- Challenges: 10 users ranked by wins (Devon #1, Marcus #3, etc.)
- Streaks: 10 users ranked by current streak (Tony #1 at 45 days, etc.)
- Sprint: 10 users ranked by weekly high score
- Games: 10 users ranked by wins (Marcus #1 at 23 wins, etc.)
- Grid: 10 users ranked by total grid points

### 21.8 Demo Games (5)

1. "Tuesday Night Run" — Pickup 5v5 — Brooklyn, NY — Tomorrow 7 PM — 8/10 players — Open
2. "Women's Scrimmage" — Scrimmage — Los Angeles, CA — Saturday 10 AM — 6/10 — Open
3. "Lunchtime 3v3" — Half-court 3v3 — Chicago, IL — Today 12 PM — 4/6 — Started
4. "Sunday Showcase" — Full Court 5v5 — Atlanta, GA — Sunday 2 PM — 10/10 — Full
5. "Morning Hoops" — Pickup — San Francisco, CA — Friday 6 AM — 3/8 — Open

### 21.9 Demo Achievements (catalog, 30+)

See Section 3.15 for the full achievement list. All are seeded in the `achievements` table with slugs, names, descriptions, categories, icons, rarity, and requirement JSON.

### 21.10 Demo Statistics

Each demo user has populated `statistics` records (all-time, yearly, monthly) with realistic numbers: games played (10–100), win rates (40–70%), ball knower points (100–5000), streaks (0–45), grid points (0–2000), challenge wins (0–25).

---

## 22. Testing

### 22.1 Unit Testing

- **Framework:** Vitest + React Testing Library.
- **Scope:** Utility functions, hooks, individual components (rendering, props, state, events).
- **Coverage target:** 80% of utility functions and hooks.
- **Examples:** `formatStreak()`, `calculateFeedScore()`, `useAuth()`, `Avatar` rendering, `PostCard` like button.

### 22.2 Integration Testing

- **Framework:** Vitest + React Testing Library + MSW (Mock Service Worker).
- **Scope:** Component interactions, data fetching, optimistic updates, form submissions.
- **Examples:** Feed loads and displays posts, post composer creates a post and it appears in the feed, message thread sends and receives messages.

### 22.3 End-to-End (E2E) Testing

- **Framework:** Playwright.
- **Scope:** Full user flows across multiple pages.
- **Test cases:**
  - Register → OTP → Onboarding → Home feed.
  - Login → Answer Daily Ball Knower → See result.
  - Create a game → Join → Start → Log result → Check stats update.
  - Create a challenge → Invite friend → Friend accepts → Log scores → Complete → Check leaderboard.
  - Send DM → Receive reply → Check notification.
  - Search for a community → Join → Post → See in feed.
  - Complete Daily Grid → Earn badge → Check trophy case.
  - Sprint mode → Complete → Check leaderboard.

### 22.4 Realtime Testing

- **Framework:** Playwright + Supabase Realtime test utilities.
- **Scope:** Message delivery, presence, typing indicators, leaderboard updates, notification delivery.
- **Test cases:** Two browser contexts — send message in one, verify it appears in the other within 1 second. Verify online status updates. Verify typing indicator shows.

### 22.5 Accessibility Testing

- **Framework:** axe-core (automated, in CI) + manual screen reader testing.
- **Scope:** All pages and components.
- **Test cases:** Every page passes axe-core with zero violations. Keyboard navigation test on every flow. Screen reader test on critical flows (login, feed, messages, daily question).

### 22.6 Performance Testing

- **Framework:** Lighthouse CI (automated) + WebPageTest (manual).
- **Scope:** Page load, interaction latency, scroll performance.
- **Targets:** Lighthouse Performance score ≥ 90. LCP < 1.5s. CLS < 0.1. TBT < 200ms.

### 22.7 Load Testing

- **Framework:** k6 or Artillery.
- **Scope:** API endpoints under load, realtime connections, database queries.
- **Targets:** 1000 concurrent users with < 500ms p95 response time. 10,000 concurrent realtime connections. Database CPU < 70% under peak load.

---

## 23. Privacy & Legal

### 23.1 Privacy Policy

- Hosted at `/about/privacy`.
- Covers: data collected (account info, usage data, location, device info), how data is used (app functionality, analytics, personalization), data sharing (no selling, shared only with service providers under DPA), data retention (90 days for logs, account data deleted on account deletion), user rights (access, export, delete, correct), cookies and tracking, children's privacy (13+ only), changes to policy.
- Written in plain language. Last updated date displayed.

### 23.2 Terms of Service

- Hosted at `/about/terms`.
- Covers: account registration and responsibility, acceptable use policy (no harassment, hate speech, spam, illegal content), user-generated content licensing (user grants Ball Up Top a license to display content), intellectual property, disclaimers (no warranty for game results or stat accuracy), limitation of liability, termination, dispute resolution, changes to terms.
- Last updated date displayed.

### 23.3 Community Guidelines

- Hosted at `/about/guidelines`.
- Covers: expected behavior (respect, sportsmanship, honesty), prohibited behavior (harassment, hate speech, threats, doxxing, spam, impersonation, cheating/fake stats), enforcement (warnings, mutes, bans, permanent bans), reporting process, appeal process.
- Written in the brand voice: clear, fair, basketball-themed.

### 23.4 Content Moderation

- Automated: AI moderation (Section 13.7) flags content before publication.
- Community-driven: User reports enter the moderation queue.
- Human review: Community moderators and platform admins review flagged/reported content.
- Actions: dismiss, warn, remove content, mute (temporary, 1–7 days), ban (permanent from community or platform), shadowban (content hidden from others, author unaware).
- Transparency: Users are notified when their content is removed, with the reason and appeal option.

### 23.5 User Reporting

- Users can report: posts, comments, messages, users, games, challenges, communities.
- Report reasons: spam, harassment, hate speech, violence, nudity, misinformation, other (with description).
- Reports are reviewed by moderators within 48 hours.
- Reporters receive a notification when the report is resolved (without revealing specific actions taken against the reported user).

---

## 24. Future Roadmap

### 24.1 Native Mobile Apps (Phase 2)
- React Native or Capacitor wrapper around the PWA for iOS and Android App Store distribution.
- Native push notifications, biometric auth, native share sheet, camera integration.

### 24.2 Wearables (Phase 3)
- Apple Watch / WearOS companion apps.
- Quick glance at Daily Ball Knower, streak status, next game time.
- Heart rate tracking during games (optional, for fitness stats).

### 24.3 AI Coaching (Phase 3)
- Personalized training recommendations based on logged stats (e.g., "Your 3-point percentage is below 30%. Try this drill.").
- Post-game AI analysis with suggested improvements.
- Weekly training plans generated by AI.

### 24.4 Tournament Management (Phase 2)
- Bracket generation (single elimination, double elimination, round-robin).
- Seeding based on community rankings.
- Live bracket updates via realtime.
- Tournament-specific leaderboards and achievements.

### 24.5 League Integrations (Phase 3)
- Import schedules and rosters from external league management tools.
- Sync stats with official league stat keepers.
- League standings integration.

### 24.6 Video Highlights (Phase 3)
- In-app video recording and clipping.
- AI-assisted highlight reel generation from game footage.
- Highlight sharing to feed and social media.
- Tagging players in video highlights.

### 24.7 Live Streaming (Phase 4)
- In-app live streaming of games (via integration with streaming providers).
- Real-time spectator chat.
- Streamer monetization (tipping, subscriptions).

### 24.8 Additional Future Features
- Betting/prediction markets (compliance-dependent).
- NIL (Name, Image, Likeness) marketplace for college players.
- Recruiting tools for high school/college coaches.
- Court condition reporting (community-maintained court quality data).
- Equipment marketplace (buy/sell/trade basketball gear).
- Virtual reality court experience (Meta Quest integration).

---

## Appendix A: Complete UI Element Inventory

### A.1 Buttons

| Button | Location | Action |
|---|---|---|
| Sign In | Login | Submit login form |
| Continue with Google | Login, Register | Google OAuth |
| Continue with Apple | Login, Register | Apple OAuth |
| Sign in with magic link | Login | Send magic link email |
| Forgot password? | Login | Navigate to forgot password |
| Don't have an account? Sign up | Login | Navigate to register |
| Continue | Register (step 1, 2) | Proceed to next step |
| Verify | Register (OTP) | Verify OTP code |
| Resend code | Register (OTP) | Resend OTP |
| Get Started | Onboarding | Begin onboarding |
| Next | Onboarding steps | Proceed |
| Skip | Onboarding steps | Skip step |
| Post | Post composer | Publish post |
| Like | PostCard, Comment | Toggle like |
| Comment | PostCard | Open comment input |
| Share | PostCard | Open share sheet |
| Bookmark | PostCard | Save post |
| Follow/Unfollow | Profile, Community | Toggle follow |
| Join/Leave | Community, Game, Challenge | Toggle membership |
| Send | Chat input | Send message |
| Attach | Chat input | Open media picker |
| Voice | Chat input | Start voice recording |
| Create Challenge | Challenges | Open create challenge |
| Create Game | Games | Open create game |
| Create Community | Communities | Open create community |
| Create Team | Teams | Open create team |
| Start Sprint | Sprint hub | Begin sprint |
| Share Result | Daily Ball Knower result | Share to feed/DM |
| Share Rank | Leaderboard | Generate stat card |
| Save | Settings forms | Save settings |
| Delete Account | Account settings | Delete account (confirmation) |
| Mark All Read | Notifications | Mark all notifications read |
| Accept/Decline | Invitations, Friend requests | Accept or decline |
| Challenge | Profile | Create challenge with user |
| Add Friend | Profile, Friends | Send friend request |
| Message | Profile | Open DM |
| Block | Profile menu | Block user |
| Edit | Profile (self) | Navigate to account settings |
| Start Game | Game detail (creator) | Start game |
| Log Result | Game detail (creator) | Open result logger |
| Cancel | Game detail (creator) | Cancel game |
| Get Directions | Game detail | Open maps app |
| Complete | Challenge detail (creator) | Complete challenge |
| Log Score | Challenge detail | Log participant score |
| Pin/Unpin | Community (mod) | Pin/unpin post |
| Remove | Moderation queue | Remove content |
| Warn | Moderation queue | Warn user |
| Ban | Moderation queue, Admin | Ban user |
| Suspend | Admin users | Suspend user |
| Promote/Demote | Admin users | Change role |
| Send Announcement | Admin | Send platform-wide notification |

### A.2 Dropdowns

- Profile avatar dropdown (Profile, Settings, Admin, Logout)
- Post menu (Edit, Delete, Report, Share, Copy link)
- Comment menu (Reply, Report, Delete)
- Message menu (Reply, React, Edit, Delete, Copy)
- Thread header menu (Mute, Leave group, Settings, Block user)
- Filter dropdowns (Challenges type, Games type/skill, Leaderboards timeframe, Notifications type)
- Sort dropdowns (Feed, Games list, Search results)
- Community settings menu (Edit, Members, Moderation, Transfer ownership, Delete)
- Admin user actions menu (View, Suspend, Ban, Change role)

### A.3 Modals

- Post composer
- Create challenge
- Create game
- Create community
- Create team
- Delete confirmation (account, post, game, etc.)
- Report content
- Share sheet (share to DM, community, copy link)
- Image/video viewer (full-screen)
- Stat card export preview
- Game result logger
- Challenge score logger
- Friend picker (for invites)
- Community picker (for post tagging)
- User detail (admin)
- Achievement detail (from trophy grid)

### A.4 Sheets (Bottom/Side)

- Post composer (mobile bottom sheet)
- Create flows (mobile bottom sheet)
- Message attachment picker
- Thread settings (side sheet)
- Community settings (side sheet)
- Filter panel (mobile bottom sheet)
- User profile quick view (mobile bottom sheet, from mention tap)
- Onboarding (full-screen sheet)

### A.5 Animations

| Animation | Trigger | Duration | Element |
|---|---|---|---|
| Fade in | Page load / route change | 250ms | Page content |
| Slide up | Sheet open | 300ms | Bottom sheets |
| Scale in | Modal open | 200ms | Modals |
| Slide in from right | Detail navigation | 250ms | Detail pages (mobile) |
| Shimmer | Loading | 1500ms loop | Skeletons |
| Confetti | Challenge win, achievement, perfect grid | 600ms | Celebration overlay |
| Bounce | Trophy unlock, rank up | 400ms | Trophy card, rank badge |
| Pulse | Live indicator, active sprint timer | 2000ms loop | Online dot, timer |
| Slide up + fade | New message, new post | 200ms | Message bubble, post card |
| Flip | Daily grid square completion | 300ms | Grid square |
| Ken Burns | Login background | 20000ms loop | Background image |
| Count up | Stat numbers on profile | 1000ms | Stat values |
| Crossfade | Tab switch, filter change | 200ms | Content area |
| Parallax | Profile/community header scroll | Continuous | Banner image |
| Scale on tap | Button press | 100ms | All buttons |
| Glow pulse | Primary CTA hover | 2000ms loop | Primary buttons |

---

## Appendix B: Complete Database & API Reference

### B.1 All Database Tables

1. users (Supabase Auth)
2. profiles
3. sports
4. games
5. game_participants
6. game_stats
7. challenges
8. challenge_participants
9. threads
10. thread_participants
11. messages
12. teams
13. team_members
14. communities
15. community_members
16. posts
17. comments
18. likes
19. notifications
20. achievements
21. user_achievements
22. media
23. leaderboards
24. statistics
25. streaks
26. daily_questions
27. daily_question_answers
28. daily_grids
29. daily_grid_completions
30. presence
31. push_tokens
32. settings
33. reports
34. audit_logs
35. friends
36. blocked_users
37. invites
38. sprints
39. sprint_results

### B.2 All API Endpoints

**Standard CRUD (per entity):** profiles, games, game_participants, game_stats, challenges, challenge_participants, threads, thread_participants, messages, teams, team_members, communities, community_members, posts, comments, likes, notifications, achievements, user_achievements, media, leaderboards, statistics, streaks, daily_questions, daily_question_answers, daily_grids, daily_grid_completions, push_tokens, settings, reports, friends, blocked_users, invites, sprints, sprint_results.

Each has: `GET /api/{entity}` (list), `GET /api/{entity}/:id` (get), `POST /api/{entity}` (create), `PUT /api/{entity}/:id` (update), `DELETE /api/{entity}/:id` (delete).

**Custom endpoints:**
- `GET /api/feed`
- `GET /api/daily/question`
- `POST /api/daily/question/answer`
- `GET /api/daily/grid`
- `POST /api/daily/grid/complete`
- `GET /api/sprint/daily`
- `POST /api/sprint/submit`
- `POST /api/sprint/challenge`
- `GET /api/leaderboards/:type`
- `GET /api/search`
- `GET /api/threads`
- `POST /api/threads`
- `GET /api/threads/:id/messages`
- `POST /api/threads/:id/messages`
- `GET /api/friends`
- `GET /api/friends/requests`
- `POST /api/friends/request`
- `PUT /api/friends/:id/accept`
- `PUT /api/friends/:id/decline`
- `DELETE /api/friends/:id`
- `GET /api/friends/suggestions`
- `GET /api/games/nearby`
- `POST /api/games/:id/join`
- `POST /api/games/:id/leave`
- `POST /api/games/:id/start`
- `POST /api/games/:id/log-result`
- `POST /api/challenges/:id/join`
- `POST /api/challenges/:id/leave`
- `POST /api/challenges/:id/log-score`
- `POST /api/challenges/:id/complete`
- `GET /api/notifications`
- `PUT /api/notifications/read-all`
- `PUT /api/notifications/:id/read`
- `POST /api/push-tokens`
- `DELETE /api/push-tokens/:token`
- `GET /api/profiles/:username`
- `PUT /api/profiles/me`
- `GET /api/profiles/:username/stats`
- `GET /api/profiles/:username/trophies`
- `GET /api/admin/overview`
- `GET /api/admin/users`
- `PUT /api/admin/users/:id`
- `GET /api/admin/reports`
- `PUT /api/admin/reports/:id`
- `POST /api/media/upload`
- `POST /api/ai/natural-search`
- `POST /api/ai/friend-suggestions`
- `GET /api/health`

### B.3 All Validation Rules

| Entity | Field | Rule |
|---|---|---|
| profiles | username | 3–20 chars, alphanumeric + underscore, unique |
| profiles | display_name | 2–40 chars |
| profiles | bio | max 200 chars |
| profiles | skill_level | 1–10 |
| profiles | height_inches | 36–96 |
| profiles | privacy_level | public, friends, private |
| profiles | dm_permissions | everyone, friends, none |
| games | title | 3–100 chars |
| games | max_players | 2–20 |
| games | skill_level | 1–10 |
| games | start_time | must be in the future (on create) |
| games | cost | ≥ 0 |
| challenges | title | 3–80 chars |
| challenges | description | max 500 chars |
| challenges | end_date | after start_date |
| posts | body | max 2000 chars (if text) |
| posts | media_urls | max 4 images or 1 video |
| comments | body | max 1000 chars |
| messages | body | max 4000 chars |
| daily_question_answers | selected_index | 0–3, one per user per question |
| push_tokens | token | non-empty, unique per user |
| settings | quiet_hours | end after start (or overnight) |
| reports | reason | one of the defined categories |

---

## Appendix C: Edge Cases, Permissions & Error States

### C.1 Edge Cases

1. **User answers Daily Ball Knower after midnight but before the new question is published:** The system serves yesterday's question until the new one is live (6 AM). If the user already answered yesterday's, show "Come back at 6 AM for today's question."
2. **User joins a game that becomes full while joining:** The join request is rejected with "This game is now full." The user is offered a spot on the waitlist.
3. **Challenge ends with a tie:** If scores are equal, the challenge is marked "completed" with no winner (or a tie is recorded for head-to-head). Wager is voided.
4. **User sends a message while offline:** Message is queued locally. On reconnection, it's sent. If the thread was deleted by the other participant in the meantime, the send fails and the user is notified.
5. **User's streak is at risk but they're in a different timezone:** Streak checks use the user's local timezone (stored in `profiles.timezone`). The "streak at risk" reminder fires at 8 PM local time.
6. **Media upload fails mid-way:** Partial upload is discarded. User sees "Upload failed. Try again." The post/message is not created.
7. **Two users create a post at the exact same millisecond:** Feed ordering uses `feed_score` then `created_date` then `id` as a tiebreaker.
8. **User blocks someone who is in a shared group chat:** Blocked user's messages are hidden from the blocker in the group chat (client-side filter). The blocker can unhide via "Show blocked messages."
9. **Community owner deletes their account:** Ownership transfers to the highest-ranking admin. If no admins, to the highest-ranking moderator. If no moderators, the community is archived.
10. **Game result is logged with incorrect stats:** The creator can edit the result within 24 hours. After 24 hours, a correction requires admin/moderator intervention.
11. **Daily Ball Knower question has an error (wrong answer):** Admins can correct the question/answer before 6 AM. If already answered, affected users' scores are adjusted and they receive a notification.
12. **User exceeds rate limit:** 429 response. Client shows "Slow down! You're doing that too much." and disables the action until `Retry-After` expires.
13. **Realtime connection drops during a sprint:** Sprint state is saved locally. On reconnection, the sprint resumes from where it left off (if within the 60-second window).
14. **User changes username:** Old username is reserved for 30 days (to prevent impersonation). Old profile links redirect to the new username. A redirect mapping is stored.
15. **Large group chat (200 members) sends a message:** Message is broadcast to all 200 via Supabase Realtime. If the realtime channel exceeds limits, a fallback "fetch new messages" polling kicks in.

### C.2 All Permissions

| Action | Who Can Do It |
|---|---|
| Create post | Any authenticated user (in communities they're a member of, if community-scoped) |
| Edit/delete post | Author, community moderator/admin, platform admin/moderator |
| Create comment | Any user who can read the post |
| Edit/delete comment | Author, moderator, admin |
| Like/unlike | Any user who can read the target |
| Create game | Any authenticated user |
| Edit/delete game | Game creator, admin |
| Join game | Any user (if public), community member (if community-scoped), invitee (if private) |
| Start game / log result | Game creator |
| Create challenge | Any authenticated user |
| Edit/delete challenge | Challenge creator, admin |
| Join challenge | Any user (if public), community member (if community), invitee (if private) |
| Log challenge score | Challenge participant |
| Complete challenge | Challenge creator |
| Create community | Any authenticated user |
| Edit community | Community owner/admin |
| Manage community members | Community owner/admin |
| Moderate community | Community moderator/admin/owner |
| Create team | Any authenticated user |
| Edit team | Team captain |
| Manage roster | Team captain/co-captain |
| Send DM | User with DM permissions allowing the sender |
| Send group message | Thread participant |
| Create group chat | Any authenticated user |
| Manage group chat | Thread admin |
| Send friend request | Any authenticated user (not blocked, not already friends) |
| Accept/decline friend request | The addressee |
| Block user | Any user (blocking anyone) |
| Report content | Any authenticated user |
| Review reports | Community moderator/admin (community reports), platform admin/moderator (all) |
| Warn/mute/ban user | Community moderator/admin (community-level), platform admin (platform-level) |
| View admin dashboard | Platform admin |
| Manage users (suspend, ban, role change) | Platform admin |
| Toggle feature flags | Platform admin |
| Send platform announcement | Platform admin |
| View audit log | Platform admin |
| Register push token | The user (own tokens only) |
| Update settings | The user (own settings only) |
| Delete account | The user (own account) |
| Export data | The user (own data only) |
| Answer Daily Ball Knower | Any authenticated user (once per day) |
| Complete Daily Grid | Any authenticated user (once per square per day) |
| Play Sprint | Any authenticated user |

### C.3 All Error States

| Error | Code | User Message | Recovery |
|---|---|---|---|
| Invalid credentials | 401 | "Invalid email or password." | User corrects input |
| Email not verified | 403 | "Please verify your email to continue." | Resend OTP |
| Account suspended | 403 | "Your account has been suspended. Contact support." | Contact support |
| Account banned | 403 | "Your account has been banned." | Appeal via support |
| Rate limited | 429 | "Slow down! You're doing that too much." | Wait and retry |
| Validation error | 422 | Field-specific message | Correct and resubmit |
| Not found | 404 | "This {resource} doesn't exist or was removed." | Navigate back |
| Unauthorized | 403 | "You don't have permission to do that." | N/A |
| Conflict (duplicate) | 409 | "You've already done that." | N/A |
| Server error | 500 | "Something went wrong on our end. Please try again." | Retry |
| Network error | — | "Couldn't connect. Check your internet and try again." | Auto-retry with backoff |
| Realtime disconnected | — | (Banner) "You're offline. Reconnecting..." | Auto-reconnect |
| Upload failed | — | "Upload failed. Try again." | Retry upload |
| Message send failed | — | (Inline) "Failed to send. Tap to retry." | Tap to retry |
| Geolocation denied | — | "Location access denied. Enter your city manually." | Manual input |
| Daily question not available | — | "Today's question isn't live yet. Check back at 6 AM." | Wait |
| Sprint connection lost | — | "Connection lost. Your progress is saved." | Reconnect to resume |
| Community full | — | "This community is full." | N/A |
| Game full | — | "This game is full." | Join waitlist |
| Challenge full | — | "This challenge is full." | N/A |

---

## Appendix D: Complete SQL Schema

### D.1 Migration Order

1. `001_create_profiles.sql`
2. `002_create_sports.sql`
3. `003_create_communities.sql`
4. `004_create_teams.sql`
5. `005_create_games.sql`
6. `006_create_challenges.sql`
7. `007_create_threads_messages.sql`
8. `008_create_posts_comments_likes.sql`
9. `009_create_notifications.sql`
10. `010_create_achievements.sql`
11. `011_create_daily_questions_grids.sql`
12. `012_create_leaderboards_statistics.sql`
13. `013_create_streaks_presence.sql`
14. `014_create_push_tokens_settings.sql`
15. `015_create_reports_audit_logs.sql`
16. `016_create_friends_blocked_invites.sql`
17. `017_create_sprints.sql`
18. `018_create_game_stats.sql`
19. `019_create_indexes.sql`
20. `020_create_rls_policies.sql`
21. `021_create_triggers.sql`
22. `022_seed_data.sql`

### D.2 Complete SQL (Key Tables and Policies)

```sql
-- 001_create_profiles.sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL CHECK (char_length(username) BETWEEN 3 AND 20 AND username ~ '^[a-zA-Z0-9_]+$'),
  display_name TEXT NOT NULL CHECK (char_length(display_name) BETWEEN 2 AND 40),
  bio TEXT CHECK (char_length(bio) <= 200),
  avatar_url TEXT,
  banner_url TEXT,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  city TEXT,
  state TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  favorite_team TEXT,
  favorite_player TEXT,
  position TEXT CHECK (position IN ('PG','SG','SF','PF','C','Any')),
  height_inches INTEGER CHECK (height_inches BETWEEN 36 AND 96),
  skill_level INTEGER DEFAULT 5 CHECK (skill_level BETWEEN 1 AND 10),
  privacy_level TEXT DEFAULT 'public' CHECK (privacy_level IN ('public','friends','private')),
  show_online_status BOOLEAN DEFAULT true,
  show_last_seen BOOLEAN DEFAULT true,
  dm_permissions TEXT DEFAULT 'friends' CHECK (dm_permissions IN ('everyone','friends','none')),
  searchable BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  is_business BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_city ON profiles(city);
CREATE INDEX idx_profiles_location ON profiles USING GIST (point(location_lng, location_lat));

-- 002_create_sports.sql
CREATE TABLE sports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  created_date TIMESTAMPTZ DEFAULT now()
);

-- 003_create_communities.sql
CREATE TABLE communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 3 AND 60),
  slug TEXT NOT NULL UNIQUE,
  description TEXT CHECK (char_length(description) <= 1000),
  type TEXT CHECK (type IN ('public','private','invite_only')),
  category TEXT CHECK (category IN ('location','league','interest','team','event')),
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  city TEXT,
  banner_url TEXT,
  avatar_url TEXT,
  rules TEXT,
  owner_id UUID REFERENCES auth.users(id),
  member_count INTEGER DEFAULT 0,
  join_approval TEXT DEFAULT 'auto' CHECK (join_approval IN ('auto','manual')),
  deleted_at TIMESTAMPTZ,
  created_by_id UUID REFERENCES auth.users(id),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_communities_slug ON communities(slug);
CREATE INDEX idx_communities_owner ON communities(owner_id);
CREATE INDEX idx_communities_category ON communities(category);
CREATE INDEX idx_communities_city ON communities(city);
CREATE INDEX idx_communities_location ON communities USING GIST (point(location_lng, location_lat));

-- (Remaining CREATE TABLE statements follow the same pattern as documented in Section 10.
--   All tables include id, created_date, updated_date, created_by_id, and deleted_at where applicable.)

-- 019_create_indexes.sql
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_community ON posts(community_id);
CREATE INDEX idx_posts_created ON posts(created_date DESC);
CREATE INDEX idx_posts_feed ON posts(feed_score DESC, created_date DESC);
CREATE INDEX idx_posts_search ON posts USING GIN (search_vector);
CREATE INDEX idx_messages_thread ON messages(thread_id, created_date DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, created_date DESC);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_leaderboards_composite ON leaderboards(type, scope, scope_id, timeframe, period_key, rank);
CREATE INDEX idx_statistics_user ON statistics(user_id, period_type, period_key);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_start ON games(start_time);
CREATE INDEX idx_games_location ON games USING GIST (point(location_lng, location_lat));
CREATE INDEX idx_challenges_status ON challenges(status);
CREATE INDEX idx_friends_requester ON friends(requester_id);
CREATE INDEX idx_friends_addressee ON friends(addressee_id);

-- 020_create_rls_policies.sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE thread_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_question_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_grid_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprint_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;

-- (All RLS policies as documented in Section 16.1 are applied here.)

-- 021_create_triggers.sql

-- Auto-update updated_date on row update
CREATE OR REPLACE FUNCTION update_updated_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_date = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_date();
CREATE TRIGGER trg_communities_updated BEFORE UPDATE ON communities
  FOR EACH ROW EXECUTE FUNCTION update_updated_date();
CREATE TRIGGER trg_posts_updated BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_date();
CREATE TRIGGER trg_games_updated BEFORE UPDATE ON games
  FOR EACH ROW EXECUTE FUNCTION update_updated_date();
CREATE TRIGGER trg_challenges_updated BEFORE UPDATE ON challenges
  FOR EACH ROW EXECUTE FUNCTION update_updated_date();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, display_name)
  VALUES (NEW.id, split_part(NEW.email, '@', 1), split_part(NEW.email, '@', 1));
  INSERT INTO settings (user_id) VALUES (NEW.id);
  INSERT INTO statistics (user_id, sport_id, period_type) VALUES (NEW.id, (SELECT id FROM sports WHERE slug = 'basketball'), 'all_time');
  INSERT INTO statistics (user_id, sport_id, period_type, period_key) VALUES (NEW.id, (SELECT id FROM sports WHERE slug = 'basketball'), 'yearly', to_char(now(), 'YYYY'));
  INSERT INTO statistics (user_id, sport_id, period_type, period_key) VALUES (NEW.id, (SELECT id FROM sports WHERE slug = 'basketball'), 'monthly', to_char(now(), 'YYYY-MM'));
  INSERT INTO streaks (user_id, type) VALUES (NEW.id, 'ball_knower'), (NEW.id, 'grid'), (NEW.id, 'daily_active'), (NEW.id, 'game_played');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-generate search_vector on posts
CREATE OR REPLACE FUNCTION update_posts_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector = to_tsvector('english', coalesce(NEW.body, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_posts_search_vector BEFORE INSERT OR UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_posts_search_vector();

-- Update post like_count on like insert/delete
CREATE OR REPLACE FUNCTION update_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.target_type = 'post' THEN
      UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.target_id;
    ELSIF NEW.target_type = 'comment' THEN
      UPDATE comments SET like_count = like_count + 1 WHERE id = NEW.target_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.target_type = 'post' THEN
      UPDATE posts SET like_count = like_count - 1 WHERE id = OLD.target_id;
    ELSIF OLD.target_type = 'comment' THEN
      UPDATE comments SET like_count = like_count - 1 WHERE id = OLD.target_id;
    END IF;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_likes_count AFTER INSERT OR DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION update_like_count();

-- Update comment_count on comment insert/delete
CREATE OR REPLACE FUNCTION update_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_comments_count AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_count();

-- Update community member_count on member insert/delete
CREATE OR REPLACE FUNCTION update_community_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'member' THEN
    UPDATE communities SET member_count = member_count + 1 WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'member' THEN
    UPDATE communities SET member_count = member_count - 1 WHERE id = OLD.community_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'member' AND NEW.status = 'member' THEN
      UPDATE communities SET member_count = member_count + 1 WHERE id = NEW.community_id;
    ELSIF OLD.status = 'member' AND NEW.status != 'member' THEN
      UPDATE communities SET member_count = member_count - 1 WHERE id = NEW.community_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_community_members_count AFTER INSERT OR DELETE OR UPDATE ON community_members
  FOR EACH ROW EXECUTE FUNCTION update_community_member_count();

-- Update game current_player_count on participant join/leave
CREATE OR REPLACE FUNCTION update_game_player_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'joined' THEN
    UPDATE games SET current_player_count = current_player_count + 1 WHERE id = NEW.game_id;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'joined' THEN
    UPDATE games SET current_player_count = current_player_count - 1 WHERE id = OLD.game_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'joined' AND NEW.status = 'joined' THEN
      UPDATE games SET current_player_count = current_player_count + 1 WHERE id = NEW.game_id;
    ELSIF OLD.status = 'joined' AND NEW.status != 'joined' THEN
      UPDATE games SET current_player_count = current_player_count - 1 WHERE id = NEW.game_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_game_participants_count AFTER INSERT OR DELETE OR UPDATE ON game_participants
  FOR EACH ROW EXECUTE FUNCTION update_game_player_count();

-- Update thread last_message_at on message insert
CREATE OR REPLACE FUNCTION update_thread_last_message()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE threads SET last_message_at = now() WHERE id = NEW.thread_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_messages_thread_update AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_thread_last_message();

-- 022_seed_data.sql

-- Sports
INSERT INTO sports (name, slug, icon) VALUES
  ('Basketball', 'basketball', 'basketball'),
  ('Football', 'football', 'football'),
  ('Soccer', 'soccer', 'soccer');

-- (Demo users, profiles, communities, teams, games, challenges, achievements, daily questions,
--   grids, leaderboards, statistics, streaks, messages, and posts as documented in Section 21.)

-- Achievements catalog (excerpt)
INSERT INTO achievements (slug, name, description, category, icon, rarity, requirement, points) VALUES
  ('first_game', 'First Game', 'Play your first game', 'games', 'basketball', 'common', '{"type":"games_played","value":1}', 10),
  ('fifty_games', 'Iron Man', 'Play 50 games', 'games', 'flame', 'uncommon', '{"type":"games_played","value":50}', 50),
  ('hundred_games', 'Century Club', 'Play 100 games', 'games', 'trophy', 'rare', '{"type":"games_played","value":100}', 100),
  ('first_win', 'First Win', 'Win your first game', 'games', 'medal', 'common', '{"type":"games_won","value":1}', 10),
  ('streak_3', 'On Fire', '3-day Ball Knower streak', 'streaks', 'flame', 'common', '{"type":"ball_knower_streak","value":3}', 15),
  ('streak_7', 'Heating Up', '7-day Ball Knower streak', 'streaks', 'flame', 'uncommon', '{"type":"ball_knower_streak","value":7}', 30),
  ('streak_30', 'Unstoppable', '30-day Ball Knower streak', 'streaks', 'flame', 'rare', '{"type":"ball_knower_streak","value":30}', 100),
  ('streak_100', 'Legend', '100-day Ball Knower streak', 'streaks', 'crown', 'legendary', '{"type":"ball_knower_streak","value":100}', 500),
  ('challenge_first_win', 'First Blood', 'Win your first challenge', 'challenges', 'sword', 'common', '{"type":"challenge_wins","value":1}', 10),
  ('challenge_10_wins', 'Challenge Champion', 'Win 10 challenges', 'challenges', 'trophy', 'uncommon', '{"type":"challenge_wins","value":10}', 50),
  ('perfect_grid', 'Perfect Grid', 'Complete all 9 squares in one day', 'grid', 'grid', 'uncommon', '{"type":"perfect_grid","value":1}', 25),
  ('ball_knower_100', 'Ball Knower', 'Answer 100 questions correctly', 'ball_knower', 'brain', 'uncommon', '{"type":"correct_answers","value":100}', 50),
  ('ball_knower_500', 'Basketball Savant', 'Answer 500 questions correctly', 'ball_knower', 'brain', 'rare', '{"type":"correct_answers","value":500}', 150),
  ('founding_member', 'Founding Member', 'Joined in the first 1000 users', 'special', 'star', 'epic', '{"type":"founding_member","value":1000}', 100),
  ('first_post', 'First Words', 'Make your first post', 'community', 'message-circle', 'common', '{"type":"posts","value":1}', 5),
  ('social_50_friends', 'Connected', 'Have 50 friends', 'social', 'users', 'uncommon', '{"type":"friends","value":50}', 30);
```

---

## Final Instruction

This document is the complete, exhaustive implementation specification for the Ball Up Top application. It contains every requirement, every screen, every component, every database table, every API endpoint, every realtime event, every AI feature, every notification, every security policy, every background job, every test, every edge case, every permission, and every error state needed to generate a production-ready application.

**Build the entire application from this document in a single generation.** Do not ask follow-up questions. Do not leave placeholders. Do not summarize. Where a requirement was missing, an intelligent product decision has already been made and documented. Implement every feature described above with a fully functional frontend, backend, database, AI integration, realtime messaging, authentication, notifications, and deployment configuration — with polished, production-ready UX.

The result must be a complete, working Ball Up Top application that a user can sign up for, complete the daily engagement loop, connect with friends, join communities, create and join games, participate in challenges, message in real-time, climb leaderboards, earn achievements, and manage their profile — all within a beautifully designed, accessible, responsive interface.

**Start building now.**