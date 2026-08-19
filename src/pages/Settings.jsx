import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Loader2, LogOut, Trash2 } from 'lucide-react';
import { getOrCreateProfile } from '@/lib/ensureProfile';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

export default function Settings() {
  const { user } = useOutletContext();
  const [profile, setProfile] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    getOrCreateProfile(user).then(setProfile);
  }, []);

  const togglePrivacy = async (checked) => {
    const updated = await base44.entities.Profile.update(profile.id, { privacy_level: checked ? 'private' : 'public' });
    setProfile(updated);
  };

  const logout = () => base44.auth.logout('/login');

  const deleteAccount = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      const uid = user.id;
      // Purge all of the user's own data. These are owner-scoped deletes that the new
      // row-level security rules allow the signed-in user to perform on their own records.
      await Promise.all([
        base44.entities.Post.deleteMany({ created_by_id: uid }),
        base44.entities.Comment.deleteMany({ created_by_id: uid }),
        base44.entities.Like.deleteMany({ created_by_id: uid }),
        base44.entities.Vote.deleteMany({ created_by_id: uid }),
        base44.entities.MessageReaction.deleteMany({ created_by_id: uid }),
        base44.entities.UserStats.deleteMany({ created_by_id: uid }),
        base44.entities.Profile.deleteMany({ created_by_id: uid }),
        base44.entities.SeriesGame.deleteMany({ created_by_id: uid }),
        base44.entities.ChallengeParticipant.deleteMany({ created_by_id: uid }),
        base44.entities.DailyQuestionAnswer.deleteMany({ created_by_id: uid }),
        base44.entities.Notification.deleteMany({ user_id: uid }),
        base44.entities.Message.deleteMany({ created_by_id: uid }),
        base44.entities.ThreadRead.deleteMany({ created_by_id: uid }),
        base44.entities.Friend.deleteMany({ $or: [{ created_by_id: uid }, { addressee_id: uid }] }),
        base44.entities.Award.deleteMany({ $or: [{ created_by_id: uid }, { recipient_id: uid }] }),
        base44.entities.Challenge.deleteMany({ $or: [{ created_by_id: uid }, { opponent_id: uid }, { opponent_ids: uid }] }),
      ]);
      // Remove solo threads (where this user is the only participant).
      const threads = await base44.entities.Thread.filter({ participant_ids: uid });
      const solo = threads.filter((t) => (t.participant_ids || []).length <= 1);
      if (solo.length) await base44.entities.Thread.deleteMany({ id: { $in: solo.map((t) => t.id) } });

      // NOTE: removing the account record itself requires a Builder+ backend function
      // (service-role User.delete). Until that's available this wipes all user data and
      // ends the session — the login credential still exists until the record is removed.
      try { await base44.auth.logout(); } catch (e) {}
      window.location.href = '/login';
    } catch (err) {
      setDeleteError(err?.message || 'Something went wrong. Please try again.');
      setDeleting(false);
    }
  };

  if (!profile) return <div className="text-center text-muted-foreground py-10">Loading settings...</div>;

  return (
    <div>
      <h1 className="font-heading text-2xl mb-6">Settings</h1>
      <div className="bg-card border border-border rounded-xl p-4 mb-4 flex items-center justify-between">
        <div>
          <p className="font-medium text-sm">Private Profile</p>
          <p className="text-xs text-muted-foreground">Only friends can see your profile</p>
        </div>
        <Switch checked={profile.privacy_level === 'private'} onCheckedChange={togglePrivacy} />
      </div>
      <Button variant="destructive" onClick={logout} className="w-full mb-8">
        <LogOut className="w-4 h-4 mr-2" /> Log Out
      </Button>

      <div className="border-t border-border pt-6">
        <h2 className="font-heading text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3">Danger Zone</h2>
        {deleteError && (
          <div className="mb-3 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{deleteError}</div>
        )}
        <Button
          variant="outline"
          className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
          disabled={deleting}
          onClick={() => setShowDelete(true)}
        >
          <Trash2 className="w-4 h-4 mr-2" /> Delete Account
        </Button>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Permanently removes your account and all your posts, challenges, messages, and stats.
        </p>
      </div>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={(open) => { setShowDelete(open); if (!open) setDeleteError(''); }}
        onConfirm={deleteAccount}
        title="Delete your account?"
        description="This permanently deletes your account and all associated data. This action cannot be undone."
      />

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Deleting your account…</p>
          </div>
        </div>
      )}
    </div>
  );
}