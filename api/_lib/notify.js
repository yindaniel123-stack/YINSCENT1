const fs = require("fs");
const path = require("path");
const mail = require("./mail");

const dataDir = path.join(__dirname, "..", "..", "data");
const dataFile = path.join(dataDir, "notify-log.json");

function recipient() {
  const list = recipients();
  return list[0] || "";
}

function recipients() {
  try {
    const saved = require("./settings").read();
    const list = (saved.notifyEmails || []).map(cleanEmail).filter(Boolean);
    if (list.length) return list.slice(0, 10);
    const one = cleanEmail(saved.notifyEmail);
    if (one) return [one];
  } catch (e) {}
  const env = cleanEmail(process.env.NOTIFY_EMAIL || "");
  return env ? [env] : ["yindaniel123@gmail.com"];
}

function cleanEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "";
  return email.slice(0, 120);
}

function safeFields(fields) {
  const out = {};
  Object.keys(fields || {}).forEach(function (key) {
    const name = String(key);
    if (/密码|password|pass|token|secret|apiKey/i.test(name)) return;
    if (fields[key] == null || fields[key] === "") return;
    out[name] = fields[key];
  });
  return out;
}

function render(event, fields) {
  const settings = require("./settings");
  let text = settings.template(event) || event;
  const safe = safeFields(fields);
  Object.keys(safe).forEach(function (key) {
    text = text.split("{{" + key + "}}").join(String(safe[key]));
  });
  return text.replace(/\{\{[^}]+\}\}/g, "").replace(/^密码：.*$/gm, "").trim();
}

function readAll() {
  try {
    const rows = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    return Array.isArray(rows) ? rows : [];
  } catch (e) {
    return [];
  }
}

function writeAll(rows) {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(dataFile, JSON.stringify(rows.slice(-200), null, 2));
  } catch (e) {}
}

function remember(entry) {
  const rows = readAll();
  rows.push(entry);
  writeAll(rows);
}

function findDelivery(dedupe, to) {
  if (!dedupe) return null;
  const rows = readAll();
  for (let i = rows.length - 1; i >= 0; i--) {
    if (rows[i].dedupe === dedupe && rows[i].to === to) return rows[i];
  }
  return null;
}

function saveDelivery(entry) {
  const rows = readAll();
  if (entry.dedupe) {
    for (let i = rows.length - 1; i >= 0; i--) {
      if (rows[i].dedupe === entry.dedupe && rows[i].to === entry.to) {
        rows[i] = Object.assign({}, rows[i], entry);
        writeAll(rows);
        return;
      }
    }
  }
  rows.push(entry);
  writeAll(rows);
}

function recent() {
  return readAll().slice(-80).reverse().map(publicRow);
}

function publicRow(row) {
  return {
    at: row.at || "",
    event: row.event || row.kind || "",
    kind: row.kind || row.event || "",
    to: row.to || "",
    sent: !!row.sent,
    reason: row.reason || "",
    attempts: Number(row.attempts) || (row.sent ? 1 : 0),
    text: String(row.text || "").replace(/^密码：.*$/gm, "").replace(/密码[:：].*/g, "").trim(),
  };
}

function esc(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function brandHtml(inner) {
  return "<!DOCTYPE html><html><body style=\"margin:0;background:#f6f1e8;\">" +
    "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#f6f1e8;padding:28px 12px;\">" +
    "<tr><td align=\"center\"><table role=\"presentation\" width=\"560\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:560px;background:#fffdf9;border-radius:16px;\">" +
    "<tr><td style=\"padding:32px 28px;font-family:Georgia,'Times New Roman',serif;color:#3c3832;\">" +
    "<div style=\"text-align:center;color:#b7893e;font-size:22px;letter-spacing:0.22em;\">YINSCENT</div>" +
    "<div style=\"text-align:center;color:#8d867c;font-size:11px;letter-spacing:0.18em;padding-top:6px;\">HOME FRAGRANCE</div>" +
    "<div style=\"width:72px;height:1px;background:#c4a46a;margin:16px auto 18px;\"></div>" +
    "<div style=\"font-family:'Segoe UI','PingFang SC',sans-serif;font-size:14px;line-height:1.75;color:#3c3832;\">" + inner + "</div>" +
    "</td></tr></table></td></tr></table></body></html>";
}

function fill(template, fields, html) {
  const safe = safeFields(fields);
  let text = String(template || "");
  if (html) text = esc(text);
  Object.keys(safe).forEach(function (key) {
    const raw = String(safe[key]);
    const value = html ? (key === "订单明细" ? raw : esc(raw).replace(/\n/g, "<br>")) : raw;
    text = text.split("{{" + key + "}}").join(value);
  });
  text = text.replace(/\{\{[^}]+\}\}/g, "").replace(/^密码：.*$/gm, "");
  if (html) text = text.replace(/\n/g, "<br>");
  return text.trim();
}

function delay(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

async function trySend(message) {
  let result = { sent: false, reason: "failed", attempts: 0 };
  for (let attempt = 1; attempt <= 3; attempt++) {
    result.attempts = attempt;
    try {
      const sent = await mail.sendMail(message);
      result.sent = !!sent.sent;
      result.reason = sent.sent ? "" : (sent.reason || "failed");
    } catch (e) {
      result.sent = false;
      result.reason = "failed";
    }
    if (result.sent || result.reason === "unconfigured") break;
    if (attempt < 3) await delay(400 * attempt);
  }
  return result;
}

async function send(event, fields) {
  try {
    const text = render(event, fields);
    const to = recipient();
    const result = await trySend({ to: to, subject: "YINSCENT " + event, text: text, html: brandHtml(esc(text).replace(/\n/g, "<br>")) });
    remember({
      at: new Date().toISOString(),
      event: event,
      kind: event,
      to: to,
      sent: !!result.sent,
      reason: result.reason || "",
      attempts: result.attempts || 1,
      text: text,
    });
    return result;
  } catch (e) {
    return { sent: false, reason: "failed" };
  }
}

async function emit(kind, options) {
  try {
    const spec = require("./settings").notice(kind);
    const fields = options.fields || {};
    const targets = (options.to || []).map(cleanEmail).filter(Boolean);
    const dedupe = String(options.dedupe || "");
    if (!spec || spec.enabled === false) {
      const prior = dedupe ? findDelivery(dedupe, targets[0] || "") : null;
      if (!prior) {
        remember({
          at: new Date().toISOString(),
          event: spec ? spec.label : kind,
          kind: kind,
          to: targets[0] || "",
          sent: false,
          reason: "disabled",
          attempts: 0,
          dedupe: dedupe,
          text: "",
        });
      }
      return { sent: false, reason: prior ? "duplicate" : "disabled" };
    }
    if (!targets.length) {
      remember({
        at: new Date().toISOString(),
        event: spec.label,
        kind: kind,
        to: "",
        sent: false,
        reason: "no_recipient",
        attempts: 0,
        dedupe: dedupe,
        text: fill(spec.body, fields, false),
      });
      return { sent: false, reason: "no_recipient" };
    }
    let last = { sent: false, reason: "failed" };
    for (let i = 0; i < targets.length; i++) {
      const to = targets[i];
      const prior = findDelivery(dedupe, to);
      if (prior && (prior.sent || prior.reason === "disabled" || prior.reason === "duplicate")) {
        last = { sent: false, reason: "duplicate" };
        continue;
      }
      if (prior && prior.reason === "unconfigured") {
        last = { sent: false, reason: "unconfigured" };
        continue;
      }
      const text = fill(spec.body, fields, false);
      const html = brandHtml(fill(spec.body, options.htmlFields || fields, true));
      const result = await trySend({ to: to, subject: fill(spec.subject, fields, false), text: text, html: html });
      saveDelivery({
        at: new Date().toISOString(),
        event: spec.label,
        kind: kind,
        to: to,
        sent: !!result.sent,
        reason: result.reason || "",
        attempts: result.attempts || 1,
        dedupe: dedupe,
        text: text,
        subject: fill(spec.subject, fields, false),
      });
      last = result;
    }
    return last;
  } catch (e) {
    return { sent: false, reason: "failed" };
  }
}

async function ping(addresses) {
  const targets = (addresses && addresses.length ? addresses : recipients()).map(cleanEmail).filter(Boolean);
  let last = { sent: false, reason: targets.length ? "failed" : "no_recipient" };
  const text = "这是一封 YINSCENT 测试邮件，用于确认发信配置。邮件中不包含客户资料或订单。";
  for (let i = 0; i < targets.length; i++) {
    const result = await trySend({
      to: targets[i],
      subject: "YINSCENT 测试邮件",
      text: text,
      html: brandHtml(esc(text)),
    });
    remember({
      at: new Date().toISOString(),
      event: "测试邮件",
      kind: "test",
      to: targets[i],
      sent: !!result.sent,
      reason: result.reason || "",
      attempts: result.attempts || 1,
      text: text,
      subject: "YINSCENT 测试邮件",
    });
    last = result;
  }
  return last;
}

async function retryPending() {
  if (!mail.configured()) return { retried: 0 };
  const rows = readAll();
  let retried = 0;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.sent || !row.to || !row.subject && !row.text) continue;
    if (row.reason !== "failed" && row.reason !== "unconfigured") continue;
    if ((Number(row.attempts) || 0) >= 3 && row.reason === "failed") continue;
    const result = await trySend({
      to: row.to,
      subject: row.subject || ("YINSCENT " + (row.event || "")),
      text: row.text || "",
      html: brandHtml(esc(row.text || "").replace(/\n/g, "<br>")),
    });
    row.at = new Date().toISOString();
    row.sent = !!result.sent;
    row.reason = result.reason || "";
    row.attempts = (Number(row.attempts) || 0) + (result.attempts || 1);
    retried += 1;
  }
  if (retried) writeAll(rows);
  return { retried: retried };
}

module.exports = {
  send: send,
  emit: emit,
  recipient: recipient,
  recipients: recipients,
  recent: recent,
  retryPending: retryPending,
  ping: ping,
  cleanEmail: cleanEmail,
  configured: mail.configured,
};
