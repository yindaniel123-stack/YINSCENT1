const fs = require("fs");
const path = require("path");
const file = path.join(__dirname, "js", "i18n.js");
let code = fs.readFileSync(file, "utf8");
function grab(name, open, close) {
  const start = code.indexOf(name);
  let i = code.indexOf(open, start);
  let depth = 0;
  let inStr = false;
  let quote = "";
  let esc = false;
  for (let j = i; j < code.length; j++) {
    const c = code[j];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === quote) inStr = false;
      continue;
    }
    if (c === '"' || c === "'") { inStr = true; quote = c; continue; }
    if (c === open) depth++;
    else if (c === close) { depth--; if (depth === 0) return { start: i, end: j + 1 }; }
  }
  throw new Error("unclosed");
}
const span = grab("var UI = ", "{", "}");
const UI = JSON.parse(code.slice(span.start, span.end));
const keys = {
  en: {
    "smart.series.aurora": "Aurora",
    "smart.series.halo": "Halo",
    "smart.series.kitty": "Kitty",
    "smart.series.bottle": "Glass bottle",
    "refills.series.100": "100 ml smart refill",
    "refills.series.300": "300 ml smart refill",
  },
  zh: {
    "smart.series.aurora": "极光",
    "smart.series.halo": "光晕",
    "smart.series.kitty": "猫咪",
    "smart.series.bottle": "玻璃瓶款",
    "refills.series.100": "100ml香薰机补充液",
    "refills.series.300": "300ml香薰机补充液",
  },
  es: {
    "smart.series.aurora": "Aurora",
    "smart.series.halo": "Halo",
    "smart.series.kitty": "Kitty",
    "smart.series.bottle": "Botella de vidrio",
    "refills.series.100": "Recarga inteligente 100 ml",
    "refills.series.300": "Recarga inteligente 300 ml",
  },
  pt: {
    "smart.series.aurora": "Aurora",
    "smart.series.halo": "Halo",
    "smart.series.kitty": "Kitty",
    "smart.series.bottle": "Frasco de vidro",
    "refills.series.100": "Recarga inteligente 100 ml",
    "refills.series.300": "Recarga inteligente 300 ml",
  },
};
Object.keys(keys).forEach(function (lang) {
  Object.keys(keys[lang]).forEach(function (key) { UI[lang][key] = keys[lang][key]; });
});
code = code.slice(0, span.start) + JSON.stringify(UI) + code.slice(span.end);
fs.writeFileSync(file, code);
console.log("ui", UI.zh["smart.series.bottle"], UI.zh["refills.series.100"]);
