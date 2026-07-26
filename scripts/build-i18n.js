const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "..", "js", "_i18n_data.json");
if (!fs.existsSync(dataPath)) {
  console.error("Missing js/_i18n_data.json — regenerate data first");
  process.exit(1);
}
const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));

const js = `/* YINSCENT i18n — en / zh / es / pt */
(function () {
  var STORAGE_KEY = "yinscent-lang";
  var LANGS = ["en", "zh", "es", "pt"];
  var LANG_HTML = { en: "en", zh: "zh-CN", es: "es", pt: "pt" };
  var current = "en";

  var UI = ${JSON.stringify(data.ui)};
  var SCENTS = ${JSON.stringify(data.scents)};
  var PHRASES = ${JSON.stringify(data.phrases)};

  function getStoredLang() {
    try {
      var q = new URLSearchParams(window.location.search).get("lang");
      if (q && LANGS.indexOf(q) !== -1) return q;
      var s = localStorage.getItem(STORAGE_KEY);
      if (s && LANGS.indexOf(s) !== -1) return s;
    } catch (e) {}
    return "en";
  }

  function t(key, vars) {
    var table = UI[current] || UI.en;
    var str = (table && table[key]) || (UI.en && UI.en[key]) || key;
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        str = str.split("{" + k + "}").join(String(vars[k]));
      });
    }
    return str;
  }

  function translateScentName(name) {
    if (!name || current === "en") return name;
    var map = SCENTS[current] || {};
    var out = String(name);
    Object.keys(map)
      .sort(function (a, b) {
        return b.length - a.length;
      })
      .forEach(function (en) {
        if (out.indexOf(en) !== -1) out = out.split(en).join(map[en]);
      });
    return out;
  }

  function translatePhrases(text) {
    if (!text || current === "en") return text;
    var list = PHRASES[current] || [];
    var out = String(text);
    for (var i = 0; i < list.length; i++) {
      out = out.split(list[i][0]).join(list[i][1]);
    }
    return translateScentName(out);
  }

  function localizeProduct(p) {
    if (!p || current === "en") return p;
    var copy = {};
    Object.keys(p).forEach(function (k) {
      copy[k] = p[k];
    });
    if (p.name) copy.name = translateScentName(p.name);
    if (p.desc) copy.desc = translatePhrases(p.desc);
    if (p.tagline) copy.tagline = translatePhrases(p.tagline);
    if (p.cartName) copy.cartName = translatePhrases(p.cartName);
    if (p.features && p.features.length) {
      copy.features = p.features.map(function (f) {
        return {
          icon: f.icon,
          label: translatePhrases(f.label),
          text: translatePhrases(f.text),
        };
      });
    }
    return copy;
  }

  function categoryLabel(id) {
    return t("cat." + id);
  }

  function applyNode(el) {
    if (!el || el.nodeType !== 1) return;
    var key = el.getAttribute("data-i18n");
    if (key) {
      var val = t(key, { year: new Date().getFullYear() });
      if (el.getAttribute("data-i18n-html") === "true") el.innerHTML = val;
      else el.textContent = val;
    }
    var attrSpec = el.getAttribute("data-i18n-attr");
    if (attrSpec) {
      attrSpec.split(";").forEach(function (pair) {
        var parts = pair.split(":");
        if (parts.length < 2) return;
        var attr = parts[0].trim();
        var aKey = parts[1].trim();
        var n = 0;
        var countEl = document.getElementById("cartCount");
        if (countEl) n = parseInt(countEl.textContent, 10) || 0;
        el.setAttribute(attr, t(aKey, { n: n, year: new Date().getFullYear() }));
      });
    }
    var ph = el.getAttribute("data-i18n-placeholder");
    if (ph) el.setAttribute("placeholder", t(ph));
  }

  function apply(root) {
    var scope = root || document;
    var nodes = scope.querySelectorAll("[data-i18n], [data-i18n-attr], [data-i18n-placeholder]");
    for (var i = 0; i < nodes.length; i++) applyNode(nodes[i]);
    if (document.body && document.body.classList.contains("page-story")) {
      document.title = t("meta.story");
    } else if (document.body && document.body.classList.contains("page-contact")) {
      document.title = t("meta.contact");
    } else if (!new URLSearchParams(window.location.search).get("id")) {
      document.title = t("meta.title");
    }
    var btns = document.querySelectorAll(".lang-switch__btn");
    for (var j = 0; j < btns.length; j++) {
      var btn = btns[j];
      var on = btn.getAttribute("data-lang") === current;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    }
  }

  function setLang(lang, opts) {
    if (LANGS.indexOf(lang) === -1) lang = "en";
    current = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {}
    document.documentElement.lang = LANG_HTML[lang] || lang;
    apply();
    if (!opts || !opts.silent) {
      window.dispatchEvent(new CustomEvent("yinscent:langchange", { detail: { lang: lang } }));
    }
  }

  function getLang() {
    return current;
  }

  function bindSwitcher() {
    var btns = document.querySelectorAll(".lang-switch__btn");
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener("click", function () {
        var lang = this.getAttribute("data-lang");
        if (lang) setLang(lang);
      });
    }
  }

  function init() {
    current = getStoredLang();
    document.documentElement.lang = LANG_HTML[current] || current;
    apply();
    bindSwitcher();
  }

  window.YINSCENT_I18N = {
    LANGS: LANGS,
    t: t,
    getLang: getLang,
    setLang: setLang,
    apply: apply,
    localizeProduct: localizeProduct,
    translateScentName: translateScentName,
    translatePhrases: translatePhrases,
    categoryLabel: categoryLabel,
    init: init,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
`;

fs.writeFileSync(path.join(__dirname, "..", "js", "i18n.js"), js);
console.log("wrote js/i18n.js", (js.length / 1024).toFixed(1) + "KB");
