// Screen-by-screen reference for every surface a player can reach, written to
// match the current routes and the labels actually rendered in the app.

export const PRODUCT_SECTIONS = [
  {
    id: 'nav',
    title: 'Navigation and Screen Map',
    blocks: [
      {
        t: 'p',
        text: 'The app is a fixed-height mobile shell. The bottom bar never scrolls away: Home, Challenges, the raised Ball Up button, Groups and Profile. Detail screens open over the shell with a back control that always has a fallback route, so a link opened cold still has somewhere to go back to.',
      },
      {
        t: 'table',
        head: ['Route', 'Screen', 'Reached from'],
        widths: [0.3, 0.32, 0.38],
        rows: [
          ['/', 'Home: Friends feed and Explore ranking', 'Bottom bar'],
          ['/challenges', 'Challenges list', 'Bottom bar'],
          ['/challenges/:id', 'Challenge detail', 'Challenges list, feed, notifications'],
          ['/ball-up', 'Ball Up: five-step challenge creator', 'Centre button'],
          ['/groups', 'Groups: Ready to Ball, leagues and chats', 'Bottom bar'],
          ['/groups/:challengeId', 'Group standings', 'Groups league list'],
          ['/messages', 'Messages: conversation list', 'Groups, profile'],
          ['/messages/:threadId', 'Conversation', 'Messages, notifications'],
          ['/profile/:username', 'Profile (me resolves to the signed-in player)', 'Bottom bar, avatars, feed'],
          ['/friends', 'Friends, requests and recommendations', 'Home empty state, profile'],
          ['/add-friend/:userId', 'Add a friend from a link or QR', 'Shared friend link'],
          ['/notifications', 'Notification centre', 'Bell in the header'],
          ['/settings', 'Settings and account controls', 'Profile'],
          ['/leagues', 'League directory', 'Ball Up, Groups'],
          ['/leagues/new', 'Create a league', 'League directory'],
          ['/leagues/:leagueId', 'League detail: sessions, RSVPs, players', 'League directory'],
          ['/rivalry/:rivalryId', 'Rivalry record and game history', 'Profile, feed announcement'],
          ['/leaderboard/:sport', 'Public leaderboard page', 'Shared links'],
          ['/privacy-policy, /terms-of-service', 'Legal pages', 'Settings, registration'],
        ],
      },
      { t: 'h2', text: 'Persistent elements' },
      {
        t: 'bullets',
        items: [
          'Header: brand mark and title, a back control on detail screens, and a bell with an unread count that opens the notification centre.',
          'Bottom bar: five targets, each at least 44 pixels tall, with the active tab scaled and tinted. Tapping the active tab scrolls that screen back to the top instead of doing nothing.',
          'Safe areas: the top and bottom insets of the device are respected, so nothing sits under a notch or a home indicator.',
        ],
      },
    ],
  },
  {
    id: 'home',
    title: 'Home: Friends Feed and Explore',
    blocks: [
      {
        t: 'p',
        text: 'Home opens on a two-option segmented control. Friends is the social feed; Explore is the city competition. Both live on the same screen because the two motivations, seeing your people and seeing your standing, are one habit.',
      },
      { t: 'h2', text: 'Friends feed' },
      {
        t: 'bullets',
        items: [
          'A personal header greets the player and surfaces their own standing before the first post.',
          'Only posts from accepted friends appear, plus any post that tags the player. Blocked accounts are removed before display, in both directions.',
          'The feed pages fifteen posts at a time and keeps paging automatically while a page contains nobody the player follows, so the screen never stalls on an empty batch.',
          'Pull to refresh reloads quietly without blanking the screen. Infinite scroll loads the next batch when the sentinel approaches.',
          'Empty, loading and failure states are all distinct: a skeleton while loading, a retry action on failure, and an empty state that links to finding friends.',
        ],
      },
      { t: 'h2', text: 'What a post can be' },
      {
        t: 'table',
        head: ['Post type', 'Contents', 'Where it comes from'],
        widths: [0.24, 0.44, 0.32],
        rows: [
          ['Standard', 'Text body, up to several photos, author identity, timestamps, edited marker.', 'Post composer or a challenge result'],
          ['Highlight card', 'Event title, one to three custom stat rows, photos, caption, styled card visual.', 'Post a scorecard in Ball Up'],
          ['Rivalry announcement', 'A dedicated card announcing that two players have become official rivals.', 'Automatic when a rivalry activates'],
          ['Rivalry milestone', 'A card marking a significant head-to-head threshold.', 'Rivalry engine'],
          ['Challenge result', 'Score text, sport, location, tagged participants, per-player scores for group games.', 'Recording a result on a challenge'],
        ],
      },
      { t: 'h2', text: 'Post actions' },
      {
        t: 'bullets',
        items: [
          'React: one reaction per player per post, chosen from a curated picker, shown as grouped pills under the post with live counts. Choosing a different reaction replaces the previous one.',
          'Comment: opens a comment sheet; the post author is notified, and comment counts update on the card.',
          'Share: copy link or save image only. The image is rendered on a canvas with the post content and branding, which is the main organic distribution surface.',
          'Edit or delete: available to the author, with a confirmation dialog for deletion. Editing flags the post as edited.',
          'Report: any player can report a post, a comment or a user with a reason and optional detail.',
        ],
      },
      { t: 'h2', text: 'Explore: the city competition' },
      {
        t: 'bullets',
        items: [
          'A hero card crowns the leading city with its completed challenge count, or shows a dashed empty state when nothing has been scored yet.',
          'Top five cities and top five states are listed with medals for the first three places. The players own city and state are highlighted and labelled.',
          'A personal block shows the players city and state with their current rank and count, or an add location prompt that links to the profile editor.',
          'The data refreshes every sixty seconds while the screen is visible, immediately when the app returns to the foreground, and never while it is backgrounded.',
          'A closing call to action opens the challenge creator, which is the only way to move a city up the table.',
        ],
      },
      { t: 'h2', text: 'Scoring rule shown to the player' },
      {
        t: 'p',
        text: 'Every completed challenge scores one for each participants city and one for each participants state. Two players from Durham completing one game produce two points for Durham and two for North Carolina. The screen states this plainly so the mechanic is understood without explanation.',
      },
    ],
  },
  {
    id: 'ballup',
    title: 'Ball Up: Creating a Challenge',
    blocks: [
      {
        t: 'p',
        text: 'The raised centre button opens a five-step flow. Each step is a single decision, the progress indicator reads Step N of 5, and the back control steps backwards rather than leaving the flow.',
      },
      { t: 'h2', text: 'Step 1: pick the game' },
      {
        t: 'bullets',
        items: [
          'Twelve sport options: basketball, golf, pickleball, darts, disc golf, cornhole, trivia, chugging, ping pong, spikeball, board games and custom.',
          'Choosing a standard sport advances immediately. Choosing custom opens a short form for a challenge name and an emoji, both required.',
          'Two secondary entries sit on this screen: Post a Scorecard, for a highlight card that is not a challenge, and Leagues, for organised recurring play.',
        ],
      },
      { t: 'h2', text: 'Step 2: choose opponents' },
      {
        t: 'bullets',
        items: [
          'Recently Challenged lists the seven most recent distinct players the user has finished a game with, newest first, deduplicated so one frequent opponent cannot fill the list.',
          'Top 5 Most Played ranks friends by how many completed challenges they share with the player.',
          'An All Friends sheet opens the full friend list with a search field that tolerates partial names and misspellings, and also surfaces public players who are not yet friends.',
          'Selecting two or more opponents reveals a group name field, which turns the challenge into a group challenge with per-player scoring.',
        ],
      },
      { t: 'h2', text: 'Step 3: location' },
      {
        t: 'p',
        text: 'A place is required. It is stored as a display name on the challenge and shown on the result post and in the challenge detail, so the record reads like a real game rather than an abstract match.',
      },
      { t: 'h2', text: 'Step 4: time and series' },
      {
        t: 'bullets',
        items: [
          'A date and time for the game, which is also what the reminder and calendar behaviours key off.',
          'Series format: single game, best of 3, best of 5, best of 7, or an open series that runs until the players end it.',
          'Any format other than single requires a series name, because the series is what the players will refer to afterwards.',
        ],
      },
      { t: 'h2', text: 'Step 5: review and send' },
      {
        t: 'p',
        text: 'A summary of sport, opponents, place, time and format. Sending creates the challenge, records each opponent as pending, posts an announcement to the feed, and notifies every opponent. The creator is then taken to the challenge detail screen, which is where the game will be accepted, played and scored.',
      },
      { t: 'h2', text: 'Why this flow is the funnel' },
      {
        t: 'p',
        text: 'Every invitation is a new account opportunity: an opponent who is not yet on the app receives a link to join and see the challenge. The recently challenged and most played lists exist to shorten the most common case, a rematch with someone the player already plays with, to two taps.',
      },
    ],
  },
  {
    id: 'challenges',
    title: 'Challenges and Challenge Detail',
    blocks: [
      { t: 'h2', text: 'Challenges list' },
      {
        t: 'bullets',
        items: [
          'Every challenge the player created or was invited to, newest first, with sport, opponent or group name, place, time and status.',
          'Statuses are pending, accepted, declined, completed and cancelled, each with its own visual treatment.',
          'Series challenges show the running game count, for example two games to one, rather than a single score.',
          'An empty state routes to the challenge creator instead of leaving a blank screen.',
        ],
      },
      { t: 'h2', text: 'Challenge detail' },
      {
        t: 'table',
        head: ['Area', 'What it shows or does'],
        widths: [0.26, 0.74],
        rows: [
          ['Header', 'Sport, group or opponent names, status, place, scheduled time, and whether the invitation has expired.'],
          ['Invitation', 'Accept or decline, shown to invited players while the challenge is pending.'],
          ['The Squad', 'Every participant with their individual status, so a group challenge shows who has confirmed.'],
          ['Games', 'For series play, a per-game list with scores, photos and captions, plus a control to add a game.'],
          ['Score entry', 'Recording a result for a single game, or per-player scores for a group challenge. Any participant can record or finalise a result.'],
          ['Winner selection', 'For group games, the winner is selected from the participants, or recorded as a draw.'],
          ['Completion', 'Completing a challenge writes the result, updates statistics, creates the feed post, and triggers location and rivalry scoring.'],
          ['Editing', 'Score, caption, photos and series games can be corrected afterwards; the linked post is updated rather than duplicated.'],
          ['Deletion', 'Available to the creator or an opponent, behind a confirmation dialog, and it removes the associated post and scores.'],
        ],
      },
      { t: 'h2', text: 'Series behaviour' },
      {
        t: 'p',
        text: 'A series tracks games won by each side and ends when one side reaches the games needed to win, or when an open series is ended manually. Ending a series requires a winner decision, and the final state is written back to the challenge so the record is complete rather than left hanging.',
      },
    ],
  },
  {
    id: 'groups',
    title: 'Groups, Standings and Chats',
    blocks: [
      {
        t: 'p',
        text: 'Groups is the organisation surface. It answers three questions in one place: am I available, what am I part of, and who am I talking to.',
      },
      { t: 'h2', text: 'Ready to Ball' },
      {
        t: 'p',
        text: 'A single switch sets a visible availability flag on the profile, with a small indicator on the Groups screen. It is a low-effort signal to friends that the player is looking for a run, without creating an event.',
      },
      { t: 'h2', text: 'Quick actions' },
      {
        t: 'bullets',
        items: [
          'New DM opens a player picker and creates or reopens the one-to-one thread.',
          'New Group opens a group creator with a name and member selection, then lands in the conversation.',
        ],
      },
      { t: 'h2', text: 'Leagues and Chats' },
      {
        t: 'p',
        text: 'A two-option toggle splits the lower half of the screen. Leagues lists every group challenge the player is part of, with sport, player count and either a series score or a winner. Chats lists every thread the player participates in, with the last message and a relative timestamp.',
      },
      { t: 'h2', text: 'Group standings' },
      {
        t: 'bullets',
        items: [
          'A ranked table of every participant in a group challenge, ordered by games won.',
          'Per-player scores recorded for each game are what the standings are derived from, so a corrected score reorders the table.',
          'Win counts per player are shown alongside the group result, so a player can lose the group but still see their own record.',
        ],
      },
      { t: 'h2', text: 'The two league concepts' },
      {
        t: 'table',
        head: ['Concept', 'What it is', 'Where it lives'],
        widths: [0.24, 0.44, 0.32],
        rows: [
          ['Group challenge', 'A multiplayer challenge with a group name and per-player scores. Shown as a league inside Groups.', 'Challenge record, standings screen'],
          ['League', 'A recurring competition with its own record, a sport, a member list, scheduled sessions and RSVPs.', 'Leagues directory and league detail'],
        ],
      },
      {
        t: 'callout',
        label: 'Naming note',
        text: 'Both surfaces use the word league. In Groups it means a group challenge with standings; in the Leagues directory it means a recurring session-based competition. This is worth unifying in the interface at some point.',
      },
    ],
  },
  {
    id: 'messages',
    title: 'Messages and Conversations',
    blocks: [
      { t: 'h2', text: 'Messages list' },
      {
        t: 'bullets',
        items: [
          'Every thread the player belongs to, ordered by the most recent message, each with the other participants name or the group name, the last message and a timestamp.',
          'A search field filters conversations by participant or group name.',
          'A new direct message can be started from here as well as from Groups.',
        ],
      },
      { t: 'h2', text: 'Conversation' },
      {
        t: 'bullets',
        items: [
          'Messages are sent optimistically: the bubble appears immediately and reconciles with the server, so sending feels instant even on a weak connection.',
          'Reactions are available on individual messages, shown as small grouped pills on the bubble.',
          'A challenge button inside a conversation creates a challenge with that person without leaving the chat, which connects conversation directly to competition.',
          'Group threads carry a settings sheet for renaming, membership and leaving, and group admins are recorded on the thread.',
          'A group challenge gets its own dedicated thread, linked to the challenge record, so the trash talk lives with the game.',
        ],
      },
      { t: 'h2', text: 'Read state' },
      {
        t: 'p',
        text: 'Read position is tracked per thread and per player, which is what drives unread indicators rather than a single timestamp on the thread.',
      },
    ],
  },
  {
    id: 'leagues',
    title: 'Leagues: Recurring Competition',
    blocks: [
      {
        t: 'p',
        text: 'Leagues exist for the organiser, the person who runs the same game every week and wants a standing record of it. A league has a name, a description, a sport, a home location and a member list, and it owns a schedule.',
      },
      { t: 'h2', text: 'Creating a league' },
      {
        t: 'bullets',
        items: [
          'Name and optional description, plus a sport chosen from the same twelve sport keys used by challenges.',
          'A member list built from friends, with the creator included automatically.',
          'A home location used as the default for sessions.',
        ],
      },
      { t: 'h2', text: 'League detail' },
      {
        t: 'table',
        head: ['Section', 'Contents'],
        widths: [0.26, 0.74],
        rows: [
          ['Header', 'League name, sport, location, organiser and member count.'],
          ['Upcoming times', 'Scheduled sessions with date, time, place and an RSVP control.'],
          ['Past times', 'Completed sessions, kept as the leagues history.'],
          ['Players', 'The member list, with the organiser marked.'],
          ['Recap', 'A recap post can be published from a session, which lands in the feed and counts toward the city competition.'],
        ],
      },
      { t: 'h2', text: 'RSVPs' },
      {
        t: 'p',
        text: 'Each session has its own attendance list. A player responds going or not going, and the response is stored against that session rather than the league, so attendance history is preserved and the organiser can see who actually shows up.',
      },
      {
        t: 'callout',
        label: 'Roadmap',
        text: 'League entry points are still thin: leagues are reachable from Groups and from the Ball Up menu, but not yet from the scorecard flow or from a players profile. Better discovery is planned.',
      },
    ],
  },
  {
    id: 'profile',
    title: 'Profile and Its Five Tabs',
    blocks: [
      {
        t: 'p',
        text: 'The profile is the reputation surface. It is also the only place a player edits who they are and where they compete from. Visiting your own profile resolves to the same screen as visiting anyone elses, with editing controls appearing only for the owner.',
      },
      { t: 'h2', text: 'Identity block' },
      {
        t: 'bullets',
        items: [
          'Avatar and banner, both uploadable, with a crop step before upload.',
          'Username, nickname, bio, favourite team and favourite sport.',
          'Home city and state, chosen from a curated list so the value maps to a ranking key rather than free text.',
          'Position (point guard through centre, or any) and a self-assessed skill level.',
          'Ready to Ball indicator, and a rivalry slot for the players current rival.',
        ],
      },
      { t: 'h2', text: 'Competitive summary' },
      {
        t: 'p',
        text: 'Above the tabs sits the record: games played, wins, losses, draws, current streak, longest streak, challenge wins and rivalry wins. These are computed from completed challenges rather than entered by hand.',
      },
      { t: 'h2', text: 'The five tabs' },
      {
        t: 'table',
        head: ['Tab', 'What it shows'],
        widths: [0.22, 0.78],
        rows: [
          ['Activity', 'Completed challenges plus every post the player authored or was tagged in, with reactions available inline and deletion for their own posts.'],
          ['Stats', 'The detailed record: win rate, streaks, sport breakdown, recent form and head-to-head highlights.'],
          ['Friends', 'The friend list with relationship state, plus pending requests and a route to add someone.'],
          ['Awards', 'Earned awards and trophies, each with a shareable award card and its own detail page.'],
          ['Highlights', 'Highlight cards the player has published, presented as a gallery of their best moments.'],
        ],
      },
      { t: 'h2', text: 'Profile actions' },
      {
        t: 'bullets',
        items: [
          'Message: opens or creates the direct thread with that player.',
          'Challenge: opens the profile challenge sheet, pre-filled with that opponent, so a challenge can start from a profile without going through the main flow.',
          'Friend actions: add, accept, decline or remove, depending on the current relationship.',
          'QR code: shows a scannable friend code and a shareable link, which is the in-person acquisition mechanic.',
          'Report or block: available on any other players profile; blocking removes their content from the feed in both directions.',
          'Edit: a bottom sheet for the editable fields, saved back to the profile record and reflected everywhere the profile is cached.',
        ],
      },
      { t: 'h2', text: 'Private profiles' },
      {
        t: 'p',
        text: 'A private profile limits visibility to friends. The setting lives both in Settings and in the edit sheet, and it is enforced on reads rather than only hidden in the interface.',
      },
    ],
  },
  {
    id: 'social',
    title: 'Friends, Rivalries and Awards',
    blocks: [
      { t: 'h2', text: 'Friends' },
      {
        t: 'bullets',
        items: [
          'Friends screen lists accepted friends, incoming requests with accept and decline, and outgoing requests with a cancel option.',
          'Recommended friends suggests players to add, which is how a new account gets its first opponents.',
          'Search tolerates partial names and misspellings and prioritises friends over strangers in the results.',
          'Adding a friend is possible by username search, by QR scan in person, or by an invite link that opens the add friend screen directly.',
          'Friend requests, acceptances and removals each produce a notification, subject to the friend activity preference.',
        ],
      },
      { t: 'h2', text: 'Rivalry' },
      {
        t: 'p',
        text: 'A rivalry is created automatically when two players meet often enough in a short window. It is a record, not a setting: once active, the app tracks wins, losses, draws, the current streak, the last result and the sport the pair plays most.',
      },
      {
        t: 'bullets',
        items: [
          'The rivalry screen shows the head-to-head record, a game history filtered by all, wins, losses, ties or the last thirty days, and a sport breakdown.',
          'Activation is announced with its own feed card, which is one of the few posts a player did not have to write.',
          'A rivalry can be marked past when the pair stops playing, without deleting the history.',
          'A player can nominate a current rival to display on their profile, which is the social hook that keeps a specific matchup front of mind.',
        ],
      },
      { t: 'h2', text: 'Awards' },
      {
        t: 'bullets',
        items: [
          'Awards are derived from stored results, for example win milestones, streak length, rivalry dominance or volume of play.',
          'Each award has a detail page and a shareable card rendered to an image, which turns an internal milestone into external content.',
          'The trophy case on the profile is the visible payoff, and awards tab is where a player checks what is next.',
        ],
      },
    ],
  },
  {
    id: 'notifications',
    title: 'Notification Centre',
    blocks: [
      {
        t: 'p',
        text: 'The bell in the header carries an unread count and opens a chronological list. Every notification has a type, an actor, a title, a body and a link, and the list is the in-app mirror of what was pushed to the device.',
      },
      { t: 'h2', text: 'Behaviour' },
      {
        t: 'bullets',
        items: [
          'Unread items are visually distinct; mark all read clears the badge in one action.',
          'Tapping an item opens the linked screen, for example the challenge, the post or the conversation.',
          'Friend requests can be handled inline without leaving the list, and handled items are marked as such.',
          'Swiping an item to the left reveals delete. Deletion is permanent and removes it for that player only.',
          'Deleting and marking read are per player: notifications are stored per recipient, never shared.',
        ],
      },
      { t: 'h2', text: 'Categories a player can receive' },
      {
        t: 'table',
        head: ['Category', 'Examples'],
        widths: [0.34, 0.66],
        rows: [
          ['Challenge invites', 'A new challenge, an accepted challenge, a declined challenge.'],
          ['Challenge results', 'A result recorded, a series decided, a rivalry activated or a rivalry lead change.'],
          ['Direct messages', 'A new message in a direct or group thread.'],
          ['Post comments', 'Someone commented on a post the player authored.'],
          ['Friend activity', 'Friend request, acceptance, removal, and league invites.'],
          ['Public reminders', 'A saved event is approaching.'],
          ['Explore favourites', 'An update to something the player follows.'],
        ],
      },
    ],
  },
  {
    id: 'settings',
    title: 'Settings and Account Controls',
    blocks: [
      { t: 'h2', text: 'Notifications' },
      {
        t: 'p',
        text: 'A master push switch sits above one switch per category. The copy explains that lock-screen alerts cover every category below, so the relationship between the master switch and the individual switches is explicit rather than guessed. Turning a category off stops both the push and the in-app record for that category.',
      },
      { t: 'h2', text: 'Account' },
      {
        t: 'bullets',
        items: [
          'Dark mode: switches between the light brand surface and the near-black dark surface, remembered per device.',
          'Log out: ends the session and returns to the sign-in screen.',
          'Private profile: restricts profile visibility to friends.',
        ],
      },
      { t: 'h2', text: 'Other and danger zone' },
      {
        t: 'bullets',
        items: [
          'Privacy policy and terms of service, reachable from Settings and from registration.',
          'Delete account: a destructive action behind a confirmation dialog, which calls a backend service that removes the account and its content, then signs the player out. Failures are shown inline rather than silently swallowed.',
        ],
      },
    ],
  },
  {
    id: 'public',
    title: 'Public and Legal Surfaces',
    blocks: [
      {
        t: 'bullets',
        items: [
          'Public leaderboard: a shareable page per sport at a stable address, designed to be opened by someone who is not signed in and then converted into a sign-up.',
          'Shared post page: a server-rendered page for a single post, so a shared link previews with the post content instead of a generic app card.',
          'Legal pages: privacy policy and terms of service, written as static pages with a consistent layout, and linked from Settings and registration.',
          'Age gate: a one-time confirmation that the player is 13 or older, shown before the app opens for a new account.',
          'Sign-in, registration, password reset and two-factor screens: platform-provided flows, restyled to the brand, with email and Google sign-in.',
        ],
      },
      {
        t: 'callout',
        label: 'Before store submission',
        text: 'The support address in the legal pages is still a placeholder. It must be replaced with a monitored inbox, and the registration and reset flows need a full end-to-end pass, before the app is submitted for review.',
      },
    ],
  },
];