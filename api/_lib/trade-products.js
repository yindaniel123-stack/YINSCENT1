const fs = require("fs");
const path = require("path");
const vm = require("vm");
const crypto = require("crypto");
const catalogStore = require("./catalog-store");

const dataFile = path.join(__dirname, "..", "..", "data", "trade-products.json");

function empty() {
  return { items: {} };
}

function read() {
  try {
    const data = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    if (!data || typeof data !== "object" || !data.items || typeof data.items !== "object") return empty();
    return { items: data.items };
  } catch (e) {
    if (e.code === "ENOENT") return empty();
    throw e;
  }
}

function write(data) {
  fs.mkdirSync(path.dirname(dataFile), { recursive: true });
  const tmp = dataFile + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify({ items: data.items }, null, 2));
  fs.renameSync(tmp, dataFile);
}

function catalog() {
  return require("./product-source").load().products;
}

function text(value, max) {
  return String(value == null ? "" : value).trim().slice(0, max);
}

function imageOf(product) {
  const slug = (product.images && product.images[0]) || product.slug || product.id || "";
  return slug ? "assets/products/" + slug + ".png" : "";
}

function imagesOf(body, base) {
  if (Array.isArray(body.images)) {
    return body.images.map(function (item) {
      return text(item, 400000);
    }).filter(Boolean).slice(0, 5);
  }
  const previous = Array.isArray(base.images) ? base.images.map(function (item) {
    return text(item, 400000);
  }).filter(Boolean).slice(0, 5) : [];
  if (body.image != null && String(body.image) !== String(base.image || "")) {
    const next = text(body.image, 400000);
    if (!previous.length) return next ? [next] : [];
    previous[0] = next;
    return previous.filter(Boolean);
  }
  if (previous.length) return previous;
  const one = text(body.image != null ? body.image : base.image, 400000);
  return one ? [one] : [];
}

function clean(body, fallback) {
  const base = fallback || {};
  const images = imagesOf(body, base);
  const length = text(body.length != null ? body.length : base.length, 20);
  const width = text(body.width != null ? body.width : base.width, 20);
  const height = text(body.height != null ? body.height : base.height, 20);
  const sized = [length, width, height].filter(Boolean).join(" × ");
  return {
    sku: text(body.sku != null ? body.sku : base.sku, 64),
    name: text(body.name != null ? body.name : base.name, 120),
    image: images[0] || "",
    images: images,
    barcode: text(body.barcode != null ? body.barcode : base.barcode, 64),
    category: text(body.category != null ? body.category : base.category, 40),
    brand: text(body.brand != null ? body.brand : base.brand, 40) || "YINSCENT",
    series: text(body.series != null ? body.series : base.series, 80),
    description: text(body.description != null ? body.description : base.description, 500),
    innerPack: text(body.innerPack != null ? body.innerPack : base.innerPack, 20),
    carton: text(body.carton != null ? body.carton : base.carton, 20),
    length: length,
    width: width,
    height: height,
    size: text(body.size != null ? body.size : (sized || base.size), 80),
    weight: text(body.weight != null ? body.weight : base.weight, 40),
    price: text(body.price != null ? body.price : base.price, 20),
    stock: text(body.stock != null ? body.stock : base.stock, 20),
    status: body.status === "disabled" || (body.status == null && base.status === "disabled") ? "disabled" : "enabled",
    removed: body.removed != null ? !!body.removed : !!base.removed,
  };
}

function categoryLabel(product) {
  const map = {
    "scented-candles": "香薰蜡烛",
    "reed-diffusers": "藤条香薰",
    "tealight-holders": "茶蜡烛台",
    "ceramic-burners": "陶瓷香炉",
    "incense-holders": "印度香板",
    "scented-sachets": "香包",
    "scented-wooden-balls": "留香木珠",
    "deodorizing-balls": "除臭球",
    "scented-gels": "香膏",
    "essential-oils": "精油",
    "smart-aroma-diffusers": "智能香薰机",
    "smart-aroma-refills": "智能香薰机补充液",
  };
  if (product.category && map[product.category]) return map[product.category];
  if (/-pack$/.test(product.id || "") || /-cozy$/.test(product.id || "") || /^white-tealight-/.test(product.id || "")) return "香薰茶蜡";
  return "";
}

const extraZh = {
  "Orange Cinnamon": "橙肉桂",
  "Salted Caramel": "海盐焦糖",
  "Lemongrass": "柠檬草",
  "Gingerbread": "姜饼",
  "Palo Santo": "秘鲁圣木",
  Strawberry: "草莓",
  Lemon: "柠檬",
};

let scentZh = null;

function zhScentMap() {
  if (scentZh) return scentZh;
  const file = path.join(__dirname, "..", "..", "js", "i18n.js");
  let code = "";
  try {
    code = fs.readFileSync(file, "utf8");
  } catch (e) {
    scentZh = Object.assign({}, extraZh);
    return scentZh;
  }
  const start = code.indexOf("var SCENTS = ");
  const end = code.indexOf(";\n  var PHRASES");
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext("result = " + code.slice(start + "var SCENTS = ".length, end), sandbox);
  scentZh = Object.assign({}, sandbox.result.zh || {}, extraZh);
  return scentZh;
}

let phraseZh = null;

function zhPhrases() {
  if (phraseZh) return phraseZh;
  const file = path.join(__dirname, "..", "..", "js", "i18n.js");
  let code = "";
  try {
    code = fs.readFileSync(file, "utf8");
  } catch (e) {
    phraseZh = [];
    return phraseZh;
  }
  const token = "var PHRASES = ";
  const brace = code.indexOf("{", code.indexOf(token));
  let depth = 0;
  let inStr = false;
  let esc = false;
  let end = brace;
  for (let i = brace; i < code.length; i++) {
    const ch = code[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext("result = " + code.slice(brace, end + 1), sandbox);
  phraseZh = (sandbox.result && sandbox.result.zh) || [];
  return phraseZh;
}

function chineseName(name) {
  let out = String(name || "");
  zhPhrases()
    .slice()
    .sort(function (a, b) { return b[0].length - a[0].length; })
    .forEach(function (pair) {
      if (pair[0]) out = out.split(pair[0]).join(pair[1]);
    });
  const map = zhScentMap();
  Object.keys(map)
    .sort(function (a, b) { return b.length - a.length; })
    .forEach(function (en) {
      if (!en) return;
      const escaped = en.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      out = out.replace(new RegExp("(?<![A-Za-z])" + escaped + "(?![A-Za-z])", "g"), map[en]);
    });
  return out;
}

function catalogSku(product) {
  if (product.ref && product.category !== "essential-oils" && product.category !== "scented-sachets") return String(product.ref);
  return product.id;
}

function catalogDefaults(product) {
  return {
    sku: catalogSku(product),
    name: product.name || "",
    image: imageOf(product),
    category: categoryLabel(product),
    brand: "YINSCENT",
    barcode: "",
    innerPack: "",
    carton: "",
    size: "",
    weight: "",
    price: "",
    stock: "",
    status: "enabled",
    removed: false,
  };
}

function list() {
  const saved = read().items;
  const overrides = catalogStore.read();
  const rows = [];
  const seen = {};
  catalog().forEach(function (product) {
    const extra = saved[product.id] || null;
    if (extra && extra.removed) {
      seen[product.id] = true;
      return;
    }
    const catalogPrice = overrides.prices[product.id] != null ? String(overrides.prices[product.id]) : String(product.price || "");
    const catalogStock = overrides.stock[product.id] == null ? "" : String(overrides.stock[product.id]);
    const row = Object.assign({
      id: product.id,
      catalog: true,
      sku: catalogSku(product),
      name: product.name || "",
      image: imageOf(product),
      barcode: "",
      innerPack: "",
      carton: "",
      size: "",
      weight: "",
      category: categoryLabel(product),
      brand: "YINSCENT",
      series: product.series || "",
      status: "enabled",
      price: catalogPrice,
      stock: catalogStock,
    }, extra || {});
    row.id = product.id;
    row.catalog = true;
    row.price = extra && extra.price !== "" && extra.price != null ? String(extra.price) : catalogPrice;
    row.stock = extra && extra.stock !== "" && extra.stock != null ? String(extra.stock) : catalogStock;
    row.image = extra && extra.image ? extra.image : imageOf(product);
    row.status = extra && extra.status === "disabled" ? "disabled" : "enabled";
    if (!row.category) row.category = categoryLabel(product);
    if (!row.sku) row.sku = catalogSku(product);
    if (!row.name) row.name = product.name || "";
    if (!extra || extra.name == null || extra.name === "" || extra.name === product.name) row.name = chineseName(product.name || "");
    if (!row.series) row.series = product.series || "";
    rows.push(row);
    seen[product.id] = true;
  });
  Object.keys(saved).forEach(function (id) {
    if (seen[id] || (saved[id] && saved[id].removed)) return;
    const row = Object.assign({ id: id, catalog: false, status: "enabled" }, clean(saved[id]));
    row.id = id;
    row.catalog = false;
    row.status = saved[id].status === "disabled" ? "disabled" : "enabled";
    rows.push(row);
  });
  return rows;
}

function patchMany(ids, op) {
  const data = read();
  const products = catalog();
  let count = 0;
  ids.forEach(function (id) {
    const product = products.filter(function (item) { return item.id === id; })[0];
    const base = data.items[id];
    if (!product && !base) return;
    if (!product && op === "remove") {
      delete data.items[id];
      count += 1;
      return;
    }
    const defaults = product ? catalogDefaults(product) : {};
    const patch = op === "remove" ? { removed: true } : { status: op === "disable" ? "disabled" : "enabled" };
    data.items[id] = clean(Object.assign({}, defaults, base || {}, patch));
    count += 1;
  });
  if (count) write(data);
  return count;
}

function saveItem(id, fields) {
  const data = read();
  data.items[id] = clean(fields);
  write(data);
  return data.items[id];
}

function create(fields) {
  const id = "t_" + crypto.randomBytes(8).toString("base64url");
  const row = saveItem(id, fields);
  return Object.assign({ id: id, catalog: false }, row);
}

module.exports = { list: list, saveItem: saveItem, create: create, clean: clean, patchMany: patchMany };
