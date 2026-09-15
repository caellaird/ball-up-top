import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { getOrCreateProfile } from '@/lib/ensureProfile';

export function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me()
      .then((u) => {
        setUser(u);
        // Populate the global avatar store with the current user's avatar so
        // every screen shows the live profile picture from app start.
        if (u) getOrCreateProfile(u).catch(() => {});
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return { user, loading };
}