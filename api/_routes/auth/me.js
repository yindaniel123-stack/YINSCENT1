const { currentUser, session, users } = require("../../_lib/access");

module.exports = function handler(req, res) {
  if (req.method !== "GET") return session.sendJson(res, 405, { error: "method" });
  const user = currentUser(req);
  if (!user) return session.sendJson(res, 401, { user: null });
  return session.sendJson(res, 200, { user: users.publicUser(user) });
};
