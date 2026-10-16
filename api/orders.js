const session = require("./_lib/session");
const store = require("./_lib/orders");
const notices = require("./_lib/notices");
const mailer = require("./_lib/mail");
const { currentUser } = require("./_lib/access");

/*
 * POST: record a completed order (legacy; storefront checkout is disabled).
 *       Stores no personal data - just order id, totals, and line items.
 * GET:  list recorded orders. Admin session required.
 */
module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    if (!session.isAuthorized(req)) {
      return session.sendJson(res, 401, { error: "Not signed in" });
    }
    return session.sendJson(res, 200, { orders: store.readOrders() });
  }

  if (req.method !== "POST") {
    return session.sendJson(res, 405, { error: "Method not allowed" });
  }

  const member = currentUser(req);
  if (!member) return session.sendJson(res, 401, { error: "unauthorized", login: "/login.html" });

  let body;
  try {
    body = await session.readJsonBody(req);
  } catch (e) {
    return session.sendJson(res, 400, { error: "Invalid request body" });
  }

  const id = String(body.id || "").slice(0, 64);
  const total = Number(body.total);
  if (!id || !isFinite(total) || total <= 0 || total > 100000) {
    return session.sendJson(res, 400, { error: "Invalid order" });
  }

  const items = Array.isArray(body.items)
    ? body.items.slice(0, 100).map(function (item) {
        return {
          id: String(item.id || "").slice(0, 64),
          qty: Math.max(1, Math.min(99, parseInt(item.qty, 10) || 1)),
          price: Number(item.price) || 0,
        };
      })
    : [];

  const added = store.addOrder({
    id: id,
    total: Math.round(total * 100) / 100,
    currency: String(body.currency || "CNY").slice(0, 3),
    items: items,
    userId: member.id,
    customerName: member.name || member.username || "",
    phone: member.phone || "",
    email: member.email || "",
    status: "已提交",
    orderStatus: "待付款",
    payStatus: "未付款",
    createdAt: new Date().toISOString(),
  });
  if (added) notices.orderCreated(store.readOrders().filter(function (order) { return order.id === id; })[0] || { id: id }, mailer.origin(req)).catch(function () {});

  return session.sendJson(res, added ? 201 : 200, { ok: true });
};
