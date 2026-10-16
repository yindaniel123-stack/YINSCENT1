const session = require("../_lib/session");
const users = require("../_lib/users");
const tickets = require("../_lib/tickets");

function can(admin, key) {
  if (admin.super) return true;
  const granted = admin.permissions || [];
  return granted.indexOf(key) !== -1;
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return session.sendJson(res, 405, { error: "method" });
  const admin = session.readAdmin(req);
  if (!admin) return session.sendJson(res, 401, { error: "unauthorized" });

  let review = 0;
  let service = 0;
  if (can(admin, "review")) {
    users.listUsers().forEach(function (user) {
      if (users.accountStatus(user) === "pending") review += 1;
    });
  }
  if (can(admin, "service")) {
    tickets.read().forEach(function (ticket) {
      if (ticket.status === "待处理" || ticket.status === "处理中") service += 1;
    });
  }
  return session.sendJson(res, 200, { review: review, service: service });
};
