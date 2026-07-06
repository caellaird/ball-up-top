import React, { useEffect, useState } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getOrCreateProfile, getOrCreateStats } from '@/lib/ensureProfile';

export default function Profile() {
  const { username } = useParams();
  const { user } = useOutletContext();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ bio: '', city: '', favorite_team: '' });
  const isSelf = username === 'me';

  useEffect(() => {
    load();
  }, [username]);

  const load = async () => {
    if (isSelf) {
      const p = await getOrCreateProfile(user);
      const s = await getOrCreateStats(user);
      setProfile(p);
      setStats(s);
      setDisplayName(user.full_name);
      setForm({ bio: p.bio || '', city: p.city || '', favorite_team: p.favorite_team || '' });
    } else {
      const found = await base44.entities.Profile.filter({ username });
      setProfile(found[0] || null);
      if (found[0]) {
        const s = await base44.entities.UserStats.filter({ created_by_id: found[0].created_by_id });
        setStats(s[0] || null);
        setDisplayName(s[0]?.user_name || found[0].username);
      }
    }
  };

  const save = async () => {
    const updated = await base44.entities.Profile.update(profile.id, form);
    setProfile(updated);
    setEditing(false);
  };

  if (!profile) return <div className="text-center text-muted-foreground py-10">Loading profile...</div>;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Avatar className="w-20 h-20">
          <AvatarImage src={profile.avatar_url} />
          <AvatarFallback className="text-2xl">{displayName?.[0] || 'U'}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="font-heading text-xl">{displayName}</h1>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
        </div>
        {isSelf && !editing && <Button size="sm" variant="secondary" className="ml-auto" onClick={() => setEditing(true)}>Edit</Button>}
      </div>

      {editing ? (
        <div className="space-y-3 mb-6">
          <Textarea placeholder="Bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          <Input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <Input placeholder="Favorite team" value={form.favorite_team} onChange={(e) => setForm({ ...form, favorite_team: e.target.value })} />
          <Button onClick={save} className="rounded-full">Save</Button>
        </div>
      ) : (
        <p className="text-sm mb-6">{profile.bio || 'No bio yet.'}</p>
      )}

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-card border border-border rounded-xl p-3">
          <p className="font-heading text-xl">{stats?.games_won || 0}</p>
          <p className="text-xs text-muted-foreground">Games Won</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3">
          <p className="font-heading text-xl">{stats?.challenge_wins || 0}</p>
          <p className="text-xs text-muted-foreground">Challenges Won</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3">
          <p className="font-heading text-xl">{stats?.ball_knower_streak || 0}</p>
          <p className="text-xs text-muted-foreground">Day Streak</p>
        </div>
      </div>
    </div>
  );
}