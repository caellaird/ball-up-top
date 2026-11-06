import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ImagePlus, X, Users } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { base44 } from '@/api/base44Client';
import { getOrCreateProfile } from '@/lib/ensureProfile';
import { getSportDisplay } from '@/lib/constants';

export default function RecapPostSheet({ open, onOpenChange, league, session, attendees, onPosted }) {
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [posted, setPosted] = useState(false);

  useEffect(() => {
    if (open) {
      setBody('');
      setImageUrl('');
      setPosted(false);
      setSaving(false);
    }
  }, [open]);

  const uploadImage = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      setImageUrl(file_url);
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const user = await base44.auth.me();
      const profile = await getOrCreateProfile(user);
      const sport = getSportDisplay(league);
      const post = await base44.entities.Post.create({
        author_name: user.full_name,
        author_username: profile.username,
        author_avatar: profile.avatar_url,
        body: body.trim() || `Recap: ${league.name}`,
        media_urls: imageUrl ? [imageUrl] : undefined,
        location_name: session.location_name || league.location_name || undefined,
        sport_label: sport.label,
        game_emoji: sport.emoji,
        highlight_title: league.name,
        tagged_user_ids: attendees.map((a) => a.user_id),
        tagged_user_names: attendees.map((a) => a.user_name),
      });
      setPosted(true);
      onPosted?.(post);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left font-heading">Post a recap</SheetTitle>
        </SheetHeader>

        {!posted ? (
          <div className="pt-2 pb-6">
            <p className="text-xs text-muted-foreground">
              {league.name}
              {session?.start_time ? ` · ${format(new Date(session.start_time), 'EEEE, MMM d')}` : ''}
            </p>

            <div className="mt-4 rounded-2xl border border-border p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Users className="w-3.5 h-3.5" />
                {attendees.length > 0
                  ? `${attendees.length} ${attendees.length === 1 ? 'player' : 'players'} tagged in this recap`
                  : 'No one marked going — everyone in the league will still see it'}
              </p>
              {attendees.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {attendees.map((a) => (
                    <span key={a.user_id} className="flex items-center gap-1.5 rounded-full bg-muted pl-1 pr-2 py-0.5">
                      <Avatar className="w-5 h-5">
                        <AvatarImage src={a.user_avatar} />
                        <AvatarFallback className="text-[9px]">{a.user_name?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                      <span className="text-[11px] font-semibold truncate max-w-[110px]">{a.user_name}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="How did it go? Say something about the run..."
              className="resize-none mt-3"
              rows={4}
            />

            {imageUrl ? (
              <div className="relative mt-3 rounded-2xl overflow-hidden">
                <img src={imageUrl} alt="Recap" className="w-full max-h-56 object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  aria-label="Remove photo"
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="mt-3 flex items-center justify-center gap-2 h-11 rounded-xl border border-dashed border-border text-xs font-semibold text-muted-foreground cursor-pointer">
                <ImagePlus className="w-4 h-4" />
                {uploading ? 'Uploading...' : 'Add a photo'}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={uploading}
                  onChange={(e) => uploadImage(e.target.files?.[0])}
                />
              </label>
            )}

            <Button onClick={submit} disabled={saving || uploading} className="w-full rounded-full mt-4">
              {saving ? 'Posting...' : 'Post recap'}
            </Button>
          </div>
        ) : (
          <div className="pt-4 pb-6 text-center">
            <p className="font-heading font-bold">Recap posted</p>
            <p className="text-sm text-muted-foreground mt-1">
              {attendees.length > 0
                ? `Everyone who came is tagged — it's on the feed now.`
                : `It's on the feed now.`}
            </p>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-full mt-4 px-6">
              Done
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}