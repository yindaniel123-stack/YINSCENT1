/*
 * Shared admin session helpers for the /api functions.
 * Sessions are stateless HMAC-signed tokens carried in an HttpOnly cookie,
 * so no database is needed. Signing uses ADMIN_SESSION_SECRET when set,
 * otherwise a secret derived from ADMIN_PASSWORD (single env var setup).
 */
const crypto = require("crypto");

const COOKIE_NAME = "yinscent_admin";
const MEMBER_COOKIE = "yinscent_user";
const SESSION_TTL_SECONDS = 8 * 60 * 60;
const MEMBER_TTL_SECONDS = 14 * 24 * 60 * 60;

function getSecret() {
  const explicit = process.env.ADMIN_SESSION_SECRET;
  if (explicit) return explicit;
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return crypto.createHash("sha256").update("yinscent-session:" + password).digest("hex");
}

function memberSecret() {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return crypto.createHash("sha256").update("yinscent-member:" + password).digest("hex");
}

function sign(value, secret) {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

function createToken() {
  const secret = getSecret();
  if (!secret) return null;
  const payload = String(Date.now() + SESSION_TTL_SECONDS * 1000);
  return payload + "." + sign(payload, secret);
}

function createAdminToken(admin) {
  const secret = getSecret();
  if (!secret || !admin) return null;
  const payload = Buffer.from(JSON.stringify({
    id: admin.id || "super",
    sv: Number(admin.sessionVersion) || 0,
    super: !admin.id || admin.id === "super",
    exp: Date.now() + SESSION_TTL_SECONDS * 1000,
  })).toString("base64url");
  return payload + "." + sign(payload, secret);
}

function superAdmin() {
  return {
    id: "super",
    username: "admin",
    name: "超级管理员",
    super: true,
    permissions: require("./permissions").list(),
  };
}

function readAdmin(req) {
  const token = parseCookies(req)[COOKIE_NAME];
  const secret = getSecret();
  if (!token || !secret) return null;
  const data = readSignedPayload(token, secret);
  if (data && Number(data.exp) > Date.now() && data.id) {
    if (data.super || data.id === "super") return superAdmin();
    const admin = require("./admins").findById(data.id);
    if (!admin || admin.disabled) return null;
    if (Number(data.sv) !== Number(admin.sessionVersion || 0)) return null;
    return {
      id: admin.id,
      username: admin.username,
      name: admin.name || admin.username,
      super: false,
      permissions: require("./permissions").normalize(admin.permissions),
    };
  }
  if (verifyToken(token)) return superAdmin();
  return null;
}

function verifyToken(token) {
  const secret = getSecret();
  if (!secret || !token) return false;
  const dot = token.lastIndexOf(".");
  if (dot < 1) return false;
  const payload = token.slice(0, dot);
  const expected = sign(payload, secret);
  const given = Buffer.from(token.slice(dot + 1));
  const wanted = Buffer.from(expected);
  if (given.length !== wanted.length || !crypto.timingSafeEqual(given, wanted)) {
    return false;
  }
  return Number(payload) > Date.now();
}

function parseCookies(req) {
  const cookies = {};
  (req.headers.cookie || "").split(";").forEach(function (part) {
    const eq = part.indexOf("=");
    if (eq > 0) {
      cookies[part.slice(0, eq).trim()] = decodeURIComponent(part.slice(eq + 1).trim());
    }
  });
  return cookies;
}

function safeEqualText(given, expected) {
  const a = Buffer.from(String(given));
  const b = Buffer.from(String(expected));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function readSignedPayload(token, secret) {
  if (!secret || !token) return null;
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;
  const payload = token.slice(0, dot);
  const expected = sign(payload, secret);
  if (!safeEqualText(token.slice(dot + 1), expected)) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch (e) {
    return null;
  }
}

function createMemberToken(userId, sessionVersion) {
  const secret = memberSecret();
  if (!secret || !userId) return null;
  const payload = Buffer.from(
    JSON.stringify({
      sub: userId,
      sv: Number(sessionVersion) || 0,
      exp: Date.now() + MEMBER_TTL_SECONDS * 1000,
    })
  ).toString("base64url");
  return payload + "." + sign(payload, secret);
}

function readMember(req) {
  const data = readSignedPayload(parseCookies(req)[MEMBER_COOKIE], memberSecret());
  if (!data || !data.sub || Number(data.exp) <= Date.now()) return null;
  return data;
}

/* Admin password session, or a member whose stored role is admin. */
function isAuthorized(req) {
  if (readAdmin(req)) return true;
  const member = readMember(req);
  if (!member) return false;
  const user = require("./users").findById(member.sub);
  if (!user || user.disabled || user.role !== "admin") return false;
  return Number(member.sv) === Number(user.sessionVersion || 0);
}

function cookieAttributes(req, sameSite) {
  const host = (req.headers.host || "").split(":")[0];
  const isLocal = host === "localhost" || host === "127.0.0.1" || host === "::1";
  return "Path=/; HttpOnly; SameSite=" + (sameSite || "Strict") + (isLocal ? "" : "; Secure");
}

function sessionCookie(req, token) {
  return COOKIE_NAME + "=" + token + "; Max-Age=" + SESSION_TTL_SECONDS + "; " + cookieAttributes(req);
}

function clearCookie(req) {
  return COOKIE_NAME + "=; Max-Age=0; " + cookieAttributes(req);
}

function memberCookie(req, token) {
  return (
    MEMBER_COOKIE +
    "=" +
    token +
    "; Max-Age=" +
    MEMBER_TTL_SECONDS +
    "; " +
    cookieAttributes(req, "Lax")
  );
}

function clearMemberCookie(req) {
  return MEMBER_COOKIE + "=; Max-Age=0; " + cookieAttributes(req, "Lax");
}

function tempCookie(req, name, value, maxAge) {
  return name + "=" + encodeURIComponent(value) + "; Max-Age=" + maxAge + "; " + cookieAttributes(req, "Lax");
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

/* Works both on Vercel (body pre-parsed) and a plain Node http server. */
async function readJsonBody(req) {
  if (req.body !== undefined) {
    return typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

module.exports = {
  createToken,
  createAdminToken,
  createMemberToken,
  readMember,
  readAdmin,
  isAuthorized,
  sessionCookie,
  clearCookie,
  memberCookie,
  clearMemberCookie,
  tempCookie,
  parseCookies,
  sendJson,
  readJsonBody,
};
