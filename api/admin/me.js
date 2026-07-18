const session = require("../_lib/session");

module.exports = async function handler(req, res) {
  if (!session.isAuthorized(req)) {
    return session.sendJson(res, 401, { error: "Not signed in" });
  }
  return session.sendJson(res, 200, { ok: true, role: "admin" });
};
