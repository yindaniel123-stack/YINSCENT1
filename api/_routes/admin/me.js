const permissions = require("../../_lib/permissions");
const session = require("../../_lib/session");

module.exports = async function handler(req, res) {
  const admin = session.readAdmin(req);
  if (!admin) {
    return session.sendJson(res, 401, { error: "Not signed in" });
  }
  return session.sendJson(res, 200, {
    ok: true,
    role: "admin",
    admin: {
      id: admin.id,
      username: admin.username,
      name: admin.name,
      super: !!admin.super,
      permissions: admin.super ? permissions.list() : admin.permissions,
    },
  });
};
