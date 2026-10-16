const crypto = require("crypto");
const admins = require("../../_lib/admins");
const loginLog = require("../../_lib/login-log");
const notify = require("../../_lib/notify");
const { clientIp, limited, issueSession, authReady, session, users } = require("../../_lib/access");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return session.sendJson(res, 405, { error: "method" });
  if (!authReady()) return session.sendJson(res, 500, { error: "unconfigured" });
  if (limited("login:" + clientIp(req), 12, 10 * 60 * 1000)) {
    return session.sendJson(res, 429, { error: "rate_limited" });
  }

  let body;
  try {
    body = await session.readJsonBody(req);
  } catch (e) {
    return session.sendJson(res, 400, { error: "invalid_body" });
  }

  const username = users.normalizeUsername(body.username || body.login);
  const password = String(body.password || "");
  const ip = clientIp(req);

  function rejectLogin(reason, userId) {
    loginLog.add({
      at: new Date().toISOString(),
      username: username || "",
      userId: userId || "",
      ip: ip,
      ok: false,
      reason: reason,
    });
    const code = reason === "invalid_login" ? 401 : 403;
    return session.sendJson(res, code, { error: reason });
  }

  if (!username) {
    const configured = process.env.ADMIN_PASSWORD || "";
    const given = crypto.createHash("sha256").update(password).digest();
    const wanted = crypto.createHash("sha256").update(configured).digest();
    if (!configured || !crypto.timingSafeEqual(given, wanted)) return rejectLogin("invalid_login");
    const token = session.createAdminToken({ id: "super", sessionVersion: 0 });
    if (!token) return session.sendJson(res, 500, { error: "unconfigured" });
    res.setHeader("Set-Cookie", [session.sessionCookie(req, token), session.clearMemberCookie(req)]);
    return session.sendJson(res, 200, { ok: true, role: "admin", super: true });
  }

  const staff = admins.findByUsername(username);
  if (staff) {
    const matched = !staff.disabled && (await users.verifyPassword(password, staff.passwordHash));
    if (!matched) return rejectLogin(staff.disabled ? "disabled" : "invalid_login", staff.id);
    const token = session.createAdminToken(staff);
    if (!token) return session.sendJson(res, 500, { error: "unconfigured" });
    loginLog.add({
      at: new Date().toISOString(),
      username: staff.username,
      userId: staff.id,
      ip: ip,
      ok: true,
      reason: "",
    });
    res.setHeader("Set-Cookie", [session.sessionCookie(req, token), session.clearMemberCookie(req)]);
    return session.sendJson(res, 200, { ok: true, role: "admin", super: false });
  }

  const user = users.findByUsername(username);
  const passwordOk = user && (await users.verifyPassword(password, user.passwordHash));

  const status = user ? users.accountStatus(user) : "";
  if (!user || !passwordOk || status !== "active") {
    const reason = status === "pending" || status === "rejected" || status === "disabled" ? status : "invalid_login";
    return rejectLogin(reason, user ? user.id : "");
  }

  loginLog.add({
    at: new Date().toISOString(),
    username: user.username,
    userId: user.id,
    ip: ip,
    ok: true,
    reason: "",
  });
  await notify.send("用户登录", {
    账号: user.username,
    姓名: user.name || "",
    电话: user.phone || "",
    邮箱: user.email || "",
    时间: new Date().toISOString(),
    IP: ip,
  });
  if (!issueSession(req, res, user, [session.clearCookie(req)])) return session.sendJson(res, 500, { error: "unconfigured" });
  return session.sendJson(res, 200, { ok: true, user: users.publicUser(user) });
};
