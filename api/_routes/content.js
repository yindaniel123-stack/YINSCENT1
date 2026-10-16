const content = require("../_lib/content");
const { session } = require("../_lib/access");

module.exports = function handler(req, res) {
  if (req.method !== "GET") return session.sendJson(res, 405, { error: "method" });
  return session.sendJson(res, 200, { story: content.read(), contact: content.readContact() });
};
