const ALL = [
  "desk",
  "home",
  "reports",
  "customers",
  "products",
  "prices",
  "orders",
  "payments",
  "stock",
  "shipping",
  "service",
  "content",
  "signup",
  "review",
  "clients",
  "productNew",
  "productAll",
  "files",
  "admins",
  "roles",
  "logs",
  "settings",
  "dashboard",
  "users",
  "review",
  "password",
  "status",
  "membership",
  "access",
  "logins",
  "mail",
  "smtp",
];

function list() {
  return ALL.slice();
}

function normalize(values) {
  const allowed = {};
  ALL.forEach(function (key) { allowed[key] = true; });
  const out = [];
  (Array.isArray(values) ? values : []).forEach(function (key) {
    const name = String(key || "");
    if (allowed[name] && out.indexOf(name) === -1) out.push(name);
  });
  return out;
}

module.exports = { ALL: list, list: list, normalize: normalize };
