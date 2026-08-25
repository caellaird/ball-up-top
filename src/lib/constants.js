export const LOGO_URL = 'https://media.base44.com/images/public/6a4b1c30da58082696f047dd/c12d432c5_Screenshot2026-07-07at112237PM.png';

export const SPORTS = [
  { key: 'basketball', label: 'Basketball', emoji: '🏀' },
  { key: 'golf', label: 'Golf', emoji: '⛳' },
  { key: 'pickleball', label: 'Pickleball', emoji: '🥒' },
  { key: 'darts', label: 'Darts', emoji: '🎯' },
  { key: 'disc_golf', label: 'Disc Golf', emoji: '🥏' },
  { key: 'cornhole', label: 'Cornhole', emoji: '🌽' },
  { key: 'trivia', label: 'Trivia', emoji: '🧠' },
  { key: 'chugging', label: 'Chugging', emoji: '🍺' },
  { key: 'custom', label: 'Custom', emoji: '➕' },
];

export const SPORT_EMOJI = SPORTS.reduce((acc, s) => ({ ...acc, [s.key]: s.emoji }), {});

// HSL channel strings (no hsl() wrapper) used by the Explore map pins to color
// each marker's ring + count badge by competition type. Keep in sync with SPORTS.
export const SPORT_PIN_COLOR = {
  basketball: '25 100% 50%',
  golf: '142 58% 42%',
  pickleball: '45 93% 52%',
  darts: '0 76% 55%',
  disc_golf: '188 60% 42%',
  cornhole: '265 60% 60%',
  trivia: '216 70% 52%',
  chugging: '330 72% 58%',
  custom: '220 14% 50%',
};

export const SPORT_LABEL = SPORTS.reduce((acc, s) => ({ ...acc, [s.key]: s.label }), {});

export const CUSTOM_SPORT_EMOJIS = ['🏓', '🥏', '🎳', '🏸', '♟️', '🏐', '🎯', '🎱', '🏈', '⚽', '🎾', '🏏', '⛳', '🏆'];

export function getSportDisplay(challenge) {
  if (challenge.sport === 'custom') {
    return {
      label: challenge.custom_sport_name || 'Custom',
      emoji: challenge.custom_sport_emoji || '🏆',
    };
  }
  return {
    label: SPORT_LABEL[challenge.sport] || challenge.sport,
    emoji: SPORT_EMOJI[challenge.sport] || '🏆',
  };
}

export const AWARD_TYPES = [
  'Clutch', 'Best Shooter', 'Lockdown Defender', 'Trash Talk King', 'Ice Cold',
  'Most Improved', 'Fastest', 'MVP', 'Sharpshooter', 'Comeback Player', 'Heart', 'Respect', 'Funny', 'Competitor',
];

export const SERIES_TYPES = [
  { key: 'single', label: 'Single Challenge' },
  { key: 'bo3', label: 'Best of 3' },
  { key: 'bo5', label: 'Best of 5' },
  { key: 'bo7', label: 'Best of 7' },
  { key: 'open', label: 'Open Series' },
];

export const GAMES_TO_WIN = { single: 1, bo3: 2, bo5: 3, bo7: 4, open: null };