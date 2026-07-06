import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import EmptyState from '@/components/shared/EmptyState';
import { formatDistanceToNow } from 'date-fns';

export default function Messages() {
  const { user } = useOutletContext();
  const [threads, setThreads] = useState(null);

  useEffect(() => {
    base44.entities.Thread.list('-last_message_at', 50).then((all) => {
      setThreads(all.filter((t) => t.participant_ids?.includes(user.id)));
    });
  }, []);

  if (threads === null) return <div className="text-center text-muted-foreground py-10">Loading messages...</div>;

  return (
    <div>
      <h1 className="font-heading text-2xl mb-6">Messages</h1>
      {threads.length === 0 ? (
        <EmptyState title="No conversations yet" description="Start a DM from a friend's profile!" />
      ) : (
        threads.map((t) => {
          const idx = t.participant_ids?.findIndex((pid) => pid !== user.id);
          const otherName = t.participant_names?.[idx] || t.name || 'Conversation';
          return (
            <Link key={t.id} to={`/messages/${t.id}`} className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 mb-2 hover:shadow-md transition">
              <Avatar className="w-10 h-10"><AvatarFallback>{otherName[0]}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{otherName}</p>
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