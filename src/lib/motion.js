import { useReducedMotion } from 'framer-motion';

// Subtle, professional entrance variants — fade + upward movement.
export const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } },
};

// Parent container that staggers its children's entrance.
export const staggerParent = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.055 } },
};

// Pop-in with a slight overshoot — for badges, notifications, celebrations.
export const popIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.32, ease: [0.34, 1.56, 0.64, 1] } },
};

// Tap feedback for motion-enhanced buttons / cards.
export const tapProps = { whileTap: { scale: 0.96 } };

// Returns motion-safe variants. When reduced motion is preferred, animations
// are flattened to instant visibility — no movement, no scaling.
export function useMotionVariants() {
  const reduce = useReducedMotion();
  if (reduce) {
    return {
      fadeUp: { hidden: {}, visible: { opacity: 1 } },
      staggerParent: { hidden: {}, visible: {} },
      popIn: { hidden: {}, visible: { opacity: 1 } },
      tapProps: {},
      reduce: true,
    };
  }
  return { fadeUp, staggerParent, popIn, tapProps, reduce: false };
}