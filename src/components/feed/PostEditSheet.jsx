import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { X } from 'lucide-react';

export default function PostEditSheet({ open, onOpenChange, post, onSaved }) {
  const [body, setBody] = useState('');
  const [scoreText, setScoreText] = useState('');
  const [mediaUrls, setMediaUrls] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && post) {
      setBody(post.body || '');
      setScoreText(post.score_text || '');
      setMediaUrls(post.media_urls || []);
    }
  }, [open, post]);

  const removePhoto = (url) => {
    setMediaUrls(mediaUrls.filter((u) => u !== url));
  };

  const save = async () => {
    setSaving(true);
    const updated = await base44.entities.Post.update(post.id, {
      body,
      score_text: scoreText,
      media_urls: mediaUrls,
      is_edited: true,
    });
    setSaving(false);
    onSaved(updated);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading">Edit Post</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Caption</label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} />
          </div>
          {post?.challenge_id && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Score Text</label>
              <Input value={scoreText} onChange={(e) => setScoreText(e.target.value)} />
            </div>
          )}
          {mediaUrls.length > 0 && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Photos (tap to remove)</label>
              <div className="flex flex-wrap gap-2">
                {mediaUrls.map((url) => (
                  <button key={url} onClick={() => removePhoto(url)} className="relative">
                    <img src={url} alt="" className="w-16 h-16 rounded-xl object-cover" />
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center">
                      <X className="w-3 h-3" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <Button onClick={save} disabled={saving} className="w-full rounded-full h-12">
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}