const notify = require("../../_lib/notify");
const { allow } = require("../../_lib/guard");
const { session } = require("../../_lib/access");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return session.sendJson(res, 405, { error: "method" });
  if (!allow(req, res, "mail")) return;
  return session.sendJson(res, 200, {
    to: notify.recipient(),
    configured: notify.configured(),
    records: notify.recent(),
  });
};
