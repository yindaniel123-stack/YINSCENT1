const { session, users } = require("../_lib/access");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return session.sendJson(res, 405, { error: "method" });
  let body;
  try {
    body = await session.readJsonBody(req);
  } catch (e) {
    return session.sendJson(res, 400, { error: "invalid_body" });
  }
  const token = String(body.token || "");
  const hash = users.hashToken(token);
  let matched = null;
  await users.update(function (list) {
    matched = list.find(function (user) {
      return user.emailTokenHash && user.emailTokenHash === hash && user.emailTokenExp > Date.now();
    });
    if (!matched) return;
    matched.emailVerified = true;
    matched.emailTokenHash = "";
    matched.emailTokenExp = 0;
  });
  if (!matched) return session.sendJson(res, 400, { error: "invalid_token" });
  return session.sendJson(res, 200, { ok: true });
};
