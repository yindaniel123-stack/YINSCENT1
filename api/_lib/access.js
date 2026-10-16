const session = require("./session");
const users = require("./users");

const hits = new Map();

function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded) return forwarded.split(",")[0].trim();
  return (req.socket && req.socket.remoteAddress) || "unknown";
}

function limitInfo(key, max, windowMs) {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter(function (time) {
    return now - time < windowMs;
  });
  if (recent.length >= max) {
    hits.set(key, recent);
    return { limited: true, retryAfterMs: Math.max(0, windowMs - (now - recent[0])) };
  }
  recent.push(now);
  hits.set(key, recent);
  return { limited: false, retryAfterMs: 0 };
}

function limited(key, max, windowMs) {
  return limitInfo(key, max, windowMs).limited;
}

function deviceKey(req, body) {
  const raw = String((body && body.deviceId) || req.headers["x-device-id"] || "").trim();
  if (/^[A-Za-z0-9_-]{8,64}$/.test(raw)) return raw;
  const agent = String(req.headers["user-agent"] || "unknown");
  return "ua-" + require("crypto").createHash("sha256").update(agent).digest("hex").slice(0, 16);
}

function authReady() {
  return !!(process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD);
}

function currentUser(req) {
  const payload = session.readMember(req);
  if (!payload) return null;
  const user = users.findById(payload.sub);
  if (!user || users.accountStatus(user) !== "active") return null;
  if (Number(payload.sv) !== Number(user.sessionVersion || 0)) return null;
  return user;
}

function issueSession(req, res, user, extraCookies) {
  const token = session.createMemberToken(user.id, user.sessionVersion || 0);
  if (!token) return false;
  const cookies = Array.isArray(extraCookies) ? extraCookies.slice() : [];
  cookies.push(session.memberCookie(req, token));
  res.setHeader("Set-Cookie", cookies.length === 1 ? cookies[0] : cookies);
  return true;
}

module.exports = { clientIp, limited, limitInfo, deviceKey, currentUser, issueSession, authReady, session, users };
