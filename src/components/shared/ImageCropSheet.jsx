import React, { useEffect, useRef, useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { CROP_ASPECT, cropBoxToNatural, cropImageToFile } from '@/lib/cropImage';

const GRID = ['33.33%', '66.66%'];
const HANDLES = [
  'left-2 top-2 border-l-2 border-t-2 rounded-tl-md',
  'right-2 top-2 border-r-2 border-t-2 rounded-tr-md',
  'left-2 bottom-2 border-l-2 border-b-2 rounded-bl-md',
  'right-2 bottom-2 border-r-2 border-b-2 rounded-br-md',
];

export default function ImageCropSheet({ file, open, onCancel, onCropped }) {
  const frameRef = useRef(null);
  const imgRef = useRef(null);
  const dragRef = useRef(null);
  const [src, setSrc] = useState('');
  const [size, setSize] = useState(null);
  const [frameW, setFrameW] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);

  const frameH = frameW ? frameW / CROP_ASPECT : 0;

  // Fresh object URL per picked photo, released when it changes or unmounts.
  useEffect(() => {
    if (!file) {
      setSrc('');
      setSize(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setSrc(url);
    setSize(null);
    setZoom(1);
    setSaving(false);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!open) return;
    const el = frameRef.current;
    if (!el) return;
    const update = () => setFrameW(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, src]);

  const baseScale = size && frameW ? Math.max(frameW / size.w, frameH / size.h) : 1;
  const drawW = size ? size.w * baseScale * zoom : 0;
  const drawH = size ? size.h * baseScale * zoom : 0;

  const clampOffset = (o, dw = drawW, dh = drawH) => ({
    x: Math.min(0, Math.max(frameW - dw, o.x)),
    y: Math.min(0, Math.max(frameH - dh, o.y)),
  });

  // Start centered on the photo.
  useEffect(() => {
    if (!size || !frameW) return;
    const bs = Math.max(frameW / size.w, frameH / size.h);
    setOffset({ x: (frameW - size.w * bs) / 2, y: (frameH - size.h * bs) / 2 });
  }, [size, frameW, frameH]);

  const changeZoom = (next) => {
    if (!size || !frameW) return;
    const bs = Math.max(frameW / size.w, frameH / size.h);
    const ratio = next / zoom;
    const cx = frameW / 2;
    const cy = frameH / 2;
    setZoom(next);
    setOffset(
      clampOffset(
        { x: cx - (cx - offset.x) * ratio, y: cy - (cy - offset.y) * ratio },
        size.w * bs * next,
        size.h * bs * next
      )
    );
  };

  const onPointerDown = (e) => {
    if (!size) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, origin: offset };
  };

  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    setOffset(clampOffset({ x: d.origin.x + (e.clientX - d.x), y: d.origin.y + (e.clientY - d.y) }));
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  const confirm = async () => {
    const el = imgRef.current;
    if (!el || !size || !frameW || saving) return;
    setSaving(true);
    try {
      const box = cropBoxToNatural({ frameW, frameH, naturalW: size.w, naturalH: size.h, offset, zoom });
      const cropped = await cropImageToFile(el, box, file?.name);
      onCropped(cropped);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onCancel(); }}>
      <SheetContent side="bottom" className="rounded-t-3xl p-0 border-0 bg-secondary max-h-[94vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <button onClick={onCancel} className="min-h-11 px-1 text-sm font-semibold text-muted-foreground">
            Cancel
          </button>
          <p className="font-heading font-bold text-sm">Crop photo</p>
          <span className="w-14" />
        </div>

        <div className="px-3">
          <div
            ref={frameRef}
            className="relative w-full overflow-hidden rounded-2xl bg-black"
            style={{ height: frameH || 240, touchAction: 'none' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            {src && (
              <img
                ref={imgRef}
                src={src}
                alt=""
                draggable={false}
                onLoad={(e) => setSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
                className="absolute left-0 top-0 select-none"
                style={{
                  width: drawW || '100%',
                  height: drawH || 'auto',
                  maxWidth: 'none',
                  transform: `translate(${offset.x}px, ${offset.y}px)`,
                }}
              />
            )}
            {GRID.map((p) => (
              <div key={`v${p}`} className="pointer-events-none absolute top-0 bottom-0 w-px bg-white/30" style={{ left: p }} />
            ))}
            {GRID.map((p) => (
              <div key={`h${p}`} className="pointer-events-none absolute left-0 right-0 h-px bg-white/30" style={{ top: p }} />
            ))}
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/70" />
            {HANDLES.map((c) => (
              <div key={c} className={`pointer-events-none absolute h-5 w-5 border-white/90 ${c}`} />
            ))}
          </div>
          <p className="pt-2 text-center text-[11px] text-muted-foreground">Drag the photo to pick what stays in frame</p>
        </div>

        <div className="flex items-center gap-3 px-5 pt-3">
          <span className="text-[11px] font-semibold text-muted-foreground">Zoom</span>
          <Slider
            value={[Math.round(zoom * 100)]}
            min={100}
            max={300}
            step={1}
            onValueChange={([v]) => changeZoom(v / 100)}
            className="flex-1"
          />
        </div>

        <div className="px-4 pt-3 pb-8">
          <Button onClick={confirm} disabled={!size || saving} className="w-full rounded-full h-12">
            {saving ? 'Cropping...' : 'Use photo'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}