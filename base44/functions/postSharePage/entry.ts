import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const LOGO = 'https://media.base44.com/images/public/6a4b1c30da58082696f047dd/21879394b_logo.png';
const APP_FALLBACK = 'https://theballuptop.com';

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>')
    .replace(/"/g, '"').replace(/'/g, '&#39;');
}

function page(title, desc, img, inner, appUrl) {
  const u = esc(appUrl || APP_FALLBACK);
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:type" content="article">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(img)}">
<style>
*{box-sizing:border-box}body{margin:0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f4f7fb;color:#131b30;padding:24px;min-height:100vh}
.wrap{max-width:560px;margin:0 auto}
.brand{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:16px}
.brand img{width:30px}.brand b{font-weight:800}
.card{background:#fff;border:1px solid #e0e0e0;border-radius:24px;overflow:hidden;box-shadow:0 8px 30px -12px rgba(16,24,40,.18)}
.media img{width:100%;display:block;aspect-ratio:4/3;object-fit:cover;background:#eef2f7}
.body{padding:16px 18px 20px}
.head{display:flex;align-items:center;gap:12px;margin-bottom:6px}
.av{width:40px;height:40px;border-radius:999px;object-fit:cover}
.av-f{width:40px;height:40px;border-radius:999px;background:#1697f3;color:#000;font-weight:700;display:flex;align-items:center;justify-content:center}
.name{font-weight:700;font-size:15px}
.hl{font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:#828282;margin:2px 0 6px}
.score{font-weight:800;font-size:22px;color:#1697f3;margin:14px 0}
.stats{display:flex;margin:18px 0;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden}
.stat{flex:1;text-align:center;padding:18px 6px;border-right:1px solid #e5e7eb}
.stat:last-child{border-right:0}
.stat .v{font-weight:800;font-size:30px;color:#1697f3;line-height:1}
.stat .l{font-size:11px;letter-spacing:.06em;color:#828282;margin-top:6px;text-transform:uppercase}
.cap{margin:14px 0 0;font-size:15px;line-height:1.5;color:#4f5660;white-space:pre-wrap}
.foot{padding:24px;text-align:center}
.sub{color:#828282;font-size:13px;margin-top:6px;margin-bottom:16px}
.btn{display:inline-block;padding:14px 30px;border-radius:999px;background:linear-gradient(135deg,#1697f3,#ff5a5f);color:#000;font-weight:800;text-decoration:none;font-size:15px}
</style></head><body>
<div class="wrap">
<div class="brand"><img src="${LOGO}" alt=""><b>Ball Up Top</b></div>
<div class="card">${inner}</div>
<div class="foot">
<p class="sub">Compete. Track your record. Climb the leaderboard.</p>
<a class="btn" href="${u}">Open in Ball Up Top</a>
</div>
</div></body></html>`;
}

function notFound(appUrl) {
  const u = esc(appUrl || APP_FALLBACK);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Ball Up Top</title>
<meta property="og:title" content="Ball Up Top — Pickup Sports, Leaderboards & Rivalries">
<meta property="og:description" content="Find local pickup games, challenge players, track your record, and climb city leaderboards.">
<meta property="og:image" content="${LOGO}">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${LOGO}">
<style>body{margin:0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#0c1326;color:#fff;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center;padding:24px}</style></head>
<body><div><img src="${LOGO}" alt="" style="width:84px;margin-bottom:16px"><h1>Ball Up Top</h1><p style="color:#9aa6bd">This post isn't available.</p><a href="${u}" style="display:inline-block;margin-top:20px;padding:14px 28px;border-radius:999px;background:#1697f3;color:#000;font-weight:700;text-decoration:none">Open the app</a></div></body></html>`;
}

function renderPost(post, appUrl) {
  const author = esc(post.author_name || 'Ball Up Top');
  const avatar = esc(post.author_avatar || '');
  const body = esc(post.body || '');
  const score = esc(post.score_text || '');
  const hl = esc(post.highlight_title || '');
  const stats = Array.isArray(post.highlight_stats) ? post.highlight_stats.filter((s) => s && s.label && s.value) : [];
  const img = (post.media_urls && post.media_urls[0]) || LOGO;
  const title = post.highlight_title || `${post.author_name || 'Ball Up Top'} on Ball Up Top`;
  const desc = post.score_text || post.body || 'Ball Up Top — competitive pickup sports, leaderboards & rivalries.';

  const mediaBlock = `<div class="media"><img src="${esc(img)}" alt=""></div>`;
  const avatarHtml = avatar
    ? `<img class="av" src="${avatar}" alt="">`
    : `<div class="av-f">${author.charAt(0) || 'B'}</div>`;
  const hlBlock = hl ? `<div class="hl">${hl}</div>` : '';
  const scoreBlock = score && !stats.length ? `<div class="score">${score}</div>` : '';
  const statsBlock = stats.length
    ? `<div class="stats">${stats.map((s) => `<div class="stat"><div class="v">${esc(s.value)}</div><div class="l">${esc(s.label)}</div></div>`).join('')}</div>`
    : '';
  const bodyBlock = body ? `<p class="cap">${body}</p>` : '';

  const inner = `${mediaBlock}<div class="body"><div class="head">${avatarHtml}<div><div class="name">${author}</div></div></div>${hlBlock}${scoreBlock}${statsBlock}${bodyBlock}</div>`;
  return page(title, desc, img, inner, appUrl);
}

export default async function (req) {
  try {
    const url = new URL(req.url);
    let postId = url.searchParams.get('post_id');
    const appUrl = req.headers.get('x-base44-app-url') || APP_FALLBACK;
    // Also accept the id in a JSON body (SDK invocations pass params in the body).
    if (!postId) {
      let body = {};
      try { body = await req.json(); } catch {}
      if (body && body.post_id) postId = String(body.post_id);
    }
    if (!postId) return new Response(notFound(appUrl), { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } });

    const base44 = createClientFromRequest(req);
    let post = null;
    try { post = await base44.asServiceRole.entities.Post.get(postId); } catch { post = null; }
    if (!post) return new Response(notFound(appUrl), { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } });

    return new Response(renderPost(post, appUrl), { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  } catch (e) {
    return new Response(notFound(APP_FALLBACK), { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }
}