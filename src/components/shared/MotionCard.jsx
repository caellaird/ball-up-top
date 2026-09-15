import { motion, useReducedMotion } from 'framer-motion';
import { fadeUp } from '@/lib/motion';

// Wraps children with a subtle fade + upward entrance.
// Pass `index` for a staggered cascade effect within a list.
// If `onClick` is provided, adds a subtle press-in tap animation.
export default function MotionCard({ children, className, index = 0, onClick }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      variants={reduce ? { hidden: {}, visible: { opacity: 1 } } : fadeUp}
      initial="hidden"
      animate="visible"
      transition={reduce ? { duration: 0 } : { delay: Math.min(index * 0.045, 0.35), duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      whileTap={onClick && !reduce ? { scale: 0.985 } : undefined}
      onClick={onClick}
      className={className}
    >
      {children}
    </motion.div>
  );
}