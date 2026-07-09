import React, { useEffect, useState } from 'react';
import { useParams, useOutletContext, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import AvatarUpload from '@/components/profile/AvatarUpload';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getOrCreateProfile, getOrCreateStats } from '@/lib/ensureProfile';
import { SPORT_EMOJI } from '@/lib/constants';
import FriendsListSheet from '@/components/friends/FriendsListSheet';

export default function Profile() {
  const { username } = useParams();
  const { user } = useOutletContext();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [awards, setAwards] = useState([]);
  const [displayName, setDisplayName] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ bio: '', city: '', favorite_sport: '' });
  const [friendRecords, setFriendRecords] = useState([]);
  const [showFriends, setShowFriends] = useState(false);
  const isSelf = username === 'me';

  useEffect(() => {
    load();
  }, [username]);

  const load = async () => {
    let p, s, ownerId, name;
    if (isSelf) {
      p = await getOrCreateProfile(user);
      s = await getOrCreateStats(user);
      ownerId = user.id;
      name = user.full_name;
    } else {
      const found = await base44.entities.Profile.filter({ username });
      p = found[0] || null;
      if (p) {
        ownerId = p.created_by_id;
        const statsList = await base44.entities.UserStats.filter({ created_by_id: ownerId });
        s = statsList[0] || null;
        name = s?.user_name || p.username;
      }
    }
    setProfile(p);
    setStats(s);
    setDisplayName(name);
    if (p) {
      setForm({ bio: p.bio || '', city: p.city || '', favorite_sport: p.favorite_sport || '' });
      const awardList = await base44.entities.Award.filter({ recipient_id: ownerId }, '-created_date', 20);
      setAwards(awardList);
      const allFriends = await base44.entities.Friend.filter({ status: 'accepted' });
      setFriendRecords(allFriends.filter((f) => f.created_by_id === ownerId || f.addressee_id === ownerId));
    }
  };

  const save = async () => {
    const updated = await base44.entities.Profile.update(profile.id, form);
    setProfile(updated);
    setEditing(false);
  };

  if (!profile) return <div className="text-center text-muted-foreground py-10">Loading profile...</div>;

  const wins = stats?.games_won || 0;
  const losses = stats?.losses || 0;
  const winPct = wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;

  return (
    <div>
      <div className="h-28 bg-gradient-to-r from-primary to-secondary" style={profile.cover_url ? { backgroundImage: `url(${profile.cover_url})`, backgroundSize: 'cover' } : {}} />
      <div className="px-4 -mt-10">
        <div className="flex items-end justify-between mb-3">
          {isSelf ? (
            <AvatarUpload profile={profile} fallback={displayName?.[0] || 'U'} onUploaded={setProfile} />
          ) : (
            <Avatar className="w-20 h-20 border-4 border-background">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="text-2xl">{displayName?.[0] || 'U'}</AvatarFallback>
            </Avatar>
          )}
          {isSelf && <Button size="sm" variant="secondary" className="rounded-full mb-2" onClick={() => setEditing(true)}>Edit Profile</Button>}
        </div>
        <h1 className="font-heading text-xl font-bold">{displayName}</h1>
        <p className="text-sm text-muted-foreground">@{profile.username}{profile.city ? ` · ${profile.city}` : ''}</p>
        {profile.favorite_sport && <p className="text-sm mt-1">{SPORT_EMOJI[profile.favorite_sport] || ''} {profile.favorite_sport}</p>}
        <p className="text-sm mt-2">{profile.bio || 'No bio yet.'}</p>

        <div className="grid grid-cols-4 gap-2 mt-5 text-center">
          <Stat label="Wins" value={wins} />
          <Stat label="Losses" value={losses} />
          <Stat label="Win %" value={`${winPct}%`} />
          <Stat label="Streak" value={stats?.current_streak || 0} />
        </div>

        <button onClick={() => setShowFriends(true)} className="block w-full text-center mt-4 text-sm font-semibold text-primary">
          Friends ({friendRecords.length})
        </button>
        {isSelf && (
          <Link to="/friends" className="block text-center mt-1 text-xs text-muted-foreground">Manage requests →</Link>
        )}

        <div className="mt-6">
          <h3 className="font-heading font-bold mb-3">Trophy Case</h3>
          {awards.length === 0 ? (
            <p className="text-sm text-muted-foreground">No awards yet. Win a challenge to earn one!</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {awards.map((a) => (
                <span key={a.id} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-accent/10 text-accent">{a.type}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      <FriendsListSheet
        open={showFriends}
        onOpenChange={setShowFriends}
        friendRecords={friendRecords}
        userId={profile.created_by_id || user.id}
      />

      <Sheet open={editing} onOpenChange={setEditing}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader><SheetTitle className="font-heading">Edit Profile</SheetTitle></SheetHeader>
          <div className="space-y-3 mt-4">
            <Textarea placeholder="Bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            <Input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <Input placeholder="Favorite sport" value={form.favorite_sport} onChange={(e) => setForm({ ...form, favorite_sport: e.target.value })} />
            <Button onClick={save} className="w-full rounded-full h-12">Save</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-card rounded-2xl shadow-sm p-3">
      <p className="font-heading text-lg font-bold">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
    </div>
  );
}