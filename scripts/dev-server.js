/*
 * Local dev server: serves the static site and mounts the /api functions the
 * same way Vercel does in production. Loads ADMIN_PASSWORD from .env in the
 * project root, or from the environment. Usage:
 *   node scripts/dev-server.js
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const port = process.env.PORT || 8123;

(function loadEnv() {
  const envPath = path.join(root, ".env");
  if (!fs.existsSync(envPath)) return;
  fs.readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .forEach(function (line) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const eq = trimmed.indexOf("=");
      if (eq < 1) return;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key] || process.env[key] !== value) process.env[key] = value;
    });
})();

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".woff2": "font/woff2",
};

function insideRoot(urlPath) {
  const rel = String(urlPath || "").replace(/^\/+/, "");
  const filePath = path.resolve(root, rel);
  const relative = path.relative(root, filePath);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) return null;
  return filePath;
}

const access = require(path.join(root, "api", "_lib", "access"));

function productFileAllowed(req) {
  if (access.session.readAdmin(req)) return true;
  const member = access.currentUser(req);
  return !!member;
}

const server = http.createServer(function (req, res) {
  const urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);

  if (urlPath === "/data" || urlPath.startsWith("/data/")) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    return res.end("Not found");
  }

  if (urlPath === "/js/products.js" && !productFileAllowed(req)) {
    const referer = String(req.headers.referer || "");
    if (referer.indexOf("/admin.html") !== -1) {
      res.writeHead(200, { "Content-Type": "application/javascript; charset=utf-8" });
      return res.end("window.YINSCENT_PRODUCTS=[];window.YINSCENT_CATEGORIES=[];");
    }
    res.writeHead(302, { Location: "/login.html?next=" + encodeURIComponent("/index.html") });
    return res.end();
  }

  if (urlPath.startsWith("/api/")) {
    const handlerPath = insideRoot(urlPath.replace(/\/$/, "") + ".js");
    const apiRoot = path.resolve(root, "api");
    if (!handlerPath || !handlerPath.startsWith(apiRoot + path.sep) || !fs.existsSync(handlerPath)) {
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Not found" }));
    }
    delete require.cache[require.resolve(handlerPath)];
    return Promise.resolve(require(handlerPath)(req, res)).catch(function (err) {
      console.error(err);
      if (!res.headersSent) res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal server error" }));
    });
  }

  const filePath = insideRoot(urlPath === "/" ? "index.html" : urlPath);
  if (!filePath || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    return res.end("Not found");
  }
  res.writeHead(200, { "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(port, function () {
  console.log("YINSCENT dev server running at http://localhost:" + port);
  if (!process.env.ADMIN_PASSWORD) {
    console.warn("WARNING: ADMIN_PASSWORD is not set - admin login will return an error.");
  }
  setInterval(function () {
    try {
      require("../api/_lib/notify").retryPending().catch(function () {});
    } catch (e) {}
  }, 60000);
});
