import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export default function QRCodeDialog({ open, onOpenChange, value, title, subtitle }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (open && value && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, value, {
        width: 240,
        margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' },
      }).catch(() => {});
    }
  }, [open, value]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-w-[480px] mx-auto">
        <SheetHeader>
          <SheetTitle className="font-heading text-center">{title || 'My QR Code'}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="bg-white p-3 rounded-2xl border border-border">
            <canvas ref={canvasRef} className="w-[240px] h-[240px] block" />
          </div>
          {subtitle && (
            <p className="text-[11px] text-muted-foreground text-center max-w-[280px]">{subtitle}</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}