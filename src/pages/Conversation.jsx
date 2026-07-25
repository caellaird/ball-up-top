import React, { useEffect, useRef, useState } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Image as ImageIcon, X } from 'lucide-react';
import MessageBubble from '@/components/messages/MessageBubble';

export default function Conversation() {
  const { threadId } = useParams();
  const { user } = useOutletContext();
  const [thread, setThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    load();
    const unsubscribe = base44.entities.Message.subscribe((event) => {
      if (event.data.thread_id !== threadId) return;
      if (event.type === 'create') {
        setMessages((prev) => [...prev, event.data]);
      } else if (event.type === 'update') {
        setMessages((prev) => prev.map((m) => (m.id === event.data.id ? event.data : m)));
      } else if (event.type === 'delete') {
        setMessages((prev) => prev.filter((m) => m.id !== event.data.id));
      }
    });
    return unsubscribe;
  }, [threadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const load = async () => {
    const t = await base44.entities.Thread.get(threadId);
    setThread(t);
    const msgs = await base44.entities.Message.filter({ thread_id: threadId }, 'created_date');
    setMessages(msgs);
  };

  const send = async () => {
    if (!text.trim()) return;
    const body = text;
    setText('');
    const msgData = { thread_id: threadId, sender_name: user.full_name, body };
    if (replyTo) {
      msgData.reply_to_id = replyTo.id;
      msgData.reply_to_sender = replyTo.sender_name;
      msgData.reply_to_body = replyTo.body || (replyTo.media_url ? '📷 Photo' : '');
      setReplyTo(null);
    }
    await base44.entities.Message.create(msgData);
    await base44.entities.Thread.update(threadId, { last_message: body, last_message_at: new Date().toISOString() });
  };

  const sendMedia = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.Message.create({ thread_id: threadId, sender_name: user.full_name, media_url: file_url });
    await base44.entities.Thread.update(threadId, { last_message: '📷 Photo', last_message_at: new Date().toISOString() });
    setUploading(false);
  };

  if (!thread) return <div className="text-center text-muted-foreground py-10">Loading conversation...</div>;

  const isGroup = thread.type === 'group';
  const idx = thread.participant_ids?.findIndex((pid) => pid !== user.id);
  const otherName = isGroup ? (thread.name || 'Group') : (thread.participant_names?.[idx] || thread.name);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h2 className="font-heading text-lg">{otherName}</h2>
        {isGroup && <p className="text-xs text-muted-foreground truncate">{thread.participant_names?.join(', ')}</p>}
      </div>
      <div className="flex-1 overflow-y-auto space-y-1 mb-4">
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            isMe={m.created_by_id === user.id}
            isGroup={isGroup}
            userId={user.id}
            onReply={setReplyTo}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {replyTo && (
        <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-muted/50 rounded-lg border-l-2 border-primary">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-muted-foreground">Replying to {replyTo.sender_name}</p>
            <p className="text-xs text-muted-foreground truncate">{replyTo.body || '📷 Photo'}</p>
          </div>
          <button onClick={() => setReplyTo(null)}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
      )}

      <div className="flex gap-2">
        <input type="file" accept="image/*" ref={fileInputRef} onChange={sendMedia} className="hidden" />
        <Button onClick={() => fileInputRef.current?.click()} size="icon" variant="outline" disabled={uploading}>
          <ImageIcon className="w-4 h-4" />
        </Button>
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Message..." onKeyDown={(e) => e.key === 'Enter' && send()} />
        <Button onClick={send} size="icon"><Send className="w-4 h-4" /></Button>
      </div>
    </div>
  );
}