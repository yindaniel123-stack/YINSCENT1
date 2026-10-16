const { session } = require("../_lib/access");

module.exports = function handler(req, res) {
  if (req.method !== "POST") return session.sendJson(res, 405, { error: "method" });
  res.setHeader("Set-Cookie", session.clearMemberCookie(req));
  return session.sendJson(res, 200, { ok: true });
};
