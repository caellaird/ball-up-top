import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Header from '@/components/layout/Header';
import { useGoBack } from '@/hooks/useGoBack';
import SegmentedControl from '@/components/shared/SegmentedControl';
import EmptyState from '@/components/shared/EmptyState';
import UserSearchResult from '@/components/friends/UserSearchResult';
import { enrichFriends, findOrCreateThread } from '@/lib/friendsHelpers';
import { sendNotification } from '@/lib/notify';
import { UserPlus } from 'lucide-react';
import AddFriendsDialog from '@/components/friends/AddFriendsDialog';
import RecommendedFriends from '@/components/friends/RecommendedFriends';

export default function Friends() {
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const goBack = useGoBack();
  const [tab, setTab] = useState('friends');
  const [allRelations, setAllRelations] = useState([]);
  const [allRecords, setAllRecords] = useState([]);
  const [friends, setFriends] = useState(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [showAddFriends, setShowAddFriends] = useState(false);

  useEffect(() => {
    load();
    const unsub = base44.entities.Friend.subscribe((event) => {
      const d = event?.data;
      if (d && (d.created_by_id === user.id || d.addressee_id === user.id)) load();
    });
    return unsub;
  }, []);

  const load = async () => {
    const all = await base44.entities.Friend.list('-created_date', 500);
    setAllRecords(all);
    const mine = all.filter((f) => f.created_by_id === user.id || f.addressee_id === user.id);
    setAllRelations(mine);
    const accepted = mine.filter((f) => f.status === 'accepted');
    setFriends(await enrichFriends(accepted, user.id));
  };

  const incoming = allRelations.filter((f) => f.addressee_id === user.id && f.status === 'pending');
  const sent = allRelations.filter((f) => f.created_by_id === user.id && f.status === 'pending');

  const relationWith = (targetId) => {
    const rec = allRelations.find(
      (f) => (f.created_by_id === user.id && f.addressee_id === targetId) || (f.addressee_id === user.id && f.created_by_id === targetId)
    );
    if (!rec) return null;
    if (rec.status === 'accepted') return 'accepted';
    if (rec.status === 'pending' && rec.created_by_id === user.id) return 'pending_outgoing';
    if (rec.status === 'pending' && rec.addressee_id === user.id) return 'pending_incoming';
    return null;
  };

  const search = async () => {
    if (!query.trim()) return setResults(null);
    setSearching(true);
    const [users, profiles] = await Promise.all([base44.entities.User.list(), base44.entities.Profile.list()]);
    const profileByOwner = {};
    profiles.forEach((p) => { profileByOwner[p.created_by_id] = p; });
    const q = query.trim().toLowerCase();
    const matches = users
      .filter((u) => u.id !== user.id)
      .filter((u) => {
        const p = profileByOwner[u.id];
        return u.full_name?.toLowerCase().includes(q) || p?.username?.toLowerCase().includes(q);
      })
      .map((u) => ({ targetUser: u, profile: profileByOwner[u.id] || null, relation: relationWith(u.id) }));
    setResults(matches);
    setSearching(false);
  };

  const sendRequest = async (targetUser) => {
    await base44.entities.Friend.create({ requester_name: user.full_name, addressee_id: targetUser.id, addressee_name: targetUser.full_name });
    await sendNotification({ userId: targetUser.id, type: 'friend_request', actorName: user.full_name, title: `${user.full_name} sent you a friend request`, link: '/friends' });
    load();
    search();
  };

  const cancelRequest = async (targetId) => {
    const rec = allRelations.find((f) => f.created_by_id === user.id && f.addressee_id === targetId && f.status === 'pending');
    if (rec) await base44.entities.Friend.update(rec.id, { status: 'cancelled' });
    load();
    search();
  };

  const respond = async (req, status) => {
    await base44.entities.Friend.update(req.id, { status });
    await sendNotification({
      userId: req.created_by_id,
      type: 'friend_response',
      actorName: user.full_name,
      title: `${user.full_name} ${status} your friend request`,
      link: '/friends',
    });
    load();
  };

  const cancelSent = async (req) => {
    await base44.entities.Friend.update(req.id, { status: 'cancelled' });
    load();
  };

  const removeFriend = async (friend) => {
    await base44.entities.Friend.delete(friend.friendRecordId);
    await sendNotification({ userId: friend.userId, type: 'friend_removed', actorName: user.full_name, title: `${user.full_name} removed you as a friend` });
    load();
  };

  const message = async (friend) => {
    const thread = await findOrCreateThread(user.id, user.full_name, friend.userId, friend.name);
    navigate(`/messages/${thread.id}`);
  };

  const addSuggestion = async (id, name) => {
    await base44.entities.Friend.create({ requester_name: user.full_name, addressee_id: id, addressee_name: name });
    await sendNotification({ userId: id, type: 'friend_request', actorName: user.full_name, title: `${user.full_name} sent you a friend request`, link: '/friends' });
    load();
  };

  return (
    <div>
      <Header title="Friends" onBack={goBack} />

      <div className="px-4 pt-4">
        <Button onClick={() => setShowAddFriends(true)} className="w-full rounded-full mb-4 bg-gradient-to-r from-primary to-accent">
          <UserPlus className="w-4 h-4 mr-1.5" /> Add Friends
        </Button>
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Search by name or @username..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            className="h-11 rounded-full"
          />
          <Button onClick={search} disabled={searching} className="rounded-full">Search</Button>
        </div>

        {results !== null && (
          <div className="mb-6 -mx-4">
            <h3 className="font-semibold text-sm px-4 mb-2">Search Results</h3>
            {results.length === 0 ? (
              <p className="text-sm text-muted-foreground px-4">No users found.</p>
            ) : (
              results.map((r) => (
                <UserSearchResult
                  key={r.targetUser.id}
                  result={r}
                  onAdd={() => sendRequest(r.targetUser)}
                  onCancel={() => cancelRequest(r.targetUser.id)}
                />
              ))
            )}
          </div>
        )}

        <SegmentedControl
          options={[
            { value: 'friends', label: `Friends (${friends?.length ?? 0})` },
            { value: 'incoming', label: `Incoming (${incoming.length})` },
            { value: 'sent', label: `Sent (${sent.length})` },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      <div className="mt-4 -mx-0">
        {tab === 'friends' && (
          friends === null ? (
            <div className="text-center text-muted-foreground py-10">Loading friends...</div>
          ) : (
            <>
              <RecommendedFriends allRecords={allRecords} userId={user.id} relations={allRelations} onAdd={addSuggestion} />
              {friends.length === 0 && <EmptyState title="No friends yet" description="Search for players to connect with!" />}
              {friends.length > 0 && (
              friends.map((f) => (
                <div key={f.friendRecordId} className="flex items-center gap-3 bg-card rounded-2xl shadow-sm p-3 mb-2 mx-4">
                  <Avatar className="w-11 h-11">
                    <AvatarImage src={f.profile?.avatar_url} />
                    <AvatarFallback>{f.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{f.name}</p>
                    {f.profile?.username && <p className="text-xs text-muted-foreground truncate">@{f.profile.username}</p>}
                  </div>
                  <Button size="sm" variant="secondary" className="rounded-full" onClick={() => message(f)}>Message</Button>
                  <Button size="sm" variant="ghost" className="rounded-full text-destructive" onClick={() => removeFriend(f)}>Remove</Button>
                </div>
              ))
            )}
            </>
          )
        )}

        {tab === 'incoming' && (
          incoming.length === 0 ? (
            <EmptyState title="No incoming requests" description="You're all caught up!" />
          ) : (
            incoming.map((req) => (
              <div key={req.id} className="flex items-center justify-between bg-card rounded-2xl shadow-sm p-3 mb-2 mx-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-9 h-9"><AvatarFallback>{req.requester_name?.[0]}</AvatarFallback></Avatar>
                  <span className="text-sm font-medium">{req.requester_name}</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="rounded-full" onClick={() => respond(req, 'accepted')}>Accept</Button>
                  <Button size="sm" variant="secondary" className="rounded-full" onClick={() => respond(req, 'declined')}>Decline</Button>
                </div>
              </div>
            ))
          )
        )}

        {tab === 'sent' && (
          sent.length === 0 ? (
            <EmptyState title="No sent requests" description="Requests you send will appear here." />
          ) : (
            sent.map((req) => (
              <div key={req.id} className="flex items-center justify-between bg-card rounded-2xl shadow-sm p-3 mb-2 mx-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-9 h-9"><AvatarFallback>{req.addressee_name?.[0]}</AvatarFallback></Avatar>
                  <span className="text-sm font-medium">{req.addressee_name}</span>
                </div>
                <Button size="sm" variant="secondary" className="rounded-full" onClick={() => cancelSent(req)}>Cancel</Button>
              </div>
            ))
          )
        )}
      </div>

      <AddFriendsDialog open={showAddFriends} onOpenChange={setShowAddFriends} user={user} />
    </div>
  );
}