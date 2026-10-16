const audit = require("../../_lib/audit");
const notify = require("../../_lib/notify");
const settings = require("../../_lib/settings");
const users = require("../../_lib/users");
const { allow } = require("../../_lib/guard");
const { clientIp, session } = require("../../_lib/access");

function record(req, admin, action, changes) {
  audit.add({
    actorId: admin.id,
    actorName: admin.name || admin.username || "",
    ip: clientIp(req),
    action: action,
    target: "mail",
    changes: changes,
  });
}

function emailsOf(value) {
  const source = Array.isArray(value) ? value.join("\n") : String(value || "");
  const out = [];
  source.split(/[\s,;，；]+/).forEach(function (item) {
    const email = users.normalizeEmail(item);
    if (email && out.indexOf(email) === -1) out.push(email);
  });
  return out.slice(0, 10);
}

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    const admin = allow(req, res, ["mail", "smtp", "settings"]);
    if (!admin) return;
    notify.retryPending().catch(function () {});
    const view = settings.publicView();
    return session.sendJson(res, 200, {
      notifyEmails: view.notifyEmails,
      stockMin: view.stockMin,
      smtp: view.smtp,
      notices: view.notices,
      configured: notify.configured(),
      records: notify.recent(),
    });
  }
  if (req.method !== "POST") return session.sendJson(res, 405, { error: "method" });
  const admin = allow(req, res, ["mail", "smtp", "settings"]);
  if (!admin) return;

  let body;
  try {
    body = await session.readJsonBody(req);
  } catch (e) {
    return session.sendJson(res, 400, { error: "invalid_body" });
  }
  const action = String(body.action || "");
  const current = settings.read();

  if (action === "recipients") {
    const emails = emailsOf(body.emails);
    if (!emails.length) return session.sendJson(res, 400, { error: "invalid_email" });
    current.notifyEmails = emails;
    current.notifyEmail = emails[0];
    const min = Number(body.stockMin);
    if (isFinite(min) && min >= 0) current.stockMin = Math.min(100000, Math.round(min));
    settings.write(current);
    record(req, admin, "通知邮箱", { before: null, after: { 邮箱: emails.join(","), 预警库存: current.stockMin } });
    notify.retryPending().catch(function () {});
    return session.sendJson(res, 200, { ok: true });
  }

  if (action === "smtp") {
    const smtp = current.smtp;
    const provider = body.provider === "resend" || body.provider === "sendgrid" ? body.provider : "smtp";
    current.smtp = {
      host: String(body.host || "").trim().slice(0, 120),
      port: Number(body.port) || 587,
      user: String(body.user || "").trim().slice(0, 120),
      pass: body.pass ? String(body.pass) : smtp.pass,
      from: String(body.from || "").trim().slice(0, 120),
      fromName: String(body.fromName || "").trim().slice(0, 60),
      secure: body.secure === "ssl" ? "ssl" : "tls",
      provider: provider,
      apiKey: body.apiKey ? String(body.apiKey) : smtp.apiKey,
    };
    settings.write(current);
    record(req, admin, "发信配置", {
      before: null,
      after: { 方式: provider, 主机: current.smtp.host, 发件人: current.smtp.from, 密码已改: !!body.pass, 密钥已改: !!body.apiKey },
    });
    notify.retryPending().catch(function () {});
    return session.sendJson(res, 200, { ok: true });
  }

  if (action === "notices") {
    const incoming = body.notices || {};
    Object.keys(current.notices).forEach(function (id) {
      const row = incoming[id];
      if (!row) return;
      current.notices[id].enabled = row.enabled !== false;
      if (typeof row.subject === "string" && row.subject.trim()) current.notices[id].subject = row.subject.trim().slice(0, 120);
      if (typeof row.body === "string") current.notices[id].body = row.body.slice(0, 4000);
    });
    settings.write(current);
    record(req, admin, "通知模板", { before: null, after: { 已更新: Object.keys(incoming).length } });
    return session.sendJson(res, 200, { ok: true });
  }

  if (action === "retry") {
    const result = await notify.retryPending();
    return session.sendJson(res, 200, { ok: true, retried: result.retried || 0, records: notify.recent() });
  }

  if (action === "test") {
    const sent = await notify.ping(notify.recipients());
    return session.sendJson(res, 200, { ok: true, sent: !!(sent && sent.sent), reason: (sent && sent.reason) || "" });
  }

  return session.sendJson(res, 400, { error: "unknown_action" });
};
