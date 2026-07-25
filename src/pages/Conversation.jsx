import React, { useEffect, useRef, useState } from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Image as ImageIcon, X, Settings as SettingsIcon, ArrowLeft } from 'lucide-react';
import MessageBubble from '@/components/messages/MessageBubble';
import GroupSettingsSheet from '@/components/messages/GroupSettingsSheet';
import { markThreadRead, setTyping, isTyping, hasRead, notifyMessageParticipants } from '@/lib/messaging';

export default function Conversation() {
  const { threadId } = useParams();
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const [thread, setThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [threadReads, setThreadReads] = useState([]);
  const [myUsername, setMyUsername] = useState('');
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const lastTypingUpdate = useRef(0);

  useEffect(() => {
    load();
    const unsubscribe = base44.entities.Message.subscribe((event) => {
      if (event.data.thread_id !== threadId) return;
      if (event.type === 'create') {
        setMessages((prev) => [...prev, event.data]);
        if (event.data.created_by_id === user.id) markThreadRead(threadId, user.id);
      } else if (event.type === 'update') {
        setMessages((prev) => prev.map((m) => (m.id === event.data.id ? event.data : m)));
      } else if (event.type === 'delete') {
        setMessages((prev) => prev.filter((m) => m.id !== event.data.id));
      }
    });
    const unsubReads = base44.entities.ThreadRead.subscribe((event) => {
      if (event.data.thread_id !== threadId) return;
      setThreadReads((prev) => {
        const idx = prev.findIndex((r) => r.id === event.data.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = event.data;
          return copy;
        }
        return [...prev, event.data];
      });
    });
    return () => { unsubscribe(); unsubReads(); };
  }, [threadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const load = async () => {
    const t = await base44.entities.Thread.get(threadId);
    setThread(t);
    const myProfiles = await base44.entities.Profile.filter({ created_by_id: user.id });
    if (myProfiles[0]) setMyUsername(myProfiles[0].username);
    const msgs = await base44.entities.Message.filter({ thread_id: threadId }, 'created_date');
    setMessages(msgs);
    await markThreadRead(threadId, user.id);
    loadThreadReads();
  };

  const loadThreadReads = async () => {
    const reads = await base44.entities.ThreadRead.filter({ thread_id: threadId });
    setThreadReads(reads);
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    const now = Date.now();
    if (now - lastTypingUpdate.current > 3000) {
      lastTypingUpdate.current = now;
      setTyping(threadId, user.id);
    }
  };

  const send = async () => {
    if (!text.trim()) return;
    const body = text;
    setText('');
    const msgData = { thread_id: threadId, sender_name: user.full_name, sender_username: myUsername, body };
    if (replyTo) {
      msgData.reply_to_id = replyTo.id;
      msgData.reply_to_sender = replyTo.sender_name;
      msgData.reply_to_body = replyTo.body || (replyTo.media_url ? '📷 Photo' : '');
      setReplyTo(null);
    }
    await base44.entities.Message.create(msgData);
    await base44.entities.Thread.update(threadId, { last_message: body, last_message_at: new Date().toISOString() });
    await markThreadRead(threadId, user.id);
    await notifyMessageParticipants(thread, user.full_name, user.id, body, myUsername);
  };

  const sendMedia = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.Message.create({ thread_id: threadId, sender_name: user.full_name, sender_username: myUsername, media_url: file_url });
    await base44.entities.Thread.update(threadId, { last_message: '📷 Photo', last_message_at: new Date().toISOString() });
    await markThreadRead(threadId, user.id);
    await notifyMessageParticipants(thread, user.full_name, user.id, '📷 Photo', myUsername);
    setUploading(false);
  };

  if (!thread) return <div className="text-center text-muted-foreground py-10">Loading conversation...</div>;

  const isGroup = thread.type === 'group';
  const idx = thread.participant_ids?.findIndex((pid) => pid !== user.id);
  const otherName = isGroup ? (thread.name || 'Group') : (thread.participant_names?.[idx] || thread.name);

  const myLastMessage = [...messages].reverse().find((m) => m.created_by_id === user.id && !m.is_deleted);
  const otherReadState = threadReads.find((tr) => tr.created_by_id !== user.id);
  const lastMessageSeen = myLastMessage && otherReadState && hasRead(otherReadState, myLastMessage.created_date);

  const typers = threadReads.filter((tr) => isTyping(tr, user.id));
  const typingNames = typers.map((tr) => {
    const pi = thread.participant_ids?.indexOf(tr.created_by_id);
    return thread.participant_names?.[pi] || 'Someone';
  });

  return (
    <div className="flex flex-col h-[calc(100dvh-8rem)]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button onClick={() => navigate(-1)} className="shrink-0 p-1 -ml-1 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="font-heading text-lg truncate">{otherName}</h2>
          {isGroup && !typingNames.length && <p className="text-xs text-muted-foreground truncate">{thread.participant_names?.join(', ')}</p>}
          {typingNames.length > 0 && <p className="text-xs text-primary">{typingNames.join(', ')} {typingNames.length === 1 ? 'is' : 'are'} typing...</p>}
        </div>
        {isGroup && <Button size="icon" variant="ghost" onClick={() => setShowSettings(true)}><SettingsIcon className="w-5 h-5" /></Button>}
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
            seen={m.id === myLastMessage?.id && lastMessageSeen && !isGroup}
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
        <Input value={text} onChange={handleTextChange} placeholder="Message..." onKeyDown={(e) => e.key === 'Enter' && send()} />
        <Button onClick={send} size="icon"><Send className="w-4 h-4" /></Button>
      </div>

      {isGroup && (
        <GroupSettingsSheet
          open={showSettings}
          onOpenChange={setShowSettings}
          thread={thread}
          user={user}
          onUpdated={setThread}
          onLeave={() => navigate(-1)}
        />
      )}
    </div>
  );
}