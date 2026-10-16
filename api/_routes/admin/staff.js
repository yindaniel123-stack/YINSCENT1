const crypto = require("crypto");
const admins = require("../../_lib/admins");
const audit = require("../../_lib/audit");
const notify = require("../../_lib/notify");
const permissions = require("../../_lib/permissions");
const users = require("../../_lib/users");
const { allow } = require("../../_lib/guard");
const { clientIp, session } = require("../../_lib/access");

function generatePassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.randomBytes(12);
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

function record(req, admin, action, target, changes) {
  audit.add({
    actorId: admin.id,
    actorName: admin.name || admin.username || "",
    ip: clientIp(req),
    action: action,
    target: target,
    changes: changes,
  });
}

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    if (!allow(req, res, ["admins", "roles"])) return;
    return session.sendJson(res, 200, {
      permissions: permissions.list(),
      admins: admins.readAll().map(function (row) {
        var pub = admins.publicAdmin(row);
        if (pub) pub.password = row.issuedPassword || "";
        return pub;
      }),
    });
  }
  if (req.method !== "POST") return session.sendJson(res, 405, { error: "method" });

  let body;
  try {
    body = await session.readJsonBody(req);
  } catch (e) {
    return session.sendJson(res, 400, { error: "invalid_body" });
  }
  const action = String(body.action || "");
  const actor = allow(req, res, action === "permissions" ? ["admins", "roles"] : "admins");
  if (!actor) return;
  if (action === "create") {
    const username = users.normalizeUsername(body.username);
    if (!username || username === "admin") return session.sendJson(res, 400, { error: "invalid_username" });
    if (admins.findByUsername(username) || users.findByUsername(username)) {
      return session.sendJson(res, 409, { error: "username_taken" });
    }
    const plain = body.password ? String(body.password) : generatePassword();
    if (plain.length < 8 || plain.length > 64) return session.sendJson(res, 400, { error: "invalid_password" });
    const now = new Date().toISOString();
    const row = {
      id: admins.randomId(),
      username: username,
      name: users.cleanName(body.name) || username,
      passwordHash: await users.hashPassword(plain),
      issuedPassword: plain,
      permissions: permissions.normalize(body.permissions),
      disabled: false,
      sessionVersion: 1,
      createdAt: now,
    };
    const list = admins.readAll();
    list.push(row);
    admins.writeAll(list);
    record(req, actor, "创建管理员", row.id, {
      before: null,
      after: { 账号: username, 权限: row.permissions },
    });
    await notify.send("创建管理员", {
      账号: username,
      姓名: row.name,
      权限: row.permissions.join(","),
      时间: now,
    });
    return session.sendJson(res, 201, { ok: true, username: username, password: plain, admin: admins.publicAdmin(row) });
  }

  const before = admins.findById(String(body.id || ""));
  if (!before) return session.sendJson(res, 404, { error: "not_found" });
  const list = admins.readAll();
  const row = list.find(function (item) { return item.id === before.id; });
  if (!row) return session.sendJson(res, 404, { error: "not_found" });

  if (action === "permissions") {
    row.permissions = permissions.normalize(body.permissions);
    row.sessionVersion = (Number(row.sessionVersion) || 0) + 1;
    admins.writeAll(list);
    record(req, actor, "管理员权限", row.id, {
      before: { 权限: before.permissions || [] },
      after: { 权限: row.permissions },
    });
    return session.sendJson(res, 200, { ok: true });
  }

  if (action === "disable" || action === "enable") {
    row.disabled = action === "disable";
    row.sessionVersion = (Number(row.sessionVersion) || 0) + 1;
    admins.writeAll(list);
    record(req, actor, action === "disable" ? "禁用管理员" : "启用管理员", row.id, {
      before: { 账号: before.username, 禁用: !!before.disabled },
      after: { 账号: row.username, 禁用: row.disabled },
    });
    return session.sendJson(res, 200, { ok: true });
  }

  if (action === "delete") {
    admins.writeAll(list.filter(function (item) { return item.id !== row.id; }));
    record(req, actor, "删除管理员", row.id, {
      before: { 账号: before.username },
      after: null,
    });
    return session.sendJson(res, 200, { ok: true });
  }

  if (action === "reset") {
    const plain = body.password ? String(body.password) : generatePassword();
    if (plain.length < 8 || plain.length > 64) return session.sendJson(res, 400, { error: "invalid_password" });
    row.passwordHash = await users.hashPassword(plain);
    row.issuedPassword = plain;
    delete row.passwordHistory;
    row.sessionVersion = (Number(row.sessionVersion) || 0) + 1;
    admins.writeAll(list);
    record(req, actor, "重置管理员密码", row.id, {
      before: { 账号: before.username },
      after: { 账号: row.username, 密码已重置: true },
    });
    await notify.send("重置管理员密码", { 账号: row.username, 时间: new Date().toISOString() });
    return session.sendJson(res, 200, { ok: true, username: row.username, password: plain });
  }

  return session.sendJson(res, 400, { error: "unknown_action" });
};
