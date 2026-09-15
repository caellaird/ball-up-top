import React, { useEffect, useRef, useState } from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Image as ImageIcon, X, Settings as SettingsIcon, Users, Trophy } from 'lucide-react';
import MessageBubble from '@/components/messages/MessageBubble';
import GroupSettingsSheet from '@/components/messages/GroupSettingsSheet';
import ChallengeButtonSheet from '@/components/messages/ChallengeButtonSheet';
import { markThreadRead, setTyping, isTyping, hasRead, notifyMessageParticipants } from '@/lib/messaging';
import BackButton from '@/components/shared/BackButton';

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
  const [showChallenge, setShowChallenge] = useState(false);
  const [threadReads, setThreadReads] = useState([]);
  const [myUsername, setMyUsername] = useState('');
  const [otherProfile, setOtherProfile] = useState(null);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const lastTypingUpdate = useRef(0);

  useEffect(() => {
    load();
    const unsubscribe = base44.entities.Message.subscribe((event) => {
      if (event.data.thread_id !== threadId) return;
      if (event.type === 'create') {
        setMessages((prev) => prev.some((m) => m.id === event.data.id) ? prev : [...prev, event.data]);
        if (event.data.created_by_id === user.id) markThreadRead(threadId, user.id);
      } else if (event.type === 'update') {
        setMessages((prev) => prev.map((m) => m.id === event.data.id ? event.data : m));
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
    return () => {unsubscribe();unsubReads();};
  }, [threadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const load = async () => {
    let t;
    try {
      t = await base44.entities.Thread.get(threadId);
    } catch (e) {
      navigate('/messages', { replace: true });
      return;
    }
    setThread(t);
    const myProfiles = await base44.entities.Profile.filter({ created_by_id: user.id });
    if (myProfiles[0]) setMyUsername(myProfiles[0].username);
    if (t.type !== 'group') {
      const otherId = (t.participant_ids || []).find((id) => id !== user.id);
      if (otherId) {
        const others = await base44.entities.Profile.filter({ created_by_id: otherId });
        setOtherProfile(others[0] || null);
      }
    }
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
    const tempId = `temp-${Date.now()}`;
    const msgData = { thread_id: threadId, sender_name: user.full_name, sender_username: myUsername, body, participant_ids: thread.participant_ids };
    if (replyTo) {
      msgData.reply_to_id = replyTo.id;
      msgData.reply_to_sender = replyTo.sender_name;
      msgData.reply_to_body = replyTo.body || (replyTo.media_url ? '📷 Photo' : '');
      setReplyTo(null);
    }
    const optimisticMsg = { id: tempId, ...msgData, created_date: new Date().toISOString(), created_by_id: user.id };
    setMessages((prev) => [...prev, optimisticMsg]);
    try {
      const created = await base44.entities.Message.create(msgData);
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== tempId);
        return withoutTemp.some((m) => m.id === created.id) ? withoutTemp : [...withoutTemp, created];
      });
      await base44.entities.Thread.update(threadId, { last_message: body, last_message_at: new Date().toISOString() });
      await markThreadRead(threadId, user.id);
      await notifyMessageParticipants(thread, user.full_name, user.id, body, myUsername);
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setText(body);
    }
  };

  const sendMedia = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.Message.create({ thread_id: threadId, sender_name: user.full_name, sender_username: myUsername, media_url: file_url, participant_ids: thread.participant_ids });
    await base44.entities.Thread.update(threadId, { last_message: '📷 Photo', last_message_at: new Date().toISOString() });
    await markThreadRead(threadId, user.id);
    await notifyMessageParticipants(thread, user.full_name, user.id, '📷 Photo', myUsername);
    setUploading(false);
  };

  if (!thread) return <div className="text-center text-muted-foreground py-10">Loading conversation...</div>;

  const isGroup = thread.type === 'group';
  const idx = thread.participant_ids?.findIndex((pid) => pid !== user.id);
  const otherName = isGroup ? thread.name || 'Group' : thread.participant_names?.[idx] || thread.name;

  const myLastMessage = [...messages].reverse().find((m) => m.created_by_id === user.id && !m.is_deleted);
  const otherReadState = threadReads.find((tr) => tr.created_by_id !== user.id);
  const lastMessageSeen = myLastMessage && otherReadState && hasRead(otherReadState, myLastMessage.created_date);

  const typers = threadReads.filter((tr) => isTyping(tr, user.id));
  const typingNames = typers.map((tr) => {
    const pi = thread.participant_ids?.indexOf(tr.created_by_id);
    return thread.participant_names?.[pi] || 'Someone';
  });

  return (
    <div className="flex flex-col h-full safe-top">
      <div className="flex items-center gap-3 mb-3 bg-card rounded-2xl shadow-sm px-3 py-2.5">
        <BackButton fallback="/messages" className="-ml-1.5 text-muted-foreground hover:text-foreground" />

        <div className="relative shrink-0">
          <Avatar className="w-11 h-11">
            <AvatarImage src={isGroup ? thread.avatar_url : otherProfile?.avatar_url} />
            <AvatarFallback className={isGroup ? 'bg-secondary text-secondary-foreground' : ''}>
              {isGroup ? <Users className="w-5 h-5" /> : otherName?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          {!isGroup && otherProfile?.ready_to_ball &&
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-primary border-2 border-card" />
          }
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="font-heading text-base font-bold truncate">{otherName}</h2>
          {isGroup && <p className="text-xs text-muted-foreground truncate">{thread.participant_ids?.length || 0} members</p>}
          {typingNames.length > 0 ?
          <p className="text-xs text-primary font-medium truncate">{typingNames.join(', ')} {typingNames.length === 1 ? 'is' : 'are'} typing…</p> :
          !isGroup && otherProfile?.ready_to_ball ?
          <p className="text-xs text-primary font-medium">Ready to ball</p> :
          null}
        </div>

        {isGroup &&
        <div className="flex -space-x-2 mr-1 shrink-0">
            {(thread.participant_names || []).slice(0, 3).map((name, i) =>
          <Avatar key={i} className="w-6 h-6 border-2 border-card">
                <AvatarFallback className="text-[9px]">{name?.[0]}</AvatarFallback>
              </Avatar>
          )}
          </div>
        }

        {isGroup &&
        <Button size="icon" variant="ghost" className="shrink-0" onClick={() => setShowSettings(true)}>
            <SettingsIcon className="w-5 h-5" />
          </Button>
        }
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 mb-4 px-1">
        {messages.map((m) =>
        <MessageBubble
          key={m.id}
          message={m}
          isMe={m.created_by_id === user.id}
          isGroup={isGroup}
          userId={user.id}
          onReply={setReplyTo}
          seen={m.id === myLastMessage?.id && lastMessageSeen && !isGroup} />

        )}
        <div ref={bottomRef} />
      </div>

      {replyTo &&
      <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-muted/50 rounded-lg border-l-2 border-primary">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-muted-foreground">Replying to {replyTo.sender_name}</p>
            <p className="text-xs text-muted-foreground truncate">{replyTo.body || '📷 Photo'}</p>
          </div>
          <button onClick={() => setReplyTo(null)}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
      }

      <div className="flex gap-2 items-center px-2">
        <button
          onClick={() => setShowChallenge(true)}
          className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground flex items-center justify-center shadow-md active:scale-95 transition"
          aria-label="Start a Challenge">
          
          <Trophy className="w-4 h-4" />
        </button>
        <input type="file" accept="image/*" ref={fileInputRef} onChange={sendMedia} className="hidden" />
        <Button onClick={() => fileInputRef.current?.click()} size="icon" variant="outline" disabled={uploading} className="px-2">
          <ImageIcon className="w-4 h-4" />
        </Button>
        <Input value={text} onChange={handleTextChange} placeholder="Message..." onKeyDown={(e) => e.key === 'Enter' && send()} className="px-2" />
        <Button onClick={send} size="icon" className="bg-gradient-to-br from-primary to-accent mx-2 px-4"><Send className="w-4 h-4" /></Button>
      </div>

      {isGroup &&
      <GroupSettingsSheet
        open={showSettings}
        onOpenChange={setShowSettings}
        thread={thread}
        user={user}
        onUpdated={setThread}
        onLeave={() => navigate('/messages', { replace: true })} />

      }

      <ChallengeButtonSheet
        open={showChallenge}
        onOpenChange={setShowChallenge}
        thread={thread}
        user={user}
        onSent={() => setShowChallenge(false)} />
      
    </div>);

}