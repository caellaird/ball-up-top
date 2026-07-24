// Builds a "Add to Google Calendar" link that pre-fills an event, no OAuth required.
export function buildGoogleCalendarUrl(challenge) {
  const start = new Date(challenge.scheduled_time);
  const end = new Date(start.getTime() + 90 * 60 * 1000); // default 90 min duration
  const fmt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const text = `${challenge.creator_name} vs ${challenge.opponent_name} (${challenge.sport?.replace('_', ' ')})`;
  const details = challenge.notes || `Ball Up Top ${challenge.series_type !== 'single' ? challenge.series_type.toUpperCase() : ''} challenge`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text,
    dates: `${fmt(start)}/${fmt(end)}`,
    details,
    location: challenge.location_name || '',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}