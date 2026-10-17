const fs = require("fs");
const path = require("path");
const vm = require("vm");

function candidates() {
  return [
    path.join(__dirname, "..", "..", "js", "products.js"),
    path.join(__dirname, "..", "js", "products.js"),
    path.join(process.cwd(), "js", "products.js"),
    path.join(process.cwd(), "api", "..", "js", "products.js"),
  ];
}

function productsFile() {
  const found = candidates().find(function (file) {
    return fs.existsSync(file);
  });
  if (found) return found;
  const error = new Error("products.js was not found");
  error.code = "ENOENT";
  throw error;
}

let cache = null;

function load() {
  if (cache) return cache;
  const code = fs.readFileSync(productsFile(), "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: "products.js" });
  cache = {
    products: sandbox.window.YINSCENT_PRODUCTS || [],
    categories: sandbox.window.YINSCENT_CATEGORIES || [],
  };
  return cache;
}

module.exports = { load, productsFile };
