import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { UserPlus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getOrCreateProfile } from '@/lib/ensureProfile';
import TagFriendsSheet from '@/components/feed/TagFriendsSheet';
import HighlightComposerSheet from '@/components/feed/HighlightComposerSheet';
import { Star } from 'lucide-react';

export default function PostComposer({ onPosted }) {
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [userId, setUserId] = useState(null);
  const [tagged, setTagged] = useState([]);
  const [showTagSheet, setShowTagSheet] = useState(false);
  const [showHighlight, setShowHighlight] = useState(false);

  useEffect(() => {
    base44.auth.me().then((u) => setUserId(u.id));
  }, []);

  const submit = async () => {
    if (!body.trim()) return;
    setPosting(true);
    const user = await base44.auth.me();
    const profile = await getOrCreateProfile(user);
    const post = await base44.entities.Post.create({
      author_name: user.full_name,
      author_username: profile.username,
      author_avatar: profile.avatar_url,
      body,
      tagged_user_ids: tagged.map((t) => t.id),
      tagged_user_names: tagged.map((t) => t.name),
      tagged_usernames: tagged.map((t) => t.username),
    });
    setBody('');
    setTagged([]);
    setPosting(false);
    onPosted(post);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 mb-6">
      <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="What's on your court?" className="resize-none mb-3" rows={3} />

      <div className="flex items-center gap-3 mb-3">
        <button onClick={() => setShowTagSheet(true)} className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <UserPlus className="w-4 h-4" />
          {tagged.length > 0 ? `Tagged: ${tagged.map((t) => t.name).join(', ')}` : 'Tag Players'}
        </button>
        <button onClick={() => setShowHighlight(true)} className="flex items-center gap-1.5 text-xs font-semibold text-primary">
          <Star className="w-4 h-4" />
          Highlight Card
        </button>
      </div>

      <div className="flex justify-end">
        <Button onClick={submit} disabled={posting || !body.trim()} className="rounded-full">
          {posting ? 'Posting...' : 'Post'}
        </Button>
      </div>

      <TagFriendsSheet
        open={showTagSheet}
        onOpenChange={setShowTagSheet}
        userId={userId}
        initialSelected={tagged}
        onConfirm={setTagged}
      />

      <HighlightComposerSheet
        open={showHighlight}
        onOpenChange={setShowHighlight}
        onPosted={onPosted}
      />
    </div>
  );
}