import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';
import { useMotionVariants } from '@/lib/motion';

// Displays generated rivalry insights as animated chips.
export default function RivalryInsights({ insights }) {
  const { staggerParent, fadeUp, reduce } = useMotionVariants();
  if (!insights || insights.length === 0) return null;

  return (
    <div className="mb-4">
      <h3 className="font-heading font-bold text-sm uppercase tracking-wide mb-2 flex items-center gap-1.5">
        <Lightbulb className="w-4 h-4 text-primary" /> Insights
      </h3>
      <motion.div
        variants={reduce ? undefined : staggerParent}
        initial="hidden"
        animate="visible"
        className="space-y-2"
      >
        {insights.map((text, i) => (
          <motion.div
            key={i}
            variants={fadeUp}
            className="bg-card rounded-2xl border border-border/50 p-3 text-sm font-medium"
          >
            {text}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}