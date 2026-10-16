const session = require("./session");

function allow(req, res, names) {
  const admin = session.readAdmin(req);
  if (!admin) {
    session.sendJson(res, 401, { error: "unauthorized" });
    return null;
  }
  const needed = Array.isArray(names) ? names : [names];
  if (admin.super) return admin;
  const granted = admin.permissions || [];
  const ok = needed.some(function (name) { return granted.indexOf(name) !== -1; });
  if (!ok) {
    session.sendJson(res, 403, { error: "forbidden" });
    return null;
  }
  return admin;
}

function confirmed(body) {
  return String((body && body.confirm) || "") === "确认";
}

module.exports = { allow: allow, confirmed: confirmed };
