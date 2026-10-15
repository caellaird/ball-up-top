import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import SocialShareSheet from '@/components/shared/SocialShareSheet';
import StoryShareCard from '@/components/feed/StoryShareCard';

// Wraps the post share flow: renders a 9:16 story poster off-screen, captures it
// to a PNG with html2canvas, then hands the image + the rich share link to the
// existing SocialShareSheet (which shares the image file to Instagram/TikTok).
export default function PostShareSheet({ open, onOpenChange, post }) {
  const cardRef = useRef(null);
  const [imageFile, setImageFile] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!open) { setImageFile(null); setGenerating(false); return; }
    let cancelled = false;
    setGenerating(true);
    (async () => {
      try {
        if (document.fonts?.ready) { try { await document.fonts.ready; } catch {} }
        await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 60)));
        if (!cardRef.current) return;
        const canvas = await html2canvas(cardRef.current, {
          scale: 1,
          useCORS: true,
          backgroundColor: null,
          logging: false,
        });
        const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
        if (!cancelled && blob) setImageFile(new File([blob], 'ball-up-top-story.png', { type: 'image/png' }));
      } catch (e) {
        // image capture failed — share will fall back to link only
      } finally {
        if (!cancelled) setGenerating(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open]);

  const shareUrl = `${window.location.origin}/functions/postSharePage?post_id=${post.id}`;
  const title = post.highlight_title || `${post.author_name || 'Ball Up Top'} on Ball Up Top`;
  const text = post.score_text || post.body || '';

  return (
    <>
      {/* Off-screen capture target */}
      <div style={{ position: 'fixed', left: -99999, top: 0, zIndex: -1, pointerEvents: 'none' }} aria-hidden>
        <div ref={cardRef}>
          <StoryShareCard post={post} />
        </div>
      </div>

      {generating ? (
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent side="bottom" className="rounded-t-3xl">
            <SheetHeader>
              <SheetTitle className="font-heading text-center">Making your story…</SheetTitle>
            </SheetHeader>
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <SocialShareSheet
          open={open}
          onOpenChange={onOpenChange}
          title={title}
          text={text}
          url={shareUrl}
          imageFile={imageFile}
        />
      )}
    </>
  );
}