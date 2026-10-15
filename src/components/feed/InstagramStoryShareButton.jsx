import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { Instagram, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import StoryShareCard from '@/components/feed/StoryShareCard';

// One-tap "share my scorecard to an Instagram Story" button.
// On tap it renders a 9:16 poster off-screen, captures it to a PNG, then opens
// Instagram's Story editor directly (instagram-stories:// deep link) with the
// image as the background. Falls back to the native share sheet (image file)
// and finally to a download for desktop browsers.
export default function InstagramStoryShareButton({ post, className = '' }) {
  const cardRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [staged, setStaged] = useState(0);

  useEffect(() => {
    if (!staged) return;
    let cancelled = false;

    (async () => {
      try {
        if (document.fonts?.ready) { try { await document.fonts.ready; } catch {} }
        await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 60)));
        if (!cardRef.current) return;

        // Wait for the poster's images to load before capturing.
        const imgs = [...cardRef.current.querySelectorAll('img')];
        await Promise.race([
          Promise.all(imgs.map((img) =>
            img.complete ? Promise.resolve() : new Promise((res) => {
              img.addEventListener('load', res, { once: true });
              img.addEventListener('error', res, { once: true });
            })
          )),
          new Promise((res) => setTimeout(res, 3000)),
        ]);
        if (cancelled) return;

        const canvas = await html2canvas(cardRef.current, {
          scale: 1, useCORS: true, backgroundColor: null, logging: false,
        });
        if (cancelled) return;

        const dataUrl = canvas.toDataURL('image/png');
        const b64 = dataUrl.split(',')[1];
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], 'ball-up-top-story.png', { type: 'image/png' });

        // 1) Direct Instagram Story deep link (mobile with the IG app installed).
        const scheme = `instagram-stories://share?source_application=Ball%20Up%20Top&background_image=${encodeURIComponent(b64)}`;
        const start = Date.now();
        try { window.location.href = scheme; } catch {}

        setTimeout(() => {
          if (cancelled) return;
          const opened = document.hidden || Date.now() - start >= 2500;
          if (opened) { toast.success('Opening Instagram…'); return; }
          // 2) Fallback: native share sheet carrying the image file (routes to IG Story on mobile).
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator.share({ files: [file], title: post.highlight_title || 'Ball Up Top' }).catch(() => {});
            return;
          }
          // 3) Desktop: download the image so the user can post it manually.
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = 'ball-up-top-story.png';
          a.click();
          toast.success('Saved — open Instagram to post to your story');
        }, 1200);
      } catch (e) {
        if (!cancelled) toast.error('Couldn’t build the story image');
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();

    return () => { cancelled = true; };
  }, [staged]);

  const handle = () => {
    if (busy) return;
    setBusy(true);
    setStaged((s) => s + 1);
  };

  return (
    <>
      <button
        onClick={handle}
        disabled={busy}
        className={`inline-flex items-center justify-center gap-2 h-9 px-4 rounded-full text-sm font-semibold text-white shadow-sm active:scale-[0.97] transition disabled:opacity-70 bg-gradient-to-br from-fuchsia-500 via-pink-500 to-amber-400 ${className}`}
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Instagram className="w-4 h-4" />}
        {busy ? 'Preparing…' : 'Share to Story'}
      </button>

      {staged > 0 && (
        <div style={{ position: 'fixed', left: -99999, top: 0, zIndex: -1, pointerEvents: 'none' }} aria-hidden>
          <div ref={cardRef}>
            <StoryShareCard post={post} />
          </div>
        </div>
      )}
    </>
  );
}