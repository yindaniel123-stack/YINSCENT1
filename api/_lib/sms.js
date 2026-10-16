const smsLog = require("./sms-log");
const { laneFor } = require("./phone");

function costFor(lane) {
  const raw = lane === "cn" ? process.env.SMS_CN_COST_CENTS : process.env.SMS_INTL_COST_CENTS;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) return lane === "cn" ? 5 : 8;
  return Math.round(value);
}

function maxAttempts() {
  const value = Number(process.env.SMS_MAX_ATTEMPTS);
  if (!Number.isFinite(value) || value < 1) return 2;
  return Math.min(4, Math.round(value));
}

function maskPhone(e164) {
  const value = String(e164 || "");
  const match = value.match(/^(\+\d{1,3})(\d+)$/);
  if (!match) return "hidden";
  const tail = match[2].slice(-4);
  return match[1] + "*".repeat(Math.max(2, match[2].length - 4)) + tail;
}

function channelConfig(lane) {
  const provider = String(process.env[lane === "cn" ? "SMS_CN_PROVIDER" : "SMS_INTL_PROVIDER"] || "twilio")
    .trim()
    .toLowerCase();
  if (provider === "http") {
    const url = process.env[lane === "cn" ? "SMS_CN_HTTP_URL" : "SMS_INTL_HTTP_URL"] || "";
    const key = process.env[lane === "cn" ? "SMS_CN_HTTP_KEY" : "SMS_INTL_HTTP_KEY"] || "";
    if (!url || !key) return null;
    return { provider: "http", url: url, key: key, lane: lane };
  }
  const from = lane === "cn"
    ? (process.env.SMS_CN_FROM || process.env.TWILIO_FROM_NUMBER || "")
    : (process.env.SMS_INTL_FROM || "");
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !from) return null;
  return { provider: "twilio", from: from, lane: lane };
}

async function deliver(config, to, text) {
  if (!config) return { sent: false, reason: "unconfigured" };
  try {
    if (config.provider === "http") return await httpSend(config, to, text);
    return await twilioSend(config.from, to, text);
  } catch (e) {
    return { sent: false, reason: "failed" };
  }
}

async function twilioSend(from, to, text) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const body = new URLSearchParams();
  body.set("To", to);
  body.set("From", from);
  body.set("Body", text);
  const response = await fetch(
    "https://api.twilio.com/2010-04-01/Accounts/" + encodeURIComponent(sid) + "/Messages.json",
    {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(sid + ":" + token).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    }
  );
  if (!response.ok) return { sent: false, reason: "provider_failed" };
  return { sent: true, reason: "" };
}

async function httpSend(config, to, text) {
  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + config.key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ to: to, text: text, lane: config.lane }),
  });
  if (!response.ok) return { sent: false, reason: "provider_failed" };
  return { sent: true, reason: "" };
}

async function sendOtp(e164, text) {
  const lane = laneFor(e164);
  const cost = costFor(lane);
  if (!smsLog.canSpend(cost)) {
    await smsLog.record({
      at: new Date().toISOString(),
      month: smsLog.monthKey(),
      phone: maskPhone(e164),
      lane: lane,
      provider: "",
      switched: false,
      sent: false,
      costCents: 0,
      reason: "cost_cap",
      attempts: [],
    });
    return { sent: false, reason: "cost_cap", lane: lane };
  }

  const primary = channelConfig(lane);
  const backup = channelConfig(lane === "cn" ? "intl" : "cn");
  const attempts = [];
  let result = { sent: false, reason: primary ? "failed" : "unconfigured" };
  let used = primary;

  if (primary) {
    const tries = maxAttempts();
    for (let i = 0; i < tries; i += 1) {
      result = await deliver(primary, e164, text);
      attempts.push({ lane: lane, provider: primary.provider, ok: !!result.sent, reason: result.reason || "" });
      if (result.sent) break;
    }
  }

  let switched = false;
  if (!result.sent && backup && process.env.SMS_FAILOVER !== "0") {
    switched = true;
    used = backup;
    result = await deliver(backup, e164, text);
    attempts.push({
      lane: backup.lane,
      provider: backup.provider,
      ok: !!result.sent,
      reason: result.reason || "",
      failover: true,
    });
  }

  await smsLog.record({
    at: new Date().toISOString(),
    month: smsLog.monthKey(),
    phone: maskPhone(e164),
    lane: used ? used.lane : lane,
    provider: used ? used.provider : "",
    switched: switched,
    sent: !!result.sent,
    costCents: result.sent ? cost : 0,
    reason: result.sent ? "" : (result.reason || "failed"),
    attempts: attempts,
  });

  return { sent: !!result.sent, reason: result.sent ? "" : (result.reason || "failed"), lane: lane, switched: switched };
}

module.exports = { sendOtp, maskPhone };
