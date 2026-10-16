const session = require("../_lib/session");
const smsLog = require("../_lib/sms-log");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return session.sendJson(res, 405, { error: "method" });
  if (!session.isAuthorized(req)) return session.sendJson(res, 401, { error: "unauthorized" });
  return session.sendJson(res, 200, smsLog.summary());
};
