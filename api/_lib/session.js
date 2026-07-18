/*
 * Shared admin session helpers for the /api functions.
 * Sessions are stateless HMAC-signed tokens carried in an HttpOnly cookie,
 * so no database is needed. Signing uses ADMIN_SESSION_SECRET when set,
 * otherwise a secret derived from ADMIN_PASSWORD (single env var setup).
 */
const crypto = require("crypto");

const COOKIE_NAME = "yinscent_admin";
const SESSION_TTL_SECONDS = 8 * 60 * 60;

function getSecret() {
  const explicit = process.env.ADMIN_SESSION_SECRET;
  if (explicit) return explicit;
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return crypto.createHash("sha256").update("yinscent-session:" + password).digest("hex");
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

/* The authorization gate: any admin API should return 401 when this is false. */
function isAuthorized(req) {
  return verifyToken(parseCookies(req)[COOKIE_NAME]);
}

function cookieAttributes(req) {
  const host = (req.headers.host || "").split(":")[0];
  const isLocal = host === "localhost" || host === "127.0.0.1";
  return "Path=/; HttpOnly; SameSite=Strict" + (isLocal ? "" : "; Secure");
}

function sessionCookie(req, token) {
  return COOKIE_NAME + "=" + token + "; Max-Age=" + SESSION_TTL_SECONDS + "; " + cookieAttributes(req);
}

function clearCookie(req) {
  return COOKIE_NAME + "=; Max-Age=0; " + cookieAttributes(req);
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
  isAuthorized,
  sessionCookie,
  clearCookie,
  sendJson,
  readJsonBody,
};
