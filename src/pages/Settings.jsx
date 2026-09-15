import React, { useEffect, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Loader2, LogOut, Moon, Sun, Trash2, Shield, FileText } from 'lucide-react';
import { getOrCreateProfile } from '@/lib/ensureProfile';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { useTheme } from '@/hooks/useTheme';
import SettingsSection from '@/components/settings/SettingsSection';
import ToggleRow from '@/components/settings/ToggleRow';
import NotificationPreferences from '@/components/settings/NotificationPreferences';
import Header from '@/components/layout/Header';

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
      await base44.functions.invoke('deleteAccount', {});
      try { await base44.auth.logout(); } catch (e) {}
      window.location.href = '/login';
    } catch (err) {
      setDeleteError(err?.response?.data?.error || err?.message || 'Something went wrong. Please try again.');
      setDeleting(false);
    }
  };

  return (
    <div className="pb-10">
      <Header title="Settings" backFallback="/profile/me" />

      {/* Notifications */}
      <SettingsSection title="Notifications" description="Control exactly which notifications you receive.">
        {profile
          ? <NotificationPreferences profile={profile} setProfile={setProfile} />
          : <div className="px-4 py-4 text-sm text-muted-foreground">Loading…</div>}
      </SettingsSection>

      {/* Account */}
      <SettingsSection title="Account">
        <div className="flex items-center justify-between gap-3 px-4 py-3 min-h-[56px]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
              {theme === 'dark' ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-primary" />}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm">Dark Mode</p>
              <p className="text-xs text-muted-foreground">Switch between light and dark</p>
            </div>
          </div>
          <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
        </div>
        <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 min-h-[56px] text-left hover:bg-muted/50">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
            <LogOut className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm">Log Out</p>
            <p className="text-xs text-muted-foreground">Sign out of your account</p>
          </div>
        </button>
      </SettingsSection>

      {/* Privacy & Security */}
      <SettingsSection title="Privacy & Security">
        {profile ? (
          <ToggleRow
            label="Private Profile"
            description="Only friends can see your profile"
            checked={profile.privacy_level === 'private'}
            onSave={async (c) => { const u = await base44.entities.Profile.update(profile.id, { privacy_level: c ? 'private' : 'public' }); setProfile(u); }}
          />
        ) : (
          <div className="px-4 py-4 text-sm text-muted-foreground">Loading…</div>
        )}
      </SettingsSection>

      {/* Other / Legal */}
      <SettingsSection title="Other">
        <Link to="/privacy-policy" className="flex items-center gap-3 px-4 py-3 min-h-[56px] hover:bg-muted/50">
          <Shield className="w-5 h-5 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium">Privacy Policy</span>
        </Link>
        <Link to="/terms-of-service" className="flex items-center gap-3 px-4 py-3 min-h-[56px] hover:bg-muted/50">
          <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium">Terms of Service</span>
        </Link>
      </SettingsSection>

      {/* Danger Zone */}
      <div className="px-4 mt-2">
        <h2 className="font-heading text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Danger Zone</h2>
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