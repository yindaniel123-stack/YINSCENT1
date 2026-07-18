const crypto = require("crypto");
const session = require("../_lib/session");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return session.sendJson(res, 405, { error: "Method not allowed" });
  }

  const configured = process.env.ADMIN_PASSWORD;
  if (!configured) {
    return session.sendJson(res, 500, {
      error: "Admin login is not configured. Set the ADMIN_PASSWORD environment variable.",
    });
  }

  let body;
  try {
    body = await session.readJsonBody(req);
  } catch (e) {
    return session.sendJson(res, 400, { error: "Invalid request body" });
  }

  const given = crypto.createHash("sha256").update(String(body.password || "")).digest();
  const wanted = crypto.createHash("sha256").update(configured).digest();
  if (!crypto.timingSafeEqual(given, wanted)) {
    return session.sendJson(res, 401, { error: "Incorrect password" });
  }

  res.setHeader("Set-Cookie", session.sessionCookie(req, session.createToken()));
  return session.sendJson(res, 200, { ok: true, role: "admin" });
};
