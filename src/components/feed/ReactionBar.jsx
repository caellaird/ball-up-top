import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SmilePlus, MessageCircle, Share2 } from 'lucide-react';
import { DEFAULT_REACTION, sortedReactions } from '@/lib/reactions';
import ReactionPickerSheet from '@/components/feed/ReactionPickerSheet';

// The reaction row shown under each post: used-emoji pills (sorted by count,
// the user's own highlighted), a primary reaction button, the comment count,
// and an optional share action.
//
// - Tap a pill: set your reaction to that emoji (or remove it if it's yours).
// - Tap the primary button: add the default emoji (🔥); tap again to remove.
// - Press-and-hold the primary button: open the curated emoji picker.
export default function ReactionBar({ post, counts, myEmoji, onReact, commentCount, onComment, onShare }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const pressTimer = useRef(null);
  const longFired = useRef(false);

  const reactions = sortedReactions(counts || {});
  const hasReactions = reactions.length > 0;

  const startPress = () => {
    longFired.current = false;
    pressTimer.current = setTimeout(() => {
      longFired.current = true;
      setPickerOpen(true);
    }, 450);
  };
  const cancelPress = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };
  const handleClick = () => {
    cancelPress();
    if (longFired.current) {
      longFired.current = false;
      return; // picker already opened from the long press
    }
    onReact(post, DEFAULT_REACTION);
  };

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

      {/* Primary reaction button: default emoji when no reactions exist, add icon otherwise. */}
      <button
        onTouchStart={startPress}
        onTouchEnd={cancelPress}
        onTouchCancel={cancelPress}
        onMouseDown={startPress}
        onMouseUp={cancelPress}
        onMouseLeave={cancelPress}
        onClick={handleClick}
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition active:scale-95 ${
          hasReactions ? 'bg-muted text-muted-foreground hover:text-foreground' : 'bg-primary/10 text-primary'
        }`}
        aria-label="React"
      >
        {hasReactions ? <SmilePlus className="w-4 h-4" /> : <>{DEFAULT_REACTION} React</>}
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