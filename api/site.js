const settings = require("./_lib/settings");
const { session } = require("./_lib/access");

module.exports = function handler(req, res) {
  if (req.method !== "GET") return session.sendJson(res, 405, { error: "method" });
  const site = settings.read().site;
  return session.sendJson(res, 200, { site: site });
};
