const crypto = require("crypto");
function valid(token, secret) {
  if (!token || !secret) return false;
  const p = token.split(".");
  if (p.length !== 2) return false;
  const expected = crypto.createHmac("sha256", secret).update(p[0]).digest("base64url");
  const a = Buffer.from(expected), b = Buffer.from(p[1]);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try { return JSON.parse(Buffer.from(p[0], "base64url").toString()).exp > Date.now(); } catch { return false; }
}
module.exports = (req, res) => {
  const token = (req.headers.cookie || "").split(";").map(s => s.trim()).find(s => s.startsWith("admin_session="))?.slice("admin_session=".length);
  return res.status(200).json({ authenticated: valid(token, process.env.SESSION_SECRET) });
};
