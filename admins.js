const { json, readBody, sb, currentAdmin, handleError } = require('../lib/admin-auth');
const validEmail = v => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) && v.length <= 254;
module.exports = async (req, res) => {
  try {
    const actor = await currentAdmin(req);
    if (!actor) return json(res, 401, { error: 'Silakan login sebagai admin.' });
    if (req.method === 'GET') {
      if (actor.role !== 'super_admin') return json(res, 403, { error: 'Hanya Super Admin yang dapat melihat pengelolaan akun.' });
      const users = await sb('/rest/v1/admin_users?select=auth_user_id,email,role,created_at,created_by&order=created_at.asc');
      return json(res, 200, { users });
    }
    if (req.method === 'POST') {
      if (actor.role !== 'super_admin') return json(res, 403, { error: 'Hanya Super Admin yang boleh menambahkan admin.' });
      const { email, password } = readBody(req);
      const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
      if (!validEmail(cleanEmail)) return json(res, 400, { error: 'Masukkan alamat email yang valid.' });
      if (typeof password !== 'string' || password.length < 12) return json(res, 400, { error: 'Password admin minimal 12 karakter.' });
      const created = await sb('/auth/v1/admin/users', { method: 'POST', body: { email: cleanEmail, password, email_confirm: true } });
      try {
        await sb('/rest/v1/admin_users', { method: 'POST', body: { auth_user_id: created.id, email: cleanEmail, role: 'admin', created_by: actor.id }, prefer: 'return=minimal' });
      } catch (e) {
        try { await sb(`/auth/v1/admin/users/${encodeURIComponent(created.id)}`, { method: 'DELETE' }); } catch (_) {}
        throw e;
      }
      return json(res, 201, { ok: true, user: { auth_user_id: created.id, email: cleanEmail, role: 'admin' } });
    }
    if (req.method === 'DELETE') {
      if (actor.role !== 'super_admin') return json(res, 403, { error: 'Hanya Super Admin yang boleh menghapus admin.' });
      const id = typeof req.query?.id === 'string' ? req.query.id : '';
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return json(res, 400, { error: 'ID akun tidak valid.' });
      if (id === actor.id) return json(res, 400, { error: 'Kamu tidak dapat menghapus akun sendiri.' });
      const rows = await sb(`/rest/v1/admin_users?select=auth_user_id,role&auth_user_id=eq.${encodeURIComponent(id)}&limit=1`);
      if (!rows.length) return json(res, 404, { error: 'Akun admin tidak ditemukan.' });
      if (rows[0].role === 'super_admin') return json(res, 403, { error: 'Akun Super Admin tidak dapat dihapus dari menu ini.' });
      await sb(`/auth/v1/admin/users/${encodeURIComponent(id)}`, { method: 'DELETE' });
      await sb(`/rest/v1/admin_users?auth_user_id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', prefer: 'return=minimal' });
      return json(res, 200, { ok: true });
    }
    res.setHeader('Allow', 'GET, POST, DELETE'); return json(res, 405, { error: 'Method not allowed' });
  } catch (e) { return handleError(res, e); }
};
