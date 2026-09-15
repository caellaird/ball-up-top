import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

// Counts up from 0 to `value` with an easeOutCubic curve.
// Falls back to instant display when reduced motion is preferred.
export default function AnimatedNumber({ value = 0, duration = 900, className }) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : 0);
  const rafRef = useRef();
  const startRef = useRef(0);

  useEffect(() => {
    if (reduce) { setDisplay(value); return; }
    const to = value;
    startRef.current = performance.now();
    const tick = (now) => {
      const t = Math.min((now - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(to * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, reduce, duration]);

  return <span className={className}>{display}</span>;
}