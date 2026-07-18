const session = require("../_lib/session");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return session.sendJson(res, 405, { error: "Method not allowed" });
  }
  res.setHeader("Set-Cookie", session.clearCookie(req));
  return session.sendJson(res, 200, { ok: true });
};
