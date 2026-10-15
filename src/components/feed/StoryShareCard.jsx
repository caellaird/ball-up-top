import React from 'react';

// A 9:16 (1080x1920) "poster" of a post, designed to be captured by html2canvas
// and shared to an Instagram Story. Uses inline styles so html2canvas renders it
// reliably, and a crossOrigin image so the captured canvas is not tainted.
export default function StoryShareCard({ post }) {
  const hasImage = !!(post.media_urls && post.media_urls[0]);
  const stats = (post.highlight_stats || []).filter((s) => s.label && s.value);
  const score = post.score_text || '';
  const body = post.body || '';
  const author = post.author_name || 'Ball Up Top';
  const initial = (author.charAt(0) || 'B').toUpperCase();

  const statsRow = stats.length
    ? stats.map((s) => `${s.value} ${s.label.toUpperCase()}`).join('   ·   ')
    : '';

  return (
    <div
      style={{
        width: 1080,
        height: 1920,
        position: 'relative',
        overflow: 'hidden',
        background: hasImage ? '#000' : 'linear-gradient(160deg, #0c1326 0%, #122247 55%, #1a3a6e 100%)',
        fontFamily: "'Inter','Sora',Helvetica,Arial,sans-serif",
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {hasImage && (
        <img
          src={post.media_urls[0]}
          crossOrigin="anonymous"
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
      {/* legibility gradient over the image */}
      {hasImage && (
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(8,12,24,0.96) 18%, rgba(8,12,24,0.35) 45%, rgba(8,12,24,0.15) 70%, rgba(8,12,24,0.45) 100%)',
          }}
        />
      )}

      {/* top: brand lockup */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16, padding: '64px 72px 0' }}>
        <div style={{ width: 64, height: 64, borderRadius: 999, background: 'linear-gradient(135deg,#1697f3,#ff5a5f)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 32, color: '#000' }}>B</div>
        <div style={{ fontWeight: 800, fontSize: 40, letterSpacing: -0.5 }}>Ball Up Top</div>
      </div>

      <div style={{ flex: 1 }} />

      {/* bottom content */}
      <div style={{ position: 'relative', padding: '0 72px 110px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, marginBottom: 40 }}>
          {/* Letter avatar — avoids canvas tainting from un-CORS-able avatar URLs. */}
          <div style={{ width: 92, height: 92, borderRadius: 999, background: 'rgba(255,255,255,0.16)', border: '3px solid rgba(255,255,255,0.85)', color: '#fff', fontWeight: 800, fontSize: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{initial}</div>
          <div style={{ fontWeight: 800, fontSize: 48 }}>{author}</div>
        </div>

        {score && !stats.length && (
          <div style={{ fontWeight: 800, fontSize: 76, lineHeight: 1.05, marginBottom: 28, textShadow: '0 2px 18px rgba(0,0,0,0.45)' }}>{score}</div>
        )}

        {stats.length > 0 && (
          <div style={{ display: 'flex', gap: 0, marginBottom: 36, borderRadius: 28, overflow: 'hidden', background: 'rgba(255,255,255,0.10)', border: '2px solid rgba(255,255,255,0.18)' }}>
            {stats.map((s, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', padding: '34px 10px', borderRight: i < stats.length - 1 ? '2px solid rgba(255,255,255,0.18)' : 'none' }}>
                <div style={{ fontWeight: 800, fontSize: 64, color: '#7fd0ff', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 20, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.78)', marginTop: 12, textTransform: 'uppercase' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {body && (
          <div style={{ fontSize: 38, lineHeight: 1.4, fontWeight: 500, color: 'rgba(255,255,255,0.96)', marginBottom: 36, display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 4, overflow: 'hidden' }}>
            {body}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
          <div style={{ height: 4, width: 90, borderRadius: 999, background: 'linear-gradient(90deg,#1697f3,#ff5a5f)' }} />
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: 0.2, color: 'rgba(255,255,255,0.92)' }}>@balluptop</div>
        </div>
      </div>
    </div>
  );
}