import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

const THRESHOLD = 64;
const RESISTANCE = 0.5;

// Native-style pull-to-refresh for a scrollable container. Attach to the element
// that owns the scroll; when the user pulls down at the top past THRESHOLD,
// `onRefresh` is awaited and the content stays in place while the spinner runs.
export default function PullToRefresh({ onRefresh, children, className }) {
  const scrollRef = useRef(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Refs mirror state so the native (non-passive) listeners stay stable.
  const pullRef = useRef(0);
  const refreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let startY = 0;
    let pulling = false;

    const onStart = (e) => {
      if (refreshingRef.current) return;
      if (el.scrollTop <= 0) { startY = e.touches[0].clientY; pulling = true; }
      else pulling = false;
    };
    const onMove = (e) => {
      if (!pulling || refreshingRef.current) return;
      const dy = e.touches[0].clientY - startY;
      if (dy <= 0) {
        if (pullRef.current !== 0) { pullRef.current = 0; setPull(0); }
        return;
      }
      e.preventDefault(); // stop the native bounce while we show our indicator
      const next = Math.min(dy * RESISTANCE, 120);
      pullRef.current = next;
      setPull(next);
    };
    const onEnd = async () => {
      if (!pulling) return;
      pulling = false;
      if (pullRef.current >= THRESHOLD) {
        refreshingRef.current = true;
        setRefreshing(true);
        setPull(THRESHOLD);
        try { await onRefreshRef.current?.(); } finally {
          refreshingRef.current = false;
          setRefreshing(false);
          pullRef.current = 0;
          setPull(0);
        }
      } else {
        pullRef.current = 0;
        setPull(0);
      }
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd, { passive: true });
    el.addEventListener('touchcancel', onEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onEnd);
    };
  }, []);

  const showIndicator = pull > 0 || refreshing;

  return (
    <div ref={scrollRef} className={className}>
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-200 ease-out"
        style={{ height: pull }}
      >
        <Loader2
          className={`w-5 h-5 text-muted-foreground transition-opacity duration-150 ${showIndicator ? 'opacity-100' : 'opacity-0'} ${refreshing ? 'animate-spin' : ''}`}
          style={{ transform: `rotate(${Math.min(pull, THRESHOLD) * (180 / THRESHOLD)}deg)` }}
        />
      </div>
      {children}
    </div>
  );
}