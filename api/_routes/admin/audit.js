const audit = require("../../_lib/audit");
const { allow } = require("../../_lib/guard");
const { session } = require("../../_lib/access");

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    if (!allow(req, res, "logs")) return;
    return session.sendJson(res, 200, { records: audit.recent() });
  }
  if (req.method !== "POST") return session.sendJson(res, 405, { error: "method" });
  if (!allow(req, res, "logs")) return;
  let body;
  try {
    body = await session.readJsonBody(req);
  } catch (e) {
    return session.sendJson(res, 400, { error: "invalid_body" });
  }
  if (body.action !== "clear") return session.sendJson(res, 400, { error: "unknown_action" });
  audit.clearAll();
  return session.sendJson(res, 200, { ok: true, records: [] });
};
