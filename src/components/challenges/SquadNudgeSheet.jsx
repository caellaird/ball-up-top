import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { buildFriendInviteUrl } from '@/lib/friendCodes';

// Post-game nudge shown once per completed challenge. Displays the user's
// friend-add QR code (same generation approach as QRCodeDialog) and a share
// button so they can invite their squad to the next game.
export default function SquadNudgeSheet({ open, onOpenChange, user }) {
  const [qrUrl, setQrUrl] = useState('');

  useEffect(() => {
    if (!open || !user?.id) { setQrUrl(''); return; }
    let active = true;
    const t = setTimeout(() => {
      QRCode.toDataURL(buildFriendInviteUrl(user.id), {
        width: 200,
        margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' },
      })
        .then((url) => { if (active) setQrUrl(url); })
        .catch(() => { if (active) setQrUrl(''); });
    }, 60);
    return () => { active = false; clearTimeout(t); };
  }, [open, user?.id]);

  const inviteUrl = user?.id ? buildFriendInviteUrl(user.id) : '';

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Add me on Ball Up Top',
          text: 'Bring your squad — add me on Ball Up Top and let’s ball! 🏀',
          url: inviteUrl,
        });
        onOpenChange(false);
        return;
      } catch { /* cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast.success('Invite link copied');
    } catch { toast.error('Couldn’t copy link'); }
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-w-[480px] mx-auto">
        <SheetHeader>
          <SheetTitle className="font-heading text-center">Bring your squad next time 🏀</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="bg-white p-3 rounded-2xl border border-border w-[220px] h-[220px] flex items-center justify-center">
            {qrUrl ? (
              <img src={qrUrl} alt="QR Code" className="w-[196px] h-[196px] block" />
            ) : (
              <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
            )}
          </div>
          <p className="text-sm text-muted-foreground text-center max-w-[280px]">
            Have a friend scan this to add you instantly, then challenge them to a game.
          </p>
          <Button onClick={handleShare} className="w-full rounded-full h-12">
            <Share2 className="w-4 h-4" /> Share Invite Link
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}