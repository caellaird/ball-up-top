import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Share2, Download } from 'lucide-react';
import { toast } from 'sonner';
import {
  canShareFiles,
  hasNativeShare,
  copyToClipboard,
  saveImageToDevice,
  shareImageToApp,
} from '@/lib/shareImage';

// Bottom sheet that lets users share an event/result/post to Instagram,
// TikTok, copy the link, save the generated image to the device, or open the
// native share sheet. When an imageFile is attached, Instagram/TikTok/Save
// share the actual image (via the native share sheet), not just a URL.
export default function SocialShareSheet({ open, onOpenChange, title, text, url, imageFile }) {
  const close = () => onOpenChange(false);
  const linkTitle = title || 'Ball Up Top';

  const handleInstagram = async () => {
    try {
      await shareImageToApp(imageFile, {
        url,
        scheme: 'instagram://app',
        fallback: 'https://www.instagram.com/',
        label: 'Instagram',
      });
      close();
    } catch (e) {
      if (e?.name !== 'AbortError') toast.error('Couldn’t share to Instagram');
    }
  };

  const handleTiktok = async () => {
    try {
      await shareImageToApp(imageFile, {
        url,
        scheme: 'tiktok://',
        fallback: 'https://www.tiktok.com/',
        label: 'TikTok',
      });
      close();
    } catch (e) {
      if (e?.name !== 'AbortError') toast.error('Couldn’t share to TikTok');
    }
  };

  const handleCopy = async () => {
    const ok = await copyToClipboard(url);
    toast.success(ok ? 'Link copied' : 'Couldn’t copy link');
    close();
  };

  const handleSave = async () => {
    if (!imageFile) return;
    try {
      await saveImageToDevice(imageFile, 'ball-up-top-story.png');
      toast.success('Saved to your device');
      close();
    } catch (e) {
      if (e?.name !== 'AbortError') toast.error('Couldn’t save image');
    }
  };

  const handleMore = async () => {
    if (hasNativeShare()) {
      try {
        await navigator.share({ title: linkTitle, text, url });
        close();
      } catch (e) {
        if (e?.name !== 'AbortError') {
          const ok = await copyToClipboard(url);
          toast.success(ok ? 'Link copied' : 'Couldn’t copy');
          close();
        }
      }
    } else {
      const ok = await copyToClipboard(url);
      toast.success(ok ? 'Link copied' : 'Couldn’t copy');
      close();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader>
          <SheetTitle className="font-heading text-center">Share</SheetTitle>
        </SheetHeader>
        <p className="text-sm text-muted-foreground text-center -mt-1 mb-4 truncate">{title}</p>
        <div className="grid grid-cols-3 gap-3">
          <ShareOption emoji="📸" label="Instagram" gradient="from-fuchsia-500 via-pink-500 to-amber-400" onClick={handleInstagram} />
          <ShareOption emoji="🎵" label="TikTok" gradient="from-slate-800 to-black" onClick={handleTiktok} />
          <ShareOption emoji="🔗" label="Copy Link" gradient="from-slate-500 to-slate-700" onClick={handleCopy} />
        </div>
        {imageFile && (
          <button
            onClick={handleSave}
            className="w-full mt-3 h-12 rounded-full border border-input bg-transparent font-semibold inline-flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" /> Save Image
          </button>
        )}
        <button
          onClick={handleMore}
          className="w-full mt-5 h-12 rounded-full bg-primary text-primary-foreground font-semibold inline-flex items-center justify-center gap-2"
        >
          <Share2 className="w-4 h-4" /> More options
        </button>
        {imageFile && canShareFiles(imageFile) && (
          <p className="text-xs text-muted-foreground text-center mt-3">
            Instagram, TikTok & Save share the image. More options shares the link.
          </p>
        )}
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