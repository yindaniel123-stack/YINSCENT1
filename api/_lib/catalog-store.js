const fs = require("fs");
const path = require("path");

const dataFile = path.join(__dirname, "..", "..", "data", "catalog-overrides.json");

function read() {
  try {
    const data = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    return {
      prices: data && data.prices && typeof data.prices === "object" ? data.prices : {},
      stock: data && data.stock && typeof data.stock === "object" ? data.stock : {},
    };
  } catch (e) {
    return { prices: {}, stock: {} };
  }
}

function write(data) {
  fs.mkdirSync(path.dirname(dataFile), { recursive: true });
  fs.writeFileSync(dataFile, JSON.stringify({ prices: data.prices, stock: data.stock }, null, 2));
}

function setPrice(id, price) {
  const data = read();
  data.prices[id] = price;
  write(data);
}

function setStock(id, qty) {
  const data = read();
  data.stock[id] = qty;
  write(data);
}

module.exports = { read, setPrice, setStock };
