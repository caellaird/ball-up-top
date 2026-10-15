import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Share2, Download, Copy, X } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { base44 } from '@/api/base44Client';
import { LOGO_URL } from '@/lib/constants';
import { saveImageToDevice, copyToClipboard } from '@/lib/shareImage';

const APP_URL = 'https://ball-up-pro.base44.app';

// Branded rivalry card rendered with inline styles for reliable html2canvas
// capture across light/dark themes. forwardRef so the parent can snapshot it.
const RivalryCard = React.forwardRef(({ record, currentUser, profileOwner }, ref) => {
  const topSports = (record.bySport || []).slice(0, 3);
  const leading = record.myWins > record.theirWins;
  const trailing = record.myWins < record.theirWins;

  return (
    <div ref={ref} style={{
      width: '100%',
      maxWidth: '360px',
      boxSizing: 'border-box',
      padding: '32px 24px',
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

      <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.15em', opacity: 0.8, marginTop: '20px', textTransform: 'uppercase' }}>Rivalry</span>

      {/* Players + avatars */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '16px', width: '100%' }}>
        <PlayerSide name={currentUser.name} avatar={currentUser.avatar} wins={record.myWins} highlight={leading} />
        <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '22px', opacity: 0.7 }}>VS</span>
        <PlayerSide name={profileOwner.name} avatar={profileOwner.avatar} wins={record.theirWins} highlight={trailing} />
      </div>

      {record.draws > 0 && (
        <span style={{ fontSize: '13px', opacity: 0.85, marginTop: '12px' }}>🤝 {record.draws} Draw{record.draws !== 1 ? 's' : ''}</span>
      )}

      {/* Stat highlights */}
      {topSports.length > 0 && (
        <div style={{ width: '100%', marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.25)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {topSports.map((s) => (
            <div key={s.sport} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '14px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                <span style={{ fontSize: '16px' }}>{s.emoji}</span> {s.sport}
              </span>
              <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700 }}>
                {s.myWins}–{s.theirWins}{s.draws > 0 ? ` 🤝${s.draws}` : ''}
              </span>
            </div>
          ))}
        </div>
      )}

      <span style={{ fontSize: '12px', opacity: 0.7, marginTop: '16px' }}>{record.total} game{record.total !== 1 ? 's' : ''} played</span>
    </div>
  );
});
RivalryCard.displayName = 'RivalryCard';

function PlayerSide({ name, avatar, wins, highlight }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
      <div style={{
        width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden',
        border: highlight ? '3px solid #FFD700' : '3px solid rgba(255,255,255,0.4)',
        background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '24px', fontWeight: 700,
      }}>
        {avatar ? <img src={avatar} alt={name} crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (name?.[0] || '?')}
      </div>
      <span style={{ fontSize: '13px', fontWeight: 600, maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
      <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '24px' }}>{wins}</span>
      <span style={{ fontSize: '10px', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Wins</span>
    </div>
  );
}

export default function RivalryCardShare({ open, onOpenChange, record, currentUserId, currentUserName, profileOwnerId, profileOwnerName, profileOwnerAvatar, profileOwnerUsername }) {
  const cardRef = useRef(null);
  const [currentUserAvatar, setCurrentUserAvatar] = useState(null);
  const [currentUserUsername, setCurrentUserUsername] = useState('');
  const [generating, setGenerating] = useState(false);

  // Lazy-fetch the current user's profile (avatar + username) only when the modal opens.
  useEffect(() => {
    if (!open) return;
    base44.entities.Profile.filter({ created_by_id: currentUserId })
      .then((rows) => {
        const p = rows?.[0];
        if (p) {
          setCurrentUserAvatar(p.avatar_url || null);
          setCurrentUserUsername(p.username || '');
        }
      })
      .catch(() => {});
  }, [open, currentUserId]);

  const leading = record?.myWins > record?.theirWins;
  const tied = record?.myWins === record?.theirWins;
  const phrase = leading ? "I'm leading the series" : tied ? "We're tied" : "Time to settle the score";
  const shareMessage = `${phrase} on Ball Up Top. Settle the score: ${APP_URL}`;

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
      await saveImageToDevice(new File([blob], 'ball-up-top-rivalry.png', { type: 'image/png' }), 'ball-up-top-rivalry.png');
      toast.success('Saved rivalry card');
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
      const imageFile = blob ? new File([blob], 'rivalry.png', { type: 'image/png' }) : null;
      const canShareFiles = imageFile && typeof navigator.canShare === 'function' && navigator.canShare({ files: [imageFile] });
      const data = { title: 'Ball Up Top Rivalry', text: shareMessage, url: APP_URL };
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

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px] p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Share Rivalry Card</DialogTitle>
        </DialogHeader>
        <button onClick={() => onOpenChange(false)} className="absolute right-3 top-3 z-10 p-1.5 rounded-full hover:bg-muted">
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center pt-6 pb-5 px-4 bg-muted/30">
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <RivalryCard
              ref={cardRef}
              record={record}
              currentUser={{ name: currentUserName, avatar: currentUserAvatar, username: currentUserUsername }}
              profileOwner={{ name: profileOwnerName, avatar: profileOwnerAvatar, username: profileOwnerUsername }}
            />
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