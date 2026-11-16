const session = require("../_lib/session");
const mail = require("../_lib/mail");
const notify = require("../_lib/notify");

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map();

function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded) return forwarded.split(",")[0].trim();
  return (req.socket && req.socket.remoteAddress) || "unknown";
}

function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(function (time) {
    return now - time < WINDOW_MS;
  });
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

function clip(value, max) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function smsConfig() {
  return {
    sid: process.env.TWILIO_ACCOUNT_SID || "",
    token: process.env.TWILIO_AUTH_TOKEN || "",
    from: process.env.TWILIO_FROM_NUMBER || "",
    to: process.env.CONTACT_SMS_TO || "",
  };
}

async function sendSms(text) {
  const cfg = smsConfig();
  if (!cfg.sid || !cfg.token || !cfg.from || !cfg.to) {
    return { configured: false };
  }

  const body = new URLSearchParams();
  body.set("To", cfg.to);
  body.set("From", cfg.from);
  body.set("Body", text);

  const response = await fetch(
    "https://api.twilio.com/2010-04-01/Accounts/" + encodeURIComponent(cfg.sid) + "/Messages.json",
    {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(cfg.sid + ":" + cfg.token).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    }
  );

  if (!response.ok) {
    throw new Error("Twilio request failed");
  }
  return { configured: true, sent: true };
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return session.sendJson(res, 405, { error: "Method not allowed" });
  }
  if (rateLimited(clientIp(req))) {
    return session.sendJson(res, 429, { error: "Too many messages. Please try again later." });
  }

  let body;
  try {
    body = await session.readJsonBody(req);
  } catch (e) {
    return session.sendJson(res, 400, { error: "Invalid request body" });
  }

  const name = clip(body.name, 80);
  const email = clip(body.email, 120);
  const message = clip(body.message, 2000);
  if (!name || !email || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return session.sendJson(res, 400, { error: "Name, email, and message are required." });
  }

  const text = ["YINSCENT 询价", "姓名：" + name, "邮箱：" + email, "", message].join("\n");
  const smsText = ("YINSCENT contact\n" + name + " <" + email + ">\n" + message).slice(0, 320);
  let mailed = false;
  try {
    const targets = notify.recipients();
    for (let i = 0; i < targets.length; i++) {
      const result = await mail.sendMail({
        to: targets[i],
        replyTo: email,
        subject: "YINSCENT 询价",
        text: text,
      });
      if (result && result.sent) mailed = true;
    }
  } catch (err) {
    mailed = false;
  }

  if (!mailed) {
    return session.sendJson(res, 503, { error: "mail_unavailable" });
  }

  try {
    await sendSms(smsText);
  } catch (err) {}

  return session.sendJson(res, 200, { ok: true });
};
