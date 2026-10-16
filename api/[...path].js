const fs = require("fs");
const path = require("path");

const routesRoot = path.resolve(__dirname, "_routes");

function partsFrom(req) {
  const query = req.query && req.query.path;
  if (Array.isArray(query)) return query;
  if (typeof query === "string" && query) return [query];
  return String(req.url || "")
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
  return Promise.resolve(require(file)(req, res)).catch(function (err) {
    console.error(err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
    }
    res.end(JSON.stringify({ error: "Internal server error" }));
  });
};
