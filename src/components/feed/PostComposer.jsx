import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { getOrCreateProfile } from '@/lib/ensureProfile';

export default function PostComposer({ onPosted }) {
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);

  const submit = async () => {
    if (!body.trim()) return;
    setPosting(true);
    const user = await base44.auth.me();
    const profile = await getOrCreateProfile(user);
    const post = await base44.entities.Post.create({ author_name: user.full_name, author_avatar: profile.avatar_url, body });
    setBody('');
    setPosting(false);
    onPosted(post);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 mb-6">
      <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="What's on your court?" className="resize-none mb-3" rows={3} />
      <div className="flex justify-end">
        <Button onClick={submit} disabled={posting || !body.trim()} className="rounded-full">
          {posting ? 'Posting...' : 'Post'}
        </Button>
      </div>
    </div>
  );
}