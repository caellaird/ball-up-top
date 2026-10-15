import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Share2, Download, Copy, X } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { LOGO_URL } from '@/lib/constants';
import { getAwardMeta, RARITY_STYLES } from '@/lib/awards';
import { saveImageToDevice, copyToClipboard } from '@/lib/shareImage';

const APP_URL = 'https://ball-up-pro.base44.app';

// Branded achievement card rendered with inline styles for reliable html2canvas
// capture across light/dark themes. forwardRef so the parent can snapshot it.
const AchievementCard = React.forwardRef(({ award, ownerName, ownerUsername }, ref) => {
  const meta = getAwardMeta(award.type);
  const rarityStyle = RARITY_STYLES[meta.rarity] || RARITY_STYLES.Common;

  return (
    <div ref={ref} style={{
      width: '100%',
      maxWidth: '360px',
      boxSizing: 'border-box',
      padding: '36px 24px 28px',
      borderRadius: '28px',
      background: 'linear-gradient(135deg, #0EA5E9 0%, #EF4444 100%)',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      fontFamily: 'Inter, sans-serif',
      boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <img src={LOGO_URL} alt="Ball Up Top" crossOrigin="anonymous" style={{ width: '30px', height: '30px', borderRadius: '8px' }} />
        <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '17px', letterSpacing: '-0.02em' }}>Ball Up Top</span>
      </div>

      <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.15em', opacity: 0.8, marginTop: '20px', textTransform: 'uppercase' }}>Achievement Unlocked</span>

      {/* Award emoji in a glowing circle */}
      <div style={{
        width: '96px', height: '96px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '48px', marginTop: '16px',
        border: '3px solid rgba(255,255,255,0.3)',
      }}>
        {meta.emoji}
      </div>

      <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '22px', marginTop: '16px', textAlign: 'center' }}>{award.type}</span>

      {/* Rarity pill */}
      <span style={{
        fontSize: '12px', fontWeight: 700, padding: '4px 14px', borderRadius: '999px',
        background: rarityStyle.bg, color: '#ffffff', border: `1px solid ${rarityStyle.border}`,
        marginTop: '10px', letterSpacing: '0.05em', textTransform: 'uppercase',
      }}>
        {meta.rarity}
      </span>

      {/* Player */}
      <div style={{ width: '100%', marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.25)', paddingTop: '16px', textAlign: 'center' }}>
        <span style={{ fontSize: '15px', fontWeight: 600 }}>{ownerName}</span>
        {ownerUsername && <span style={{ fontSize: '13px', opacity: 0.75, display: 'block', marginTop: '2px' }}>@{ownerUsername}</span>}
      </div>

      {award.awarded_by_name && (
        <span style={{ fontSize: '12px', opacity: 0.7, marginTop: '12px' }}>Awarded by {award.awarded_by_name}</span>
      )}
    </div>
  );
});
AchievementCard.displayName = 'AchievementCard';

export default function AchievementShareCard({ open, onOpenChange, award, ownerId, ownerName, ownerUsername }) {
  const cardRef = useRef(null);
  const [generating, setGenerating] = useState(false);

  if (!award) return null;

  const shareLink = `${APP_URL}/award/${award.id}?user=${ownerId || ''}`;
  const shareMessage = `I just unlocked the "${award.type}" achievement on Ball Up Top. Think you can match it? ${shareLink}`;

  const captureCard = async () => {
    if (!cardRef.current) return null;
    const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: null, useCORS: true });
    return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'));
  };

  const handleDownload = async () => {
    setGenerating(true);
    try {
      const blob = await captureCard();
      if (!blob) return;
      await saveImageToDevice(new File([blob], 'ball-up-top-achievement.png', { type: 'image/png' }), 'ball-up-top-achievement.png');
      toast.success('Saved achievement card');
    } catch (e) {
      if (e?.name !== 'AbortError') toast.error('Couldn’t save image');
    }
    setGenerating(false);
  };

  const handleCopy = async () => {
    const ok = await copyToClipboard(shareMessage);
    toast.success(ok ? 'Message copied' : 'Couldn’t copy');
  };

  const handleShare = async () => {
    setGenerating(true);
    try {
      const blob = await captureCard();
      const imageFile = blob ? new File([blob], 'achievement.png', { type: 'image/png' }) : null;
      const canShareFiles = imageFile && typeof navigator.canShare === 'function' && navigator.canShare({ files: [imageFile] });
      const data = { title: 'Ball Up Top Achievement', text: shareMessage, url: shareLink };
      if (canShareFiles) data.files = [imageFile];
      if (navigator.share) {
        await navigator.share(data);
      } else {
        await navigator.clipboard.writeText(shareMessage);
        toast.success('Message copied');
      }
    } catch { /* user cancelled */ }
    setGenerating(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px] p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Flex Achievement</DialogTitle>
        </DialogHeader>
        <button onClick={() => onOpenChange(false)} className="absolute right-3 top-3 z-10 p-1.5 rounded-full hover:bg-muted">
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center pt-6 pb-5 px-4 bg-muted/30">
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <AchievementCard ref={cardRef} award={award} ownerName={ownerName} ownerUsername={ownerUsername} />
          </div>

          <div className="w-full mt-5 space-y-2">
            <Button onClick={handleShare} disabled={generating} className="w-full rounded-full h-11">
              <Share2 className="w-4 h-4 mr-1.5" /> {generating ? 'Preparing...' : 'Share'}
            </Button>
            <div className="flex gap-2">
              <Button onClick={handleCopy} variant="outline" className="flex-1 rounded-full h-11">
                <Copy className="w-4 h-4 mr-1.5" /> Copy
              </Button>
              <Button onClick={handleDownload} disabled={generating} variant="outline" className="flex-1 rounded-full h-11">
                <Download className="w-4 h-4 mr-1.5" /> Save
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}