const { clientIp, currentUser, issueSession, limited, session, users } = require("../../_lib/access");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return session.sendJson(res, 405, { error: "method" });
  const user = await currentUser(req);
  if (!user) return session.sendJson(res, 401, { error: "unauthorized" });
  if (limited("password:" + user.id + ":" + clientIp(req), 8, 10 * 60 * 1000)) {
    return session.sendJson(res, 429, { error: "rate_limited" });
  }

  let body;
  try {
    body = await session.readJsonBody(req);
  } catch (e) {
    return session.sendJson(res, 400, { error: "invalid_body" });
  }

  const current = String(body.current || "");
  const next = String(body.next || "");
  if (!current || !(await users.verifyPassword(current, user.passwordHash))) {
    return session.sendJson(res, 400, { error: "invalid_password" });
  }
  if (next.length < 8 || next.length > 64) return session.sendJson(res, 400, { error: "invalid_password" });
  if (next === current || (await users.verifyPassword(next, user.passwordHash))) {
    return session.sendJson(res, 400, { error: "same_password" });
  }

  const hash = await users.hashPassword(next);
  let version = (Number(user.sessionVersion) || 0) + 1;
  try {
    await users.update(function (list) {
      const row = list.find(function (item) { return item.id === user.id; });
      if (!row) return;
      row.passwordHash = hash;
      row.issuedPassword = "";
      delete row.passwordHistory;
      version = (Number(row.sessionVersion) || 0) + 1;
      row.sessionVersion = version;
    });
  } catch (e) {
    return session.sendJson(res, 503, { error: "unavailable" });
  }

  issueSession(req, res, { id: user.id, sessionVersion: version });
  return session.sendJson(res, 200, { ok: true });
};
