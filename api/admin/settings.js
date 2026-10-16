const audit = require("../_lib/audit");
const notify = require("../_lib/notify");
const settings = require("../_lib/settings");
const users = require("../_lib/users");
const { allow } = require("../_lib/guard");
const { clientIp, session } = require("../_lib/access");

function record(req, admin, action, changes) {
  audit.add({
    actorId: admin.id,
    actorName: admin.name || admin.username || "",
    ip: clientIp(req),
    action: action,
    target: "settings",
    changes: changes,
  });
}

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    if (!allow(req, res, ["settings", "smtp", "templates"])) return;
    return session.sendJson(res, 200, settings.publicView());
  }
  if (req.method !== "POST") return session.sendJson(res, 405, { error: "method" });

  let body;
  try {
    body = await session.readJsonBody(req);
  } catch (e) {
    return session.sendJson(res, 400, { error: "invalid_body" });
  }

  const action = String(body.action || "");
  const current = settings.read();

  if (action === "system") {
    const admin = allow(req, res, "settings");
    if (!admin) return;
    const email = body.notifyEmail === undefined || body.notifyEmail === ""
      ? current.notifyEmail
      : users.normalizeEmail(body.notifyEmail);
    if (body.notifyEmail && !email) return session.sendJson(res, 400, { error: "invalid_email" });
    current.membershipMonths = settings.clampMonths(body.membershipMonths);
    current.notifyEmail = email || current.notifyEmail;
    if (email) {
      const list = Array.isArray(current.notifyEmails) ? current.notifyEmails.slice() : [];
      if (!list.length) list.push(email);
      else list[0] = email;
      current.notifyEmails = list;
    }
    settings.write(current);
    record(req, admin, "系统设置", {
      before: null,
      after: { 会员月数: current.membershipMonths, 通知邮箱: current.notifyEmail },
    });
    return session.sendJson(res, 200, { ok: true, settings: settings.publicView() });
  }

  if (action === "smtp") {
    const admin = allow(req, res, "smtp");
    if (!admin) return;
    const smtp = current.smtp;
    const next = {
      host: String(body.host || "").trim(),
      port: Number(body.port) || 587,
      user: String(body.user || "").trim(),
      pass: body.pass ? String(body.pass) : smtp.pass,
      from: String(body.from || "").trim(),
      fromName: smtp.fromName || "",
      secure: smtp.secure === "ssl" ? "ssl" : "tls",
      provider: smtp.provider || "smtp",
      apiKey: smtp.apiKey || "",
    };
    current.smtp = next;
    settings.write(current);
    record(req, admin, "SMTP配置", {
      before: { host: smtp.host, port: smtp.port, user: smtp.user, from: smtp.from, passwordChanged: false },
      after: { host: next.host, port: next.port, user: next.user, from: next.from, passwordChanged: !!body.pass },
    });
    return session.sendJson(res, 200, { ok: true, settings: settings.publicView() });
  }

  if (action === "site") {
    const admin = allow(req, res, "settings");
    if (!admin) return;
    const incoming = body.site || {};
    if (incoming.email && !users.normalizeEmail(incoming.email)) {
      return session.sendJson(res, 400, { error: "invalid_email" });
    }
    const nextSite = settings.normalizeSite(incoming, current.site);
    const beforeSite = current.site || {};
    current.site = nextSite;
    if (body.membershipMonths != null) current.membershipMonths = settings.clampMonths(body.membershipMonths);
    settings.write(current);
    record(req, admin, "系统设置", {
      before: { 网站名称: beforeSite.name || "", 默认语言: beforeSite.defaultLanguage || "" },
      after: {
        网站名称: nextSite.name,
        默认语言: nextSite.defaultLanguage,
        货币: nextSite.currency,
        允许注册: nextSite.allowRegister,
        需要审核: nextSite.requireReview,
        显示价格: nextSite.showPrice,
        显示库存: nextSite.showStock,
        会员月数: current.membershipMonths,
      },
    });
    return session.sendJson(res, 200, { ok: true, settings: settings.publicView() });
  }

  if (action === "templates") {
    const admin = allow(req, res, "templates");
    if (!admin) return;
    const incoming = body.templates || {};
    Object.keys(current.templates).forEach(function (name) {
      if (typeof incoming[name] === "string") current.templates[name] = incoming[name].slice(0, 4000);
    });
    settings.write(current);
    record(req, admin, "邮件模板", { before: null, after: { 已更新: Object.keys(incoming) } });
    return session.sendJson(res, 200, { ok: true, settings: settings.publicView() });
  }

  return session.sendJson(res, 400, { error: "unknown_action", notify: notify.recipient() });
};
