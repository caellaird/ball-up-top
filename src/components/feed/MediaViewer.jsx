import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function MediaViewer({ urls, initialIndex = 0, onClose }) {
  const [index, setIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const pinchStartDist = useRef(null);
  const pinchStartScale = useRef(1);

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
      const nextScale = Math.min(4, Math.max(1, pinchStartScale.current * (newDist / pinchStartDist.current)));
      setScale(nextScale);
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
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onDoubleClick={() => setScale((s) => (s > 1 ? 1 : 2))}>
      <button onClick={onClose} className="absolute top-5 right-5 text-white z-10">
        <X className="w-7 h-7" />
      </button>

      {urls.length > 1 && index > 0 && (
        <button onClick={() => goTo(-1)} className="absolute left-3 text-white z-10">
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}
      {urls.length > 1 && index < urls.length - 1 && (
        <button onClick={() => goTo(1)} className="absolute right-3 text-white z-10">
          <ChevronRight className="w-8 h-8" />
        </button>
      )}

      <motion.div
        className="w-full h-full flex items-center justify-center overflow-hidden touch-none"
        drag={scale === 1 ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={(e, info) => {
          if (info.offset.x < -80) goTo(1);
          else if (info.offset.x > 80) goTo(-1);
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <img
          src={urls[index]}
          alt=""
          className="max-w-full max-h-full object-contain transition-transform"
          style={{ transform: `scale(${scale})` }}
        />
      </motion.div>

      {urls.length > 1 && (
        <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-1.5">
          {urls.map((_, i) => (
            <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === index ? 'bg-white' : 'bg-white/40'}`} />
          ))}
        </div>
      )}
    </div>
  );
}