import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '🔥', '😮', '😢'];

export default function MessageBubble({ message, isMe, isGroup, userId, onReply, seen }) {
  const [showActions, setShowActions] = useState(false);
  const [reactions, setReactions] = useState([]);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.body || '');

  useEffect(() => {
    loadReactions();
    const unsub = base44.entities.MessageReaction.subscribe((event) => {
      if (event.data.message_id === message.id) loadReactions();
    });
    return unsub;
  }, [message.id]);

  const loadReactions = async () => {
    const data = await base44.entities.MessageReaction.filter({ message_id: message.id });
    setReactions(data);
  };

  const react = async (emoji) => {
    const existing = reactions.find((r) => r.emoji === emoji && r.created_by_id === userId);
    if (existing) {
      await base44.entities.MessageReaction.delete(existing.id);
    } else {
      await base44.entities.MessageReaction.create({ message_id: message.id, emoji });
    }
    loadReactions();
    setShowActions(false);
  };

  const saveEdit = async () => {
    if (!editText.trim()) return;
    await base44.entities.Message.update(message.id, { body: editText, is_edited: true });
    setEditing(false);
    setShowActions(false);
  };

  const del = async () => {
    await base44.entities.Message.update(message.id, { is_deleted: true, body: '' });
    setShowActions(false);
  };

  const reactionCounts = reactions.reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {});

  if (message.is_deleted) {
    return (
      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}>
        <div className="max-w-xs px-4 py-2 rounded-2xl text-sm italic text-muted-foreground bg-muted/50">
          🚫 Message deleted
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-1`}>
      {isGroup && !isMe && (
        <span className="text-[11px] text-muted-foreground ml-1 mb-0.5">{message.sender_name}</span>
      )}

      {message.reply_to_id && (
        <div className={`max-w-[200px] mb-0.5 px-3 py-1 rounded-lg bg-muted/50 border-l-2 border-primary text-xs ${isMe ? 'mr-1' : 'ml-1'}`}>
          <p className="font-semibold text-muted-foreground">{message.reply_to_sender}</p>
          <p className="text-muted-foreground truncate">{message.reply_to_body}</p>
        </div>
      )}

      {message.media_url ? (
        <img
          src={message.media_url}
          alt=""
          className="max-w-[220px] rounded-2xl cursor-pointer"
          onClick={() => setShowActions(!showActions)}
        />
      ) : editing ? (
        <div className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
          <input
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="max-w-xs px-4 py-2 rounded-2xl text-sm bg-card border border-primary outline-none"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
          />
          <div className="flex gap-2">
            <button onClick={saveEdit} className="text-xs text-primary font-semibold">Save</button>
            <button onClick={() => { setEditing(false); setEditText(message.body); }} className="text-xs text-muted-foreground">Cancel</button>
          </div>
        </div>
      ) : (
        <div
          className={`max-w-xs px-4 py-2 rounded-2xl text-sm cursor-pointer ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
          onClick={() => setShowActions(!showActions)}
        >
          {message.body}
          {message.is_edited && <span className="text-[10px] opacity-60 ml-1">(edited)</span>}
        </div>
      )}

      {Object.keys(reactionCounts).length > 0 && (
        <div className={`flex gap-1 mt-0.5 ${isMe ? 'mr-1' : 'ml-1'}`}>
          {Object.entries(reactionCounts).map(([emoji, count]) => {
            const mine = reactions.some((r) => r.emoji === emoji && r.created_by_id === userId);
            return (
              <button
                key={emoji}
                onClick={() => react(emoji)}
                className={`text-xs rounded-full px-1.5 py-0.5 ${mine ? 'bg-primary/20 border border-primary/40' : 'bg-muted'}`}
              >
                {emoji} {count}
              </button>
            );
          })}
        </div>
      )}

      {seen && (
        <p className="text-[10px] text-muted-foreground mr-1 mt-0.5">Seen ✓</p>
      )}

      {showActions && (
        <div className={`flex items-center gap-1 mt-1 flex-wrap ${isMe ? 'mr-1' : 'ml-1'}`}>
          <button onClick={() => { onReply(message); setShowActions(false); }} className="text-[11px] px-2 py-1 rounded-full bg-muted">Reply</button>
          {!message.media_url && QUICK_REACTIONS.map((emoji) => (
            <button key={emoji} onClick={() => react(emoji)} className="text-sm px-0.5">{emoji}</button>
          ))}
          {isMe && !message.media_url && (
            <>
              <button onClick={() => { setEditing(true); setShowActions(false); }} className="text-[11px] px-2 py-1 rounded-full bg-muted">Edit</button>
              <button onClick={del} className="text-[11px] px-2 py-1 rounded-full bg-destructive/10 text-destructive">Delete</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}