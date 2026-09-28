import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SmilePlus, MessageCircle, Share2 } from 'lucide-react';
import { DEFAULT_REACTION, sortedReactions } from '@/lib/reactions';
import ReactionPickerSheet from '@/components/feed/ReactionPickerSheet';

// The reaction row shown under each post.
//
// Interactions (all single-tap — no long-press gesture required, which was the
// source of the tap/hold conflict that made the picker unreachable):
//   - Tap an emoji pill: set your reaction to that emoji, or remove it if it's
//     already yours (one reaction per user per post).
//   - Tap "🔥 React": quickly toggle the default 🔥 reaction.
//   - Tap the SmilePlus button: open the curated emoji picker.
export default function ReactionBar({ post, counts, myEmoji, onReact, commentCount, onComment, onShare }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const reactions = sortedReactions(counts || {});

  return (
    <div className="flex items-center gap-1.5 flex-wrap pt-1 text-sm">
      <AnimatePresence initial={false}>
        {reactions.map(({ emoji, count }) => {
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

      {/* Quick react: toggle the default 🔥 */}
      <button
        onClick={() => onReact(post, DEFAULT_REACTION)}
        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold bg-primary/10 text-primary transition active:scale-95"
        aria-label="React with fire"
      >
        {DEFAULT_REACTION} React
      </button>

      {/* Open the curated emoji picker — always one tap away */}
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