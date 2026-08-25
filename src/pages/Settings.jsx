import React, { useEffect, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Loader2, LogOut, Moon, Sun, Trash2 } from 'lucide-react';
import { getOrCreateProfile } from '@/lib/ensureProfile';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { useTheme } from '@/hooks/useTheme';

export default function Settings() {
  const { user } = useOutletContext();
  const [profile, setProfile] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const { theme, toggleTheme } = useTheme();
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
      // Service-role function purges all user data AND removes the account record itself.
      await base44.functions.invoke('deleteAccount', {});
      try { await base44.auth.logout(); } catch (e) {}
      window.location.href = '/login';
    } catch (err) {
      setDeleteError(err?.response?.data?.error || err?.message || 'Something went wrong. Please try again.');
      setDeleting(false);
    }
  };

  return (
    <div>
      <h1 className="font-heading text-2xl mb-6">Settings</h1>
      <div className="bg-card border border-border rounded-xl p-4 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            {theme === 'dark' ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-primary" />}
          </div>
          <div>
            <p className="font-medium text-sm">Dark Mode</p>
            <p className="text-xs text-muted-foreground">Switch between light and dark</p>
          </div>
        </div>
        <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
      </div>
      {!profile ? (
        <div className="text-center text-muted-foreground py-10">Loading settings...</div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-4 mb-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">Private Profile</p>
            <p className="text-xs text-muted-foreground">Only friends can see your profile</p>
          </div>
          <Switch checked={profile.privacy_level === 'private'} onCheckedChange={togglePrivacy} />
        </div>
      )}
      <Button variant="destructive" onClick={logout} className="w-full mb-4">
        <LogOut className="w-4 h-4 mr-2" /> Log Out
      </Button>

      <div className="text-center text-xs text-muted-foreground mb-8 space-x-1">
        <Link to="/privacy-policy" className="hover:underline">Privacy Policy</Link>
        <span>·</span>
        <Link to="/terms-of-service" className="hover:underline">Terms of Service</Link>
      </div>

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