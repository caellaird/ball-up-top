import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import EmptyState from '@/components/shared/EmptyState';
import { sendNotification } from '@/lib/notify';

export default function Friends() {
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const accepted = await base44.entities.Friend.filter({ status: 'accepted' });
    setFriends(accepted.filter((f) => f.created_by_id === user.id || f.addressee_id === user.id));
    const inReq = await base44.entities.Friend.filter({ addressee_id: user.id, status: 'pending' });
    setIncoming(inReq);
  };

  const search = async () => {
    if (!query.trim()) return setResults([]);
    const all = await base44.entities.User.filter({});
    setResults(all.filter((u) => u.id !== user.id && u.full_name?.toLowerCase().includes(query.toLowerCase())));
  };

  const sendRequest = async (target) => {
    await base44.entities.Friend.create({ requester_name: user.full_name, addressee_id: target.id, addressee_name: target.full_name });
    await sendNotification({ userId: target.id, type: 'friend_request', actorName: user.full_name, title: `${user.full_name} sent you a friend request`, link: '/friends' });
    setResults(results.filter((r) => r.id !== target.id));
  };

  const respond = async (req, status) => {
    await base44.entities.Friend.update(req.id, { status });
    setIncoming(incoming.filter((i) => i.id !== req.id));
    if (status === 'accepted') load();
  };

  const message = async (friend) => {
    const otherId = friend.created_by_id === user.id ? friend.addressee_id : friend.created_by_id;
    const otherName = friend.created_by_id === user.id ? friend.addressee_name : friend.requester_name;
    const existing = await base44.entities.Thread.filter({ type: 'dm' });
    let thread = existing.find((t) => t.participant_ids?.includes(otherId) && t.participant_ids?.includes(user.id));
    if (!thread) {
      thread = await base44.entities.Thread.create({ type: 'dm', participant_ids: [user.id, otherId], participant_names: [user.full_name, otherName] });
    }
    navigate(`/messages/${thread.id}`);
  };

  return (
    <div>
      <h1 className="font-heading text-2xl mb-6">Friends</h1>

      <div className="flex gap-2 mb-6">
        <Input placeholder="Search players..." value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && search()} />
        <Button onClick={search}>Search</Button>
      </div>
      {results.length > 0 && (
        <div className="space-y-2 mb-6">
          {results.map((r) => (
            <div key={r.id} className="flex items-center justify-between bg-card border border-border rounded-xl p-3">
              <span className="text-sm font-medium">{r.full_name}</span>
              <Button size="sm" onClick={() => sendRequest(r)}>Add Friend</Button>
            </div>
          ))}
        </div>
      )}

      {incoming.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Requests</h3>
          {incoming.map((req) => (
            <div key={req.id} className="flex items-center justify-between bg-card border border-border rounded-xl p-3 mb-2">
              <span className="text-sm">{req.requester_name}</span>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => respond(req, 'accepted')}>Accept</Button>
                <Button size="sm" variant="secondary" onClick={() => respond(req, 'declined')}>Decline</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <h3 className="font-semibold mb-2">Your Friends</h3>
      {friends.length === 0 ? (
        <EmptyState title="No friends yet" description="Search for players to connect with!" />
      ) : (
        friends.map((f) => {
          const name = f.created_by_id === user.id ? f.addressee_name : f.requester_name;
          return (
            <div key={f.id} className="flex items-center justify-between bg-card border border-border rounded-xl p-3 mb-2">
              <div className="flex items-center gap-3">
                <Avatar className="w-9 h-9"><AvatarFallback>{name?.[0]}</AvatarFallback></Avatar>
                <span className="text-sm font-medium">{name}</span>
              </div>
              <Button size="sm" variant="secondary" onClick={() => message(f)}>Message</Button>
            </div>
          );
        })
      )}
    </div>
  );
}