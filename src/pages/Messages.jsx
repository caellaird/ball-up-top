import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import EmptyState from '@/components/shared/EmptyState';
import CreateGroupSheet from '@/components/messages/CreateGroupSheet';
import { Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function Messages() {
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const [threads, setThreads] = useState(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    load();
  }, []);

  const load = () => {
    base44.entities.Thread.list('-last_message_at', 50).then((all) => {
      setThreads(all.filter((t) => t.participant_ids?.includes(user.id)));
    });
  };

  if (threads === null) return <div className="text-center text-muted-foreground py-10">Loading messages...</div>;

  const filtered = threads.filter((t) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const isGroup = t.type === 'group';
    const idx = t.participant_ids?.findIndex((pid) => pid !== user.id);
    const title = isGroup ? (t.name || 'Group') : (t.participant_names?.[idx] || '');
    return title.toLowerCase().includes(q) || (t.participant_names || []).some((n) => n.toLowerCase().includes(q));
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-heading text-2xl">Messages</h1>
        <Button size="sm" variant="secondary" className="rounded-full" onClick={() => setShowCreateGroup(true)}>
          <Users className="w-4 h-4 mr-1.5" /> New Group
        </Button>
      </div>
      <Input
        placeholder="Search conversations..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-10 rounded-full mb-4"
      />
      <CreateGroupSheet
        open={showCreateGroup}
        onOpenChange={setShowCreateGroup}
        user={user}
        onCreated={(thread) => {
          setShowCreateGroup(false);
          load();
          navigate(`/messages/${thread.id}`);
        }}
      />
      {filtered.length === 0 ? (
        <EmptyState title={threads.length === 0 ? 'No conversations yet' : 'No results'} description={threads.length === 0 ? "Start a DM from a friend's profile!" : 'Try a different search.'} />
      ) : (
        filtered.map((t) => {
          const isGroup = t.type === 'group';
          const idx = t.participant_ids?.findIndex((pid) => pid !== user.id);
          const title = isGroup ? (t.name || 'Group') : (t.participant_names?.[idx] || t.name || 'Conversation');
          return (
            <Link key={t.id} to={`/messages/${t.id}`} className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 mb-2 hover:shadow-md transition">
              <Avatar className="w-10 h-10">
                {isGroup ? <AvatarFallback><Users className="w-4 h-4" /></AvatarFallback> : <AvatarFallback>{title[0]}</AvatarFallback>}
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{title}</p>
                {isGroup && <p className="text-[11px] text-muted-foreground truncate">{t.participant_names?.join(', ')}</p>}
                <p className="text-xs text-muted-foreground truncate">{t.last_message}</p>
              </div>
              {t.last_message_at && <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(t.last_message_at), { addSuffix: true })}</span>}
            </Link>
          );
        })
      )}
    </div>
  );
}