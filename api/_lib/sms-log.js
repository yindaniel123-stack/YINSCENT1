const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", "..", "data");
const dataFile = path.join(dataDir, "sms-log.json");
const MAX_ROWS = 500;

let memory = null;
let writeChain = Promise.resolve();

function capCents() {
  const value = Number(process.env.SMS_COST_CAP_CENTS);
  if (!Number.isFinite(value) || value < 0) return 5000;
  return Math.round(value);
}

function monthKey(time) {
  const date = new Date(time || Date.now());
  return date.getUTCFullYear() + "-" + String(date.getUTCMonth() + 1).padStart(2, "0");
}

function readAll() {
  if (memory) return memory.map(function (row) { return Object.assign({}, row); });
  try {
    const rows = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    return Array.isArray(rows) ? rows.map(function (row) { return Object.assign({}, row); }) : [];
  } catch (e) {
    return [];
  }
}

function save(rows) {
  const trimmed = rows.slice(-MAX_ROWS);
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    const tmp = dataFile + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(trimmed, null, 2));
    fs.renameSync(tmp, dataFile);
    memory = null;
  } catch (e) {
    memory = trimmed.map(function (row) { return Object.assign({}, row); });
  }
}

function spentCents(rows, month) {
  return rows.reduce(function (sum, row) {
    if (row.month !== month || !row.sent) return sum;
    return sum + (Number(row.costCents) || 0);
  }, 0);
}

function canSpend(costCents) {
  const cost = Math.max(0, Number(costCents) || 0);
  const cap = capCents();
  if (cap === 0) return false;
  const month = monthKey();
  return spentCents(readAll(), month) + cost <= cap;
}

function record(entry) {
  const run = writeChain.then(function () {
    const rows = readAll();
    rows.push(entry);
    save(rows);
    return entry;
  });
  writeChain = run.then(function () {}, function () {});
  return run;
}

function summary() {
  const month = monthKey();
  const rows = readAll();
  return {
    month: month,
    capCents: capCents(),
    spentCents: spentCents(rows, month),
    records: rows.slice(-50).reverse().map(function (row) {
      return {
        at: row.at,
        phone: row.phone,
        lane: row.lane,
        provider: row.provider,
        switched: !!row.switched,
        sent: !!row.sent,
        costCents: row.sent ? Number(row.costCents) || 0 : 0,
        reason: row.reason || "",
        attempts: Array.isArray(row.attempts) ? row.attempts.length : 0,
      };
    }),
  };
}

module.exports = { capCents, canSpend, record, summary, monthKey };
