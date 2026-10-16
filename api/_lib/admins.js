const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const users = require("./users");
const permissions = require("./permissions");

const dataDir = path.join(__dirname, "..", "..", "data");
const dataFile = path.join(dataDir, "admins.json");

function readAll() {
  try {
    const rows = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    return Array.isArray(rows) ? rows : [];
  } catch (e) {
    return [];
  }
}

function writeAll(rows) {
  fs.mkdirSync(dataDir, { recursive: true });
  const tmp = dataFile + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(rows, null, 2));
  fs.renameSync(tmp, dataFile);
}

function findById(id) {
  return readAll().find(function (admin) { return admin.id === id; }) || null;
}

function findByUsername(username) {
  const wanted = users.normalizeUsername(username);
  if (!wanted) return null;
  return readAll().find(function (admin) { return admin.username === wanted; }) || null;
}

function publicAdmin(admin) {
  if (!admin) return null;
  return {
    id: admin.id,
    username: admin.username || "",
    name: admin.name || "",
    disabled: !!admin.disabled,
    super: false,
    permissions: permissions.normalize(admin.permissions),
    password: admin.issuedPassword || "",
    createdAt: admin.createdAt || "",
  };
}

function randomId() {
  return "a_" + crypto.randomBytes(8).toString("base64url");
}

module.exports = {
  readAll: readAll,
  writeAll: writeAll,
  findById: findById,
  findByUsername: findByUsername,
  publicAdmin: publicAdmin,
  randomId: randomId,
};
