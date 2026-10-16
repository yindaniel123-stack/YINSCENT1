const tickets = require("../../_lib/tickets");
const notices = require("../../_lib/notices");
const { currentUser, session } = require("../../_lib/access");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return session.sendJson(res, 405, { error: "method" });
  const member = currentUser(req);
  if (!member) return session.sendJson(res, 401, { error: "unauthorized" });

  let body;
  try {
    body = await session.readJsonBody(req);
  } catch (e) {
    return session.sendJson(res, 400, { error: "invalid_body" });
  }
  const note = String(body.note || "").trim();
  if (!note) return session.sendJson(res, 400, { error: "invalid_ticket" });
  const row = tickets.create({
    customerName: member.name || member.username || "",
    phone: member.phone || "",
    email: member.email || "",
    userId: member.id,
    orderId: body.orderId,
    type: body.type,
    note: note,
  });
  notices.serviceOpened(row).catch(function () {});
  return session.sendJson(res, 201, { ok: true, id: row.id });
};
