const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", "..", "data");
const dataFile = path.join(dataDir, "audit-log.json");

function readAll() {
  try {
    const rows = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    return Array.isArray(rows) ? rows : [];
  } catch (e) {
    return [];
  }
}

function cleanChanges(value) {
  if (!value || typeof value !== "object") return value || {};
  const out = Array.isArray(value) ? [] : {};
  Object.keys(value).forEach(function (key) {
    if (key === "密码" || key === "password" || key === "pass" || key === "passwordHash" || key === "issuedPassword") return;
    const item = value[key];
    out[key] = item && typeof item === "object" ? cleanChanges(item) : item;
  });
  return out;
}

function add(entry) {
  const rows = readAll();
  rows.push({
    at: new Date().toISOString(),
    actorId: entry.actorId || "",
    actorName: entry.actorName || "",
    ip: entry.ip || "",
    action: entry.action || "",
    target: entry.target || "",
    changes: cleanChanges(entry.changes),
  });
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(dataFile, JSON.stringify(rows.slice(-300), null, 2));
  } catch (e) {}
}

function recent() {
  return readAll().slice(-100).reverse();
}

function clearAll() {
  fs.mkdirSync(dataDir, { recursive: true });
  const tmp = dataFile + ".tmp";
  fs.writeFileSync(tmp, "[]\n");
  fs.renameSync(tmp, dataFile);
}

module.exports = { add: add, recent: recent, clearAll: clearAll };
