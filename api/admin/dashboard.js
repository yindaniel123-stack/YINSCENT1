const loginLog = require("../_lib/login-log");
const { allow } = require("../_lib/guard");
const { session, users } = require("../_lib/access");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return session.sendJson(res, 405, { error: "method" });
  if (!allow(req, res, "dashboard")) return;
  const list = users.listUsers();
  const soon = Date.now() + 30 * 24 * 60 * 60 * 1000;
  const counts = {
    total: list.length,
    pending: 0,
    active: 0,
    disabled: 0,
    rejected: 0,
    expiringSoon: 0,
    expired: 0,
    resetPending: 0,
    noAccess: 0,
  };
  list.forEach(function (user) {
    const status = users.accountStatus(user);
    if (status === "pending") counts.pending += 1;
    else if (status === "rejected") counts.rejected += 1;
    else if (status === "disabled") counts.disabled += 1;
    else counts.active += 1;
    if (status === "active" && user.membershipExpiresAt && !users.membershipValid(user)) counts.expired += 1;
    const exp = Date.parse(user.membershipExpiresAt || "");
    if (users.membershipValid(user) && exp && exp <= soon) counts.expiringSoon += 1;
    if (user.resetRequest && user.resetRequest.status === "pending") counts.resetPending += 1;
    if (user.productAccess === false) counts.noAccess += 1;
  });
  return session.sendJson(res, 200, {
    counts: counts,
    recentLogins: loginLog.recent().slice(0, 8),
  });
};
