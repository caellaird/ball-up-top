import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Global full-screen photo viewer.
 *
 * - Large, always-visible close button with a dark blurred background
 *   (readable against both light and dark photos).
 * - Tap the backdrop (outside the image) to close.
 * - Device/browser back button closes the viewer without leaving the page
 *   (via a dummy history entry pushed on mount).
 * - Pinch-to-zoom, double-tap-to-zoom, and swipe-to-navigate on multi-image sets.
 * - Keyboard: Escape closes, arrows navigate (desktop).
 */
export default function GlobalPhotoViewer({ urls, initialIndex = 0, onClose }) {
  const [index, setIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const pinchStartDist = useRef(null);
  const pinchStartScale = useRef(1);
  const closingRef = useRef(false);

  // Push a dummy history entry so the back button closes the viewer instead
  // of navigating away. Closing via X or backdrop calls history.back() to
  // pop this entry → popstate fires → onClose.
  useEffect(() => {
    window.history.pushState({ photoViewer: true }, '');
    const onPopState = () => {
      closingRef.current = true;
      onClose();
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [onClose]);

  // Lock background scroll while the viewer is open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Desktop keyboard shortcuts.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') requestClose();
      if (e.key === 'ArrowLeft' && urls.length > 1) goTo(-1);
      if (e.key === 'ArrowRight' && urls.length > 1) goTo(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestClose = () => {
    if (closingRef.current) return;
    window.history.back();
  };

  const distance = (touches) => {
    const [a, b] = touches;
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  };

  const onTouchStart = (e) => {
    if (e.touches.length === 2) {
      pinchStartDist.current = distance(e.touches);
      pinchStartScale.current = scale;
    }
  };

  const onTouchMove = (e) => {
    if (e.touches.length === 2 && pinchStartDist.current) {
      const newDist = distance(e.touches);
      const next = Math.min(4, Math.max(1, pinchStartScale.current * (newDist / pinchStartDist.current)));
      setScale(next);
    }
  };

  const onTouchEnd = (e) => {
    if (e.touches.length < 2) pinchStartDist.current = null;
  };

  const goTo = (delta) => {
    setScale(1);
    setIndex((prev) => Math.min(urls.length - 1, Math.max(0, prev + delta)));
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 select-none">
      {/* Full-screen backdrop: tap to close, drag to swipe */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center overflow-hidden touch-none"
        onClick={requestClose}
        drag={scale === 1 && urls.length > 1 ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragEnd={(e, info) => {
          if (info.offset.x < -80) goTo(1);
          else if (info.offset.x > 80) goTo(-1);
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onDoubleClick={() => setScale((s) => (s > 1 ? 1 : 2))}
      >
        <img
          src={urls[index]}
          alt=""
          className="max-w-full max-h-full object-contain transition-transform"
          style={{ transform: `scale(${scale})` }}
          onClick={(e) => e.stopPropagation()}
          draggable={false}
        />
      </motion.div>

      {/* Close button — large, always-visible against any photo */}
      <button
        onClick={requestClose}
        className="absolute z-20 w-12 h-12 rounded-full bg-black/55 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition"
        style={{ top: 'calc(env(safe-area-inset-top) + 0.75rem)', right: '0.75rem' }}
        aria-label="Close photo"
      >
        <X className="w-6 h-6" strokeWidth={2.5} />
      </button>

      {/* Navigation arrows (multi-image only) */}
      {urls.length > 1 && index > 0 && (
        <button
          onClick={() => goTo(-1)}
          className="absolute z-20 w-11 h-11 rounded-full bg-black/45 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition"
          style={{ left: '0.5rem', top: '50%', transform: 'translateY(-50%)' }}
          aria-label="Previous photo"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>
      )}
      {urls.length > 1 && index < urls.length - 1 && (
        <button
          onClick={() => goTo(1)}
          className="absolute z-20 w-11 h-11 rounded-full bg-black/45 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition"
          style={{ right: '0.5rem', top: '50%', transform: 'translateY(-50%)' }}
          aria-label="Next photo"
        >
          <ChevronRight className="w-7 h-7" />
        </button>
      )}

      {/* Page dots */}
      {urls.length > 1 && (
        <div
          className="absolute z-20 left-0 right-0 flex justify-center gap-1.5"
          style={{ bottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
        >
          {urls.map((_, i) => (
            <span
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition ${i === index ? 'bg-white' : 'bg-white/40'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}