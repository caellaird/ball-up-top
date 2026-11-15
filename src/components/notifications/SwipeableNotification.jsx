import React, { useRef, useState } from 'react';
import { motion, animate, useMotionValue, useReducedMotion } from 'framer-motion';
import { Trash2 } from 'lucide-react';

const ACTION_WIDTH = 88;

// Native-feeling swipe-left-to-delete row. Swiping back cancels; a tap while
// open closes the row instead of navigating.
export default function SwipeableNotification({ children, onDelete, onOpen, deleting }) {
  const x = useMotionValue(0);
  const openRef = useRef(false);
  const draggedRef = useRef(false);
  const reduce = useReducedMotion();
  const [dragging, setDragging] = useState(false);

  const snapTo = (shouldOpen) => {
    openRef.current = shouldOpen;
    const target = shouldOpen ? -ACTION_WIDTH : 0;
    if (reduce) {
      x.set(target);
      return;
    }
    animate(x, target, { type: 'spring', stiffness: 520, damping: 42, mass: 0.7 });
  };

  const handleDragEnd = (_, info) => {
    setDragging(false);
    const flickedLeft = info.velocity.x < -450;
    const pulledFar = info.offset.x < -ACTION_WIDTH / 2;
    snapTo(flickedLeft || pulledFar);
    // Let the gesture settle before taps are honoured again.
    setTimeout(() => { draggedRef.current = false; }, 120);
  };

  const handleTap = () => {
    if (draggedRef.current) return;
    if (openRef.current) { snapTo(false); return; }
    onOpen?.();
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-destructive">
      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        aria-label="Delete notification"
        className="absolute inset-y-0 right-0 w-[88px] flex flex-col items-center justify-center gap-1 text-destructive-foreground text-[11px] font-semibold disabled:opacity-60"
      >
        <Trash2 className="w-4 h-4" />
        {deleting ? 'Deleting' : 'Delete'}
      </button>
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -ACTION_WIDTH, right: 0 }}
        dragElastic={0.06}
        style={{ x }}
        onDragStart={() => { draggedRef.current = true; setDragging(true); }}
        onDragEnd={handleDragEnd}
        onClick={handleTap}
        className={`relative bg-card ${dragging ? 'cursor-grabbing' : 'cursor-pointer'}`}
      >
        {children}
      </motion.div>
    </div>
  );
}