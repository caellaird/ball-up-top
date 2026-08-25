import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocateFixed } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getOrCreateProfile } from '@/lib/ensureProfile';
import { SPORT_EMOJI, SPORT_LABEL, SPORT_PIN_COLOR } from '@/lib/constants';
import { haversineMiles } from '@/lib/geo';
import EventDetailsSheet from './EventDetailsSheet';
import SportFilterBar from './SportFilterBar';

const userIcon = L.divIcon({
  className: 'user-loc-icon',
  html: `<div style="width:18px;height:18px;border-radius:50%;background:hsl(25 100% 50%);border:3px solid #fff;box-shadow:0 0 0 4px hsl(25 100% 50% / .25);"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function eventIcon(event) {
  const emoji = event.competition_type === 'custom'
    ? (event.custom_sport_emoji || '🏆')
    : (SPORT_EMOJI[event.competition_type] || '🏆');
  const count = event.accepted_count || 0;
  const channels = SPORT_PIN_COLOR[event.competition_type] || SPORT_PIN_COLOR.custom;
  const ring = `hsl(${channels})`;
  const glow = `hsl(${channels} / .3)`;
  const badge = `hsl(${channels})`;
  return L.divIcon({
    className: 'event-marker',
    html: `<div style="position:relative;width:46px;height:46px;display:flex;align-items:center;justify-content:center;background:#fff;border:3px solid ${ring};border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.25),0 0 0 5px ${glow};font-size:22px;line-height:1;">${emoji}<span style="position:absolute;top:-7px;right:-7px;min-width:19px;height:19px;padding:0 5px;background:${badge};color:#fff;font-size:11px;font-weight:700;border-radius:10px;display:flex;align-items:center;justify-content:center;border:2px solid #fff;">${count}</span></div>`,
    iconSize: [46, 46],
    iconAnchor: [23, 23],
  });
}

export default function ExploreMap({ user, onOpenChat, initialEventId }) {
  const [userPos, setUserPos] = useState(null);
  const [denied, setDenied] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [map, setMap] = useState(null);
  const [activeSports, setActiveSports] = useState(new Set());
  const lastFetchRef = useRef(null);

  const fetchEvents = async (lat, lng) => {
    try {
      const res = await base44.functions.invoke('getNearbyEvents', { latitude: lat, longitude: lng });
      setEvents(res.data.events || []);
    } catch (e) { /* ignore */ }
    setLoading(false);
  };

  const onLocated = async (lat, lng) => {
    setUserPos({ lat, lng });
    setDenied(false);
    try {
      const profile = await getOrCreateProfile(user);
      await base44.entities.Profile.update(profile.id, { last_lat: lat, last_lng: lng });
    } catch (e) { /* ignore */ }
    fetchEvents(lat, lng);
  };

  const requestLocation = () => {
    if (!navigator.geolocation) { setDenied(true); setLoading(false); return; }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => onLocated(pos.coords.latitude, pos.coords.longitude),
      () => { setDenied(true); setLoading(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => { requestLocation(); }, []);

  // Refresh events when the user moves more than a mile; don't fight the user's pans.
  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition((pos) => {
      const lat = pos.coords.latitude, lng = pos.coords.longitude;
      setUserPos((prev) => {
        const moved = prev ? haversineMiles(prev.lat, prev.lng, lat, lng) : 999;
        if (moved > 1) fetchEvents(lat, lng);
        return { lat, lng };
      });
    }, () => {}, { enableHighAccuracy: true, maximumAge: 30000 });
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // Real-time participant count + status updates.
  useEffect(() => {
    const unsub = base44.entities.PublicEvent.subscribe((event) => {
      const d = event?.data;
      if (!d) return;
      setEvents((prev) => prev.map((e) => (e.id === d.id ? { ...e, accepted_count: d.accepted_count ?? e.accepted_count, status: d.status ?? e.status } : e)));
      setSelected((s) => (s && s.id === d.id ? { ...s, accepted_count: d.accepted_count ?? s.accepted_count, status: d.status ?? s.status } : s));
    });
    return unsub;
  }, []);

  // Open event from a deep link (?event=) once events load.
  useEffect(() => {
    if (!initialEventId) return;
    const e = events.find((x) => x.id === initialEventId);
    if (e) setSelected(e);
  }, [initialEventId, events]);

  const visibleEvents = activeSports.size === 0
    ? events
    : events.filter((e) => activeSports.has(e.competition_type));

  const recenter = () => {
    if (userPos && map) map.flyTo([userPos.lat, userPos.lng], 13);
  };

  if (denied) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-center px-8 bg-muted/30">
        <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mb-4">
          <LocateFixed className="w-7 h-7 text-accent" />
        </div>
        <p className="font-heading font-bold text-lg mb-1">Location needed</p>
        <p className="text-sm text-muted-foreground mb-6">
          Explore uses your location to find public competitions near you. Enable location access to see nearby games.
        </p>
        <button onClick={requestLocation} className="px-6 h-11 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
          Enable Location
        </button>
      </div>
    );
  }

  if (!userPos) {
    return (
      <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
        Finding your location…
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <MapContainer center={[userPos.lat, userPos.lng]} zoom={13} zoomControl={false} ref={setMap} className="h-full w-full">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
        <Marker position={[userPos.lat, userPos.lng]} icon={userIcon} />
        {visibleEvents.map((e) => (
          <Marker key={e.id} position={[e.latitude, e.longitude]} icon={eventIcon(e)} eventHandlers={{ click: () => setSelected(e) }} />
        ))}
      </MapContainer>

      <SportFilterBar active={activeSports} onToggle={setActiveSports} />

      <button
        onClick={recenter}
        className="absolute right-4 top-20 z-[1000] w-11 h-11 rounded-full bg-background/80 backdrop-blur-xl border border-border/60 shadow-md flex items-center justify-center"
        aria-label="Recenter map"
      >
        <LocateFixed className="w-5 h-5 text-primary" />
      </button>

      {loading && (
        <div className="absolute left-1/2 -translate-x-1/2 top-5 z-[1000] px-4 py-2 rounded-full bg-background/80 backdrop-blur-xl border border-border/60 shadow-md text-xs font-medium">
          Finding nearby competitions…
        </div>
      )}
      {!loading && events.length === 0 && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-6 z-[1000] px-4 py-2.5 rounded-full bg-background/80 backdrop-blur-xl border border-border/60 shadow-md text-xs font-medium text-center">
          No nearby competitions yet.<br />Check back or create a public event.
        </div>
      )}

      <EventDetailsSheet
        event={selected}
        user={user}
        onClose={() => setSelected(null)}
        onOpenChat={onOpenChat}
      />
    </div>
  );
}