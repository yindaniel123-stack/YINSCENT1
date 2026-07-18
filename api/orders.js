const session = require("./_lib/session");
const store = require("./_lib/orders");

/*
 * POST: record a completed order (called by checkout after PayPal capture).
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
    currency: String(body.currency || "GBP").slice(0, 3),
    items: items,
    createdAt: new Date().toISOString(),
  });

  return session.sendJson(res, added ? 201 : 200, { ok: true });
};
