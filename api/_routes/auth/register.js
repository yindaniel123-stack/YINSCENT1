const crypto = require("crypto");
const notices = require("../../_lib/notices");
const settings = require("../../_lib/settings");
const { clientIp, limited, session, users } = require("../../_lib/access");

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

function clip(value, max) {
  return String(value || "").replace(/[\u0000-\u001f]/g, "").trim().slice(0, max);
}

function generatePassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.randomBytes(12);
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return session.sendJson(res, 405, { error: "method" });
  if (limited("register:" + clientIp(req), 8, 10 * 60 * 1000)) {
    return session.sendJson(res, 429, { error: "rate_limited" });
  }

  let body;
  try {
    body = await session.readJsonBody(req);
  } catch (e) {
    return session.sendJson(res, 400, { error: "invalid_body" });
  }

  const name = users.cleanName(body.name);
  const phone = users.cleanPhone(body.phone);
  const email = users.normalizeEmail(body.email);
  const username = String(body.username || "").trim().toLowerCase();
  const country = COUNTRIES[String(body.country || "").trim().toUpperCase()] || "";
  const company = users.cleanName(body.company);
  const address = clip(body.address, 200);
  const city = clip(body.city, 40);
  const note = clip(body.note, 500);
  if (!/^[a-z0-9]{4,20}$/.test(username)) return session.sendJson(res, 400, { error: "invalid_username" });
  if (!name || !phone) return session.sendJson(res, 400, { error: "invalid_application" });
  if (!email) return session.sendJson(res, 400, { error: "invalid_email" });
  if (!country) return session.sendJson(res, 400, { error: "invalid_country" });

  const existing = users.findByEmail(email);
  if (existing && existing.status !== "rejected") {
    return session.sendJson(res, 409, {
      error: existing.status === "pending" ? "application_pending" : "email_taken",
    });
  }
  const named = users.findByUsername(username);
  if (named && (!existing || named.id !== existing.id)) {
    return session.sendJson(res, 409, { error: "username_taken" });
  }

  const site = settings.read().site || {};
  if (site.allowRegister === false) return session.sendJson(res, 403, { error: "register_closed" });
  const plain = generatePassword();
  const hash = await users.hashPassword(plain);
  const now = new Date().toISOString();
  const approved = site.requireReview === false;
  const fields = {
    username: username,
    passwordHash: hash,
    issuedPassword: plain,
    status: approved ? "active" : "pending",
    disabled: false,
    name: name,
    phone: phone,
    email: email,
    emailVerified: true,
    country: country,
    company: company,
    address: address,
    city: city,
    note: note,
    role: "member",
    productAccess: approved,
  };

  if (existing) {
    await users.update(function (list) {
      const row = list.find(function (item) { return item.id === existing.id; });
      if (!row) return;
      Object.assign(row, fields);
      delete row.passwordHistory;
      row.sessionVersion = (Number(row.sessionVersion) || 0) + 1;
    });
  } else {
    await users.update(function (list) {
      list.push(Object.assign({
        id: users.randomId(),
        sessionVersion: 1,
        createdAt: now,
      }, fields, users.blankSecrets()));
    });
  }

  notices.register({
    id: existing ? existing.id : "",
    username: username,
    name: name,
    phone: phone,
    email: email,
    company: company,
    country: country,
    createdAt: now,
  }).catch(function () {});
  return session.sendJson(res, 201, { ok: true, status: approved ? "active" : "pending", username: username, password: plain });
};
