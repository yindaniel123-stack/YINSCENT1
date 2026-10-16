const store = require("../_lib/orders");
const { currentUser, session } = require("../_lib/access");

module.exports = function handler(req, res) {
  if (req.method !== "GET") return session.sendJson(res, 405, { error: "method" });
  const user = currentUser(req);
  if (!user) return session.sendJson(res, 401, { error: "unauthorized" });
  const orders = store.readOrders().filter(function (order) {
    return order.userId === user.id;
  }).map(function (order) {
    return {
      id: order.id,
      total: order.total,
      currency: order.currency || "CNY",
      items: order.items || [],
      status: order.status || "已提交",
      createdAt: order.createdAt,
    };
  });
  return session.sendJson(res, 200, { orders: orders });
};
