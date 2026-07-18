const crypto = require("crypto");
const { createSessionCookie, readJsonBody, sendJson } = require("./_lib/session");

function safeEqual(a, b) {
  const ha = crypto.createHash("sha256").update(String(a)).digest();
  const hb = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  const authSecret = process.env.AUTH_SECRET;
  if (!adminPassword || !authSecret) {
    return sendJson(res, 500, {
      error: "Auth is not configured. Set ADMIN_PASSWORD and AUTH_SECRET environment variables.",
    });
  }

  const body = await readJsonBody(req);
  const password = body && body.password;
  if (!password || !safeEqual(password, adminPassword)) {
    return sendJson(res, 401, { error: "Incorrect password." });
  }

  res.setHeader("Set-Cookie", createSessionCookie());
  return sendJson(res, 200, { ok: true, user: { role: "admin" } });
};
