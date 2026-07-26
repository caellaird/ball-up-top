import React, { useEffect, useRef, useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Loader2, CameraOff } from 'lucide-react';

export default function QRScannerDialog({ open, onOpenChange, onDecode }) {
  const scannerRef = useRef(null);
  const [status, setStatus] = useState('starting');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!open) return;
    let active = true;
    setStatus('starting');
    setErrorMsg('');

    (async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (!active) return;
        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText) => {
            scanner.stop().then(() => scanner.clear()).catch(() => {});
            if (active) onDecode?.(decodedText);
          },
          () => {}
        );
        if (active) setStatus('ready');
      } catch (err) {
        if (!active) return;
        setStatus('error');
        setErrorMsg(
          err?.message?.includes('Permission')
            ? 'Camera permission was denied. Enable it in your browser settings.'
            : 'Could not access camera. Make sure no other app is using it.'
        );
      }
    })();

    return () => {
      active = false;
      const s = scannerRef.current;
      if (s) {
        s.stop().then(() => s.clear()).catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-w-[480px] mx-auto h-[80vh] p-0">
        <div className="flex flex-col items-center h-full pt-6 pb-8 px-4">
          <h2 className="font-heading font-bold text-lg mb-4">Scan QR Code</h2>
          <div className="relative w-[280px] h-[280px] rounded-2xl overflow-hidden bg-black">
            <div id="qr-reader" className="w-full h-full" />
            {status !== 'ready' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-2 bg-black/80">
                {status === 'starting' ? (
                  <>
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p className="text-sm">Starting camera…</p>
                  </>
                ) : (
                  <>
                    <CameraOff className="w-8 h-8" />
                    <p className="text-sm text-center px-4">{errorMsg || 'Camera unavailable'}</p>
                  </>
                )}
              </div>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-4 text-center">
            Point your camera at a friend's Ball Up Top QR code.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}