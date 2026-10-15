const crypto = require("crypto");
function cookieOpts(value, maxAge) {
  return `admin_session=${value}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
}
function sign(payload, secret) {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${sig}`;
}
module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { ADMIN_USERNAME, ADMIN_PASSWORD, SESSION_SECRET } = process.env;
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !SESSION_SECRET)
    return res.status(500).json({ error: "Admin belum dikonfigurasi di Vercel Environment Variables." });
  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  if (!body || body.username !== ADMIN_USERNAME || body.password !== ADMIN_PASSWORD)
    return res.status(401).json({ error: "Username atau password salah." });
  const token = sign({ exp: Date.now() + 8 * 60 * 60 * 1000 }, SESSION_SECRET);
  res.setHeader("Set-Cookie", cookieOpts(token, 8 * 60 * 60));
  return res.status(200).json({ ok: true });
};
