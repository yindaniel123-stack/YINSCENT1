const catalogStore = require("../_lib/catalog-store");
const productSource = require("../_lib/product-source");
const trade = require("../_lib/trade-products");
const { currentUser, session } = require("../_lib/access");

function catalog() {
  return productSource.load();
}

module.exports = function handler(req, res) {
  if (req.method !== "GET") return session.sendJson(res, 405, { error: "method" });
  const admin = session.readAdmin(req);
  const member = currentUser(req);
  if (!admin && !member) {
    return session.sendJson(res, 401, { error: "unauthorized", login: "/login.html" });
  }
  const data = catalog();
  const overrides = catalogStore.read();
  const saved = {};
  trade.list().forEach(function (row) { saved[row.id] = row; });
  const products = data.products.filter(function (product) {
    const row = saved[product.id];
    return !row || row.status !== "disabled";
  }).map(function (product) {
    const next = Object.assign({}, product);
    const row = saved[product.id];
    if (row && row.price) next.price = String(row.price);
    if (row && row.sku) next.sku = String(row.sku);
    else if (product.ref) next.sku = String(product.ref);
    if (overrides.prices[product.id] != null) next.price = String(overrides.prices[product.id]);
    next.stock = overrides.stock[product.id] == null ? null : overrides.stock[product.id];
    if (row && row.stock) next.stock = row.stock;
    if (row && row.name) next.tradeName = row.name;
    return next;
  });
  return session.sendJson(res, 200, { products: products, categories: data.categories });
};
