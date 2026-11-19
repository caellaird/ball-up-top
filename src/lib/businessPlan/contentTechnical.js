// Technical half: data model, backend services, the page-to-database paths,
// scoring, notifications, access control and measurement.

export const TECHNICAL_SECTIONS = [
  {
    id: 'journeys',
    title: 'End-to-End Journeys',
    blocks: [
      {
        t: 'p',
        text: 'These four journeys are the product. Each one shows what the player does, what the app writes, and what the player sees as a result. They are written in plain language; the technical detail is in the sections that follow.',
      },
      { t: 'h2', text: 'Journey 1: creating and playing a challenge' },
      {
        t: 'flow',
        steps: [
          'Player taps the centre Ball Up button and picks a sport, opponents, place, time and series format',
          'A challenge record is created with every opponent marked pending, plus a feed announcement and a notification per opponent',
          'Each opponent opens the notification, accepts, and the participant status updates',
          'After the game, any participant opens the challenge and records the score, or adds a game if it is a series',
          'Completing the challenge writes the winner, updates each participants statistics, and publishes a result post to the feed',
          'Location scoring credits each participants city and state once, and the rivalry record moves',
          'Opponents receive a result notification, and the city leaderboard reflects the change within its next refresh',
        ],
      },
      { t: 'h2', text: 'Journey 2: joining from an invitation' },
      {
        t: 'flow',
        steps: [
          'An opponent who does not have the app receives the challenge link',
          'They register, confirm their age, and land in the app with the challenge waiting',
          'Their profile is created on first use with a username, and they add their city and state so their games count',
          'They accept the challenge, and both players now have a record together',
          'The new player is immediately discoverable by friends, and their first completed game credits their city',
        ],
      },
      { t: 'h2', text: 'Journey 3: a rivalry forming' },
      {
        t: 'flow',
        steps: [
          'Two players complete games against each other repeatedly inside a short window',
          'The rivalry engine promotes the pair to an active rivalry with a win count, streak and last result',
          'A rivalry announcement card is published to the feed, and both players are notified',
          'The rivalry page becomes the shared record: every game, every filter, every sport the pair plays',
          'Further results update the record and trigger milestone cards at significant thresholds',
        ],
      },
      { t: 'h2', text: 'Journey 4: a city climbing the table' },
      {
        t: 'flow',
        steps: [
          'A player sets their home city and state from the curated picker',
          'Every completed challenge credits that city and that state exactly once per participant',
          'Scorecard posts and league recaps award an additional city point for content that is not already a challenge result',
          'Explore reads the pre-aggregated totals and ranks the top five cities and states',
          'The player sees their own rank and count on the same screen, and is prompted to challenge someone to move up',
        ],
      },
    ],
  },
  {
    id: 'data',
    title: 'Data Model Reference',
    blocks: [
      {
        t: 'p',
        text: 'Everything the app knows lives in records. Each record carries four platform fields automatically: a unique id, a created timestamp, an updated timestamp, and the id of the account that created it. The tables below group the records by what they are for.',
      },
      { t: 'h2', text: 'Identity and social' },
      {
        t: 'table',
        head: ['Record', 'What it holds', 'Access'],
        widths: [0.22, 0.52, 0.26],
        rows: [
          ['Profile', 'The players identity: username, nickname, bio, avatar, banner, city and state plus normalised keys, position, skill, availability, privacy level and every notification preference.', 'Readable by all; only the owner can write'],
          ['User', 'The platform account: email, full name and role. Never created by the app itself.', 'Managed by the platform; admins only for others'],
          ['Friend', 'One row per relationship, with requester, addressee and a status of pending, accepted, declined, cancelled or blocked.', 'Readable where the player is either side; writes by the creator'],
          ['Report', 'A moderation report: target type, target id, target owner, reason and optional detail.', 'Visible only to the reporter'],
          ['Award', 'An earned award attached to a player, derived from stored results.', 'Readable by all; written by the awarding process'],
        ],
      },
      { t: 'h2', text: 'Competition' },
      {
        t: 'table',
        head: ['Record', 'What it holds', 'Access'],
        widths: [0.22, 0.52, 0.26],
        rows: [
          ['Challenge', 'The core record: sport, creator, one opponent or many, participant statuses, place, scheduled time, series format and running game counts, scores, winner, caption, photos, completion time and location scoring flags.', 'Readable by all; writable by the creator or any participant'],
          ['ChallengeParticipant', 'A per-player participation row used for group challenges and invitations.', 'Readable by all; written by the participant'],
          ['SeriesGame', 'One row per game in a series: game number, scores, per-player scores for group play, winner, caption and photos.', 'Readable by all; written by the creator'],
          ['League', 'A recurring competition: name, description, sport, location, organiser and the member list.', 'Readable by all; writable by the creator'],
          ['LeagueSession', 'A scheduled session for a league: start time, place and note.', 'Readable by all; written by the creator'],
          ['LeagueRsvp', 'One response per player per session: going or not going.', 'Readable by all; written by the creator'],
        ],
      },
      { t: 'h2', text: 'Content and messaging' },
      {
        t: 'table',
        head: ['Record', 'What it holds', 'Access'],
        widths: [0.22, 0.52, 0.26],
        rows: [
          ['Post', 'A feed item: author identity, body, media, linked challenge or league, sport and emoji, participants, reaction and comment counts, post type, highlight stats, edited flag and city scoring flags.', 'Readable by all; writable by the author'],
          ['Comment', 'A comment on a post, with its author.', 'Readable by all; writable by the author'],
          ['Like', 'One reaction per player per post, storing the chosen emoji.', 'Readable by all; writable by the creator'],
          ['Thread', 'A direct or group conversation: participants, names, last message and time, description, avatar, and group admins. A thread can be tied to a challenge.', 'Readable by participants only; writable by participants'],
          ['Message', 'A single message in a thread.', 'Readable by thread participants'],
          ['MessageReaction', 'A reaction on an individual message.', 'Readable by thread participants'],
          ['ThreadRead', 'The read position of one player in one thread, which drives unread state.', 'Own row only'],
        ],
      },
      { t: 'h2', text: 'Scoring, rankings and reputation' },
      {
        t: 'table',
        head: ['Record', 'What it holds', 'Access'],
        widths: [0.24, 0.5, 0.26],
        rows: [
          ['UserStats', 'The per-player record: games played, wins, losses, draws, current and longest streak, challenge wins, rivalry wins, and daily-question scoring.', 'Readable by all; writable by the owner'],
          ['Rivalry', 'A canonical pair of players with each side wins, total games, draws, current streak holder, last result and summary, primary sport, active or past status, and the announcement post.', 'Readable by all; writable by the two players'],
          ['CityChallengeScore', 'The pre-aggregated completed challenge count per city, with display name, state code and state name.', 'Readable by all; written only by server logic'],
          ['StateChallengeScore', 'The pre-aggregated completed challenge count per state.', 'Readable by all; written only by server logic'],
          ['ChallengeLocationCredit', 'One row per challenge per participant, recording the city and state that were credited. This is the idempotency guard.', 'Server only'],
          ['CityYearScore', 'Yearly city points earned from eligible posts, keyed by city and calendar year.', 'Readable by all; written by server logic'],
        ],
      },
      { t: 'h2', text: 'Notifications and legacy records' },
      {
        t: 'table',
        head: ['Record', 'What it holds', 'Access'],
        widths: [0.26, 0.48, 0.26],
        rows: [
          ['Notification', 'One row per recipient: type, actor identity, title, body, link, read flag and handled flag.', 'Readable, writable and deletable by the recipient only'],
          ['PublicEvent, EventParticipant, EventFavorite', 'An earlier public event and map feature: event details, participants and favourites.', 'Retained; the map discovery surface is no longer part of the current navigation'],
          ['Game, GameParticipant, Community, CommunityMember, Vote, DailyQuestion, DailyQuestionAnswer', 'Earlier game, community and daily-question features.', 'Retained in the data layer; the related screens are not currently routed'],
        ],
      },
      {
        t: 'callout',
        label: 'Housekeeping',
        text: 'The legacy records above are still valid data but no longer have a route in the app. They are safe to leave in place, and should be reviewed before any migration so that historical results are not lost.',
      },
    ],
  },
  {
    id: 'backend',
    title: 'Backend Services',
    blocks: [
      {
        t: 'p',
        text: 'Nine server-side services handle work that must not happen on the device: anything that needs to trust the caller, write on behalf of another player, or coordinate several records at once. Screens call them by name and receive plain JSON.',
      },
      {
        t: 'table',
        head: ['Service', 'Responsibility', 'Called by'],
        widths: [0.26, 0.5, 0.24],
        rows: [
          ['sendNotification', 'Creates the in-app notification for a recipient, checks their category preference, suppresses duplicates, and triggers the push alert.', 'Almost every screen that causes an event'],
          ['recordGameResult', 'Records or finalises a result, updates participant statistics, then triggers location crediting, rivalry updates and city points for a completed challenge.', 'Challenge detail, series entry'],
          ['creditChallengeLocations', 'Credits a completed challenge to each participants city and state exactly once, using a per-participant credit row to prevent double counting.', 'Result recording, and a scheduled workflow'],
          ['getCityLeaderboard', 'Returns the top five cities, top five states, the leading city, and the requesting players own city and state rank.', 'Explore and the Home Explore tab'],
          ['countCityActivity', 'Awards one city point for an eligible post (a scorecard or a league recap), skipping challenge results so nothing is counted twice.', 'Post creation for eligible types'],
          ['deleteChallenge', 'Removes a challenge with its games, posts and derived records in one operation.', 'Challenge detail'],
          ['deleteAccount', 'Removes the account and its content, then the player is signed out.', 'Settings danger zone'],
          ['postSharePage', 'Serves a public, server-rendered page for a single shared post so links preview properly.', 'Shared post links'],
          ['generateDailyQuestion', 'Produces the daily question content.', 'Retained; daily screen not currently routed'],
        ],
      },
      { t: 'h2', text: 'Shared server logic' },
      {
        t: 'p',
        text: 'Rules that more than one service depends on live in shared modules rather than being copied, so the same rule cannot drift between callers.',
      },
      {
        t: 'table',
        head: ['Module', 'Rule it owns'],
        widths: [0.28, 0.72],
        rows: [
          ['notifPrefs', 'The mapping from notification type to the players preference field, plus the two gates: may this in-app notification be created, and may it be pushed.'],
          ['locationTally', 'How a completed challenge credits a city and a state, with the per-participant credit row and a rollback if the two totals cannot both be written.'],
          ['cityScore', 'City normalisation (Durham, NC becomes durham, nc with a display form), the calendar-year key, and the yearly point award.'],
          ['rivalries', 'When a pair of players becomes a rivalry, how the record moves after a result, and when a milestone card is due.'],
          ['geo and usStates', 'Distance helpers and the canonical list of US states, so location values are consistent everywhere.'],
        ],
      },
      { t: 'h2', text: 'Scheduled work' },
      {
        t: 'p',
        text: 'One workflow runs the location credit pass over completed challenges, so a completion that was missed by a failed client call is still credited rather than silently lost. Result recording also calls the same logic directly, and the credit rows make the double path safe.',
      },
    ],
  },
  {
    id: 'comms',
    title: 'How Screens Talk to Data',
    blocks: [
      {
        t: 'p',
        text: 'There are exactly three paths between a screen and stored data. Knowing which path a screen uses explains its loading behaviour, its permissions and its failure modes.',
      },
      { t: 'h2', text: 'Path 1: direct entity access, the default' },
      {
        t: 'flow',
        steps: [
          'Screen mounts and calls the data layer with a filter, a sort and a limit',
          'The request carries the signed-in players session token',
          'Row-level security rules are evaluated against every record before anything is returned',
          'The screen receives a page of records and derives what it displays locally',
          'Writes follow the same path in reverse: the record is created or updated, and the rule on the record decides whether the write is allowed',
        ],
      },
      {
        t: 'p',
        text: 'This is how the feed, challenge lists, profiles, threads, leagues and settings work. It means a screen can only ever see what that player is permitted to see, without the screen having to enforce anything.',
      },
      { t: 'h2', text: 'Path 2: a backend service for trusted work' },
      {
        t: 'flow',
        steps: [
          'Screen invokes a service by name with a small, specific payload',
          'The service authenticates the caller from the request and rejects anyone who is not signed in',
          'The service checks the specific permission for the action, for example that the caller is a participant in the challenge',
          'Only then does it act with elevated rights, which is what allows it to write a notification for another player or update a shared total',
          'It returns a small JSON result, and the screen updates from that result rather than re-reading everything',
        ],
      },
      {
        t: 'callout',
        label: 'Why this matters',
        text: 'Elevated rights never reach the device. A player cannot write another players notification, alter a city total, or finalise a challenge they are not part of, because those writes only exist inside a service that checks the caller first.',
      },
      { t: 'h2', text: 'Path 3: live subscriptions' },
      {
        t: 'p',
        text: 'Six surfaces subscribe to changes rather than polling: the notification badge, the notification centre, the friends list, the messages list, an open conversation and individual message bubbles. A new message or friend request therefore appears without the player refreshing, and the subscription is cleaned up when the screen unmounts.',
      },
      { t: 'h2', text: 'Cross-cutting behaviour on the client' },
      {
        t: 'bullets',
        items: [
          'Request spacing: entity calls are spaced at least 150 milliseconds apart through a queue, because the platform rate-limits bursts when several screens mount at once.',
          'Rate-limit recovery: a throttled call backs off and retries rather than surfacing an error, within a per-minute allowance kept just under the server limit.',
          'Sequential reads: where a screen needs several related sets, they are fetched in sequence rather than in parallel, which trades a little latency for far fewer failures.',
          'Caching: the players own profile, avatars and the player directory are cached so screens do not re-read the same records on every navigation.',
          'Optimistic writes: messages and reactions appear immediately and reconcile with the server response.',
          'Derived filtering: a screen fetches once and filters locally, rather than issuing a new request per filter change.',
        ],
      },
      { t: 'h2', text: 'Worked example: the Home feed' },
      {
        t: 'flow',
        steps: [
          'Read the players friend relationships in one filtered call',
          'Build the accepted set and the blocked set from those relationships',
          'Request the newest fifteen posts',
          'Remove blocked authors, then keep only posts by accepted friends or posts that tag the player',
          'If nothing survives, request the next fifteen and repeat, bounded, so the screen never stalls',
          'Render, then load further batches as the list approaches its end',
        ],
      },
    ],
  },
  {
    id: 'scoring',
    title: 'Scoring, Rankings and Reputation',
    blocks: [
      {
        t: 'p',
        text: 'Four scoring systems run on top of the same records. They are separate on purpose: one rewards playing, one rewards content, one tracks a personal matchup, and one ranks places.',
      },
      { t: 'h2', text: '1. Personal record' },
      {
        t: 'bullets',
        items: [
          'Games played, wins, losses and draws are incremented when a result is finalised, from the perspective of each participant.',
          'The current streak extends on a win and resets on a loss; the longest streak is kept separately so it is never lost.',
          'Draws are recorded as draws rather than as a no-result, and they do not break the longest streak record.',
          'Challenge wins and rivalry wins are counted separately, because a rivalry is a sustained relationship and a challenge win is a single event.',
        ],
      },
      { t: 'h2', text: '2. City and state competition (the Explore table)' },
      {
        t: 'bullets',
        items: [
          'Every completed challenge credits one point to each participants city and one point to their state. Two players from the same city produce two city points from one game.',
          'A credit row is written per challenge per participant before any total changes. A retry, an edited result or a second scheduled pass skips an already-credited participant, so totals cannot double.',
          'If the city total writes but the state total fails, the city total is rolled back and the credit row is removed, so the next attempt applies both cleanly instead of leaving the two tables inconsistent.',
          'Cities are stored twice: a normalised key for matching (durham, nc) and a display form for reading (Durham, NC). Free-text city input cannot create two entries for the same place.',
          'A player with no saved location is never credited to an invented or partial place.',
        ],
      },
      { t: 'h2', text: '3. Content points (the yearly city table)' },
      {
        t: 'bullets',
        items: [
          'A scorecard post or a league recap post awards one additional city point, recorded against the city and the calendar year.',
          'Challenge result posts are excluded, because the challenge completion already scored the city. This is the rule that prevents double counting the same game.',
          'A flag on the post marks it as already counted, so re-sending or editing cannot award twice.',
        ],
      },
      { t: 'h2', text: '4. Rivalries' },
      {
        t: 'bullets',
        items: [
          'A pair of players is stored once, in a canonical order, so the same two people can never produce two rivalry records.',
          'Repeated games inside a short window promote the pair to an active rivalry, which is announced in the feed.',
          'Each result updates the pair record: win counts, total games, draws, the current streak holder and count, the last result summary and the primary sport.',
          'Milestones at meaningful thresholds produce their own feed cards, which keeps a long-running rivalry visible without new posts from the players.',
        ],
      },
      { t: 'h2', text: 'What the leaderboard does and does not rank' },
      {
        t: 'p',
        text: 'Explore ranks places by completed challenges, not by win rate, population or player skill. That choice keeps the mechanic understandable and impossible to game by playing weak opponents: a city climbs by playing, and every participant adds to their own city. Individual rankings live on the profile and in head-to-head records, not on the city table.',
      },
    ],
  },
  {
    id: 'notifsys',
    title: 'Notification and Push System',
    blocks: [
      {
        t: 'p',
        text: 'A notification is created by a backend service, never directly by a screen. That single rule is what makes preferences, duplicate suppression and push delivery consistent across every feature.',
      },
      { t: 'h2', text: 'The path of one notification' },
      {
        t: 'flow',
        steps: [
          'A player acts: sends a challenge, comments, accepts a friend request, records a result',
          'The screen calls the notification service with the recipient, the type, the actor, a title, a body and a link',
          'The service confirms the caller is allowed to notify that recipient for that reason',
          'The recipients category preference is checked, and the notification is dropped if they have switched it off',
          'A duplicate check looks for an identical notification to the same recipient in the last twenty seconds, which absorbs double events from retries or two code paths',
          'The notification record is written, then a push alert is sent to the recipients registered devices',
          'The badge, the notification centre and the device all reflect the same event',
        ],
      },
      { t: 'h2', text: 'Category to preference mapping' },
      {
        t: 'table',
        head: ['Notification type', 'Preference switch', 'Default'],
        widths: [0.4, 0.4, 0.2],
        rows: [
          ['challenge_invite', 'Challenge invites', 'On'],
          ['challenge_response, challenge_result', 'Challenge results', 'On'],
          ['rivalry_activated, rivalry_lead_change', 'Challenge results', 'On'],
          ['direct_message', 'Direct messages', 'On'],
          ['post_comment', 'Post comments', 'On'],
          ['friend_request, friend_response, friend_accepted, friend_removed, league_invite', 'Friend activity', 'On'],
          ['event_reminder', 'Public reminders', 'On'],
          ['favorite_event_update', 'Explore favourites', 'On'],
        ],
      },
      { t: 'h2', text: 'Master switch and push' },
      {
        t: 'p',
        text: 'A master push switch sits above the categories. With it off, no push alert is sent for any category while in-app records still follow their own switches. With a category off, neither the record nor the push is created, so a player who silences post comments genuinely stops receiving them.',
      },
      { t: 'h2', text: 'Delivery and failure' },
      {
        t: 'bullets',
        items: [
          'Push delivery targets the recipients registered devices; the app itself does not store or manage device tokens.',
          'A push failure never blocks the in-app notification, because the record is written first and the alert is a second step.',
          'The twenty-second duplicate window exists because the same action can reach the service twice, for example a result recorded from the screen and again from a backend pass.',
          'Deleting a notification removes it for that recipient only; the other participants keep theirs.',
        ],
      },
      {
        t: 'callout',
        label: 'Deployment note',
        text: 'Lock-screen delivery depends on the native iOS build having its push capability and Apple credentials configured. That configuration lives with the build, not in app code, so it cannot be verified from the product itself.',
      },
    ],
  },
  {
    id: 'security',
    title: 'Access Control, Privacy and Safety',
    blocks: [
      {
        t: 'p',
        text: 'Access is enforced per record, not per screen. Every table carries rules for read, create, update and delete, and the platform applies them to every request before the app sees anything.',
      },
      { t: 'h2', text: 'The three rule shapes in use' },
      {
        t: 'table',
        head: ['Shape', 'Rule', 'Applied to'],
        widths: [0.22, 0.5, 0.28],
        rows: [
          ['Public read, owned write', 'Anyone signed in can read; only the creator can change or delete.', 'Profile, Post, Comment, Like, Challenge, SeriesGame, League, Thread, Notification, Report'],
          ['Participant only', 'Read and write require the player to be part of the record.', 'Thread, its messages and read positions'],
          ['Server only', 'No client can write; only backend logic with elevated rights can.', 'CityChallengeScore, StateChallengeScore, ChallengeLocationCredit'],
        ],
      },
      { t: 'h2', text: 'What that means in practice' },
      {
        t: 'bullets',
        items: [
          'A notification belongs to one recipient. Nobody else can read it, mark it read or delete it.',
          'A direct message thread is invisible to anyone who is not a participant, including through search.',
          'A challenge can be edited by its creator or by any of its opponents, but not by a stranger.',
          'City and state totals cannot be written by a player, which is what makes the leaderboard trustworthy.',
          'A private profile is enforced on read rather than hidden in the interface.',
        ],
      },
      { t: 'h2', text: 'Safety features' },
      {
        t: 'bullets',
        items: [
          'Age gate: a one-time 13 and over confirmation before the app opens for a new account.',
          'Blocking: removes the blocked players content from the feed in both directions and prevents further interaction.',
          'Reporting: available on posts, comments and users, with a reason and optional detail, stored for review.',
          'Account deletion: removes the account and its content, behind a confirmation dialog, with inline error handling if it fails.',
          'Edited content is labelled, so a corrected result is honest rather than silent.',
        ],
      },
      { t: 'h2', text: 'Gaps worth closing' },
      {
        t: 'bullets',
        items: [
          'Reports are stored but there is no moderation console or triage queue.',
          'There is no automated content screening on uploaded photos or post text.',
          'There is no appeal path for a blocked or removed player.',
          'The support address in the legal pages is still a placeholder.',
        ],
      },
    ],
  },
  {
    id: 'analytics',
    title: 'Measurement and Instrumentation',
    blocks: [
      {
        t: 'p',
        text: 'Three product events define the funnel. They are recorded as analytics events at the moment the action succeeds, so the count reflects completed actions rather than attempts.',
      },
      {
        t: 'table',
        head: ['Event', 'Fired when', 'Why it matters'],
        widths: [0.26, 0.42, 0.32],
        rows: [
          ['player_registered', 'A registration completes', 'Top of funnel; the only true acquisition number'],
          ['challenge_sent', 'A challenge is created and the invitation is dispatched', 'Leading indicator, because each one pulls in an opponent'],
          ['game_played', 'A result is saved', 'Retention signal: did the game actually happen'],
        ],
      },
      { t: 'h2', text: 'What the app already knows without analytics' },
      {
        t: 'p',
        text: 'Because every result is a stored record, most product questions can be answered from the database directly: completed challenges per city, games per player, acceptance rate of invitations, rivalry counts, streaks, and league attendance. The analytics events exist to measure the funnel, not to reconstruct the product.',
      },
      { t: 'h2', text: 'What is not measured yet' },
      {
        t: 'bullets',
        items: [
          'There is no in-app dashboard for the three headline metrics; the platform analytics dashboard is the place to read them.',
          'Screen-level engagement, session length and retention cohorts are not instrumented inside the app.',
          'Notification open rates are not tracked beyond the read flag on the record.',
          'No financial metrics exist, because nothing is charged.',
        ],
      },
      {
        t: 'callout',
        label: 'Reading numbers honestly',
        text: 'Record counts in this document are live counts of stored records, not active users. A large post count can come from a small number of players. Use the analytics events for people, and the records for product behaviour.',
      },
    ],
  },
  {
    id: 'ops',
    title: 'Running and Updating This Document',
    blocks: [
      { t: 'h2', text: 'Where the product lives' },
      {
        t: 'bullets',
        items: [
          'The app is published as a web application and is designed to ship to iOS and Android from the same code.',
          'Sign-in, registration, password reset, two-factor authentication and push delivery are platform services rather than app code.',
          'Data, files and functions are hosted on the same platform, which is why there is no separate server to operate.',
          'Custom domain and app store listings are configured outside the codebase.',
        ],
      },
      { t: 'h2', text: 'How to regenerate this document' },
      {
        t: 'bullets',
        items: [
          'Open the business plan screen and press Download PDF. The file is generated on demand from the current app definition, so it always reflects the product as it stands today.',
          'The screen also shows a live record snapshot. Reload the screen before downloading to capture current counts.',
          'When a feature ships, update the matching section in the plan content so the document stays true. The document is part of the codebase, which means it can be reviewed and versioned alongside the product.',
          'Nothing in this document is entered by hand after generation; the layout, table of contents and page numbers are produced automatically.',
        ],
      },
      { t: 'h2', text: 'Cadence worth adopting' },
      {
        t: 'bullets',
        items: [
          'Regenerate before any investor or partner conversation, so numbers and screens are current.',
          'Review the Roadmap section monthly, and move completed items out rather than letting them age.',
          'Review the Goals section against the analytics dashboard, and record actuals separately from targets.',
          'Keep the Data Model section accurate whenever a record changes, because it is the part a technical partner will read first.',
        ],
      },
    ],
  },
  {
    id: 'glossary',
    title: 'Glossary',
    blocks: [
      {
        t: 'table',
        head: ['Term', 'Meaning in this product'],
        widths: [0.26, 0.74],
        rows: [
          ['Challenge', 'A single competitive agreement between a creator and one or more opponents, with a sport, place, time and format.'],
          ['Series', 'A challenge played over multiple games, best of three, five or seven, or open-ended.'],
          ['Group challenge', 'A challenge with two or more opponents, a group name and per-player scores; shown as a league inside Groups.'],
          ['League', 'A recurring competition with members, scheduled sessions and RSVPs.'],
          ['Result', 'A recorded outcome for a game, which triggers statistics, content and scoring.'],
          ['City credit', 'One point added to a participants city and state for a completed challenge, applied at most once.'],
          ['Rivalry', 'An automatically activated record between two players who meet repeatedly, with its own head-to-head history.'],
          ['Ready to Ball', 'A profile flag signalling that the player is available to play.'],
          ['Highlight card', 'A styled post for an event with a title, custom stat rows and photos.'],
          ['Record (or entity)', 'A stored type of data, such as a Post or a Challenge.'],
          ['Rule (or RLS)', 'A per-record permission deciding who may read, create, update or delete it.'],
          ['Push', 'A lock-screen alert delivered to the players device by the platform.'],
        ],
      },
    ],
  },
];