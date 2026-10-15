const crypto = require('crypto');

function config() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, SESSION_SECRET } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY || !SESSION_SECRET) {
    const err = new Error('Konfigurasi Supabase belum lengkap. Periksa Environment Variables di Vercel.');
    err.status = 500; throw err;
  }
  return { url: SUPABASE_URL.replace(/\/$/, ''), service: SUPABASE_SERVICE_ROLE_KEY, anon: SUPABASE_ANON_KEY, secret: SESSION_SECRET };
}
function json(res, status, data) { return res.status(status).json(data); }
function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body || '{}'); } catch { return {}; }
}
function cookieValue(req) {
  return (req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith('p263_admin_session='))?.slice('p263_admin_session='.length) || '';
}
function sign(payload, secret) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return data + '.' + crypto.createHmac('sha256', secret).update(data).digest('base64url');
}
function verify(token, secret) {
  if (!token) return null;
  const p = token.split('.'); if (p.length !== 2) return null;
  const expected = crypto.createHmac('sha256', secret).update(p[0]).digest('base64url');
  const a = Buffer.from(expected), b = Buffer.from(p[1]);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try { const data = JSON.parse(Buffer.from(p[0], 'base64url').toString()); return data.exp > Date.now() ? data : null; } catch { return null; }
}
async function sb(path, { method = 'GET', body, anon = false, prefer } = {}) {
  const c = config();
  const key = anon ? c.anon : c.service;
  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (prefer) headers.Prefer = prefer;
  const response = await fetch(c.url + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const raw = await response.text(); let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }
  if (!response.ok) {
    const err = new Error(data?.msg || data?.message || data?.error_description || data?.error || 'Permintaan ke Supabase gagal.');
    err.status = response.status >= 500 ? 502 : response.status; throw err;
  }
  return data;
}
async function currentAdmin(req) {
  const c = config();
  const session = verify(cookieValue(req), c.secret);
  if (!session?.id) return null;
  const rows = await sb(`/rest/v1/admin_users?select=auth_user_id,email,role&auth_user_id=eq.${encodeURIComponent(session.id)}&limit=1`);
  if (!Array.isArray(rows) || !rows.length) return null;
  return { id: rows[0].auth_user_id, email: rows[0].email, role: rows[0].role };
}
function setSession(res, userId) {
  const c = config();
  const token = sign({ id: userId, exp: Date.now() + 8 * 60 * 60 * 1000 }, c.secret);
  res.setHeader('Set-Cookie', `p263_admin_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800`);
}
function clearSession(res) { res.setHeader('Set-Cookie', 'p263_admin_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'); }
function handleError(res, err) { return json(res, err.status || 500, { error: err.message || 'Terjadi kesalahan server.' }); }
module.exports = { config, json, readBody, sb, currentAdmin, setSession, clearSession, handleError };
