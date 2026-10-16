const notify = require("../_lib/notify");
const { clientIp, limited, session, users } = require("../_lib/access");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return session.sendJson(res, 405, { error: "method" });
  if (limited("reset-request:" + clientIp(req), 8, 10 * 60 * 1000)) {
    return session.sendJson(res, 429, { error: "rate_limited" });
  }

  let body;
  try {
    body = await session.readJsonBody(req);
  } catch (e) {
    return session.sendJson(res, 400, { error: "invalid_body" });
  }

  const username = users.normalizeUsername(body.username);
  const email = users.normalizeEmail(body.email);
  const user = username ? users.findByUsername(username) : null;
  const matched = user && email && user.email === email && users.accountStatus(user) === "active";
  if (!matched) return session.sendJson(res, 200, { ok: true });

  const now = new Date().toISOString();
  await users.update(function (list) {
    const row = list.find(function (item) { return item.id === user.id; });
    if (!row) return;
    row.resetRequest = { at: now, email: email, status: "pending" };
  });
  await notify.send("重置密码申请", {
    账号: user.username,
    姓名: user.name || "",
    电话: user.phone || "",
    邮箱: email,
    时间: now,
  });
  return session.sendJson(res, 200, { ok: true });
};
