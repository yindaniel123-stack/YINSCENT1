const fs = require("fs");
const path = require("path");
const vm = require("vm");
const audit = require("../../_lib/audit");
const catalogStore = require("../../_lib/catalog-store");
const orders = require("../../_lib/orders");
const notices = require("../../_lib/notices");
const mailer = require("../../_lib/mail");
const { allow } = require("../../_lib/guard");
const { clientIp, session } = require("../../_lib/access");

const PAY = ["未付款", "已付款"];
const SHIP = ["未发货", "待发货", "已发货"];
const SERVICE = ["无", "处理中", "已完成"];
const STAGES = ["待付款", "待审核", "待发货", "已发货", "已完成", "已取消"];

function stagePatch(status) {
  if (STAGES.indexOf(status) === -1) return null;
  if (status === "待付款") return { orderStatus: status, payStatus: "未付款" };
  if (status === "待审核") return { orderStatus: status, payStatus: "已付款", shipStatus: "未发货" };
  if (status === "待发货") return { orderStatus: status, shipStatus: "待发货", payStatus: "已付款" };
  if (status === "已发货") return { orderStatus: status, shipStatus: "已发货" };
  if (status === "已完成") return { orderStatus: status, service: "已完成" };
  return { orderStatus: status };
}

function flowPatch(flow) {
  const names = ["待发货", "已发货", "运输中", "已签收", "异常", "已关闭"];
  if (names.indexOf(flow) === -1) return null;
  let patch = { shipStage: flow };
  if (flow === "待发货") patch = Object.assign(stagePatch("待发货"), { shipStage: flow });
  if (flow === "已发货" || flow === "运输中") patch = Object.assign(stagePatch("已发货"), { shipStage: flow });
  if (flow === "已签收") patch = Object.assign(stagePatch("已完成"), { shipStage: flow });
  if (flow === "已关闭") patch = Object.assign(stagePatch("已取消"), { shipStage: flow });
  return patch;
}

function clipText(value, max) {
  return String(value || "").replace(/[\u0000-\u001f]/g, "").trim().slice(0, max);
}

function catalogProducts() {
  const file = path.join(__dirname, "..", "..", "js", "products.js");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(file, "utf8"), sandbox, { filename: "products.js" });
  return sandbox.window.YINSCENT_PRODUCTS || [];
}

function record(req, admin, action, target, changes) {
  audit.add({
    actorId: admin.id,
    actorName: admin.name || admin.username || "",
    ip: clientIp(req),
    action: action,
    target: target,
    changes: changes,
  });
}

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    const admin = allow(req, res, ["desk", "reports", "products", "prices", "orders", "payments", "stock", "shipping", "service", "dashboard"]);
    if (!admin) return;
    return session.sendJson(res, 200, { overrides: catalogStore.read() });
  }
  if (req.method !== "POST") return session.sendJson(res, 405, { error: "method" });

  let body;
  try {
    body = await session.readJsonBody(req);
  } catch (e) {
    return session.sendJson(res, 400, { error: "invalid_body" });
  }
  const action = String(body.action || "");

  if (action === "order-create") {
    const admin = allow(req, res, ["orders"]);
    if (!admin) return;
    const customerName = clipText(body.customerName, 40);
    const phone = String(body.phone || "").replace(/[^\d+\-\s]/g, "").trim().slice(0, 20);
    const contactPhone = String(body.contactPhone || "").replace(/[^\d+\-\s]/g, "").trim().slice(0, 20);
    if (!customerName) return session.sendJson(res, 400, { error: "invalid_order" });
    const products = catalogProducts();
    const overrides = catalogStore.read();
    const items = [];
    let total = 0;
    (Array.isArray(body.items) ? body.items : []).slice(0, 50).forEach(function (item) {
      const itemId = String(item && item.id || "").slice(0, 64);
      const product = products.filter(function (row) { return row.id === itemId; })[0];
      if (!product) return;
      const qty = Math.max(1, Math.min(9999, parseInt(item.qty, 10) || 1));
      const price = overrides.prices[itemId] != null ? Number(overrides.prices[itemId]) : Number(product.price) || 0;
      if (!isFinite(price) || price < 0) return;
      items.push({ id: itemId, qty: qty, price: price });
      total += price * qty;
    });
    total = Math.round(total * 100) / 100;
    if (!items.length || total <= 0) return session.sendJson(res, 400, { error: "invalid_order" });
    const types = ["客户", "经销商"];
    const created = orders.createOrder({
      customerName: customerName,
      customerType: types.indexOf(body.customerType) === -1 ? "" : body.customerType,
      phone: phone || contactPhone,
      contactPhone: contactPhone,
      receiver: clipText(body.receiver, 40),
      country: clipText(body.country, 40),
      city: clipText(body.city, 40),
      address: clipText(body.address, 200),
      postcode: clipText(body.postcode, 20),
      note: clipText(body.note, 500),
      source: clipText(body.source, 40),
      freight: body.freight,
      discount: body.discount,
      goodsTotal: total,
      shipDate: body.shipDate,
      createdAt: body.createdAt,
      userId: clipText(body.userId, 40),
      items: items,
      total: total,
      payStatus: body.payStatus === "已付款" ? "已付款" : "未付款",
    });
    record(req, admin, "新建订单", created.id, { before: null, after: { 客户: customerName, 金额: created.total } });
    notices.orderCreated(created, mailer.origin(req)).catch(function () {});
    return session.sendJson(res, 201, { ok: true, order: created });
  }

  if (action === "order-batch") {
    const admin = allow(req, res, ["orders", "shipping"]);
    if (!admin) return;
    const ids = Array.isArray(body.ids) ? body.ids.map(function (item) {
      return String(item || "").slice(0, 80);
    }).filter(Boolean).slice(0, 500) : [];
    const patch = {};
    if (body.orderStatus) {
      const stage = stagePatch(String(body.orderStatus));
      if (!stage) return session.sendJson(res, 400, { error: "invalid_status" });
      Object.assign(patch, stage);
    }
    if (body.shipStage) {
      const flow = flowPatch(String(body.shipStage));
      if (!flow) return session.sendJson(res, 400, { error: "invalid_status" });
      Object.assign(patch, flow);
    }
    if (body.carrier != null) patch.carrier = clipText(body.carrier, 40);
    if (body.tracking != null) patch.tracking = clipText(body.tracking, 80);
    if (body.warehouse != null) patch.warehouse = clipText(body.warehouse, 40);
    if (!ids.length || !Object.keys(patch).length) return session.sendJson(res, 400, { error: "invalid_status" });
    let count = 0;
    const origin = mailer.origin(req);
    ids.forEach(function (item) {
      const existing = orders.readOrders().filter(function (order) { return order.id === item; })[0];
      const before = existing ? Object.assign({}, existing) : null;
      const row = orders.updateOrder(item, patch);
      if (row) {
        count += 1;
        notices.orderUpdated(before, row, origin).catch(function () {});
      }
    });
    record(req, admin, "批量更新订单", ids.join(",").slice(0, 180), { before: null, after: { 数量: count, 发货: patch.shipStage || patch.orderStatus || "" } });
    return session.sendJson(res, 200, { ok: true, count: count });
  }

  const id = String(body.id || "").slice(0, 80);
  if (!id) return session.sendJson(res, 400, { error: "invalid_id" });

  if (action === "price") {
    const admin = allow(req, res, "prices");
    if (!admin) return;
    const price = Number(body.price);
    if (!isFinite(price) || price <= 0 || price > 100000) return session.sendJson(res, 400, { error: "invalid_price" });
    const saved = price.toFixed(2);
    catalogStore.setPrice(id, saved);
    record(req, admin, "修改价格", id, { before: null, after: { 价格: saved } });
    return session.sendJson(res, 200, { ok: true, price: saved });
  }

  if (action === "stock") {
    const admin = allow(req, res, "stock");
    if (!admin) return;
    const qty = parseInt(body.stock, 10);
    if (!isFinite(qty) || qty < 0 || qty > 1000000) return session.sendJson(res, 400, { error: "invalid_stock" });
    const previous = catalogStore.read().stock[id];
    catalogStore.setStock(id, qty);
    const product = catalogProducts().filter(function (item) { return item.id === id; })[0] || { id: id, name: id, sku: id };
    notices.stockChanged({ id: id, name: product.name || id, sku: product.id || id }, previous, qty).catch(function () {});
    record(req, admin, "修改库存", id, { before: null, after: { 库存: qty } });
    return session.sendJson(res, 200, { ok: true, stock: qty });
  }

  if (action === "order") {
    const admin = allow(req, res, ["orders", "payments", "shipping", "service"]);
    if (!admin) return;
    const patch = {};
    if (body.payStatus != null) {
      if (PAY.indexOf(body.payStatus) === -1) return session.sendJson(res, 400, { error: "invalid_status" });
      if (!admin.super && (admin.permissions || []).indexOf("payments") === -1 && (admin.permissions || []).indexOf("orders") === -1) {
        return session.sendJson(res, 403, { error: "forbidden" });
      }
      patch.payStatus = body.payStatus;
    }
    if (body.shipStatus != null) {
      if (SHIP.indexOf(body.shipStatus) === -1) return session.sendJson(res, 400, { error: "invalid_status" });
      if (!admin.super && (admin.permissions || []).indexOf("shipping") === -1 && (admin.permissions || []).indexOf("orders") === -1) {
        return session.sendJson(res, 403, { error: "forbidden" });
      }
      patch.shipStatus = body.shipStatus;
    }
    if (body.service != null) {
      if (SERVICE.indexOf(body.service) === -1) return session.sendJson(res, 400, { error: "invalid_status" });
      if (!admin.super && (admin.permissions || []).indexOf("service") === -1 && (admin.permissions || []).indexOf("orders") === -1) {
        return session.sendJson(res, 403, { error: "forbidden" });
      }
      patch.service = body.service;
    }
    if (body.serviceNote != null) patch.serviceNote = String(body.serviceNote).slice(0, 200);
    if (body.orderStatus != null) {
      const stage = stagePatch(String(body.orderStatus));
      if (!stage) return session.sendJson(res, 400, { error: "invalid_status" });
      Object.assign(patch, stage);
    }
    if (body.tracking != null) patch.tracking = clipText(body.tracking, 80);
    if (body.shipStage != null) {
      const flow = flowPatch(String(body.shipStage));
      if (!flow) return session.sendJson(res, 400, { error: "invalid_status" });
      Object.assign(patch, flow);
    }
    if (body.address != null) patch.address = clipText(body.address, 200);
    if (body.warehouse != null) patch.warehouse = clipText(body.warehouse, 40);
    if (body.carrier != null) patch.carrier = clipText(body.carrier, 40);
    if (body.urge) patch.urgedAt = new Date().toISOString();
    const existing = orders.readOrders().filter(function (order) { return order.id === id; })[0];
    const beforeOrder = existing ? Object.assign({}, existing) : null;
    const row = orders.updateOrder(id, patch);
    if (!row) return session.sendJson(res, 404, { error: "not_found" });
    notices.orderUpdated(beforeOrder, row, mailer.origin(req)).catch(function () {});
    record(req, admin, "更新订单", id, { before: null, after: patch });
    return session.sendJson(res, 200, { ok: true, order: row });
  }

  return session.sendJson(res, 400, { error: "invalid_action" });
};
