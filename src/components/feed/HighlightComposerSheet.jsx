import React, { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X, ImagePlus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getOrCreateProfile } from '@/lib/ensureProfile';

const MAX_STATS = 3;

export default function HighlightComposerSheet({ open, onOpenChange, onPosted }) {
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState([{ label: '', value: '' }, { label: '', value: '' }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setTitle('');
      setCaption('');
      setImageUrl('');
      setStats([{ label: '', value: '' }, { label: '', value: '' }]);
      setError('');
    }
  }, [open]);

  const validStats = stats.filter((s) => s.label.trim() && s.value.trim());
  const canPost = title.trim() && imageUrl && validStats.length >= 1 && !uploading;

  const setStat = (i, field, val) => {
    setStats(stats.map((s, idx) => (idx === i ? { ...s, [field]: val } : s)));
  };

  const addStat = () => {
    if (stats.length < MAX_STATS) setStats([...stats, { label: '', value: '' }]);
  };

  const removeStat = (i) => {
    setStats(stats.filter((_, idx) => idx !== i));
  };

  const uploadImage = async (file) => {
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(file_url);
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!canPost) return;
    setSaving(true);
    try {
      const user = await base44.auth.me();
      const profile = await getOrCreateProfile(user);
      const post = await base44.entities.Post.create({
        author_name: user.full_name,
        author_username: profile.username,
        author_avatar: profile.avatar_url,
        body: caption.trim() || title.trim(),
        media_urls: [imageUrl],
        post_type: 'highlight_card',
        highlight_title: title.trim(),
        highlight_stats: validStats.map((s) => ({ label: s.label.trim(), value: s.value.trim() })),
      });
      onPosted?.(post);
      onOpenChange(false);
    } catch (e) {
      setError("Couldn't post your highlight. Tap Post Highlight to try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[92vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading">Highlight Card</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Event / League name</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Tuesday Night Hoops" />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Photo</label>
            {imageUrl ? (
              <div className="relative">
                <img src={imageUrl} alt="" className="w-full h-44 rounded-2xl object-cover" />
                <button
                  onClick={() => setImageUrl('')}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center"
                  aria-label="Remove photo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="w-full h-44 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground cursor-pointer gap-1">
                {uploading ? (
                  <span className="text-sm">Uploading...</span>
                ) : (
                  <>
                    <ImagePlus className="w-6 h-6" />
                    <span className="text-xs">Add a photo</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])}
                />
              </label>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-muted-foreground">Stats (1–{MAX_STATS})</label>
              {stats.length < MAX_STATS && (
                <button onClick={addStat} className="flex items-center gap-1 text-xs font-semibold text-primary">
                  <Plus className="w-3.5 h-3.5" /> Add stat
                </button>
              )}
            </div>
            <div className="space-y-2">
              {stats.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={s.label}
                    onChange={(e) => setStat(i, 'label', e.target.value)}
                    placeholder="Stat (e.g. Points)"
                    className="flex-1"
                  />
                  <Input
                    value={s.value}
                    onChange={(e) => setStat(i, 'value', e.target.value)}
                    placeholder="Value (e.g. 24)"
                    className="flex-1"
                  />
                  {stats.length > 1 && (
                    <button onClick={() => removeStat(i)} className="p-1.5 text-muted-foreground hover:text-destructive shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Caption (optional)</label>
            <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Say something about it..." rows={2} className="resize-none" />
          </div>

          {error && <p className="text-sm text-destructive text-center">{error}</p>}
          <Button onClick={submit} disabled={!canPost || saving} className="w-full rounded-full h-12">
            {saving ? 'Posting...' : 'Post Highlight'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}