import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import SocialShareSheet from '@/components/shared/SocialShareSheet';
import { buildStoryImage } from '@/lib/storyImage';

// Post share flow: builds a 9:16 scorecard story image (Canvas 2D, reliable),
// then hands the image + the rich share link to the shared social share sheet.
// The Instagram option there shares the image file via navigator.share, which
// on mobile opens Instagram's Story composer with the image attached.
export default function PostShareSheet({ open, onOpenChange, post }) {
  const [imageFile, setImageFile] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!open) { setImageFile(null); setGenerating(false); return; }
    let cancelled = false;
    setGenerating(true);
    (async () => {
      try {
        const file = await buildStoryImage(post);
        if (!cancelled) setImageFile(file);
      } catch {
        /* leave imageFile null — share falls back to link */
      }
      if (!cancelled) setGenerating(false);
    })();
    return () => { cancelled = true; };
  }, [open]);

  const shareUrl = `${window.location.origin}/functions/postSharePage?post_id=${post.id}`;
  const title = post.highlight_title || `${post.author_name || 'Ball Up Top'} on Ball Up Top`;
  const text = post.score_text || post.body || '';

  if (generating) {
    return (
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
    );
  }

  return (
    <SocialShareSheet open={open} onOpenChange={onOpenChange} title={title} text={text} url={shareUrl} imageFile={imageFile} minimal />
  );
}