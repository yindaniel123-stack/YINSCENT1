const fs = require("fs");
const http = require("http");
const path = require("path");

const root = path.join(__dirname, "..");
const env = fs.readFileSync(path.join(root, ".env"), "utf8");
const password = (env.match(/^ADMIN_PASSWORD=(.*)$/m) || [])[1] || "";
let failed = false;
function check(name, ok) {
  if (!ok) {
    failed = true;
    console.log("FAIL", name);
  }
}

function request(method, apiPath, body, cookie) {
  return new Promise(function (resolve, reject) {
    const data = body ? JSON.stringify(body) : "";
    const req = http.request({
      hostname: "127.0.0.1",
      port: 8123,
      path: apiPath,
      method: method,
      headers: Object.assign({
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
      }, cookie ? { Cookie: cookie } : {}),
    }, function (res) {
      let buf = "";
      res.on("data", function (chunk) { buf += chunk; });
      res.on("end", function () {
        const setCookie = res.headers["set-cookie"] || [];
        resolve({ status: res.statusCode, body: buf, cookie: setCookie.map(function (item) { return item.split(";")[0]; }).join("; ") });
      });
    });
    req.on("error", reject);
    req.end(data);
  });
}

(async function () {
  const guest = await request("GET", "/api/catalog");
  check("guest catalog", guest.status === 401);

  const denied = await request("POST", "/api/admin/users", { action: "create", username: "term_check", confirm: "" });
  check("no session", denied.status === 401);

  const login = await request("POST", "/api/admin/login", { password: password });
  check("admin login", login.status === 200);
  const cookie = login.cookie;

  const dash = await request("GET", "/api/admin/dashboard", null, cookie);
  check("dashboard", dash.status === 200 && dash.body.indexOf("pending") !== -1);

  const created = await request("POST", "/api/admin/users", { action: "create", username: "term_check", confirm: "确认" }, cookie);
  check("create", created.status === 201);
  const createdBody = JSON.parse(created.body);
  const exp = Date.parse(createdBody.user.membershipExpiresAt);
  const months = (exp - Date.now()) / (30.4 * 24 * 60 * 60 * 1000);
  check("twelve months", months > 11 && months < 13);
  check("password returned once", typeof createdBody.password === "string" && createdBody.password.length >= 8);

  const mail = await request("GET", "/api/admin/mail-log", null, cookie);
  const mailBody = JSON.parse(mail.body);
  const mailRow = (mailBody.records || []).find(function (row) { return row.event === "直接创建" && row.text.indexOf("term_check") !== -1; });
  check("mail record", !!mailRow && mailRow.text.indexOf("密码：") !== -1 && mailRow.to.indexOf("@") !== -1);

  const audit = await request("GET", "/api/admin/audit", null, cookie);
  const auditBody = JSON.parse(audit.body);
  const auditRow = (auditBody.records || []).find(function (row) { return row.action === "直接创建"; });
  check("audit actor", !!auditRow && auditRow.actorId === "super" && !!auditRow.ip && !!auditRow.at);

  const me = await request("GET", "/api/admin/me", null, cookie);
  check("permissions", me.status === 200 && me.body.indexOf("dashboard") !== -1 && me.body.indexOf("logs") !== -1);

  const removed = await request("POST", "/api/admin/users", { action: "delete", id: createdBody.user.id, confirm: "确认" }, cookie);
  check("delete", removed.status === 200);

  const users = JSON.parse(fs.readFileSync(path.join(root, "data", "users.json"), "utf8"));
  check("users restored", users.length === 2 && users.every(function (user) { return user.username !== "term_check"; }));

  function strip(file, marker) {
    const full = path.join(root, "data", file);
    if (!fs.existsSync(full)) return;
    const rows = JSON.parse(fs.readFileSync(full, "utf8"));
    const kept = rows.filter(function (row) { return JSON.stringify(row).indexOf(marker) === -1; });
    fs.writeFileSync(full, JSON.stringify(kept, null, 2) + "\n");
  }
  strip("mail-log.json", "term_check");
  strip("audit-log.json", "term_check");

  if (failed) process.exit(1);
  console.log("ALL PASSED");
})().catch(function (err) {
  console.error(err.message);
  process.exit(1);
});
