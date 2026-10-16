const crypto = require("crypto");
const admins = require("../../_lib/admins");
const session = require("../../_lib/session");
const users = require("../../_lib/users");

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

  const username = users.normalizeUsername(body.username);
  const password = String(body.password || "");
  let record = { id: "super", sessionVersion: 0 };
  const superName = !username || username === "admin";
  if (superName) {
    const given = crypto.createHash("sha256").update(password).digest();
    const wanted = crypto.createHash("sha256").update(configured).digest();
    if (!crypto.timingSafeEqual(given, wanted)) {
      return session.sendJson(res, 401, { error: "Incorrect password" });
    }
  } else {
    const admin = admins.findByUsername(username);
    const matched = admin && !admin.disabled && (await users.verifyPassword(password, admin.passwordHash));
    if (!matched) return session.sendJson(res, 401, { error: "Incorrect password" });
    record = admin;
  }

  const token = session.createAdminToken(record);
  if (!token) return session.sendJson(res, 500, { error: "Admin login is not configured." });
  res.setHeader("Set-Cookie", session.sessionCookie(req, token));
  return session.sendJson(res, 200, { ok: true, role: "admin", super: superName });
};
