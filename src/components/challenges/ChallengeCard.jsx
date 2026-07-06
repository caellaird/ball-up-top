import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function ChallengeCard({ challenge }) {
  return (
    <Link to={`/challenges/${challenge.id}`} className="block bg-card border border-border rounded-xl p-4 mb-3 hover:shadow-md transition">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">{challenge.title}</h3>
        <Badge variant={challenge.status === 'active' ? 'default' : 'secondary'}>{challenge.status}</Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-2">{challenge.type.replace('_', ' ')}</p>
      <p className="text-xs text-muted-foreground">Ends {format(new Date(challenge.end_date), 'MMM d')}</p>
    </Link>
  );
}