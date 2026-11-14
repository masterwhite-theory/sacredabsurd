// THE SACRED ABSURD member API: remembers which episode each LINE user reached.
const CHANNEL = '2012610836';
const ORIGINS = ['https://sacredabsurd.com', 'https://www.sacredabsurd.com', 'http://localhost:8765'];
function cors(req) {
  const o = req.headers.get('origin') || '';
  return { 'access-control-allow-origin': ORIGINS.includes(o) ? o : ORIGINS[0], 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type', 'vary': 'origin' };
}
const json = (req, body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...cors(req) } });
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
export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors(req) });
    if (req.method !== 'POST') return json(req, { ok: true, service: 'sacredabsurd-member' });
    const path = new URL(req.url).pathname;
    let body = {};
    try { body = await req.json(); } catch (e) {}
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
