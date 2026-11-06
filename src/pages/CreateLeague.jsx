import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import Header from '@/components/layout/Header';
import PlayerPicker from '@/components/leagues/PlayerPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SPORTS } from '@/lib/constants';
import { sendNotification } from '@/lib/notify';
import { getOrCreateProfile } from '@/lib/ensureProfile';

const LEAGUE_SPORTS = SPORTS.filter((s) => s.key !== 'custom');

let sessionKey = 0;
const blankSession = () => ({ key: ++sessionKey, start_time: '', note: '' });

export default function CreateLeague() {
  const { user } = useOutletContext();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [sport, setSport] = useState('basketball');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [players, setPlayers] = useState([]);
  const [sessions, setSessions] = useState([blankSession()]);
  const [saving, setSaving] = useState(false);

  const setSession = (key, patch) => {
    setSessions((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  };

  const save = async () => {
    setSaving(true);
    try {
      const profile = await getOrCreateProfile(user);
      const league = await base44.entities.League.create({
        name: name.trim(),
        sport,
        description: description.trim() || undefined,
        location_name: location.trim() || undefined,
        creator_name: user.full_name,
        members: [
          { user_id: user.id, name: user.full_name, avatar_url: profile?.avatar_url },
          ...players,
        ],
      });

      for (const s of sessions.filter((x) => x.start_time)) {
        await base44.entities.LeagueSession.create({
          league_id: league.id,
          start_time: new Date(s.start_time).toISOString(),
          location_name: location.trim() || undefined,
          note: s.note.trim() || undefined,
        });
      }

      for (const p of players) {
        await sendNotification({
          userId: p.user_id,
          type: 'league_invite',
          actorName: user.full_name,
          title: `${user.full_name} added you to ${league.name}`,
          link: `/leagues/${league.id}`,
        });
      }

      navigate(`/leagues/${league.id}`, { replace: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-8">
      <Header title="New League" backFallback="/leagues" />

      <div className="px-4 pt-4 space-y-6">
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">League name</p>
          <Input
            placeholder="e.g. Tuesday Night Run"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 rounded-2xl"
          />
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">Sport</p>
          <div className="grid grid-cols-4 gap-2">
            {LEAGUE_SPORTS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setSport(s.key)}
                className={`rounded-2xl py-3 flex flex-col items-center gap-1 border-2 ${sport === s.key ? 'border-accent bg-accent/10' : 'border-border bg-card'}`}
              >
                <span className="text-xl">{s.emoji}</span>
                <span className="text-[10px] font-semibold text-center leading-tight">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">Description</p>
          <Textarea
            placeholder="What's this league about? Rules, vibe, who it's for..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-2xl min-h-[90px]"
          />
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">Where you play</p>
          <Input
            placeholder="e.g. Rockwood Court"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="h-12 rounded-2xl"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground">Players</p>
            {players.length > 0 && <p className="text-xs font-semibold text-primary">{players.length} added</p>}
          </div>
          <PlayerPicker user={user} selected={players} onChange={setPlayers} />
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">Times you're playing</p>
          <div className="space-y-2">
            {sessions.map((s) => (
              <div key={s.key} className="bg-card rounded-2xl p-3 shadow-sm space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    type="datetime-local"
                    value={s.start_time}
                    onChange={(e) => setSession(s.key, { start_time: e.target.value })}
                    className="h-11 rounded-xl"
                  />
                  {sessions.length > 1 && (
                    <button
                      type="button"
                      aria-label="Remove time"
                      onClick={() => setSessions((prev) => prev.filter((x) => x.key !== s.key))}
                      className="w-11 h-11 flex items-center justify-center rounded-xl text-muted-foreground shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <Input
                  placeholder="Note (optional)"
                  value={s.note}
                  onChange={(e) => setSession(s.key, { note: e.target.value })}
                  className="h-11 rounded-xl"
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setSessions((prev) => [...prev, blankSession()])}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary mt-3"
          >
            <Plus className="w-4 h-4" /> Add another time
          </button>
        </div>

        <Button
          onClick={save}
          disabled={!name.trim() || saving}
          className="w-full rounded-full h-12 font-bold"
        >
          {saving ? 'Creating...' : 'Create League'}
        </Button>
      </div>
    </div>
  );
}