const crypto = require("crypto");
const admins = require("../../_lib/admins");
const audit = require("../../_lib/audit");
const loginLog = require("../../_lib/login-log");
const notify = require("../../_lib/notify");
const notices = require("../../_lib/notices");
const orders = require("../../_lib/orders");
const settings = require("../../_lib/settings");
const { clientIp, session, users } = require("../../_lib/access");

const COUNTRIES = {
  CN: "中国大陆", HK: "中国香港", MO: "中国澳门", TW: "中国台湾",
  US: "美国", CA: "加拿大", GB: "英国", AU: "澳大利亚", NZ: "新西兰",
  JP: "日本", KR: "韩国", SG: "新加坡", MY: "马来西亚", TH: "泰国",
  VN: "越南", ID: "印度尼西亚", PH: "菲律宾", IN: "印度", AE: "阿联酋",
  SA: "沙特阿拉伯", DE: "德国", FR: "法国", IT: "意大利", ES: "西班牙",
  PT: "葡萄牙", NL: "荷兰", BE: "比利时", CH: "瑞士", SE: "瑞典",
  NO: "挪威", DK: "丹麦", FI: "芬兰", IE: "爱尔兰", RU: "俄罗斯",
  BR: "巴西", MX: "墨西哥", AR: "阿根廷", ZA: "南非", TR: "土耳其", EG: "埃及",
};

function countryName(code) {
  return COUNTRIES[String(code || "").trim().toUpperCase()] || "";
}

function generatePassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.randomBytes(12);
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

function orderView(order) {
  return {
    id: order.id,
    total: order.total,
    currency: order.currency || "CNY",
    status: order.status || "已提交",
    createdAt: order.createdAt,
  };
}

function adminUser(user, allOrders) {
  const mine = allOrders.filter(function (order) {
    return order.userId === user.id;
  }).map(orderView);
  return {
    id: user.id,
    username: user.username || "",
    name: user.name || "",
    password: user.issuedPassword || "",
    phone: user.phone || "",
    email: user.email || "",
    country: user.country || "",
    city: user.city || "",
    company: user.company || "",
    address: user.address || "",
    note: user.note || "",
    emailVerified: !!user.emailVerified,
    disabled: !!user.disabled,
    status: users.accountStatus(user),
    profileReady: users.profileReady(user),
    createdAt: user.createdAt || "",
    membershipExpiresAt: user.membershipExpiresAt || "",
    membershipValid: users.membershipValid(user),
    productAccess: user.productAccess !== false,
    canViewProducts: users.canViewProducts(user),
    resetRequest: user.resetRequest && user.resetRequest.status === "pending" ? {
      at: user.resetRequest.at || "",
      email: user.resetRequest.email || "",
      status: "pending",
    } : null,
    orders: mine.slice().reverse(),
  };
}

function expiryFromNow() {
  const date = new Date();
  date.setMonth(date.getMonth() + settings.clampMonths(settings.read().membershipMonths));
  return date.toISOString();
}

function parseExpiry(value) {
  const text = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return "";
  const time = Date.parse(text + "T23:59:59.000Z");
  if (!time) return "";
  return new Date(time).toISOString();
}

function snapshot(user) {
  if (!user) return null;
  return {
    账号: user.username || "",
    姓名: user.name || "",
    电话: user.phone || "",
    邮箱: user.email || "",
    国家: user.country || "",
    状态: users.accountStatus(user),
    会员到期: user.membershipExpiresAt || "",
    产品权限: user.productAccess === false ? "关闭" : "开启",
  };
}

function record(req, admin, action, target, before, after) {
  audit.add({
    actorId: admin.id,
    actorName: admin.name || admin.username || "",
    ip: clientIp(req),
    action: action,
    target: target,
    changes: { before: before, after: after },
  });
}

function can(admin, name) {
  if (!admin) return false;
  if (admin.super) return true;
  return (admin.permissions || []).indexOf(name) !== -1;
}

function allowAny(admin, names) {
  return names.some(function (name) { return can(admin, name); });
}

module.exports = async function handler(req, res) {
  const actor = session.readAdmin(req);
  if (!actor) return session.sendJson(res, 401, { error: "unauthorized" });

  if (req.method === "GET") {
    if (!allowAny(actor, ["users", "review", "password", "status", "membership", "access", "logins", "customers", "signup", "clients"])) {
      return session.sendJson(res, 403, { error: "forbidden" });
    }
    const allOrders = orders.readOrders();
    const seeUsers = allowAny(actor, ["users", "review", "password", "status", "membership", "access", "customers", "signup", "clients"]);
    return session.sendJson(res, 200, {
      users: seeUsers ? users.listUsers().map(function (user) { return adminUser(user, allOrders); }) : [],
      logins: can(actor, "logins") ? loginLog.recent() : [],
      notify: { to: notify.recipient(), configured: notify.configured() },
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

  if (action === "apply") {
    if (!can(actor, "review")) return session.sendJson(res, 403, { error: "forbidden" });
    const name = users.cleanName(body.name);
    const phone = users.cleanPhone(body.phone);
    const email = users.normalizeEmail(body.email);
    if (!name || !phone) return session.sendJson(res, 400, { error: "invalid_application" });
    if (!email) return session.sendJson(res, 400, { error: "invalid_email" });
    const existing = users.findByEmail(email);
    if (existing && existing.status !== "rejected") {
      return session.sendJson(res, 409, {
        error: existing.status === "pending" ? "application_pending" : "email_taken",
      });
    }
    const now = new Date().toISOString();
    const id = existing ? existing.id : users.randomId();
    if (existing) {
      await users.update(function (list) {
        const row = list.find(function (item) { return item.id === existing.id; });
        if (!row) return;
        row.name = name;
        row.phone = phone;
        row.email = email;
        row.emailVerified = true;
        row.status = "pending";
        row.disabled = false;
        row.username = "";
        row.passwordHash = "";
        row.issuedPassword = "";
        delete row.passwordHistory;
        row.sessionVersion = (Number(row.sessionVersion) || 0) + 1;
      });
    } else {
      await users.update(function (list) {
        list.push(Object.assign({
          id: id,
          username: "",
          passwordHash: "",
          issuedPassword: "",
          sessionVersion: 0,
          status: "pending",
          disabled: false,
          name: name,
          phone: phone,
          email: email,
          emailVerified: true,
          role: "member",
          createdAt: now,
        }, users.blankSecrets()));
      });
    }
    const after = users.findById(id);
    record(req, actor, "注册申请", id, existing ? snapshot(existing) : null, snapshot(after));
    await notify.send("注册申请", {
      姓名: name,
      电话: phone,
      邮箱: email,
      状态: "待审核",
      时间: now,
    });
    return session.sendJson(res, 200, { ok: true, status: "pending" });
  }

  if (action === "register") {
    if (!can(actor, "users") && !can(actor, "customers") && !can(actor, "signup")) return session.sendJson(res, 403, { error: "forbidden" });
    const name = users.cleanName(body.name);
    const phone = users.cleanPhone(body.phone);
    const email = users.normalizeEmail(body.email);
    const username = String(body.username || "").trim().toLowerCase();
    const plain = generatePassword();
    const country = countryName(body.country);
    const company = users.cleanName(body.company);
    const address = String(body.address || "").replace(/[\u0000-\u001f]/g, "").trim().slice(0, 200);
    const note = String(body.note || "").replace(/[\u0000-\u001f]/g, "").trim().slice(0, 500);
    if (!name || !phone) return session.sendJson(res, 400, { error: "invalid_application" });
    if (!email) return session.sendJson(res, 400, { error: "invalid_email" });
    if (!/^[a-z0-9]{4,20}$/.test(username)) return session.sendJson(res, 400, { error: "invalid_username" });
    if (!company) return session.sendJson(res, 400, { error: "invalid_company" });
    if (!country) return session.sendJson(res, 400, { error: "invalid_country" });
    if (users.findByUsername(username)) return session.sendJson(res, 409, { error: "username_taken" });
    const existingEmail = users.findByEmail(email);
    if (existingEmail && existingEmail.status !== "rejected") {
      return session.sendJson(res, 409, { error: "email_taken" });
    }
    const hash = await users.hashPassword(plain);
    const id = users.randomId();
    const now = new Date().toISOString();
    await users.update(function (list) {
      list.push(Object.assign({
        id: id,
        username: username,
        passwordHash: hash,
        issuedPassword: plain,
        sessionVersion: 1,
        status: "pending",
        disabled: false,
        name: name,
        phone: phone,
        email: email,
        country: country,
        company: company,
        address: address,
        note: note,
        emailVerified: true,
        role: "member",
        createdAt: now,
        productAccess: false,
      }, users.blankSecrets()));
    });
    const created = users.findById(id);
    record(req, actor, "注册申请", id, null, snapshot(created));
    notices.register({
      id: id,
      username: username,
      name: name,
      phone: phone,
      email: email,
      company: company,
      country: country,
      createdAt: now,
    }).catch(function () {});
    return session.sendJson(res, 201, { ok: true, status: "pending", username: username, password: plain });
  }

  if (action === "create") {
    if (!can(actor, "users") && !can(actor, "customers") && !can(actor, "signup")) return session.sendJson(res, 403, { error: "forbidden" });
    const name = users.cleanName(body.name);
    const phone = users.cleanPhone(body.phone);
    const email = users.normalizeEmail(body.email);
    const country = countryName(body.country) || "中国大陆";
    const username = users.normalizeUsername(body.username);
    if (!name || !phone) return session.sendJson(res, 400, { error: "invalid_application" });
    if (!email) return session.sendJson(res, 400, { error: "invalid_email" });
    if (!username) return session.sendJson(res, 400, { error: "invalid_username" });
    if (users.findByUsername(username)) return session.sendJson(res, 409, { error: "username_taken" });
    const existingEmail = users.findByEmail(email);
    if (existingEmail && existingEmail.status !== "rejected") {
      return session.sendJson(res, 409, { error: "email_taken" });
    }
    const plain = body.password ? String(body.password) : generatePassword();
    if (plain.length < 8 || plain.length > 64) return session.sendJson(res, 400, { error: "invalid_password" });
    const hash = await users.hashPassword(plain);
    const id = users.randomId();
    const now = new Date().toISOString();
    const expires = expiryFromNow();
    await users.update(function (list) {
      list.push(Object.assign({
        id: id,
        username: username,
        passwordHash: hash,
        issuedPassword: plain,
        sessionVersion: 1,
        status: "active",
        disabled: false,
        name: name,
        phone: phone,
        email: email,
        country: country,
        emailVerified: true,
        role: "member",
        createdAt: now,
        membershipExpiresAt: expires,
        productAccess: true,
      }, users.blankSecrets()));
    });
    const created = users.findById(id);
    record(req, actor, "直接创建", id, null, snapshot(created));
    await notify.send("直接创建", {
      账号: username,
      姓名: name,
      电话: phone,
      邮箱: email,
      国家: country,
      会员到期: expires,
      时间: now,
    });
    return session.sendJson(res, 201, {
      ok: true,
      username: username,
      password: plain,
      user: adminUser(created, orders.readOrders()),
    });
  }

  const before = users.findById(String(body.id || ""));
  if (!before) return session.sendJson(res, 404, { error: "not_found" });

  if (action === "assign" || action === "approve") {
    if (!can(actor, action === "approve" ? "review" : "users")) {
      return session.sendJson(res, 403, { error: "forbidden" });
    }
    if (action === "approve" && before.status !== "pending" && before.status !== "rejected") {
      return session.sendJson(res, 400, { error: "not_pending" });
    }
    if (action === "assign" && before.username) return session.sendJson(res, 409, { error: "username_taken" });
    const username = users.normalizeUsername(body.username);
    if (!username) return session.sendJson(res, 400, { error: "invalid_username" });
    const named = users.findByUsername(username);
    if (named && named.id !== before.id) return session.sendJson(res, 409, { error: "username_taken" });
    if (admins.findByUsername(username)) return session.sendJson(res, 409, { error: "username_taken" });
    const plain = body.password ? String(body.password) : generatePassword();
    if (plain.length < 8 || plain.length > 64) return session.sendJson(res, 400, { error: "invalid_password" });
    const hash = await users.hashPassword(plain);
    const now = new Date().toISOString();
    const expires = expiryFromNow();
    await users.update(function (list) {
      const row = list.find(function (item) { return item.id === before.id; });
      if (!row) return;
      row.username = username;
      row.passwordHash = hash;
      row.issuedPassword = plain;
      delete row.passwordHistory;
      row.sessionVersion = (Number(row.sessionVersion) || 0) + 1;
      row.status = "active";
      row.disabled = false;
      row.role = "member";
      row.membershipExpiresAt = expires;
      row.productAccess = true;
    });
    const after = users.findById(before.id);
    record(req, actor, action === "approve" ? "审核通过" : "分配账号", before.id, snapshot(before), snapshot(after));
    await notify.send(action === "approve" ? "审核通过" : "分配账号", {
      账号: username,
      姓名: before.name || "",
      电话: before.phone || "",
      邮箱: before.email || "",
      会员到期: expires,
      时间: now,
    });
    if (action === "approve") notices.review(Object.assign({}, before, { username: username }), true).catch(function () {});
    return session.sendJson(res, 200, { ok: true, username: username, password: plain });
  }

  if (action === "reject") {
    if (!can(actor, "review")) return session.sendJson(res, 403, { error: "forbidden" });
    await users.update(function (list) {
      const row = list.find(function (item) { return item.id === before.id; });
      if (!row) return;
      row.status = "rejected";
      row.sessionVersion = (Number(row.sessionVersion) || 0) + 1;
    });
    record(req, actor, "审核拒绝", before.id, snapshot(before), snapshot(users.findById(before.id)));
    await notify.send("审核拒绝", {
      姓名: before.name || "",
      电话: before.phone || "",
      邮箱: before.email || "",
      账号: before.username || "",
      时间: new Date().toISOString(),
    });
    notices.review(before, false).catch(function () {});
    return session.sendJson(res, 200, { ok: true });
  }

  if (action === "disable" || action === "enable") {
    if (!can(actor, "status") && !can(actor, "clients")) return session.sendJson(res, 403, { error: "forbidden" });
    await users.update(function (list) {
      const row = list.find(function (item) { return item.id === before.id; });
      if (!row) return;
      row.disabled = action === "disable";
      row.sessionVersion = (Number(row.sessionVersion) || 0) + 1;
    });
    record(req, actor, action === "disable" ? "账号禁用" : "账号启用", before.id, snapshot(before), snapshot(users.findById(before.id)));
    await notify.send(action === "disable" ? "账号禁用" : "账号启用", {
      账号: before.username || "",
      姓名: before.name || "",
      电话: before.phone || "",
      邮箱: before.email || "",
      会员到期: before.membershipExpiresAt || "",
      时间: new Date().toISOString(),
    });
    return session.sendJson(res, 200, { ok: true });
  }

  if (action === "delete") {
    if (!can(actor, "users") && !can(actor, "clients")) return session.sendJson(res, 403, { error: "forbidden" });
    await users.update(function (list) {
      const index = list.findIndex(function (item) { return item.id === before.id; });
      if (index >= 0) list.splice(index, 1);
    });
    record(req, actor, "账号删除", before.id, snapshot(before), null);
    await notify.send("账号删除", {
      账号: before.username || "",
      姓名: before.name || "",
      电话: before.phone || "",
      邮箱: before.email || "",
      时间: new Date().toISOString(),
    });
    return session.sendJson(res, 200, { ok: true });
  }

  if (action === "reset") {
    if (!can(actor, "password")) return session.sendJson(res, 403, { error: "forbidden" });
    const plain = body.password ? String(body.password) : generatePassword();
    if (plain.length < 8 || plain.length > 64) return session.sendJson(res, 400, { error: "invalid_password" });
    const hash = await users.hashPassword(plain);
    const now = new Date().toISOString();
    await users.update(function (list) {
      const row = list.find(function (item) { return item.id === before.id; });
      if (!row) return;
      row.passwordHash = hash;
      row.issuedPassword = plain;
      delete row.passwordHistory;
      row.sessionVersion = (Number(row.sessionVersion) || 0) + 1;
      if (row.resetRequest && row.resetRequest.status === "pending") row.resetRequest.status = "done";
    });
    record(req, actor, "密码已重置", before.id, snapshot(before), { 账号: before.username || "", 密码已重置: true });
    await notify.send("密码已重置", {
      账号: before.username || "",
      姓名: before.name || "",
      电话: before.phone || "",
      邮箱: before.email || "",
      会员到期: before.membershipExpiresAt || "",
      时间: now,
    });
    return session.sendJson(res, 200, { ok: true, username: before.username || "", password: plain });
  }

  if (action === "dismiss") {
    if (!can(actor, "password")) return session.sendJson(res, 403, { error: "forbidden" });
    await users.update(function (list) {
      const row = list.find(function (item) { return item.id === before.id; });
      if (row && row.resetRequest) row.resetRequest.status = "dismissed";
    });
    record(req, actor, "忽略重置申请", before.id, { 重置申请: "待处理" }, { 重置申请: "已忽略" });
    return session.sendJson(res, 200, { ok: true });
  }

  if (action === "membership") {
    if (!can(actor, "membership")) return session.sendJson(res, 403, { error: "forbidden" });
    const expires = parseExpiry(body.expiresAt);
    if (!expires) return session.sendJson(res, 400, { error: "invalid_date" });
    await users.update(function (list) {
      const row = list.find(function (item) { return item.id === before.id; });
      if (!row) return;
      row.membershipExpiresAt = expires;
    });
    const after = users.findById(before.id);
    record(req, actor, "会员续期", before.id, snapshot(before), snapshot(after));
    await notify.send("会员续期", {
      账号: before.username || "",
      姓名: before.name || "",
      电话: before.phone || "",
      邮箱: before.email || "",
      会员到期: expires,
      时间: new Date().toISOString(),
    });
    return session.sendJson(res, 200, { ok: true, membershipExpiresAt: expires });
  }

  if (action === "access") {
    if (!can(actor, "access")) return session.sendJson(res, 403, { error: "forbidden" });
    const allowed = body.productAccess !== false && body.productAccess !== "false";
    await users.update(function (list) {
      const row = list.find(function (item) { return item.id === before.id; });
      if (!row) return;
      row.productAccess = allowed;
    });
    const after = users.findById(before.id);
    record(req, actor, "产品权限", before.id, snapshot(before), snapshot(after));
    await notify.send("产品权限", {
      账号: before.username || "",
      姓名: before.name || "",
      产品权限: allowed ? "开启" : "关闭",
      时间: new Date().toISOString(),
    });
    return session.sendJson(res, 200, { ok: true, productAccess: allowed });
  }

  return session.sendJson(res, 400, { error: "unknown_action" });
};
