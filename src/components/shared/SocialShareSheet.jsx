import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Share2, Download } from 'lucide-react';
import { toast } from 'sonner';

// Bottom sheet that lets users share an event/result to Instagram, TikTok, or
// copy the link. When an imageFile is attached (e.g. a result card), the native
// share sheet shares the image file directly — Instagram/TikTok receive the
// image instead of just a URL.
export default function SocialShareSheet({ open, onOpenChange, title, text, url, imageFile }) {
  const canShareFiles = imageFile && typeof navigator.canShare === 'function' && navigator.canShare({ files: [imageFile] });
  const data = { title: title || 'Ball Up Top', text, url };
  if (canShareFiles) data.files = [imageFile];

  const nativeShare = async () => {
    if (navigator.share) {
      try { await navigator.share(data); return true; } catch { return false; }
    }
    return false;
  };

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(url); toast.success('Link copied'); }
    catch { toast.error('Couldn’t copy link'); }
  };

  const shareSocial = async () => {
    const ok = await nativeShare();
    if (!ok && !canShareFiles) await copyLink();
    onOpenChange(false);
  };

  // Instagram and TikTok don't accept arbitrary text via URL scheme, so the
  // reliable path is: copy the link to the clipboard, then launch the app via
  // its deep link (web fallback if the app isn't installed) and nudge the user
  // to paste. `document.hidden` lets us avoid the web fallback when the app
  // actually took over.
  const shareToApp = async (scheme, fallback, label) => {
    if (canShareFiles) {
      try { await navigator.share(data); onOpenChange(false); return; }
      catch { /* user cancelled — fall through to URL scheme */ }
    }
    await navigator.clipboard.writeText(url).catch(() => {});
    toast.success(`Link copied — paste in ${label}`);
    const start = Date.now();
    try { window.location.href = scheme; } catch { /* ignore */ }
    setTimeout(() => {
      if (!document.hidden && Date.now() - start < 2500) {
        window.open(fallback, '_blank', 'noopener');
      }
    }, 1200);
    onOpenChange(false);
  };

  const instagram = () => shareToApp('instagram://app', 'https://www.instagram.com/', 'Instagram');
  const tiktok = () => shareToApp('tiktok://', 'https://www.tiktok.com/', 'TikTok');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader>
          <SheetTitle className="font-heading text-center">Share</SheetTitle>
        </SheetHeader>
        <p className="text-sm text-muted-foreground text-center -mt-1 mb-4 truncate">{title}</p>
        <div className="grid grid-cols-3 gap-3">
          <ShareOption emoji="📸" label="Instagram" gradient="from-fuchsia-500 via-pink-500 to-amber-400" onClick={instagram} />
          <ShareOption emoji="🎵" label="TikTok" gradient="from-slate-800 to-black" onClick={tiktok} />
          <ShareOption emoji="🔗" label="Copy Link" gradient="from-slate-500 to-slate-700" onClick={async () => { await copyLink(); onOpenChange(false); }} />
        </div>
        {imageFile && (
          <button
            onClick={() => {
              const a = document.createElement('a');
              a.href = URL.createObjectURL(imageFile);
              a.download = 'ball-up-top-result.png';
              a.click();
              URL.revokeObjectURL(a.href);
              onOpenChange(false);
            }}
            className="w-full mt-3 h-12 rounded-full border border-input bg-transparent font-semibold inline-flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" /> Save Image
          </button>
        )}
        <button
          onClick={async () => { await shareSocial(); }}
          className="w-full mt-5 h-12 rounded-full bg-primary text-primary-foreground font-semibold inline-flex items-center justify-center gap-2"
        >
          <Share2 className="w-4 h-4" /> More options
        </button>
      </SheetContent>
    </Sheet>
  );
}

function ShareOption({ emoji, label, gradient, onClick }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2">
      <span className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} text-white text-2xl flex items-center justify-center shadow-sm`}>
        {emoji}
      </span>
      <span className="text-xs font-semibold">{label}</span>
    </button>
  );
}