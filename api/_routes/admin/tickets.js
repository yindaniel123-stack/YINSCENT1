const audit = require("../../_lib/audit");
const tickets = require("../../_lib/tickets");
const { allow } = require("../../_lib/guard");
const { clientIp, session } = require("../../_lib/access");

function actorName(admin) {
  return admin.name || admin.username || "客服";
}

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    const admin = allow(req, res, ["service", "orders"]);
    if (!admin) return;
    return session.sendJson(res, 200, { tickets: tickets.read() });
  }
  if (req.method !== "POST") return session.sendJson(res, 405, { error: "method" });

  let body;
  try {
    body = await session.readJsonBody(req);
  } catch (e) {
    return session.sendJson(res, 400, { error: "invalid_body" });
  }
  const admin = allow(req, res, ["service", "orders"]);
  if (!admin) return;
  const action = String(body.action || "");
  if (action === "update") {
    const id = String(body.id || "").slice(0, 80);
    const reply = String(body.reply || "").replace(/[\u0000-\u001f]/g, "").trim().slice(0, 500);
    if (!id) return session.sendJson(res, 400, { error: "invalid_id" });
    const row = tickets.update(id, {
      status: body.status,
      priority: body.priority,
      reply: reply,
      actor: actorName(admin),
    });
    if (!row) return session.sendJson(res, 404, { error: "not_found" });
    audit.add({
      actorId: admin.id,
      actorName: actorName(admin),
      ip: clientIp(req),
      action: "处理工单",
      target: id,
      changes: { before: null, after: { 状态: row.status } },
    });
    return session.sendJson(res, 200, { ok: true, ticket: row });
  }
  if (action === "batch") {
    const ids = Array.isArray(body.ids) ? body.ids.map(function (id) {
      return String(id || "").slice(0, 80);
    }).filter(Boolean).slice(0, 500) : [];
    if (!ids.length || tickets.STATUSES.indexOf(body.status) === -1) {
      return session.sendJson(res, 400, { error: "invalid_status" });
    }
    let count = 0;
    ids.forEach(function (id) {
      if (tickets.update(id, { status: body.status, actor: actorName(admin) })) count += 1;
    });
    return session.sendJson(res, 200, { ok: true, count: count });
  }
  return session.sendJson(res, 400, { error: "unknown_action" });
};
