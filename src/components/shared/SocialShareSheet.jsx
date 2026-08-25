import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';

// Bottom sheet that lets users share an event/result to Instagram, TikTok, or
// copy the link. Instagram/TikTok open the OS share sheet (where those apps
// appear if installed); Copy Link writes the URL to the clipboard.
export default function SocialShareSheet({ open, onOpenChange, title, text, url }) {
  const data = { title: title || 'Ball Up Top', text, url };

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
    if (!ok) await copyLink();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader>
          <SheetTitle className="font-heading text-center">Share</SheetTitle>
        </SheetHeader>
        <p className="text-sm text-muted-foreground text-center -mt-1 mb-4 truncate">{title}</p>
        <div className="grid grid-cols-3 gap-3">
          <ShareOption emoji="📸" label="Instagram" gradient="from-fuchsia-500 via-pink-500 to-amber-400" onClick={shareSocial} />
          <ShareOption emoji="🎵" label="TikTok" gradient="from-slate-800 to-black" onClick={shareSocial} />
          <ShareOption emoji="🔗" label="Copy Link" gradient="from-slate-500 to-slate-700" onClick={async () => { await copyLink(); onOpenChange(false); }} />
        </div>
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