const mail = require("../_lib/mail");
const notify = require("../_lib/notify");
const { currentUser, session, users } = require("../_lib/access");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return session.sendJson(res, 405, { error: "method" });
  const user = currentUser(req);
  if (!user) return session.sendJson(res, 401, { error: "unauthorized" });

  let body;
  try {
    body = await session.readJsonBody(req);
  } catch (e) {
    return session.sendJson(res, 400, { error: "invalid_body" });
  }

  const name = body.name === undefined ? user.name || "" : users.cleanName(body.name);
  const phone = body.phone === undefined ? user.phone || "" : users.cleanPhone(body.phone);
  const email = body.email === undefined ? user.email || "" : users.normalizeEmail(body.email);
  if (body.name !== undefined && !name) return session.sendJson(res, 400, { error: "invalid_name" });
  if (body.phone !== undefined && !phone) return session.sendJson(res, 400, { error: "invalid_phone" });
  if (body.email !== undefined && !email) return session.sendJson(res, 400, { error: "invalid_email" });
  if (email && email !== user.email && users.findByEmail(email)) {
    return session.sendJson(res, 409, { error: "email_taken" });
  }

  let token = "";
  let mailTo = email;
  await users.update(function (list) {
    const row = list.find(function (item) { return item.id === user.id; });
    if (!row) return;
    if (body.name !== undefined) row.name = name;
    if (body.phone !== undefined) row.phone = phone;
    if (email && email !== row.email) {
      row.email = email;
      row.emailVerified = false;
      row.emailTokenHash = "";
      row.emailTokenExp = 0;
    }
    const expired = !row.emailTokenExp || row.emailTokenExp < Date.now();
    if (row.email && !row.emailVerified && (body.resend || !row.emailTokenHash || expired)) {
      token = users.randomToken();
      mailTo = row.email;
      row.emailTokenHash = users.hashToken(token);
      row.emailTokenExp = Date.now() + 24 * 60 * 60 * 1000;
    }
  });

  const fresh = users.findById(user.id);
  const payload = { ok: true, user: users.publicUser(fresh) };
  await notify.send("资料更新", {
    账号: fresh.username || "",
    姓名: fresh.name || "",
    电话: fresh.phone || "",
    邮箱: fresh.email || "",
    邮箱验证: fresh.emailVerified ? "已验证" : "未验证",
    时间: new Date().toISOString(),
  });
  if (token) {
    const link = mail.origin(req) + "/account.html?view=verify&token=" + encodeURIComponent(token);
    const sent = await mail.sendMail({
      to: mailTo,
      subject: "Verify your YINSCENT email",
      text: "Confirm this email for your YINSCENT account:\n" + link,
    });
    payload.emailSent = !!sent.sent;
    if (!sent.sent && mail.isLocal(req)) payload.devLink = link;
  }
  return session.sendJson(res, 200, payload);
};
