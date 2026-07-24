import React, { useEffect, useRef, useState } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Image as ImageIcon } from 'lucide-react';

export default function Conversation() {
  const { threadId } = useParams();
  const { user } = useOutletContext();
  const [thread, setThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    load();
    const unsubscribe = base44.entities.Message.subscribe((event) => {
      if (event.data.thread_id === threadId) setMessages((prev) => [...prev, event.data]);
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
    await base44.entities.Message.create({ thread_id: threadId, sender_name: user.full_name, body });
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
      <div className="flex-1 overflow-y-auto space-y-2 mb-4">
        {messages.map((m) => {
          const isMe = m.created_by_id === user.id;
          return (
            <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              {isGroup && !isMe && <span className="text-[11px] text-muted-foreground ml-1 mb-0.5">{m.sender_name}</span>}
              {m.media_url ? (
                <img src={m.media_url} alt="" className="max-w-[220px] rounded-2xl" />
              ) : (
                <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>{m.body}</div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
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