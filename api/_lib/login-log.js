const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", "..", "data");
const dataFile = path.join(dataDir, "login-log.json");

function readAll() {
  try {
    const rows = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    return Array.isArray(rows) ? rows : [];
  } catch (e) {
    return [];
  }
}

function add(entry) {
  const rows = readAll();
  rows.push(entry);
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(dataFile, JSON.stringify(rows.slice(-300), null, 2));
  } catch (e) {}
}

function recent() {
  return readAll().slice(-80).reverse();
}

module.exports = { add, recent };
