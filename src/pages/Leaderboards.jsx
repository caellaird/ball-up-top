import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ExternalLink } from 'lucide-react';

const boards = [
  { key: 'ball_knower_points', label: 'Ball Knower' },
  { key: 'games_won', label: 'Games Won' },
  { key: 'challenge_wins', label: 'Challenges' },
  { key: 'ball_knower_streak', label: 'Streaks' },
];

export default function Leaderboards() {
  const [stats, setStats] = useState([]);

  useEffect(() => {
    base44.entities.UserStats.list('-ball_knower_points', 100).then(setStats);
  }, []);

  return (
    <div>
      <h1 className="font-heading text-2xl mb-6">Leaderboards</h1>
      <Tabs defaultValue={boards[0].key}>
        <TabsList className="mb-4">
          {boards.map((b) => <TabsTrigger key={b.key} value={b.key}>{b.label}</TabsTrigger>)}
        </TabsList>
        {boards.map((b) => (
          <TabsContent key={b.key} value={b.key}>
            <div className="flex justify-end mb-2">
              <Link to={`/leaderboard/${b.key}`} className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                View public leaderboard <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {[...stats].sort((a, c) => (c[b.key] || 0) - (a[b.key] || 0)).slice(0, 20).map((s, i) => (
                <div key={s.id} className="flex items-center justify-between bg-card border border-border rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-sm font-semibold text-muted-foreground">#{i + 1}</span>
                    <Avatar className="w-8 h-8"><AvatarFallback>{s.user_name?.[0] || 'U'}</AvatarFallback></Avatar>
                    <span className="text-sm font-medium">{s.user_name || 'Player'}</span>
                  </div>
                  <span className="font-semibold">{s[b.key] || 0}</span>
                </div>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}