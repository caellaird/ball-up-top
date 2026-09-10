import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trophy } from 'lucide-react';

const BOARDS = {
  ball_knower_points: { label: 'Ball Knower', suffix: 'pts' },
  games_won: { label: 'Games Won', suffix: 'W' },
  challenge_wins: { label: 'Challenges', suffix: 'W' },
  ball_knower_streak: { label: 'Streaks', suffix: '🔥' },
};

export default function PublicLeaderboard() {
  const { sport } = useParams();
  const board = BOARDS[sport] || BOARDS.ball_knower_points;
  const [stats, setStats] = useState(null);

  useEffect(() => {
    base44.entities.UserStats.list(`-${sport}`, 20)
      .then((rows) => setStats(rows.filter((s) => (s[sport] || 0) > 0)))
      .catch(() => setStats([]));
  }, [sport]);

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <div className="sticky top-0 safe-top bg-background/95 backdrop-blur border-b border-border z-10">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">Back</Link>
          <span className="font-heading font-semibold text-sm">Ball Up Top</span>
          <Link to="/register" className="text-sm font-semibold text-primary">Sign up</Link>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 pb-28">
        {/* Title */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-full brand-gradient mx-auto flex items-center justify-center mb-3 arena-shadow">
            <Trophy className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-heading text-2xl font-bold">{board.label} Leaderboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Top 20 players on Ball Up Top</p>
        </div>

        {/* Board switcher */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-5">
          {Object.entries(BOARDS).map(([key, b]) => (
            <Link
              key={key}
              to={`/leaderboard/${key}`}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                key === sport ? 'brand-gradient text-white' : 'bg-muted text-muted-foreground'
              }`}
            >
              {b.label}
            </Link>
          ))}
        </div>

        {/* Leaderboard list */}
        {stats === null ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 animate-pulse">
                <div className="w-6 h-4 bg-muted rounded" />
                <div className="w-8 h-8 bg-muted rounded-full" />
                <div className="flex-1 h-4 bg-muted rounded" />
                <div className="w-8 h-4 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : stats.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-sm">No players ranked yet.</p>
            <p className="text-muted-foreground text-sm">Be the first to claim the top spot!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {stats.map((s, i) => (
              <div
                key={s.id}
                className={`flex items-center justify-between rounded-xl p-3 border ${
                  i < 3 ? 'bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20' : 'bg-card border-border'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-7 text-center font-heading font-bold ${i < 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                    {i + 1}
                  </span>
                  <Avatar className="w-9 h-9">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {s.user_name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm">{s.user_name || 'Player'}</span>
                </div>
                <span className="font-heading font-bold text-sm">
                  {s[sport] || 0}
                  <span className="text-xs text-muted-foreground font-normal ml-1">{board.suffix}</span>
                </span>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-8 rounded-2xl brand-gradient p-6 text-center text-white arena-shadow">
          <h2 className="font-heading text-lg font-bold mb-1">Think you can climb?</h2>
          <p className="text-sm text-white/90 mb-4">Join Ball Up Top, challenge players near you, and claim your rank.</p>
          <Link
            to="/register"
            className="inline-flex items-center justify-center h-11 px-6 rounded-full bg-white text-primary font-heading font-bold text-sm"
          >
            Join Ball Up Top
          </Link>
        </div>
      </div>
    </div>
  );
}