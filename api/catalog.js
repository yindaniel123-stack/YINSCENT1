const fs = require("fs");
const path = require("path");
const vm = require("vm");
const catalogStore = require("./_lib/catalog-store");
const trade = require("./_lib/trade-products");
const { currentUser, session } = require("./_lib/access");

let cache = null;

function catalog() {
  if (cache) return cache;
  const file = path.join(__dirname, "..", "js", "products.js");
  const code = fs.readFileSync(file, "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: "products.js" });
  cache = {
    products: sandbox.window.YINSCENT_PRODUCTS || [],
    categories: sandbox.window.YINSCENT_CATEGORIES || [],
  };
  return cache;
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
