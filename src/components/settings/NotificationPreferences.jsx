import React from 'react';
import { base44 } from '@/api/base44Client';
import ToggleRow from '@/components/settings/ToggleRow';
import { invalidateProfile } from '@/lib/ensureProfile';

// All independent notification on/off toggles, persisted immediately on the
// user's Profile. Defaults are on, so existing users keep current behavior.
// The nearby/public-event toggle lives in NearbyNotificationsSettings (Explore
// section); this component covers the remaining categories.
export default function NotificationPreferences({ profile, setProfile }) {
  const save = async (field, checked) => {
    const updated = await base44.entities.Profile.update(profile.id, { [field]: checked });
    invalidateProfile(profile.created_by_id);
    setProfile(updated);
  };

  return (
    <>
      <p className="px-1 pb-1 text-xs text-muted-foreground leading-snug">
        Alerts arrive in the app and as iPhone lock-screen notifications. iOS asks for notification
        permission the first time alerts are delivered — if you turned them off in iPhone Settings,
        turn them back on there to receive them again.
      </p>
      <ToggleRow
        label="Push Notifications"
        description="Lock-screen alerts for every category below. In-app notifications stay on either way."
        checked={profile.push_enabled !== false}
        onSave={(c) => save('push_enabled', c)}
      />
      <ToggleRow
        label="Challenge Invites"
        description="When someone invites you to a challenge"
        checked={profile.notif_challenge_invites !== false}
        onSave={(c) => save('notif_challenge_invites', c)}
      />
      <ToggleRow
        label="Direct Messages"
        description="New direct messages in your inbox"
        checked={profile.notif_direct_messages !== false}
        onSave={(c) => save('notif_direct_messages', c)}
      />
      <ToggleRow
        label="Challenge Results"
        description="When a challenge you're in gets a result update"
        checked={profile.notif_challenge_results !== false}
        onSave={(c) => save('notif_challenge_results', c)}
      />
      <ToggleRow
        label="Public Event Reminders"
        description="30-minute reminder before a public event starts"
        checked={profile.notif_public_reminders !== false}
        onSave={(c) => save('notif_public_reminders', c)}
      />
      <ToggleRow
        label="Explore Map Favorites"
        description="Updates to events you've saved from the Explore map"
        checked={profile.notif_explore_favorites !== false}
        onSave={(c) => save('notif_explore_favorites', c)}
      />
      <ToggleRow
        label="Friends & Leagues"
        description="Friend requests and acceptances, plus league invites"
        checked={profile.notif_friend_activity !== false}
        onSave={(c) => save('notif_friend_activity', c)}
      />
      <ToggleRow
        label="Post Comments"
        description="When someone comments on one of your posts"
        checked={profile.notif_post_comments !== false}
        onSave={(c) => save('notif_post_comments', c)}
      />
    </>
  );
}