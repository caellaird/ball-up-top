import React, { useState } from 'react';
import { Share2, Copy, Check } from 'lucide-react';

export default function ProfileQRCode({ username }) {
  const [copied, setCopied] = useState(false);
  const profileUrl = `${window.location.origin}/profile/${username}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(profileUrl)}`;

  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title: `@${username} on Ball Up Top`, url: profileUrl });
    } else {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="mt-6 bg-card rounded-2xl shadow-sm p-4 text-center">
      <h3 className="font-heading font-bold mb-3">My QR Code</h3>
      <img src={qrSrc} alt="Profile QR code" className="w-40 h-40 mx-auto rounded-xl border border-border" />
      <p className="text-xs text-muted-foreground mt-2">Friends can scan this to open your profile and add you.</p>
      <button onClick={share} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
        {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
        {copied ? 'Link Copied' : 'Share Profile Link'}
      </button>
    </div>
  );
}