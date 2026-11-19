// Investor-facing half of the business plan. Every figure that is a goal,
// an assumption or an unbuilt idea is labelled as such in the copy — the app
// itself has no billing, no ad spend and no user-count reporting yet.

export const BUSINESS_SECTIONS = [
  {
    id: 'exec',
    title: 'Executive Summary',
    blocks: [
      {
        t: 'p',
        text: 'Ball Up Top is a mobile-first competitive sports network. It turns a pickup game into a permanent competitive record: two players agree to a challenge, the result is recorded in the app, and that result immediately feeds a personal record, a head-to-head rivalry, and a public leaderboard for the players city and state.',
      },
      {
        t: 'p',
        text: 'Most social sports apps stop at coordination. They help you find a game or book a court, then forget it happened. Ball Up Top treats the result as the product. Every completed challenge is scored, attributed to the players home location, and surfaced in a feed, a rivalry page and a city ranking. The competitive history becomes the players reputation, which is what keeps people coming back and what pulls their opponents in.',
      },
      { t: 'h2', text: 'What exists today' },
      {
        t: 'bullets',
        items: [
          'A working iOS-first web app: feed, challenge creation, live scoring, series play, group challenges, direct and group messaging, recurring leagues, profiles, awards, rivalries and a notifications center.',
          'A location competition engine: every completed challenge credits the participants home city and state, and those totals drive a public leaderboard that refreshes every 60 seconds.',
          'A relationship engine: friends, blocked users, head-to-head records, streak tracking and automatic rivalry activation once two players meet often enough.',
          'A native notification layer: in-app notifications and push alerts for every activity category, each one individually switchable by the player.',
        ],
      },
      { t: 'h2', text: 'Where the opportunity sits' },
      {
        t: 'p',
        text: 'Pickup sport is organised in group chats and memory. Scores evaporate, trash talk has no record, and there is no standing to defend. Ball Up Top replaces the group chat with a structured record, then makes that record public at the city level so that even players who never meet each other are competing for the same thing.',
      },
      { t: 'h2', text: 'How it grows' },
      {
        t: 'p',
        text: 'Growth is built into the core loop rather than bolted on. A challenge cannot exist without an opponent, so every active player is a distribution channel. The friend QR code makes adding a player at the court a two-second action. Challenge results and highlight cards are designed to be exported as images and posted to social feeds, with the app watermark attached. The plan leans on those three loops plus app store search rather than paid acquisition.',
      },
      {
        t: 'callout',
        label: 'Status note',
        text: 'This document describes a live, published product with real users and real data, but no revenue yet. No payment provider is connected, no advertising has been purchased, and no financial projections are included. Targets in the Goals section are goals, not results.',
      },
    ],
  },
  {
    id: 'problem',
    title: 'The Problem',
    blocks: [
      { t: 'h2', text: 'Pickup games leave no trace' },
      {
        t: 'p',
        text: 'A player can win the same run three weeks in a row and have nothing to show for it. Scores live in a group chat that scrolls away, in a camera roll nobody revisits, or in someones memory. There is no reliable answer to the simplest competitive questions: how many games have I played, who do I actually beat, and who is the best in my city?',
      },
      { t: 'h2', text: 'Coordination tools are not competition tools' },
      {
        t: 'p',
        text: 'Existing apps solve logistics: finding a court, booking a slot, joining a league, splitting a fee. They treat the game as a calendar event that ends when the time slot ends. The social layer is a group chat bolted onto the side, and the outcome is never captured in a way that compounds.',
      },
      { t: 'h2', text: 'The gap Ball Up Top fills' },
      {
        t: 'bullets',
        items: [
          'Record over logistics: the result is the atomic unit of the product, not the booking.',
          'Reputation over follower counts: standing is earned by results that other people confirm.',
          'Place over feeds: your city and state are on the line in every game, so strangers become rivals.',
          'Any sport over one sport: basketball is the anchor, but the same challenge and scoring model covers eleven more sports plus custom games.',
        ],
      },
    ],
  },
  {
    id: 'product',
    title: 'What Ball Up Top Is',
    blocks: [
      {
        t: 'p',
        text: 'Ball Up Top is a single mobile app with five primary surfaces, reachable from a fixed bottom bar: Home, Challenges, Ball Up (the raised centre button), Groups and Profile. Everything else is a detail screen behind those five.',
      },
      {
        t: 'table',
        head: ['Surface', 'What the player does there', 'What it produces'],
        widths: [0.22, 0.42, 0.36],
        rows: [
          ['Home', 'Reads a friends-only feed of results, highlights and rivalry announcements, or switches to Explore to see the city leaderboard.', 'Social proof, rivalry awareness, city standing'],
          ['Challenges', 'Reviews every challenge they are part of, accepts or declines invites, opens a challenge to record scores.', 'The competitive record'],
          ['Ball Up', 'Creates a challenge in five steps, posts a scorecard, or opens the leagues list.', 'New games and new content'],
          ['Groups', 'Toggles Ready to Ball, starts a DM or group chat, opens group challenge standings or the league directory.', 'Organised play and conversation'],
          ['Profile', 'Edits identity and location, and reviews activity, stats, friends, awards and highlights.', 'Reputation and identity'],
        ],
      },
      { t: 'h2', text: 'The unit of value: a completed challenge' },
      {
        t: 'p',
        text: 'A challenge starts as an invitation with a sport, a place and a time. Once accepted and played, the participants record the score. Completion triggers the whole value chain at once: statistics update, a result post appears in the feed, the city and state tallies each gain a point per participant, a rivalry record moves, and the opponent is notified. Nothing else in the app matters as much as this event, and almost every screen exists either to create it or to display its consequences.',
      },
      { t: 'h2', text: 'Two ways to compete' },
      {
        t: 'bullets',
        items: [
          'Head to head: one creator versus one opponent, played as a single game or a best-of series (best of 3, 5 or 7, or an open-ended series).',
          'Group: one creator versus two or more opponents, with a group name, per-player scores and a standings dashboard. Group challenges are what the Groups tab surfaces as live leagues.',
        ],
      },
      { t: 'h2', text: 'What makes it sticky' },
      {
        t: 'bullets',
        items: [
          'A record that only grows: every game is permanent and edits are visible, so the history stays trustworthy.',
          'Reciprocity: to score a game you need an opponent who also uses the app, which converts every new player into at least two active accounts.',
          'Local identity: city and state rankings give players a team they did not have to join.',
          'Recurring reasons to return: leagues with scheduled sessions and RSVPs, a daily question, streak counters and push notifications.',
        ],
      },
    ],
  },
  {
    id: 'audience',
    title: 'Who It Is For',
    blocks: [
      {
        t: 'p',
        text: 'The product is built for people who already play organised pickup sport with the same circle of people and who care, even casually, about who won. Basketball is the entry point; the mechanics are sport-agnostic.',
      },
      {
        t: 'table',
        head: ['Player type', 'Why they open the app', 'What keeps them'],
        widths: [0.24, 0.4, 0.36],
        rows: [
          ['The regular', 'Plays two or three times a week with the same group and wants the run to count for something.', 'Streaks, head-to-head records, city rank'],
          ['The organiser', 'Runs the group chat, sets up the runs, keeps the scores.', 'Leagues, group challenges, standings, session RSVPs'],
          ['The competitor', 'Wants a public record and someone to beat.', 'Rivalries, leaderboards, awards, challenge invites'],
          ['The new arrival', 'Moved to a city, or wants to find a game at their level.', 'Ready to Ball status, friend QR, public leaderboards'],
        ],
      },
      { t: 'h2', text: 'Age and safety posture' },
      {
        t: 'p',
        text: 'The app is intended for players aged 13 and over. A one-time age confirmation gate is shown to every new account before the app opens, and the account controls include blocking, reporting, a private profile mode and full account deletion. Content is user generated, so reporting and blocking are part of the core product rather than an afterthought.',
      },
      { t: 'h2', text: 'Geographic focus' },
      {
        t: 'p',
        text: 'The city competition currently runs on United States locations, selected from a curated list of US cities and states so that every player maps to one consistent key. The model generalises to any country, but the ranking data is only meaningful where there are enough players in one metro area. Early density matters more than early reach: one city with forty active players is worth more than forty cities with one player each.',
      },
    ],
  },
  {
    id: 'principles',
    title: 'Product Principles',
    blocks: [
      {
        t: 'p',
        text: 'These principles come from decisions made while building the app. They explain why it looks and behaves the way it does, and they should govern new work.',
      },
      { t: 'h2', text: '1. The record is the reputation' },
      {
        t: 'p',
        text: 'Stats, rivalries, awards and rankings are all derived from the same stored results. Nothing is hand-edited for show. If a result is corrected, the downstream record corrects with it, which is why result edits are allowed but visibly marked as edited.',
      },
      { t: 'h2', text: '2. Native feel over web feel' },
      {
        t: 'p',
        text: 'The app is laid out as a fixed-height mobile shell with its own scrolling regions, elastic overscroll, safe-area padding for notched phones, press-scale feedback on every control, and gestures such as pull to refresh and swipe to delete. Pinch zoom and double-tap zoom are suppressed. The same code ships to iOS and Android, and the interface is designed for a thumb first and a desktop second.',
      },
      { t: 'h2', text: '3. Quiet, brand-led design' },
      {
        t: 'p',
        text: 'A duo-tone identity (brand blue and brand red) on a light, airy surface, with a near-black dark mode. Typography is a single strong heading face over a neutral body face. Motion is fast and purposeful: staggered card entry, press feedback, and no decorative animation that delays reading.',
      },
      { t: 'h2', text: '4. One source of truth per screen' },
      {
        t: 'p',
        text: 'Screens derive what they show from one fetch and filter locally, rather than firing several competing requests. Where the platform rate-limits bursts, calls are made sequentially with retries and backoff. This is a deliberate reliability trade: a slightly slower load instead of a broken one.',
      },
      { t: 'h2', text: '5. Every notification is a choice' },
      {
        t: 'p',
        text: 'Each notification category has its own switch, and a master switch sits above them. Turning a category off suppresses both the in-app record and the push alert, so the setting means what it says.',
      },
      { t: 'h2', text: '6. No invented data' },
      {
        t: 'p',
        text: 'Rankings, scores and statistics are computed from stored records or not shown at all. Where the app has no data it shows an empty state that tells the player what to do next, rather than placeholder numbers.',
      },
    ],
  },
  {
    id: 'decisions',
    title: 'Decision History',
    blocks: [
      {
        t: 'p',
        text: 'This product was shaped by a long series of decisions, many of which replaced an earlier approach. Recording them is the cheapest way to stop the same debate from reopening, and it explains why several screens behave the way they do.',
      },
      { t: 'h2', text: 'How the product has evolved' },
      {
        t: 'p',
        text: 'Ball Up Top began as a way to find a pickup game nearby, with a map of public events and a sign-up list. That version competed with every scheduling tool and diluted the one thing the app did better than anything else: keeping a record of who won. The map was removed, the identity moved to the competitive record, and the location mechanic was rebuilt as a city and state competition. Scoring followed the same path, from a single yearly city total to per-city and per-state completed-challenge counts with an idempotent credit for every participant. The most recent change was structural rather than conceptual: the web app was rebuilt to behave like a native iOS application, with fixed page bounds, inner scrolling, safe-area handling and real push notifications.',
      },
      { t: 'h2', text: 'Decisions that shape the product today' },
      {
        t: 'table',
        head: ['Decision', 'Reason', 'Where it shows'],
        widths: [0.36, 0.36, 0.28],
        rows: [
          ['Any participant can record or finalise a result', 'One absent player must not be able to freeze a game out of the record', 'Challenge detail, score entry'],
          ['A challenge stores a list of opponents, not one', 'Group play needed per-player scores and a standings table', 'Group challenges, Groups tab'],
          ['Completed results lead the feed, not upcoming fixtures', 'The feed should show what happened, not what might happen', 'Home'],
          ['A custom sport requires a name and an emoji', 'A custom game still has to read properly on a card', 'Ball Up, step one'],
          ['One confirmation pattern for every edit and delete', 'Destructive actions should feel identical everywhere', 'Posts, challenges, comments'],
          ['Cities chosen from a curated US list, stored as key and display form', 'Free text created duplicate cities and split the ranking', 'Profile editor, Explore'],
          ['Location credit is written per participant before totals move', 'Retries and repeated passes must never double count', 'Scoring engine'],
          ['One master push switch with per-category switches', 'One place to reason about alerts, one place to silence them', 'Settings'],
          ['Opponent selection leads with recent and most-played lists', 'A rematch is the most common case and should take two taps', 'Ball Up, step two'],
          ['Photos are cropped to a fixed ratio before upload', 'Consistent cards and smaller uploads', 'Post composer, highlight cards'],
          ['Explore refreshes every 60 seconds only while visible', 'Live feel without spending requests in the background', 'Explore'],
          ['Fixed page bounds with scrolling only inside containers', 'Stops the whole page rubber-banding like a website', 'Every screen'],
        ],
      },
      { t: 'h2', text: 'Approaches tried and replaced' },
      {
        t: 'table',
        head: ['Approach', 'Why it was replaced'],
        widths: [0.4, 0.6],
        rows: [
          ['A navy and gold arena theme', 'It read as a different brand; the light blue and red duo-tone was adopted instead.'],
          ['Forcing components to remount with a key to clear stale state', 'It hid a state lifecycle bug rather than fixing it, and reset scroll and form state.'],
          ['Parallel requests when several screens mounted', 'Bursts tripped the platform rate limit; requests are now spaced and retried.'],
          ['A public event map for game discovery', 'It competed with the city competition identity and split the product in two.'],
          ['Re-fetching data on every tab switch', 'It produced race conditions and screens that disagreed with each other; one fetch with derived filtering replaced it.'],
          ['A long-press gesture to open the reaction picker', 'It fought with tap and hold behaviour and made the control unreliable; an explicit tap replaced it.'],
          ['Rendering a screenshot for social sharing', 'Fragile and resource heavy; the share image is drawn natively on a canvas.'],
        ],
      },
    ],
  },
  {
    id: 'market',
    title: 'Market and Competitive Position',
    blocks: [
      {
        t: 'p',
        text: 'The competitive set splits into pickup coordination apps, league management software and general social feeds. Ball Up Top sits between them: lighter than league software, heavier than a group chat, and public where the others are private.',
      },
      {
        t: 'table',
        head: ['Product', 'What it does well', 'Where it leaves room'],
        widths: [0.18, 0.4, 0.42],
        rows: [
          ['Hoopla', 'Basketball-specific pickup coordination with a focused audience.', 'Single sport, and limited push notification for public game discovery.'],
          ['Playiton', 'League management and pickup booking with player profiles.', 'Thin social layer, and no location-based public game discovery.'],
          ['Group chats', 'Zero friction, already installed, everyone is there.', 'No record, no standings, no search, no permanence.'],
          ['League software', 'Scheduling, fees, rosters, administration.', 'Built for organisers, not players, and only for registered leagues.'],
        ],
      },
      {
        t: 'callout',
        label: 'Verify before external use',
        text: 'The competitor notes above come from the apps internal marketing plan and describe positioning, not audited market research. Confirm current features and pricing directly before putting them in front of an investor.',
      },
      { t: 'h2', text: 'Defensible position' },
      {
        t: 'bullets',
        items: [
          'Multi-sport by design: twelve sport keys including custom games, so a friend group does not have to switch apps for darts night or a golf round.',
          'The location competition is a network effect with a public scoreboard: the more players in a city, the more meaningful the ranking, and the more reason for the next player to join that city.',
          'The rivalry mechanic creates recurring fixtures rather than one-off matches, which raises retention without new features.',
          'Everything is captured in one data model, so reputation, awards and rankings all reinforce each other.',
        ],
      },
      { t: 'h2', text: 'Risks to the position' },
      {
        t: 'bullets',
        items: [
          'Cold start by geography: a leaderboard with three cities and two players is not compelling. Density in one metro is the first milestone.',
          'Two-sided recording: a result needs both players to be in the app. The invitation flow is the funnel, so invite completion is the metric that matters most.',
          'Copyability: the mechanics are replicable; the stored competitive history and the city scoreboard are not.',
        ],
      },
    ],
  },
  {
    id: 'model',
    title: 'Business Model Options',
    blocks: [
      {
        t: 'callout',
        label: 'Important',
        text: 'No revenue mechanism is implemented today. No payment provider is connected, nothing in the app charges a player, and no revenue figures exist. Everything in this section is an option under consideration, not a description of current functionality.',
      },
      { t: 'h2', text: 'Option A: free core, paid organiser tools' },
      {
        t: 'p',
        text: 'Keep every player-facing feature free, and charge organisers for running structured competition: league creation beyond a free limit, automated scheduling, exports, and richer standings. The organiser is already the person who recruits the most players, so charging them is charging the distribution channel rather than the audience.',
      },
      { t: 'h2', text: 'Option B: city competition sponsorship' },
      {
        t: 'p',
        text: 'The city and state leaderboards are a natural surface for local sponsorship: a gym, a court operator, a sneaker retailer or a beverage brand attached to a city table. This keeps the player experience free and monetises attention that is already concentrated by geography.',
      },
      { t: 'h2', text: 'Option C: premium identity' },
      {
        t: 'p',
        text: 'Cosmetic and identity upgrades: profile treatments, highlight card styles, award showcases and rivalry presentation. Purely additive, no competitive advantage, which protects the integrity of the record.',
      },
      { t: 'h2', text: 'What would have to be true' },
      {
        t: 'bullets',
        items: [
          'Enough density in at least one metro that the city leaderboard is contested weekly.',
          'Enough completed challenges per active player that the record feels worth protecting.',
          'A payment path that does not interrupt the challenge flow, since the challenge is the activation event.',
          'Clear terms for user-generated content before any sponsorship or paid tier goes live.',
        ],
      },
    ],
  },
  {
    id: 'growth',
    title: 'Go-To-Market Plan',
    blocks: [
      {
        t: 'p',
        text: 'The plan concentrates on three channels: two that are free and already built into the product, and one content channel that requires modest spend. The stated budget band for this plan is approximately 100 US dollars per month, which is spent on content production rather than media buying.',
      },
      { t: 'h2', text: 'Channel 1: short-form video (highest priority)' },
      {
        t: 'bullets',
        items: [
          'Post 15 to 30 second clips of real in-app challenges and results, with the Ball Up Top watermark visible.',
          'Run a recurring series around challenge outcomes, for example a weekly who got cooked segment, to build a followable brand rather than a stream of ads.',
          'Target basketball hashtags and local city tags so the content reaches players who already play, in places where the app already has density.',
        ],
      },
      { t: 'h2', text: 'Channel 2: QR code and invite referral (free, already shipped)' },
      {
        t: 'bullets',
        items: [
          'The profile QR code and friend link are the acquisition mechanic. Prompt players to share it after completing a challenge or joining an event, when intent is highest.',
          'Add a bring your squad prompt on the post-game screen that opens the QR share flow.',
          'Produce printable QR cards for local courts, so an organiser can add a whole run at once.',
        ],
      },
      { t: 'h2', text: 'Channel 3: app store search (free)' },
      {
        t: 'bullets',
        items: [
          'Lead the title and subtitle with the highest-intent phrases: pickup basketball, find local games, challenge players.',
          'Open the description with the core promise: find a run, challenge players, build your record.',
          'Use real product screenshots in the first two slots, starting with the city leaderboard rather than a splash screen, because the leaderboard is the differentiator.',
        ],
      },
      { t: 'h2', text: 'What the plan deliberately avoids' },
      {
        t: 'p',
        text: 'Paid install campaigns at this budget, broad influencer seeding without geographic focus, and growth into new sports before one city is dense. Each of those spends money to widen a funnel that has not yet proven it retains.',
      },
    ],
  },
  {
    id: 'goals',
    title: 'Goals, KPIs and Targets',
    blocks: [
      {
        t: 'p',
        text: 'Three metrics define whether the product is working: new players arriving, challenges being sent, and games actually being played. Challenges sent is the leading indicator because a challenge always pulls in a second player; games played is the retention signal. The 90-day targets below come from the current marketing plan and are goals, not measured results.',
      },
      {
        t: 'table',
        head: ['Metric', 'Organic only', 'At ~$100/mo', 'At ~$500/mo', 'At $1,000+/mo'],
        widths: [0.32, 0.17, 0.17, 0.17, 0.17],
        rows: [
          ['New players per week (90-day target)', '15', '30', '50', '120'],
          ['Challenges sent per week (90-day target)', '40', '80', '200', '500'],
          ['Games played per week (90-day target)', '60', '120', '300', '700'],
        ],
      },
      {
        t: 'callout',
        label: 'Current budget band',
        text: 'The plan is operating at the approximately 100 dollars per month band, so the middle column is the active target set: 30 new players per week, 80 challenges sent per week, and 120 games played per week within 90 days.',
      },
      { t: 'h2', text: 'How each metric is intended to be measured' },
      {
        t: 'bullets',
        items: [
          'New players: an analytics event fired when a registration completes, counted as unique sessions over a seven-day window.',
          'Challenges sent: an analytics event fired when a challenge is created and the invitation is dispatched, counted over a seven-day window.',
          'Games played: an analytics event fired when a result is saved, counted over a seven-day window.',
        ],
      },
      {
        t: 'callout',
        label: 'Instrumentation caveat',
        text: 'The app tracks these events through the platforms analytics layer, but the dashboards for them live outside the app. Treat the numbers in this section as the definition of success, and read the actual counts from the analytics dashboard rather than from this document.',
      },
      { t: 'h2', text: 'Qualitative goals for the same period' },
      {
        t: 'bullets',
        items: [
          'One metro area with enough weekly completed challenges that the city table changes order every week.',
          'Rivalries activating without prompting, which is the clearest sign that two players are choosing each other repeatedly.',
          'A majority of challenges sent being accepted and played, not abandoned.',
          'Notification preferences left at their defaults, which indicates the alerts are useful rather than noisy.',
        ],
      },
    ],
  },
  {
    id: 'roadmap',
    title: 'Roadmap, Known Gaps and Risks',
    blocks: [
      {
        t: 'p',
        text: 'The honest position: the competitive core is built and running, while the surrounding product and the business layer are not. The list below separates what is missing from what is merely unfinished.',
      },
      { t: 'h2', text: 'Open product work' },
      {
        t: 'bullets',
        items: [
          'Highlight card creation is reachable from the scorecard menu, but should also be surfaced as a direct option in the main Ball Up menu for non-challenge posts.',
          'Group challenge standings exist as a dashboard, but need a clearer entry point from the challenge itself.',
          'Leagues should be reachable directly from the scorecard menu section, not only from the Groups tab.',
          'Registration and password reset need an end-to-end pass before app store submission.',
          'Password reset deep linking needs universal links so the email opens the app rather than the browser.',
          'The support address in the legal pages is still a placeholder and must be replaced before launch review.',
          'Safe-area handling needs a cross-page audit on notched devices so no header is clipped.',
        ],
      },
      { t: 'h2', text: 'Scale and reliability work' },
      {
        t: 'bullets',
        items: [
          'Bulk fetching on Settings and a few list screens still needs pagination rather than loading everything at once.',
          'Rate limiting on burst requests is mitigated with sequential calls, retries and a queue, but the long-term answer is narrower queries per screen.',
          'Notification delivery depends on the native build having push credentials configured; the app cannot verify lock-screen delivery on its own.',
        ],
      },
      { t: 'h2', text: 'Business layer still to build' },
      {
        t: 'bullets',
        items: [
          'No payment provider, pricing, subscription or sponsorship mechanism is connected.',
          'No formal analytics dashboard inside the app for the three headline KPIs.',
          'No moderation queue: reporting and blocking exist, but reports are stored rather than triaged in a console.',
        ],
      },
      { t: 'h2', text: 'Principal risks' },
      {
        t: 'table',
        head: ['Risk', 'Why it matters', 'Mitigation'],
        widths: [0.24, 0.4, 0.36],
        rows: [
          ['Thin local density', 'A leaderboard nobody contests has no value.', 'Target one metro first; use QR cards and organiser outreach.'],
          ['One-sided results', 'A game needs both players to record it.', 'Invitation flow, reminders, and allowing any participant to finalise a game.'],
          ['Notification fatigue', 'Push is the retention channel; overuse kills it.', 'Per-category switches, master switch, and duplicate suppression.'],
          ['Content moderation', 'User-generated posts and photos carry risk.', 'Reporting, blocking, private profiles, account deletion, 13+ gate.'],
          ['Platform dependency', 'Hosting, auth and push are platform services.', 'Keep data model portable; export records periodically.'],
        ],
      },
    ],
  },
];