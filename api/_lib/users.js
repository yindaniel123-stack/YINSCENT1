/*
 * Member store. Writes data/users.json when the disk is writable.
 * Passwords are Argon2id hashes only. Plaintext passwords are never stored.
 * Email tokens are stored as hashes. Role is never accepted from the client.
 */
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", "..", "data");
const dataFile = path.join(dataDir, "users.json");

let memoryUsers = null;
let writeChain = Promise.resolve();

function withoutSecrets(user) {
  const copy = copyUser(user);
  delete copy.passwordHistory;
  return copy;
}

function readUsers() {
  try {
    const users = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    if (!Array.isArray(users)) return [];
    return users.map(withoutSecrets);
  } catch (e) {
    if (e && e.code === "ENOENT") return [];
    if (memoryUsers) return memoryUsers.map(withoutSecrets);
    throw e;
  }
}

function saveUsers(users) {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    const tmp = dataFile + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(users, null, 2));
    fs.renameSync(tmp, dataFile);
    memoryUsers = null;
  } catch (e) {
    memoryUsers = users.map(copyUser);
  }
}

function copyUser(user) {
  return Object.assign({}, user);
}

function update(mutator) {
  const run = writeChain.then(function () {
    const users = readUsers();
    const result = mutator(users);
    saveUsers(users);
    return result;
  });
  writeChain = run.then(
    function () {},
    function () {}
  );
  return run;
}

async function hashPassword(password) {
  const { argon2id } = require("hash-wasm");
  return argon2id({
    password: String(password),
    salt: crypto.randomBytes(16),
    parallelism: 1,
    iterations: 2,
    memorySize: 19456,
    hashLength: 32,
    outputType: "encoded",
  });
}

async function verifyPassword(password, stored) {
  const value = String(stored || "");
  if (value.startsWith("$argon2id$")) {
    const { argon2Verify } = require("hash-wasm");
    return argon2Verify({ password: String(password), hash: value });
  }
  const parts = value.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const hash = crypto.scryptSync(String(password), parts[1], 32);
  const given = Buffer.from(parts[2], "base64url");
  if (hash.length !== given.length) return false;
  return crypto.timingSafeEqual(hash, given);
}

function hashToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("base64url");
}

function randomToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function randomId() {
  return "u_" + crypto.randomBytes(9).toString("base64url");
}

function normalizeEmail(raw) {
  let text = String(raw || "")
    .replace(/[\u0000-\u001f\u007f\u200b-\u200d\ufeff]/g, "")
    .replace(/\u3000/g, " ")
    .trim();
  const wrapped = text.match(/<([^<>]+)>/);
  if (wrapped) text = wrapped[1].trim();
  text = text.replace(/[\uff01-\uff5e]/g, function (ch) {
    return String.fromCharCode(ch.charCodeAt(0) - 0xfee0);
  }).toLowerCase();
  const at = text.lastIndexOf("@");
  if (at <= 0 || text.indexOf("@") !== at) return "";
  const local = text.slice(0, at);
  let domain = text.slice(at + 1);
  if (domain.endsWith(".")) domain = domain.slice(0, -1);
  if (!local || !domain) return "";
  try {
    const ascii = require("node:url").domainToASCII(domain);
    if (!ascii) return "";
    domain = ascii.toLowerCase();
  } catch (e) {
    return "";
  }
  if (local.length > 64 || domain.length > 253) return "";
  const email = local + "@" + domain;
  if (email.length > 254) return "";
  if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local)) return "";
  if (local.charAt(0) === "." || local.charAt(local.length - 1) === "." || local.indexOf("..") !== -1) return "";
  // Any provider. 163, 126, yeah, qq, gmail, outlook, and company domains are all accepted.
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(domain)) return "";
  return email;
}

function normalizePhone(raw, region) {
  const parsed = require("./phone").toE164(raw, region);
  return parsed ? parsed.e164 : "";
}

function cleanName(raw) {
  return String(raw || "")
    .replace(/[\u0000-\u001f]/g, "")
    .trim()
    .slice(0, 80);
}

function normalizeUsername(raw) {
  const name = String(raw || "").trim().toLowerCase();
  if (!/^[a-z0-9_]{3,32}$/.test(name)) return "";
  return name;
}

function cleanPhone(raw) {
  const value = String(raw || "").replace(/[^\d+\-\s]/g, "").trim().slice(0, 24);
  const digits = value.replace(/\D/g, "");
  if (digits.length < 6 || digits.length > 15) return "";
  return value;
}

function accountStatus(user) {
  if (!user) return "";
  if (user.disabled) return "disabled";
  if (user.status === "pending" || user.status === "rejected") return user.status;
  return "active";
}

function profileReady(user) {
  return !!(user && accountStatus(user) === "active" && user.name && user.phone && user.email && user.emailVerified);
}

function membershipValid(user) {
  if (!user || accountStatus(user) !== "active") return false;
  if (!user.membershipExpiresAt) return true;
  const exp = Date.parse(user.membershipExpiresAt);
  return !!exp && exp > Date.now();
}

function canViewProducts(user) {
  if (!profileReady(user)) return false;
  if (user.productAccess === false) return false;
  return membershipValid(user);
}

function listUsers() {
  return readUsers().slice();
}

function findByUsername(username) {
  const wanted = normalizeUsername(username);
  if (!wanted) return null;
  return readUsers().find(function (user) {
    return user.username === wanted;
  }) || null;
}

function findById(id) {
  return readUsers().find(function (user) {
    return user.id === id;
  }) || null;
}

function findByEmail(email) {
  const wanted = normalizeEmail(email);
  if (!wanted) return null;
  return readUsers().find(function (user) {
    return user.email === wanted;
  }) || null;
}

function findByPhone(phone) {
  const wanted = normalizePhone(phone);
  if (!wanted) return null;
  return readUsers().find(function (user) {
    return user.phone === wanted;
  }) || null;
}

function findByWechat(openId) {
  if (!openId) return null;
  return readUsers().find(function (user) {
    return user.wechatOpenId === openId;
  }) || null;
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username || "",
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    role: user.role === "admin" ? "admin" : "member",
    emailVerified: !!user.emailVerified,
    disabled: !!user.disabled,
    status: accountStatus(user),
    profileReady: profileReady(user),
    hasPassword: !!user.passwordHash,
    membershipExpiresAt: user.membershipExpiresAt || "",
    membershipValid: membershipValid(user),
    productAccess: user.productAccess !== false,
    canViewProducts: canViewProducts(user),
  };
}

function blankSecrets() {
  return {
    emailTokenHash: "",
    emailTokenExp: 0,
    resetTokenHash: "",
    resetTokenExp: 0,
    otpHash: "",
    otpExp: 0,
    otpAttempts: 0,
  };
}

module.exports = {
  update,
  hashPassword,
  verifyPassword,
  hashToken,
  randomToken,
  randomId,
  normalizeEmail,
  normalizeUsername,
  cleanPhone,
  accountStatus,
  profileReady,
  membershipValid,
  canViewProducts,
  normalizePhone,
  cleanName,
  listUsers,
  findByUsername,
  findById,
  findByEmail,
  findByPhone,
  findByWechat,
  publicUser,
  blankSecrets,
};
