// THE SACRED ABSURD member API: remembers which episode each LINE user reached.
const CHANNEL = '2012610836';
const ORIGINS = ['https://sacredabsurd.com', 'https://www.sacredabsurd.com', 'http://localhost:8765'];
function cors(req) {
  const o = req.headers.get('origin') || '';
  return { 'access-control-allow-origin': ORIGINS.includes(o) ? o : ORIGINS[0], 'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-allow-headers': 'content-type', 'vary': 'origin' };
}
const json = (req, body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...cors(req) } });
async function profile(token) {
  if (!token) return null;
  const v = await fetch('https://api.line.me/oauth2/v2.1/verify?access_token=' + encodeURIComponent(token));
  if (!v.ok) return null;
  const vj = await v.json();
  if (String(vj.client_id) !== CHANNEL || !(vj.expires_in > 0)) return null;
  const p = await fetch('https://api.line.me/v2/profile', { headers: { authorization: 'Bearer ' + token } });
  if (!p.ok) return null;
  return await p.json();
}
async function userId(token) {
  if (!token) return null;
  const v = await fetch('https://api.line.me/oauth2/v2.1/verify?access_token=' + encodeURIComponent(token));
  if (!v.ok) return null;
  const vj = await v.json();
  if (String(vj.client_id) !== CHANNEL || !(vj.expires_in > 0)) return null;
  const p = await fetch('https://api.line.me/v2/profile', { headers: { authorization: 'Bearer ' + token } });
  if (!p.ok) return null;
  return (await p.json()).userId || null;
}
import TL from './timeline.js';
// Comments are keyed by episode title (slug), so inserting episodes never moves them.
const slug = t => String(t || '').toUpperCase().normalize('NFKC').replace(/[’'`]/g, '').replace(/[^A-Z0-9฀-๿]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 140);
const okKey = k => typeof k === 'string' && /^[A-Z0-9฀-๿-]{1,140}$/.test(k);
const titleAt = (n, ts) => { let i = 0; TL.forEach((x, j) => { if (x[0] * 1000 <= ts) i = j; }); for (let j = i; j < TL.length; j++) if (TL[j][1][n - 1]) return TL[j][1][n - 1]; return ''; };
const keyOf = (body, url) => { const k = body ? body.key : url.searchParams.get('key'); if (okKey(k)) return k; const n = parseInt(body ? body.ep : url.searchParams.get('ep'), 10); return n > 0 ? slug(TL[TL.length - 1][1][n - 1]) || null : null; };
const RECENT = 'c:recent2', RECENT_MAX = 30;
const pub = c => ({ key: c.key, id: c.id, name: c.name, pic: c.pic, text: c.text, ts: c.ts });
async function migrate(env) {
  if (await env.PROGRESS.get('mig:titles2')) return;
  const groups = {};
  let cursor;
  do {
    const r = await env.PROGRESS.list({ prefix: 'c:', cursor });
    for (const k of r.keys) {
      const n = parseInt(k.name.slice(2), 10);
      if (!(n > 0) || String(n) !== k.name.slice(2)) continue;
      for (const c of (await env.PROGRESS.get(k.name, 'json')) || []) {
        const key = slug(titleAt(n, c.ts));
        if (key) (groups[key] = groups[key] || []).push(c);
      }
    }
    cursor = r.list_complete ? null : r.cursor;
  } while (cursor);
  for (const [key, add] of Object.entries(groups)) {
    const cur = (await env.PROGRESS.get('ct:' + key, 'json')) || [];
    const ids = new Set(cur.map(c => c.id));
    const merged = cur.concat(add.filter(c => !ids.has(c.id))).sort((a, b) => a.ts - b.ts);
    await env.PROGRESS.put('ct:' + key, JSON.stringify(merged));
  }
  await env.PROGRESS.delete(RECENT);
  await env.PROGRESS.put('mig:titles2', String(Date.now()));
}
async function recent(env) {
  let list = await env.PROGRESS.get(RECENT, 'json');
  if (list) return list;
  list = [];
  let cursor;
  do {
    const r = await env.PROGRESS.list({ prefix: 'ct:', cursor });
    for (const k of r.keys) for (const c of (await env.PROGRESS.get(k.name, 'json')) || []) list.push(pub({ ...c, key: k.name.slice(3) }));
    cursor = r.list_complete ? null : r.cursor;
  } while (cursor);
  list.sort((x, y) => y.ts - x.ts); list = list.slice(0, RECENT_MAX);
  await env.PROGRESS.put(RECENT, JSON.stringify(list));
  return list;
}
export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors(req) });
    const url = new URL(req.url), path = url.pathname;
    if (req.method === 'GET' && path.startsWith('/comments')) await migrate(env);
    if (req.method === 'GET' && path === '/comments/latest') {
      const lim = Math.min(Math.max(parseInt(url.searchParams.get('limit'), 10) || 8, 1), 20);
      return json(req, (await recent(env)).slice(0, lim));
    }
    if (req.method === 'GET' && path === '/comments') {
      const key = keyOf(null, url);
      if (!key) return json(req, { error: 'bad key' }, 400);
      const list = (await env.PROGRESS.get('ct:' + key, 'json')) || [];
      return json(req, list.map(c => ({ id: c.id, name: c.name, pic: c.pic, text: c.text, ts: c.ts })));
    }
    if (req.method !== 'POST') return json(req, { ok: true, service: 'sacredabsurd-member' });
    let body = {};
    try { body = await req.json(); } catch (e) {}
    const admins = String(env.ADMINS || '').split(',').map(x => x.trim()).filter(Boolean);
    if (path.startsWith('/comments/')) {
      const pr = await profile(body.token);
      if (!pr || !pr.userId) return json(req, { error: 'unauthorized' }, 401);
      await migrate(env);
      const ck = keyOf(body);
      if (!ck) return json(req, { error: 'bad key' }, 400);
      const key = 'ct:' + ck;
      const list = (await env.PROGRESS.get(key, 'json')) || [];
      const isAdmin = admins.includes(pr.userId);
      if (path === '/comments/add') {
        const text = String(body.text || '').trim().slice(0, 600);
        if (!text) return json(req, { error: 'empty' }, 400);
        if (!isAdmin && await env.PROGRESS.get('rl:' + pr.userId)) return json(req, { error: 'slow down' }, 429);
        const c = { id: crypto.randomUUID().slice(0, 8), uid: pr.userId, name: String(pr.displayName || 'ผู้อ่าน').slice(0, 40), pic: pr.pictureUrl || '', text, ts: Date.now() };
        list.push(c); if (list.length > 500) list.shift();
        await env.PROGRESS.put(key, JSON.stringify(list));
        if (!isAdmin) await env.PROGRESS.put('rl:' + pr.userId, '1', { expirationTtl: 60 });
        const rc = (await recent(env)).filter(x => x.id !== c.id); rc.unshift(pub({ ...c, key: ck })); await env.PROGRESS.put(RECENT, JSON.stringify(rc.slice(0, RECENT_MAX)));
        return json(req, { id: c.id, name: c.name, pic: c.pic, text: c.text, ts: c.ts, mine: true });
      }
      if (path === '/comments/mine') {
        return json(req, { admin: isAdmin, ids: list.filter(c => c.uid === pr.userId).map(c => c.id) });
      }
      if (path === '/comments/del') {
        const i = list.findIndex(c => c.id === body.id);
        if (i < 0) return json(req, { error: 'not found' }, 404);
        if (list[i].uid !== pr.userId && !isAdmin) return json(req, { error: 'forbidden' }, 403);
        list.splice(i, 1); await env.PROGRESS.put(key, JSON.stringify(list));
        const rc = await recent(env); const j = rc.findIndex(c => c.id === body.id && c.key === ck); if (j >= 0) { rc.splice(j, 1); await env.PROGRESS.put(RECENT, JSON.stringify(rc)); }
        return json(req, { ok: true });
      }
      return json(req, { error: 'not found' }, 404);
    }
    if (path === '/whoami') {
      const pr = await profile(body.token);
      return pr ? json(req, { uid: pr.userId, name: pr.displayName }) : json(req, { error: 'unauthorized' }, 401);
    }
    const uid = await userId(body.token);
    if (!uid) return json(req, { error: 'unauthorized' }, 401);
    const key = 'p:' + uid;
    if (path === '/get') return json(req, (await env.PROGRESS.get(key, 'json')) || {});
    if (path === '/progress') {
      const n = parseInt(body.n, 10);
      if (!(n > 0 && n < 10000)) return json(req, { error: 'bad n' }, 400);
      const rec = { n, t: String(body.t || '').slice(0, 120), ts: Number(body.ts) || Date.now() };
      await env.PROGRESS.put(key, JSON.stringify(rec));
      return json(req, rec);
    }
    return json(req, { error: 'not found' }, 404);
  }
};
