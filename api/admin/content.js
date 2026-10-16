const audit = require("../_lib/audit");
const content = require("../_lib/content");
const { allow } = require("../_lib/guard");
const { clientIp, session } = require("../_lib/access");

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    if (!allow(req, res, "content")) return;
    return session.sendJson(res, 200, { story: content.read(), contact: content.readContact() });
  }
  if (req.method !== "POST") return session.sendJson(res, 405, { error: "method" });
  const admin = allow(req, res, "content");
  if (!admin) return;
  let body;
  try {
    body = await session.readJsonBody(req);
  } catch (e) {
    return session.sendJson(res, 400, { error: "invalid_body" });
  }
  const saved = content.writeAll({ story: body.story, contact: body.contact });
  audit.add({
    actorId: admin.id,
    actorName: admin.name || admin.username || "",
    ip: clientIp(req),
    action: "内容管理",
    target: "story",
    changes: { after: { 标题: saved.story.title, 横幅: saved.story.heroTitle, 联系页: saved.contact.title } },
  });
  return session.sendJson(res, 200, { ok: true, story: saved.story, contact: saved.contact });
};
