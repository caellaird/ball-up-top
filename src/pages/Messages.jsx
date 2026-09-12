import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import EmptyState from '@/components/shared/EmptyState';
import CreateGroupSheet from '@/components/messages/CreateGroupSheet';
import { Users, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { isTyping } from '@/lib/messaging';
import { useGoBack } from '@/hooks/useGoBack';

export default function Messages() {
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const goBack = useGoBack();
  const [threads, setThreads] = useState(null);
  const [readMap, setReadMap] = useState({});
  const [threadReads, setThreadReads] = useState({});
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    const unsubReads = base44.entities.ThreadRead.subscribe((event) => {
      if (event.type === 'create' || event.type === 'update') {
        setThreadReads((prev) => {
          const tMap = { ...prev };
          const arr = tMap[event.data.thread_id] ? [...tMap[event.data.thread_id]] : [];
          const idx = arr.findIndex((r) => r.id === event.data.id);
          if (idx >= 0) arr[idx] = event.data;
          else arr.push(event.data);
          tMap[event.data.thread_id] = arr;
          return tMap;
        });
      }
    });
    return () => { clearInterval(interval); unsubReads(); };
  }, []);

  const load = async () => {
    const [all, myReads, allReads] = await Promise.all([
      base44.entities.Thread.list('-last_message_at', 50),
      base44.entities.ThreadRead.filter({ created_by_id: user.id }),
      base44.entities.ThreadRead.list('-updated_date', 50),
    ]);
    const myThreads = all.filter((t) => t.participant_ids?.includes(user.id));
    const rMap = {};
    myReads.forEach((r) => { rMap[r.thread_id] = r; });
    setThreads(myThreads);
    setReadMap(rMap);
    const tMap = {};
    allReads.forEach((r) => {
      if (!tMap[r.thread_id]) tMap[r.thread_id] = [];
      tMap[r.thread_id].push(r);
    });
    setThreadReads(tMap);
  };

  if (threads === null) return <div className="text-center text-muted-foreground py-10">Loading messages...</div>;

  const isUnread = (t) => {
    const read = readMap[t.id];
    if (!read) return !!t.last_message_at;
    if (!t.last_message_at) return false;
    return new Date(t.last_message_at).getTime() > new Date(read.last_read_at).getTime();
  };

  const getTypingName = (t) => {
    const reads = threadReads[t.id] || [];
    const typers = reads.filter((r) => isTyping(r, user.id));
    if (typers.length === 0) return null;
    if (typers.length === 1) {
      const pi = t.participant_ids?.indexOf(typers[0].created_by_id);
      return `${t.participant_names?.[pi] || 'Someone'} is typing…`;
    }
    const pi = t.participant_ids?.indexOf(typers[0].created_by_id);
    const firstName = t.participant_names?.[pi] || 'Someone';
    return `${firstName} and ${typers.length - 1} other${typers.length - 1 > 1 ? 's' : ''} are typing…`;
  };

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
        <div className="flex items-center gap-2">
          <button onClick={goBack} className="p-1 -ml-1 text-foreground shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-heading text-2xl font-extrabold">Messages</h1>
        </div>
        <Button size="sm" className="rounded-full bg-gradient-to-r from-primary to-accent" onClick={() => setShowCreateGroup(true)}>
          <Users className="w-4 h-4 mr-1.5" /> New Group
        </Button>
      </div>
      <Input
        placeholder="Search conversations..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-11 rounded-full mb-4 bg-card"
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
        <div className="space-y-2.5">
          {filtered.map((t) => {
            const isGroup = t.type === 'group';
            const idx = t.participant_ids?.findIndex((pid) => pid !== user.id);
            const title = isGroup ? (t.name || 'Group') : (t.participant_names?.[idx] || t.name || 'Conversation');
            const typingLabel = getTypingName(t);
            const unread = isUnread(t);
            return (
              <Link
                key={t.id}
                to={`/messages/${t.id}`}
                className="flex items-center gap-3 bg-card rounded-2xl p-3 shadow-sm hover:shadow-md active:scale-[0.99] transition"
              >
                <div className="relative shrink-0">
                  <Avatar className="w-14 h-14">
                    <AvatarImage src={isGroup ? t.avatar_url : undefined} />
                    <AvatarFallback className={isGroup ? 'bg-secondary text-secondary-foreground text-lg' : 'text-lg'}>
                      {isGroup ? <Users className="w-6 h-6" /> : title[0]}
                    </AvatarFallback>
                  </Avatar>
                  {unread && <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-primary border-2 border-card" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${unread ? 'font-extrabold' : 'font-bold'} truncate`}>{title}</p>
                  {isGroup && !typingLabel && <p className="text-[11px] text-muted-foreground truncate">{t.participant_names?.join(', ')}</p>}
                  <p className={`text-xs truncate ${typingLabel ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                    {typingLabel || t.last_message || 'No messages yet'}
                  </p>
                </div>
                {t.last_message_at && !typingLabel && (
                  <span className="text-xs text-muted-foreground shrink-0">{formatDistanceToNow(new Date(t.last_message_at), { addSuffix: true })}</span>
                )}
                {unread && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}