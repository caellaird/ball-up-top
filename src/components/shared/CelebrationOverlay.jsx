import { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import confetti from 'canvas-confetti';

const BRAND_COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#ffffff'];

const MESSAGES = {
  win: 'YOU GOT THE DUB 🔥',
  loss: 'Run it back? 😤',
  tie: 'Dead even 🤝',
};

// Full-screen celebration overlay. Fires confetti for wins, shows a branded
// personality message, then calls onDone after `duration` ms.
// result: 'win' | 'loss' | 'tie'
export default function CelebrationOverlay({ result, onDone, duration = 2600 }) {
  const reduce = useReducedMotion();
  const firedRef = useRef(false);

  useEffect(() => {
    if (!result || firedRef.current) return;
    firedRef.current = true;
    if (result === 'win' && !reduce) {
      const opts = { colors: BRAND_COLORS, disableForReducedMotion: true, scalar: 0.9 };
      confetti({ particleCount: 90, spread: 78, origin: { y: 0.55 }, ...opts });
      setTimeout(() => confetti({ particleCount: 50, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, ...opts }), 220);
      setTimeout(() => confetti({ particleCount: 50, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, ...opts }), 440);
    }
    const t = setTimeout(() => onDone?.(), duration);
    return () => clearTimeout(t);
  }, [result]); // eslint-disable-line react-hooks/exhaustive-deps

  const message = MESSAGES[result];
  if (!message) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none bg-black/40 backdrop-blur-sm"
    >
      <motion.p
        initial={reduce ? false : { opacity: 0, scale: 0.7, y: 20 }}
        animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
        className="font-heading text-3xl font-extrabold text-white drop-shadow-lg text-center px-8"
      >
        {message}
      </motion.p>
    </motion.div>
  );
}