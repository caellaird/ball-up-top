import React, { useEffect, useState } from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import AvatarUpload from '@/components/profile/AvatarUpload';
import ProfileBanner from '@/components/profile/ProfileBanner';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getOrCreateProfile, getOrCreateStats } from '@/lib/ensureProfile';
import { findOrCreateThread } from '@/lib/friendsHelpers';
import { computeProfileStats } from '@/lib/profileStats';
import QRCodeDialog from '@/components/friends/QRCodeDialog';
import { buildFriendInviteUrl } from '@/lib/friendCodes';
import { ArrowLeft, Swords, QrCode, Settings, MoreVertical } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import ChallengeFromProfileSheet from '@/components/profile/ChallengeFromProfileSheet';
import FriendButton from '@/components/profile/FriendButton';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import ReportSheet from '@/components/shared/ReportSheet';
import BlockButton from '@/components/shared/BlockButton';
import { useGoBack } from '@/hooks/useGoBack';
import ProfileTabs from '@/components/profile/ProfileTabs';
import ActivityTab from '@/components/profile/tabs/ActivityTab';
import StatsTab from '@/components/profile/tabs/StatsTab';
import FriendsTab from '@/components/profile/tabs/FriendsTab';
import AwardsTab from '@/components/profile/tabs/AwardsTab';
import HighlightsTab from '@/components/profile/tabs/HighlightsTab';
import FavoriteSportPicker from '@/components/profile/FavoriteSportPicker';
import { getSportDisplay } from '@/lib/favoriteSport';

export default function Profile({ user: userProp, usernameOverride }) {
  const { username: paramUsername } = useParams();
  const outletCtx = useOutletContext();
  const user = userProp || outletCtx?.user;
  const username = usernameOverride || paramUsername;
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
  const [showChallenge, setShowChallenge] = useState(false);
  const [showReportUser, setShowReportUser] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [activeTab, setActiveTab] = useState('activity');
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
      const [awardList, friendsAsCreator, friendsAsAddressee, profileStatsResult, pendingList] = await Promise.all([
        base44.entities.Award.filter({ recipient_id: ownerId }, '-created_date', 20),
        base44.entities.Friend.filter({ created_by_id: ownerId, status: 'accepted' }),
        base44.entities.Friend.filter({ addressee_id: ownerId, status: 'accepted' }),
        computeProfileStats(ownerId),
        isSelf ? base44.entities.Friend.filter({ addressee_id: user.id, status: 'pending' }) : Promise.resolve([]),
      ]);
      setAwards(awardList);
      setFriendRecords([...friendsAsCreator, ...friendsAsAddressee]);
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

  const ownerId = profile.created_by_id || user.id;
  const wins = profileStats?.wins ?? stats?.games_won ?? 0;
  const losses = profileStats?.losses ?? stats?.losses ?? 0;
  const winPct = profileStats?.winPct ?? (wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0);
  const currentStreak = profileStats?.currentStreak ?? stats?.current_streak ?? 0;
  const longestStreak = profileStats?.longestStreak ?? stats?.longest_streak ?? 0;
  const sportDisplay = getSportDisplay(profile.favorite_sport);

  return (
    <div className="h-full flex flex-col">
      {!isSelf && (
        <div className="flex items-center px-4 pt-3 pb-1 shrink-0">
          <button onClick={goBack} className="p-1 -ml-1 text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
      )}
      {/* Pinned profile header — stays visible while the tab content below scrolls */}
      <div className="shrink-0">
        {isSelf ? (
          <div className="relative">
            <ProfileBanner profile={profile} />
            <button
              onClick={() => navigate('/settings')}
              className="absolute right-2 p-2 rounded-full bg-black/30 backdrop-blur-sm text-white flex items-center justify-center"
              style={{ top: 'calc(env(safe-area-inset-top) + 0.5rem)' }}
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <ProfileBanner profile={profile} />
        )}
        <div className="px-4 -mt-10 relative z-10">
          <div className="flex items-end justify-between mb-2">
            {isSelf ? (
              <AvatarUpload profile={profile} fallback={displayName?.[0] || 'U'} onUploaded={setProfile} />
            ) : (
              <Avatar className="w-16 h-16 border-4 border-background">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-xl">{displayName?.[0] || 'U'}</AvatarFallback>
              </Avatar>
            )}
            {isSelf && <Button size="sm" variant="secondary" className="rounded-full mb-1" onClick={() => setEditing(true)}>Edit Profile</Button>}
            {!isSelf && (
              <div className="flex gap-2 mb-1">
                <Button size="sm" className="rounded-full bg-gradient-to-r from-primary to-accent" onClick={() => { setActiveTab('stats'); setShowChallenge(true); }}>
                  <Swords className="w-3.5 h-3.5 mr-1" /> Challenge
                </Button>
                <FriendButton
                  currentUserId={user.id}
                  currentUserName={user.full_name}
                  targetUserId={profile.created_by_id}
                  targetUserName={displayName}
                />
                <Button size="sm" variant="secondary" className="rounded-full" onClick={message}>Message</Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="secondary" className="rounded-full px-2" aria-label="More options">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowReportUser(true)} className="text-destructive focus:text-destructive">
                      Report user
                    </DropdownMenuItem>
                    <BlockButton
                      currentUserId={user.id}
                      currentUserName={user.full_name}
                      targetUserId={profile.created_by_id}
                      targetUserName={displayName}
                    />
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
          <h1 className="font-heading text-lg font-bold leading-tight">{displayName}</h1>
          <p className="text-sm text-muted-foreground">@{profile.username}{profile.city ? ` · ${profile.city}` : ''}{sportDisplay ? ` · ${sportDisplay.emoji} ${sportDisplay.label}` : ''}</p>
          {profile.bio && <p className="text-sm mt-1.5">{profile.bio}</p>}

          <div className="flex items-center gap-5 mt-3 text-sm">
            <span><strong className="font-heading">{wins}</strong> <span className="text-muted-foreground">Wins</span></span>
            <span><strong className="font-heading">{losses}</strong> <span className="text-muted-foreground">Losses</span></span>
            <span><strong className="font-heading">{profileStats?.publicEvents ?? 0}</strong> <span className="text-muted-foreground">Public Events</span></span>
            <button onClick={() => setActiveTab('friends')} className="flex items-center gap-1">
              <strong className="font-heading">{friendRecords.length}</strong> <span className="text-muted-foreground">Friends</span>
            </button>
          </div>

          {isSelf && (
            <button
              onClick={() => setShowQR(true)}
              className="mt-3 mb-1 flex items-center gap-1.5 text-xs font-semibold text-primary"
            >
              <QrCode className="w-3.5 h-3.5" /> Show My QR
            </button>
          )}
        </div>
      </div>

      <ProfileTabs active={activeTab} onChange={setActiveTab} />

      {/* Only the active tab's content scrolls */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {activeTab === 'activity' && <ActivityTab ownerId={ownerId} ownerName={displayName} viewerId={user.id} />}
        {activeTab === 'stats' && (
          <StatsTab
            wins={wins}
            losses={losses}
            draws={profileStats?.draws ?? stats?.draws ?? 0}
            winPct={winPct}
            currentStreak={currentStreak}
            longestStreak={longestStreak}
            created={profileStats?.challengesCreated ?? 0}
            completed={profileStats?.challengesCompleted ?? 0}
            topActivities={profileStats?.topActivities}
            awards={awards}
            ownerId={ownerId}
            ownerName={displayName}
            ownerUsername={profile.username}
            ownerAvatar={profile.avatar_url}
            headToHead={!isSelf ? { currentUserId: user.id, currentUserName: user.full_name, profileOwnerId: ownerId, profileOwnerName: displayName, profileOwnerAvatar: profile.avatar_url, profileOwnerUsername: profile.username } : null}
          />
        )}
        {activeTab === 'friends' && (
          <FriendsTab friendRecords={friendRecords} userId={ownerId} isSelf={isSelf} pendingCount={pendingCount} />
        )}
        {activeTab === 'awards' && <AwardsTab awards={awards} />}
        {activeTab === 'highlights' && <HighlightsTab ownerId={ownerId} />}
      </div>

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

      {!isSelf && (
        <ReportSheet
          open={showReportUser}
          onOpenChange={setShowReportUser}
          targetType="user"
          targetId={profile.created_by_id}
          targetOwnerName={displayName}
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
            <FavoriteSportPicker value={form.favorite_sport} onChange={(v) => setForm({ ...form, favorite_sport: v })} />
            <Button onClick={save} className="w-full rounded-full h-12">Save</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}