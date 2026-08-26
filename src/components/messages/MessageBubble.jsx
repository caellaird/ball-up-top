import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { Trophy } from 'lucide-react';

const QUICK_REACTIONS = ['👍', '🔥', '🏀', '😂', '💪', '👑'];

function parseChallengeCard(body) {
  const match = body?.match(/#challenge:([a-zA-Z0-9_-]+)\s*$/);
  if (!match) return null;
  const text = body.slice(0, match.index).trim();
  return { challengeId: match[1], text };
}

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

  const time = message.created_date ? format(new Date(message.created_date), 'h:mm a') : '';
  const challengeCard = !message.media_url ? parseChallengeCard(message.body) : null;

  if (message.is_deleted) {
    return (
      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-2`}>
        <div className="max-w-[70%] px-4 py-2 rounded-2xl text-sm italic text-muted-foreground bg-muted/50">
          🚫 Message deleted
        </div>
      </div>);

  }

  return (
    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-2`}>
      {isGroup && !isMe &&
      <Link to={`/profile/${message.sender_username || 'me'}`} className="text-xs font-semibold text-secondary ml-1 mb-0.5 hover:underline">
          {message.sender_name}
        </Link>
      }

      {message.reply_to_id &&
      <div className={`max-w-[70%] mb-0.5 px-3 py-1.5 rounded-xl bg-muted/60 border-l-2 border-primary text-xs ${isMe ? 'mr-1' : 'ml-1'}`}>
          <p className="font-semibold text-muted-foreground">{message.reply_to_sender}</p>
          <p className="text-muted-foreground truncate">{message.reply_to_body}</p>
        </div>
      }

      {message.media_url ?
      <img
        src={message.media_url}
        alt=""
        className="max-w-[70%] rounded-2xl cursor-pointer shadow-sm mx-2"
        onClick={() => setShowActions(!showActions)} /> :

      editing ?
      <div className={`flex flex-col gap-1 max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
          <input
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          className="w-full px-4 py-2 rounded-2xl text-sm bg-card border border-primary outline-none"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && saveEdit()} />
        
          <div className="flex gap-2">
            <button onClick={saveEdit} className="text-xs text-primary font-semibold">Save</button>
            <button onClick={() => {setEditing(false);setEditText(message.body);}} className="text-xs text-muted-foreground">Cancel</button>
          </div>
        </div> :
      challengeCard ?
      <Link
        to={`/challenges/${challengeCard.challengeId}`}
        className="max-w-[70%] rounded-2xl px-4 py-3 bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/30 shadow-sm active:scale-[0.98] transition">
        
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wide text-primary">Challenge Card</span>
          </div>
          <p className="text-sm font-medium whitespace-pre-wrap">{challengeCard.text}</p>
          <p className="text-xs font-semibold text-secondary mt-1">View Challenge →</p>
        </Link> :

      <div
        className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm cursor-pointer shadow-sm ${isMe ? 'bg-gradient-to-br from-primary to-accent text-primary-foreground' : 'bg-muted text-foreground'}`}
        onClick={() => setShowActions(!showActions)}>
        
          {message.body}
          {message.is_edited && <span className="text-[10px] opacity-60 ml-1">(edited)</span>}
        </div>
      }

      <div className={`flex items-center gap-1.5 mt-0.5 ${isMe ? 'mr-1' : 'ml-1'}`}>
        {time && <span className="text-[10px] text-muted-foreground">{time}</span>}
        {seen && <span className="text-[10px] text-primary font-medium">Read ✓✓</span>}
        {isMe && !seen && <span className="text-[10px] text-muted-foreground">Delivered ✓</span>}
      </div>

      {Object.keys(reactionCounts).length > 0 &&
      <div className={`flex gap-1 mt-1 ${isMe ? 'mr-1' : 'ml-1'}`}>
          {Object.entries(reactionCounts).map(([emoji, count]) => {
          const mine = reactions.some((r) => r.emoji === emoji && r.created_by_id === userId);
          return (
            <button
              key={emoji}
              onClick={() => react(emoji)}
              className={`text-xs rounded-full px-2 py-0.5 shadow-sm ${mine ? 'bg-primary/20 border border-primary/40' : 'bg-card border border-border'}`}>
              
                {emoji} {count}
              </button>);

        })}
        </div>
      }

      {showActions &&
      <div className={`flex items-center gap-1 mt-1 flex-wrap ${isMe ? 'mr-1' : 'ml-1'}`}>
          <button onClick={() => {onReply(message);setShowActions(false);}} className="text-[11px] px-2 py-1 rounded-full bg-muted">Reply</button>
          {!message.media_url && !challengeCard && QUICK_REACTIONS.map((emoji) =>
        <button key={emoji} onClick={() => react(emoji)} className="text-sm px-0.5">{emoji}</button>
        )}
          {isMe && !message.media_url && !challengeCard &&
        <>
              <button onClick={() => {setEditing(true);setShowActions(false);}} className="text-[11px] px-2 py-1 rounded-full bg-muted">Edit</button>
              <button onClick={del} className="text-[11px] px-2 py-1 rounded-full bg-destructive/10 text-destructive">Delete</button>
            </>
        }
        </div>
      }
    </div>);

}