import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { getOrCreateProfile } from '@/lib/ensureProfile';

export default function Settings() {
  const { user } = useOutletContext();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    getOrCreateProfile(user).then(setProfile);
  }, []);

  const togglePrivacy = async (checked) => {
    const updated = await base44.entities.Profile.update(profile.id, { privacy_level: checked ? 'private' : 'public' });
    setProfile(updated);
  };

  const logout = () => base44.auth.logout('/login');

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
      <Button variant="destructive" onClick={logout}>Log Out</Button>
    </div>
  );
}