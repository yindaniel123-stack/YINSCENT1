const fs = require("fs");
const path = require("path");

const routesRoot = path.resolve(__dirname, "_routes");

function splitRoute(value) {
  const raw = Array.isArray(value) ? value.join("/") : String(value || "");
  try {
    return decodeURIComponent(raw).split("/").filter(Boolean);
  } catch (e) {
    return raw.split("/").filter(Boolean);
  }
}

function partsFrom(req) {
  const query = (req && req.query) || {};
  if (query.route) return splitRoute(query.route);
  if (query.path) return splitRoute(query.path);
  return String((req && req.url) || "")
    .split("?")[0]
    .replace(/^\/api\/?/, "")
    .split("/")
    .filter(Boolean);
}

module.exports = function handler(req, res) {
  const parts = partsFrom(req).filter(function (part) {
    return part !== "." && part !== "..";
  });
  const file = path.resolve(routesRoot, parts.join(path.sep) + ".js");
  const inside = file === routesRoot || file.startsWith(routesRoot + path.sep);
  if (!parts.length || !inside || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Not found" }));
    return;
  }
  try {
    return Promise.resolve(require(file)(req, res)).catch(fail);
  } catch (err) {
    return fail(err);
  }

  function fail(err) {
    console.error(err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
    }
    if (!res.writableEnded) res.end(JSON.stringify({ error: "Internal server error" }));
  }
};
