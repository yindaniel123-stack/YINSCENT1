const mail = require("../_lib/mail");
const { clientIp, limited, session, users } = require("../_lib/access");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return session.sendJson(res, 405, { error: "method" });
  if (limited("resend:" + clientIp(req), 5, 10 * 60 * 1000)) {
    return session.sendJson(res, 429, { error: "rate_limited" });
  }
  let body;
  try {
    body = await session.readJsonBody(req);
  } catch (e) {
    return session.sendJson(res, 400, { error: "invalid_body" });
  }
  const email = users.normalizeEmail(body.email);
  const user = email ? users.findByEmail(email) : null;
  const payload = { ok: true };
  if (!user || user.emailVerified) return session.sendJson(res, 200, payload);

  const token = users.randomToken();
  await users.update(function (list) {
    const row = list.find(function (item) { return item.id === user.id; });
    if (!row || row.emailVerified) return;
    row.emailTokenHash = users.hashToken(token);
    row.emailTokenExp = Date.now() + 24 * 60 * 60 * 1000;
  });
  const link = mail.origin(req) + "/account.html?view=verify&token=" + encodeURIComponent(token);
  const sent = await mail.sendMail({
    to: email,
    subject: "Verify your YINSCENT account",
    text: "Confirm your email:\n" + link + "\n\n请打开链接完成邮箱验证，24 小时内有效。",
  });
  if (!sent.sent && mail.isLocal(req)) payload.devLink = link;
  return session.sendJson(res, 200, payload);
};
