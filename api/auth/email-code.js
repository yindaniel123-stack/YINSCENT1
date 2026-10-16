const { session } = require("../_lib/access");

module.exports = function handler(req, res) {
  return session.sendJson(res, 410, { error: "email_code_closed" });
};
