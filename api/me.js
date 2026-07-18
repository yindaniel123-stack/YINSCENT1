const { readSession, sendJson } = require("./_lib/session");

module.exports = function handler(req, res) {
  const session = readSession(req);
  if (!session) {
    return sendJson(res, 401, { user: null });
  }
  return sendJson(res, 200, { user: { role: session.role } });
};
