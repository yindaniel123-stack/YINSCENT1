const catalogStore = require("../_lib/catalog-store");
const productSource = require("../_lib/product-source");
const trade = require("../_lib/trade-products");
const { currentUser, session } = require("../_lib/access");

function catalog() {
  return productSource.load();
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return session.sendJson(res, 405, { error: "method" });
  const admin = session.readAdmin(req);
  const member = await currentUser(req);
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
    delete next.innerPack;
    delete next.carton;
    delete next.length;
    delete next.width;
    delete next.height;
    delete next.size;
    delete next.weight;
    delete next.barcode;
    if (!admin && !member) {
      delete next.price;
      delete next.price2;
      delete next.price3;
      delete next.price3Rule;
      delete next.stock;
    }
    return next;
  });
  return session.sendJson(res, 200, { products: products, categories: data.categories });
};
