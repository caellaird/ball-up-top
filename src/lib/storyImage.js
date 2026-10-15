// Renders a 9:16 (1080x1920) "scorecard story" image for a post using the
// Canvas 2D API — no html2canvas, no off-screen DOM, no canvas tainting.
// The post photo is loaded with crossOrigin; if it can't be loaded (no CORS),
// we fall back to a brand gradient background so the image is always produced.

const W = 1080;
const H = 1920;
const BLUE = '#7fd0ff';
const FONT_HEAD = '"Sora","Inter",sans-serif';
const FONT_BODY = '"Inter",sans-serif';

function loadImage(src) {
  return new Promise((res) => {
    if (!src) return res(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = src;
  });
}

function drawGradientBg(ctx) {
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#0c1326');
  g.addColorStop(0.55, '#122247');
  g.addColorStop(1, '#1a3a6e');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function drawCover(ctx, img) {
  const scale = Math.max(W / img.width, H / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrap(ctx, text, maxWidth, maxLines) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (let i = 0; i < words.length; i++) {
    const test = line ? line + ' ' + words[i] : words[i];
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = words[i];
      if (lines.length === maxLines - 1) {
        const rest = line + ' ' + words.slice(i + 1).join(' ');
        let r = rest;
        while (r && ctx.measureText(r + '…').width > maxWidth) r = r.slice(0, -1);
        lines.push(r + '…');
        return lines;
      }
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, maxLines);
}

export async function buildStoryImage(post) {
  if (document.fonts?.ready) { try { await document.fonts.ready; } catch {} }

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const img = post.media_urls?.[0] ? await loadImage(post.media_urls[0]) : null;
  if (img) drawCover(ctx, img);
  else drawGradientBg(ctx);

  // bottom legibility gradient
  const g = ctx.createLinearGradient(0, H * 0.4, 0, H);
  g.addColorStop(0, 'rgba(8,12,24,0)');
  g.addColorStop(0.35, 'rgba(8,12,24,0.55)');
  g.addColorStop(1, 'rgba(8,12,24,0.97)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // top gradient for the logo
  const gt = ctx.createLinearGradient(0, 0, 0, H * 0.22);
  gt.addColorStop(0, 'rgba(8,12,24,0.55)');
  gt.addColorStop(1, 'rgba(8,12,24,0)');
  ctx.fillStyle = gt;
  ctx.fillRect(0, 0, W, H * 0.22);

  // top brand lockup: gradient B circle + "Ball Up Top"
  const bx = 72, by = 64, r = 32;
  const cg = ctx.createLinearGradient(bx, by, bx + r * 2, by + r * 2);
  cg.addColorStop(0, '#1697f3');
  cg.addColorStop(1, '#ff5a5f');
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.arc(bx + r, by + r, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.font = `800 32px ${FONT_HEAD}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('B', bx + r, by + r + 2);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fff';
  ctx.font = `800 40px ${FONT_HEAD}`;
  ctx.fillText('Ball Up Top', bx + r * 2 + 16, by + r);

  // bottom content
  const author = post.author_name || 'Ball Up Top';
  const stats = (post.highlight_stats || []).filter((s) => s.label && s.value);
  const score = post.score_text || '';
  const body = post.body || '';
  const ax = 72;
  let y = 1330;

  // author row: letter avatar + name
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.beginPath();
  ctx.arc(ax + 46, y + 46, 46, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(ax + 46, y + 46, 46, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = `800 40px ${FONT_HEAD}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText((author[0] || 'B').toUpperCase(), ax + 46, y + 48);
  ctx.textAlign = 'left';
  ctx.font = `800 48px ${FONT_HEAD}`;
  ctx.fillText(author, ax + 112, y + 46);
  y += 110;

  // big score (when no stats)
  if (score && !stats.length) {
    ctx.fillStyle = '#fff';
    ctx.font = `800 72px ${FONT_HEAD}`;
    ctx.textBaseline = 'alphabetic';
    let s = score;
    while (s && ctx.measureText(s).width > W - 144) s = s.slice(0, -1);
    ctx.fillText(s, ax, y + 60);
    y += 100;
  }

  // stats row (up to 3 columns)
  if (stats.length) {
    const rowH = 150;
    const rowW = W - 144;
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    roundRect(ctx, ax, y, rowW, rowH, 28);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 2;
    roundRect(ctx, ax, y, rowW, rowH, 28);
    ctx.stroke();
    const cols = stats.slice(0, 3);
    const colW = rowW / cols.length;
    cols.forEach((s, i) => {
      const cx = ax + colW * i + colW / 2;
      ctx.fillStyle = BLUE;
      ctx.font = `800 64px ${FONT_HEAD}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(s.value, cx, y + 54);
      ctx.fillStyle = 'rgba(255,255,255,0.78)';
      ctx.font = `600 20px ${FONT_BODY}`;
      ctx.fillText(s.label.toUpperCase(), cx, y + 108);
      if (i < cols.length - 1) {
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ax + colW * (i + 1), y + 24);
        ctx.lineTo(ax + colW * (i + 1), y + rowH - 24);
        ctx.stroke();
      }
    });
    ctx.textAlign = 'left';
    y += rowH + 36;
  }

  // caption (max 3 lines)
  if (body) {
    ctx.fillStyle = 'rgba(255,255,255,0.96)';
    ctx.font = `500 38px ${FONT_BODY}`;
    ctx.textBaseline = 'alphabetic';
    const lines = wrap(ctx, body, W - 144, 3);
    lines.forEach((ln, i) => ctx.fillText(ln, ax, y + 38 + i * 54));
  }

  // @balluptop handle
  const hgy = H - 90;
  const bggrad = ctx.createLinearGradient(ax, hgy, ax + 90, hgy);
  bggrad.addColorStop(0, '#1697f3');
  bggrad.addColorStop(1, '#ff5a5f');
  ctx.fillStyle = bggrad;
  roundRect(ctx, ax, hgy, 90, 6, 3);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = `700 30px ${FONT_BODY}`;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('@balluptop', ax, hgy + 34);

  return new Promise((res) => {
    canvas.toBlob((blob) => {
      if (!blob) return res(null);
      res(new File([blob], 'ball-up-top-story.png', { type: 'image/png' }));
    }, 'image/png');
  });
}