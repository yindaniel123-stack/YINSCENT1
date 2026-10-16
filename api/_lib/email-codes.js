const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", "..", "data");
const dataFile = path.join(dataDir, "email-codes.json");
const TTL_MS = 10 * 60 * 1000;
const COOLDOWN_MS = 60 * 1000;

function readAll() {
  try {
    const rows = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    return Array.isArray(rows) ? rows : [];
  } catch (e) {
    return [];
  }
}

function save(rows) {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(dataFile, JSON.stringify(rows.slice(-200), null, 2));
}

function hash(code) {
  return crypto.createHash("sha256").update(String(code)).digest("hex");
}

function tooSoon(email, purpose) {
  const row = readAll().find(function (item) {
    return item.email === email && item.purpose === purpose;
  });
  if (!row) return 0;
  const wait = COOLDOWN_MS - (Date.now() - row.sentAt);
  return wait > 0 ? wait : 0;
}

function issue(email, purpose) {
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
  const rows = readAll().filter(function (item) {
    return !(item.email === email && item.purpose === purpose);
  });
  rows.push({
    email: email,
    purpose: purpose,
    hash: hash(code),
    exp: Date.now() + TTL_MS,
    attempts: 0,
    sentAt: Date.now(),
  });
  save(rows);
  return code;
}

function check(email, purpose, code) {
  const rows = readAll();
  const row = rows.find(function (item) {
    return item.email === email && item.purpose === purpose;
  });
  if (!row || row.exp < Date.now() || !/^\d{6}$/.test(String(code || ""))) return false;
  row.attempts += 1;
  const given = hash(code);
  const same = row.hash.length === given.length && crypto.timingSafeEqual(Buffer.from(row.hash), Buffer.from(given));
  if (!same || row.attempts > 5) {
    save(same ? rows.filter(function (item) { return item !== row; }) : rows);
    return false;
  }
  save(rows.filter(function (item) { return item !== row; }));
  return true;
}

module.exports = { tooSoon, issue, check };
