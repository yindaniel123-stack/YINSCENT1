const { session } = require("../../_lib/access");

module.exports = function handler(req, res) {
  return session.sendJson(res, 403, { error: "password_locked" });
};
