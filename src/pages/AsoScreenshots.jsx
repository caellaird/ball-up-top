import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocateFixed, MapPin, Trophy, Flame, Check, Users, Calendar } from 'lucide-react';
import { LOGO_URL, SPORT_EMOJI, SPORT_PIN_COLOR, SPORTS } from '@/lib/constants';

// iPhone 15 Pro Max screenshot resolution for App Store submission.
const W = 1290;
const H = 2796;

// Venice Beach basketball courts — a recognizable, photogenic map area.
const CENTER = [33.9850, -118.4695];

const MOCK_EVENTS = [
  { id: 'e1', competition_type: 'basketball', latitude: 33.9878, longitude: -118.4728, accepted_count: 8 },
  { id: 'e2', competition_type: 'pickleball', latitude: 33.9830, longitude: -118.4672, accepted_count: 4 },
  { id: 'e3', competition_type: 'darts', latitude: 33.9862, longitude: -118.4652, accepted_count: 3 },
  { id: 'e4', competition_type: 'disc_golf', latitude: 33.9815, longitude: -118.4718, accepted_count: 6 },
  { id: 'e5', competition_type: 'cornhole', latitude: 33.9898, longitude: -118.4698, accepted_count: 5 },
  { id: 'e6', competition_type: 'golf', latitude: 33.9840, longitude: -118.4755, accepted_count: 2 },
  { id: 'e7', competition_type: 'trivia', latitude: 33.9805, longitude: -118.4682, accepted_count: 12 },
  { id: 'e8', competition_type: 'basketball', latitude: 33.9908, longitude: -118.4738, accepted_count: 10 },
  { id: 'e9', competition_type: 'chugging', latitude: 33.9825, longitude: -118.4740, accepted_count: 7 },
  { id: 'e10', competition_type: 'pickleball', latitude: 33.9790, longitude: -118.4710, accepted_count: 3 },
];

const userIcon = L.divIcon({
  className: 'user-loc-icon',
  html: `<div style="width:22px;height:22px;border-radius:50%;background:hsl(25 100% 50%);border:4px solid #fff;box-shadow:0 0 0 6px hsl(25 100% 50% / .25);"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function eventIcon(event) {
  const emoji = SPORT_EMOJI[event.competition_type] || '🏆';
  const count = event.accepted_count || 0;
  const channels = SPORT_PIN_COLOR[event.competition_type] || SPORT_PIN_COLOR.custom;
  const ring = `hsl(${channels})`;
  const glow = `hsl(${channels} / .3)`;
  const badge = `hsl(${channels})`;
  return L.divIcon({
    className: 'event-marker',
    html: `<div style="position:relative;width:58px;height:58px;display:flex;align-items:center;justify-content:center;background:#fff;border:4px solid ${ring};border-radius:50%;box-shadow:0 3px 10px rgba(0,0,0,.25),0 0 0 6px ${glow};font-size:28px;line-height:1;">${emoji}<span style="position:absolute;top:-8px;right:-8px;min-width:24px;height:24px;padding:0 6px;background:${badge};color:#fff;font-size:14px;font-weight:700;border-radius:12px;display:flex;align-items:center;justify-content:center;border:2px solid #fff;">${count}</span></div>`,
    iconSize: [58, 58],
    iconAnchor: [29, 29],
  });
}

function MapBackground({ dimmed }) {
  return (
    <MapContainer
      center={CENTER}
      zoom={14}
      zoomControl={false}
      attributionControl={false}
      className="absolute inset-0"
      style={{ filter: dimmed ? 'brightness(.6) saturate(.7)' : 'none' }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={CENTER} icon={userIcon} />
      <Circle center={CENTER} radius={804} pathOptions={{ color: 'hsl(25 100% 50%)', weight: 2, fillColor: 'hsl(25 100% 50%)', fillOpacity: 0.06 }} />
      {MOCK_EVENTS.map((e) => (
        <Marker key={e.id} position={[e.latitude, e.longitude]} icon={eventIcon(e)} />
      ))}
    </MapContainer>
  );
}

function GlassHeader() {
  return (
    <div className="absolute top-0 left-0 right-0 z-[500] px-12 pt-[5rem]">
      <div className="flex items-center justify-between h-20 px-8 rounded-full border border-white/40 bg-white/80 backdrop-blur-2xl shadow-lg">
        <div className="flex items-center gap-4">
          <img src={LOGO_URL} alt="Ball Up Top" className="w-14 h-14 rounded-2xl" />
          <span className="font-extrabold text-3xl text-slate-900" style={{ fontFamily: 'Sora, sans-serif' }}>Ball Up Top</span>
        </div>
      </div>
    </div>
  );
}

function SportFilterChips() {
  const chips = SPORTS.filter(s => s.key !== 'custom').slice(0, 6);
  return (
    <div className="absolute top-[10.5rem] left-0 right-0 z-[500] px-12">
      <div className="flex gap-3 overflow-hidden">
        {chips.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2 h-14 px-6 rounded-full bg-white/85 backdrop-blur-xl border border-white/50 shadow-md">
            <span className="text-2xl">{s.emoji}</span>
            <span className="font-semibold text-lg text-slate-800">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecenterButton() {
  return (
    <div className="absolute right-12 top-[10.5rem] z-[500] w-16 h-16 rounded-full bg-white/85 backdrop-blur-xl border border-white/50 shadow-lg flex items-center justify-center">
      <LocateFixed className="w-7 h-7 text-blue-500" />
    </div>
  );
}

function HeadlineOverlay({ title, subtitle }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-[500] pb-[7rem] px-12">
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      <div className="relative">
        <h1 className="text-white font-extrabold leading-[1.05] mb-4" style={{ fontFamily: 'Sora, sans-serif', fontSize: '5.5rem', textShadow: '0 4px 24px rgba(0,0,0,.5)' }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-white/90 font-medium" style={{ fontFamily: 'Inter, sans-serif', fontSize: '2rem', textShadow: '0 2px 12px rgba(0,0,0,.5)' }}>
            {subtitle}
          </p>
        )}
        <div className="mt-8 inline-flex items-center gap-3 h-16 px-10 rounded-full brand-gradient text-white shadow-2xl">
          <span className="font-bold text-2xl" style={{ fontFamily: 'Sora, sans-serif' }}>Find a Game</span>
        </div>
      </div>
    </div>
  );
}

// Variant 2: challenge flow mock card
function ChallengeFlowCard() {
  const sportGrid = SPORTS.filter(s => s.key !== 'custom').slice(0, 6);
  return (
    <div className="absolute left-0 right-0 bottom-0 z-[500] px-12 pb-[6rem]">
      <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200">
        {/* Sport picker */}
        <div className="p-10 pb-6">
          <p className="font-bold text-slate-400 text-xl mb-5 uppercase tracking-wider">Pick your sport</p>
          <div className="grid grid-cols-6 gap-4">
            {sportGrid.map((s, i) => (
              <div key={s.key} className={`flex flex-col items-center justify-center gap-2 aspect-square rounded-2xl border-2 ${i === 0 ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}>
                <span className="text-4xl">{s.emoji}</span>
                <span className="text-sm font-semibold text-slate-600">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Opponent */}
        <div className="px-10 pb-6">
          <p className="font-bold text-slate-400 text-xl mb-4 uppercase tracking-wider">Opponent</p>
          <div className="flex items-center gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="w-16 h-16 rounded-full brand-gradient flex items-center justify-center text-white font-bold text-2xl">M</div>
            <div className="flex-1">
              <p className="font-bold text-2xl text-slate-900">Marcus K.</p>
              <p className="text-lg text-slate-500">@marcushoops</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
              <Check className="w-6 h-6 text-white" strokeWidth={3} />
            </div>
          </div>
        </div>

        {/* Series + Location */}
        <div className="px-10 pb-8 flex gap-4">
          <div className="flex-1 flex items-center gap-3 p-5 rounded-2xl bg-slate-50 border border-slate-200">
            <Trophy className="w-7 h-7 text-amber-500" />
            <div>
              <p className="text-sm text-slate-400 font-medium">Series</p>
              <p className="font-bold text-xl text-slate-900">Best of 3</p>
            </div>
          </div>
          <div className="flex-1 flex items-center gap-3 p-5 rounded-2xl bg-slate-50 border border-slate-200">
            <MapPin className="w-7 h-7 text-blue-500" />
            <div>
              <p className="text-sm text-slate-400 font-medium">Location</p>
              <p className="font-bold text-xl text-slate-900">Venice Courts</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="px-10 pb-10">
          <div className="h-20 brand-gradient rounded-2xl flex items-center justify-center shadow-xl">
            <span className="text-white font-extrabold text-3xl" style={{ fontFamily: 'Sora, sans-serif' }}>Ball Up Top</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function VariantOne() {
  return (
    <>
      <MapBackground dimmed={false} />
      <GlassHeader />
      <SportFilterChips />
      <RecenterButton />
      <HeadlineOverlay
        title="Find pickup games near you"
        subtitle="Real-time public competitions within 25 miles — basketball, pickleball, darts & more."
      />
    </>
  );
}

function VariantTwo() {
  return (
    <>
      <MapBackground dimmed />
      <GlassHeader />
      {/* Headline at top for variant 2 */}
      <div className="absolute top-[10.5rem] left-0 right-0 z-[500] px-12">
        <h1 className="text-white font-extrabold leading-[1.05]" style={{ fontFamily: 'Sora, sans-serif', fontSize: '5rem', textShadow: '0 4px 24px rgba(0,0,0,.7)' }}>
          Challenge anyone.<br />Track your rep.
        </h1>
      </div>
      <ChallengeFlowCard />
    </>
  );
}

export default function AsoScreenshots() {
  const [params] = useSearchParams();
  const variant = params.get('v') || '1';

  // Force light mode for consistent App Store assets.
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  return (
    <div
      className="relative overflow-hidden bg-white"
      style={{ width: `${W}px`, height: `${H}px` }}
    >
      {variant === '2' ? <VariantTwo /> : <VariantOne />}
    </div>
  );
}