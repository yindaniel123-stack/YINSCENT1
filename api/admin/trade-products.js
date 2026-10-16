const audit = require("../_lib/audit");
const trade = require("../_lib/trade-products");
const notices = require("../_lib/notices");
const { allow } = require("../_lib/guard");
const { clientIp, session } = require("../_lib/access");

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    const admin = allow(req, res, ["products", "prices", "stock", "orders", "productNew", "productAll", "reports", "dashboard", "shipping", "service"]);
    if (!admin) return;
    return session.sendJson(res, 200, { products: trade.list() });
  }
  if (req.method !== "POST") return session.sendJson(res, 405, { error: "method" });

  let body;
  try {
    body = await session.readJsonBody(req);
  } catch (e) {
    return session.sendJson(res, 400, { error: "invalid_body" });
  }
  const admin = allow(req, res, ["products", "prices", "stock", "productNew", "productAll"]);
  if (!admin) return;
  const action = String(body.action || "");
  if (action === "create") {
    const row = trade.clean(body);
    if (!row.sku || !row.name) return session.sendJson(res, 400, { error: "invalid_product" });
    if (!row.category) return session.sendJson(res, 400, { error: "invalid_category" });
    if ((row.images || []).some(function (item) { return item.length > 380000; })) {
      return session.sendJson(res, 400, { error: "invalid_image" });
    }
    const created = trade.create(row);
    audit.add({
      actorId: admin.id,
      actorName: admin.name || admin.username || "",
      ip: clientIp(req),
      action: "新增产品",
      target: created.id,
      changes: { before: null, after: { 货号: created.sku, 产品: created.name } },
    });
    return session.sendJson(res, 201, { ok: true, product: created });
  }
  if (action === "update") {
    const id = String(body.id || "").slice(0, 80);
    if (!id) return session.sendJson(res, 400, { error: "invalid_id" });
    const current = trade.list().filter(function (item) { return item.id === id; })[0];
    if (!current) return session.sendJson(res, 404, { error: "not_found" });
    const row = trade.clean(body, current);
    if ((row.images || []).some(function (item) { return item.length > 380000; })) {
      return session.sendJson(res, 400, { error: "invalid_image" });
    }
    trade.saveItem(id, row);
    if (String(row.stock || "") !== "" && String(row.stock) !== String(current.stock || "")) {
      notices.stockChanged({ id: id, name: row.name || current.name || id, sku: row.sku || current.sku || id }, current.stock, row.stock).catch(function () {});
    }
    audit.add({
      actorId: admin.id,
      actorName: admin.name || admin.username || "",
      ip: clientIp(req),
      action: "修改产品资料",
      target: id,
      changes: { before: { 货号: current.sku, 产品: current.name }, after: { 货号: row.sku, 产品: row.name } },
    });
    return session.sendJson(res, 200, { ok: true });
  }
  if (action === "batch") {
    const ids = Array.isArray(body.ids) ? body.ids.map(function (id) {
      return String(id || "").slice(0, 80);
    }).filter(Boolean).slice(0, 500) : [];
    const op = String(body.op || "");
    if (!ids.length || (op !== "enable" && op !== "disable" && op !== "remove")) {
      return session.sendJson(res, 400, { error: "invalid_batch" });
    }
    const count = trade.patchMany(ids, op);
    audit.add({
      actorId: admin.id,
      actorName: admin.name || admin.username || "",
      ip: clientIp(req),
      action: op === "remove" ? "删除产品资料" : "修改产品状态",
      target: ids.join(",").slice(0, 180),
      changes: { before: null, after: { 数量: count, 操作: op } },
    });
    return session.sendJson(res, 200, { ok: true, count: count });
  }
  return session.sendJson(res, 400, { error: "unknown_action" });
};
