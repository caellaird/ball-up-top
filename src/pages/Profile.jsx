import React, { useEffect, useState } from 'react';
import { useParams, useOutletContext, Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import AvatarUpload from '@/components/profile/AvatarUpload';
import BannerUpload from '@/components/profile/BannerUpload';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getOrCreateProfile, getOrCreateStats } from '@/lib/ensureProfile';
import { findOrCreateThread } from '@/lib/friendsHelpers';
import { computeProfileStats } from '@/lib/profileStats';
import { SPORT_EMOJI, SPORTS } from '@/lib/constants';
import FriendsListSheet from '@/components/friends/FriendsListSheet';
import HeadToHead from '@/components/profile/HeadToHead';
import TrophyCase from '@/components/profile/TrophyCase';
import QRCodeDialog from '@/components/friends/QRCodeDialog';
import { buildFriendInviteUrl } from '@/lib/friendCodes';
import CompletedChallenges from '@/components/profile/CompletedChallenges';
import { ArrowLeft, Swords, QrCode } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import ChallengeFromProfileSheet from '@/components/profile/ChallengeFromProfileSheet';
import FriendButton from '@/components/profile/FriendButton';
import { useGoBack } from '@/hooks/useGoBack';

const SPORT_LABEL = SPORTS.reduce((acc, s) => ({ ...acc, [s.key]: s.label }), {});

export default function Profile() {
  const { username } = useParams();
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const goBack = useGoBack();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [profileStats, setProfileStats] = useState(null);
  const [awards, setAwards] = useState([]);
  const [displayName, setDisplayName] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ nickname: '', bio: '', city: '', favorite_sport: '' });
  const [friendRecords, setFriendRecords] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [showFriends, setShowFriends] = useState(false);
  const [showChallenge, setShowChallenge] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const isSelf = username === 'me';

  useEffect(() => { load(); }, [username]);

  const load = async () => {
    let p, s, ownerId, name;
    if (isSelf) {
      p = await getOrCreateProfile(user);
      s = await getOrCreateStats(user);
      ownerId = user.id;
      name = p.nickname || user.full_name;
    } else {
      const found = await base44.entities.Profile.filter({ username });
      p = found[0] || null;
      if (p) {
        ownerId = p.created_by_id;
        const statsList = await base44.entities.UserStats.filter({ created_by_id: ownerId });
        s = statsList[0] || null;
        name = p.nickname || s?.user_name || p.username;
      }
    }
    setProfile(p);
    setStats(s);
    setDisplayName(name);
    if (p) {
      setForm({ nickname: p.nickname || '', bio: p.bio || '', city: p.city || '', favorite_sport: p.favorite_sport || '' });
      const [awardList, allFriends, profileStatsResult, pendingList] = await Promise.all([
        base44.entities.Award.filter({ recipient_id: ownerId }, '-created_date', 20),
        base44.entities.Friend.filter({ status: 'accepted' }),
        computeProfileStats(ownerId),
        isSelf ? base44.entities.Friend.filter({ addressee_id: user.id, status: 'pending' }) : Promise.resolve([]),
      ]);
      setAwards(awardList);
      setFriendRecords(allFriends.filter((f) => f.created_by_id === ownerId || f.addressee_id === ownerId));
      setProfileStats(profileStatsResult);
      if (isSelf) setPendingCount(pendingList.length);
    }
  };

  const save = async () => {
    const updated = await base44.entities.Profile.update(profile.id, form);
    setProfile(updated);
    setDisplayName(form.nickname || user.full_name);
    setEditing(false);
  };

  const message = async () => {
    const thread = await findOrCreateThread(user.id, user.full_name, profile.created_by_id, displayName);
    navigate(`/messages/${thread.id}`);
  };

  if (!profile) return (
    <div className="space-y-4">
      <Skeleton className="w-full h-32 rounded-none" />
      <div className="px-4 flex items-end gap-3">
        <Skeleton className="w-20 h-20 rounded-full -mt-12" />
        <Skeleton className="h-8 w-20 rounded-full mb-2" />
      </div>
      <div className="px-4 space-y-2">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <div className="grid grid-cols-4 gap-2 mt-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
        </div>
      </div>
    </div>
  );

  const wins = profileStats?.wins ?? stats?.games_won ?? 0;
  const losses = profileStats?.losses ?? stats?.losses ?? 0;
  const winPct = profileStats?.winPct ?? (wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0);
  const currentStreak = profileStats?.currentStreak ?? stats?.current_streak ?? 0;
  const longestStreak = profileStats?.longestStreak ?? stats?.longest_streak ?? 0;
  const favoriteComp = profile.favorite_sport || profileStats?.favoriteCompetition;

  return (
    <div>
      {!isSelf && (
        <div className="flex items-center px-4 pt-3 pb-1">
          <button onClick={goBack} className="p-1 -ml-1 text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
      )}
      {isSelf ? (
        <BannerUpload profile={profile} onUploaded={setProfile} />
      ) : (
        <div
          className="h-32 bg-gradient-to-r from-primary to-secondary"
          style={profile.banner_url ? { backgroundImage: `url(${profile.banner_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        />
      )}
      <div className="px-4 -mt-12 relative z-10">
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
          {!isSelf && (
            <div className="flex gap-2 mb-2">
              <Button size="sm" className="rounded-full bg-gradient-to-r from-primary to-accent" onClick={() => setShowChallenge(true)}>
                <Swords className="w-3.5 h-3.5 mr-1" /> Challenge
              </Button>
              <FriendButton
                currentUserId={user.id}
                currentUserName={user.full_name}
                targetUserId={profile.created_by_id}
                targetUserName={displayName}
              />
              <Button size="sm" variant="secondary" className="rounded-full" onClick={message}>Message</Button>
            </div>
          )}
        </div>
        <h1 className="font-heading text-xl font-bold">{displayName}</h1>
        <p className="text-sm text-muted-foreground">@{profile.username}{profile.city ? ` · ${profile.city}` : ''}</p>
        {favoriteComp && <p className="text-sm mt-1">{SPORT_EMOJI[favoriteComp] || '🏆'} {SPORT_LABEL[favoriteComp] || favoriteComp}</p>}
        <p className="text-sm mt-2">{profile.bio || 'No bio yet.'}</p>

        <div className="grid grid-cols-4 gap-2 mt-5 text-center">
          <Stat label="Wins" value={wins} />
          <Stat label="Losses" value={losses} />
          <Stat label="Win %" value={`${winPct}%`} />
          <Stat label="Streak" value={currentStreak} />
          <Stat label="Best Streak" value={longestStreak} />
          <Stat label="Created" value={profileStats?.challengesCreated ?? 0} />
          <Stat label="Completed" value={profileStats?.challengesCompleted ?? 0} />
          <Stat label="Friends" value={friendRecords.length} />
        </div>

        <button
          onClick={() => setShowFriends(true)}
          className="block w-full text-center mt-5 bg-primary text-primary-foreground font-heading font-bold text-base rounded-xl py-3.5 hover:bg-primary/90 transition"
        >
          Friends ({friendRecords.length})
        </button>
        {isSelf && (
          <Link
            to="/friends"
            className="block w-full text-center mt-2 bg-primary/10 text-primary font-heading font-bold text-sm rounded-xl py-3 hover:bg-primary/20 transition"
          >
            {pendingCount > 0 ? `${pendingCount} pending request${pendingCount > 1 ? 's' : ''}` : 'Manage Friends'}
          </Link>
        )}

        <TrophyCase topActivities={profileStats?.topActivities} />

        {!isSelf && (
          <HeadToHead
            currentUserId={user.id}
            currentUserName={user.full_name}
            profileOwnerId={profile.created_by_id}
            profileOwnerName={displayName}
          />
        )}

        <CompletedChallenges userId={profile.created_by_id || user.id} userName={displayName} />

        {isSelf && (
          <button
            onClick={() => setShowQR(true)}
            className="mt-6 w-full flex items-center justify-center gap-2 bg-card border border-border rounded-2xl py-3 text-sm font-semibold hover:bg-accent/5 transition"
          >
            <QrCode className="w-4 h-4 text-primary" /> Show My QR
          </button>
        )}

        {awards.length > 0 && (
          <div className="mt-6">
            <h3 className="font-heading font-bold mb-3">Awards</h3>
            <div className="flex flex-wrap gap-2">
              {awards.map((a) => (
                <span key={a.id} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-accent/10 text-accent">{a.type}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <FriendsListSheet
        open={showFriends}
        onOpenChange={setShowFriends}
        friendRecords={friendRecords}
        userId={profile.created_by_id || user.id}
      />

      {isSelf && (
        <QRCodeDialog
          open={showQR}
          onOpenChange={setShowQR}
          value={buildFriendInviteUrl(user.id)}
          title="My QR Code"
          subtitle="Have a friend scan this to add you instantly."
        />
      )}

      {!isSelf && (
        <ChallengeFromProfileSheet
          open={showChallenge}
          onOpenChange={setShowChallenge}
          opponentId={profile.created_by_id}
          opponentName={displayName}
          opponentUsername={profile.username}
        />
      )}

      <Sheet open={editing} onOpenChange={setEditing}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader><SheetTitle className="font-heading">Edit Profile</SheetTitle></SheetHeader>
          <div className="space-y-3 mt-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nickname</label>
              <Input placeholder="Nickname" value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} />
            </div>
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