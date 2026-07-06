import React from 'react';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';

export default function CommunityCard({ community }) {
  return (
    <Link to={`/communities/${community.id}`} className="block bg-card border border-border rounded-xl p-4 mb-3 hover:shadow-md transition">
      <h3 className="font-semibold mb-1">{community.name}</h3>
      <p className="text-sm text-muted-foreground mb-2">{community.description}</p>
      <span className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="w-3.5 h-3.5" />{community.member_count} members</span>
    </Link>
  );
}