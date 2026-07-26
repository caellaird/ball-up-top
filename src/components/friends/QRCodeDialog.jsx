import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Loader2 } from 'lucide-react';

export default function QRCodeDialog({ open, onOpenChange, value, title, subtitle }) {
  const [dataUrl, setDataUrl] = useState('');

  useEffect(() => {
    if (!open || !value) {
      setDataUrl('');
      return;
    }
    let active = true;
    // Small delay ensures the portal has mounted before we render
    const t = setTimeout(() => {
      QRCode.toDataURL(value, {
        width: 240,
        margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' },
      })
        .then((url) => { if (active) setDataUrl(url); })
        .catch(() => { if (active) setDataUrl(''); });
    }, 60);
    return () => { active = false; clearTimeout(t); };
  }, [open, value]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-w-[480px] mx-auto">
        <SheetHeader>
          <SheetTitle className="font-heading text-center">{title || 'My QR Code'}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="bg-white p-3 rounded-2xl border border-border w-[264px] h-[264px] flex items-center justify-center">
            {dataUrl ? (
              <img src={dataUrl} alt="QR Code" className="w-[240px] h-[240px] block" />
            ) : (
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            )}
          </div>
          {subtitle && (
            <p className="text-[11px] text-muted-foreground text-center max-w-[280px]">{subtitle}</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}