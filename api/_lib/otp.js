const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", "..", "data");
const dataFile = path.join(dataDir, "otp.json");
const TTL_MS = 5 * 60 * 1000;
const COOLDOWN_MS = 60 * 1000;

let memory = null;
let writeChain = Promise.resolve();

function readAll() {
  if (memory) return memory.map(copy);
  try {
    const rows = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    return Array.isArray(rows) ? rows.map(copy) : [];
  } catch (e) {
    return [];
  }
}

function save(rows) {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    const tmp = dataFile + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(rows, null, 2));
    fs.renameSync(tmp, dataFile);
    memory = null;
  } catch (e) {
    memory = rows.map(copy);
  }
}

function copy(row) {
  return Object.assign({}, row);
}

function update(mutator) {
  const run = writeChain.then(function () {
    const now = Date.now();
    const rows = readAll().filter(function (row) {
      return row.exp > now;
    });
    const result = mutator(rows, now);
    save(rows);
    return result;
  });
  writeChain = run.then(
    function () {},
    function () {}
  );
  return run;
}

module.exports = { TTL_MS, COOLDOWN_MS, update };
