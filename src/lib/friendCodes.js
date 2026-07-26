const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function buildFriendInviteUrl(userId) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://balluptop.app';
  return `${origin}/add-friend/${userId}`;
}

export function parseFriendQr(raw) {
  if (!raw) return null;
  const text = String(raw).trim();
  const match = text.match(/\/add-friend\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i);
  if (match) return match[1].toLowerCase();
  if (UUID_RE.test(text)) return text.toLowerCase();
  return null;
}

export const PROFILE_UPDATED_EVENT = 'ballup:profile-updated';

export function notifyProfileUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(PROFILE_UPDATED_EVENT));
  }
}