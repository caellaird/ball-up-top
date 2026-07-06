import React, { useEffect, useState } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import PostComposer from '@/components/feed/PostComposer';
import PostCard from '@/components/feed/PostCard';

export default function CommunityDetail() {
  const { id } = useParams();
  const { user } = useOutletContext();
  const [community, setCommunity] = useState(null);
  const [isMember, setIsMember] = useState(false);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    load();
  }, [id]);

  const load = async () => {
    const c = await base44.entities.Community.get(id);
    setCommunity(c);
    const members = await base44.entities.CommunityMember.filter({ community_id: id });
    setIsMember(members.some((m) => m.created_by_id === user.id));
    const p = await base44.entities.Post.filter({ community_id: id }, '-created_date');
    setPosts(p);
  };

  const join = async () => {
    await base44.entities.CommunityMember.create({ community_id: id });
    const updated = await base44.entities.Community.update(id, { member_count: (community.member_count || 0) + 1 });
    setCommunity(updated);
    setIsMember(true);
  };

  const addPost = async (post) => {
    const updated = await base44.entities.Post.update(post.id, { community_id: id });
    setPosts([updated, ...posts]);
  };

  if (!community) return <div className="text-center text-muted-foreground py-10">Loading community...</div>;

  return (
    <div>
      <h1 className="font-heading text-2xl mb-1">{community.name}</h1>
      <p className="text-sm text-muted-foreground mb-4">{community.member_count} members{community.city ? ` · ${community.city}` : ''}</p>
      <p className="text-sm mb-4">{community.description}</p>
      {!isMember && <Button onClick={join} className="rounded-full mb-6">Join Community</Button>}
      {isMember && <PostComposer onPosted={addPost} />}
      {posts.map((p) => (
        <PostCard key={p.id} post={p} liked={false} onToggleLike={() => {}} />
      ))}
    </div>
  );
}