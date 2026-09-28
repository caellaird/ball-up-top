import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SmilePlus, MessageCircle, Share2 } from 'lucide-react';
import { DEFAULT_REACTION, sortedReactions } from '@/lib/reactions';
import ReactionPickerSheet from '@/components/feed/ReactionPickerSheet';

// The reaction row shown under each post.
//
// Layout:  🔥 N  [other emoji pills…]  🙂   |  comment  share
//
//   - 🔥 N is the primary Like button. Tap to add 🔥; tap again to remove it;
//     if your current reaction is another emoji, tapping it switches you back
//     to 🔥. Highlighted when your reaction is 🔥.
//   - Other emojis people have used render as pills after the Like button,
//     sorted by count. Tap one to set your reaction to it (or remove it if
//     it's already yours). One reaction per user per post is enforced by the
//     useReactions hook.
//   - The SmilePlus button opens the curated emoji picker.
export default function ReactionBar({ post, counts, myEmoji, onReact, commentCount, onComment, onShare }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const fireCount = (counts && counts[DEFAULT_REACTION]) || 0;
  const fireMine = myEmoji === DEFAULT_REACTION;
  const others = sortedReactions(counts || {}).filter((r) => r.emoji !== DEFAULT_REACTION);

  return (
    <div className="flex items-center gap-1.5 flex-wrap pt-1 text-sm">
      {/* Primary Like button — 🔥 + count, always first */}
      <button
        onClick={() => onReact(post, DEFAULT_REACTION)}
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition active:scale-95 ${
          fireMine ? 'bg-primary/15 text-primary ring-1 ring-primary/40' : 'bg-muted text-foreground'
        }`}
        aria-label="Like"
      >
        <span className="text-sm leading-none">{DEFAULT_REACTION}</span>
        <span>{fireCount}</span>
      </button>

      {/* Other emojis, dynamic by usage */}
      <AnimatePresence initial={false}>
        {others.map(({ emoji, count }) => {
          const mine = myEmoji === emoji;
          return (
            <motion.button
              key={emoji}
              layout
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              onClick={() => onReact(post, emoji)}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition active:scale-95 ${
                mine ? 'bg-primary/15 text-primary ring-1 ring-primary/40' : 'bg-muted text-foreground'
              }`}
            >
              <span className="text-sm leading-none">{emoji}</span>
              <span>{count}</span>
            </motion.button>
          );
        })}
      </AnimatePresence>

      {/* Emoji picker — opens the curated sheet */}
      <button
        onClick={() => setPickerOpen(true)}
        className="inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold bg-muted text-muted-foreground hover:text-foreground transition active:scale-95"
        aria-label="Choose a reaction"
      >
        <SmilePlus className="w-4 h-4" />
      </button>

      <div className="ml-auto flex items-center gap-2 text-muted-foreground">
        {onComment ? (
          <button onClick={onComment} className="inline-flex items-center gap-1.5 py-1 px-1">
            <MessageCircle className="w-4 h-4" /> {commentCount || 0}
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 py-1 px-1">
            <MessageCircle className="w-4 h-4" /> {commentCount || 0}
          </span>
        )}
        {onShare && (
          <button onClick={onShare} className="py-1 px-1" aria-label="Share">
            <Share2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <ReactionPickerSheet open={pickerOpen} onOpenChange={setPickerOpen} onSelect={(emoji) => onReact(post, emoji)} />
    </div>
  );
}