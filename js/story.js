(function () {
  var base = window.YINSCENT_BASE || "/";

  function node(tag, className, text) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (text != null) el.textContent = text;
    return el;
  }
  function icon(path) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    var shape = document.createElementNS("http://www.w3.org/2000/svg", "path");
    shape.setAttribute("d", path);
    shape.setAttribute("fill", "none");
    shape.setAttribute("stroke", "currentColor");
    shape.setAttribute("stroke-width", "1.6");
    shape.setAttribute("stroke-linecap", "round");
    shape.setAttribute("stroke-linejoin", "round");
    svg.appendChild(shape);
    return svg;
  }
  var statIcons = [
    "M12 3l2.2 4.6L19 8.2l-3.5 3.4.8 4.9L12 14.8 7.7 16.5l.8-4.9L5 8.2l4.8-.6z",
    "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18",
    "M4 20V10l8-6 8 6v10M9 20v-6h6v6",
    "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16.5 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM3.5 19c.6-2.4 2.4-3.6 4.5-3.6s3.9 1.2 4.5 3.6",
  ];

  function fillProse(host, text) {
    String(text || "").split(/\n{2,}/).forEach(function (part) {
      var cleaned = part.trim();
      if (!cleaned) return;
      var paragraph = node("p");
      cleaned.split("\n").forEach(function (line, index) {
        if (index) paragraph.appendChild(document.createElement("br"));
        paragraph.appendChild(document.createTextNode(line));
      });
      host.appendChild(paragraph);
    });
  }

  function srcOf(value) {
    var text = String(value || "");
    if (text.indexOf("data:image/") === 0) return text;
    if (text.indexOf("assets/") === 0) return base + text + (text === "assets/story-building.jpg" ? "?v=3" : "");
    return base + "assets/story-building.jpg?v=3";
  }

  function editButton(host, key) {
    var bar = node("div", "cms-editbar");
    var button = node("button", "cms-edit", "编辑");
    button.type = "button";
    button.setAttribute("data-edit", key);
    bar.appendChild(button);
    host.insertBefore(bar, host.firstChild);
  }

  function render(root, story, editable) {
    var data = story || {};
    root.innerHTML = "";
    root.classList.add("about");

    var crumb = node("p", "about-crumb");
    var home = node("a", "", tr("story.home"));
    home.href = base + "index.html";
    crumb.appendChild(home);
    crumb.appendChild(node("span", "", " / " + (data.crumb || "")));
    root.appendChild(crumb);

    var hero = node("section", "about-hero cms-block");
    var heroImg = node("img", "about-hero__bg");
    heroImg.alt = "";
    heroImg.src = srcOf(data.heroImage);
    hero.appendChild(heroImg);
    var heroCopy = node("div", "about-hero__copy");
    heroCopy.appendChild(node("p", "about-hero__eyebrow", data.heroEyebrow || ""));
    heroCopy.appendChild(node("h1", "", data.heroTitle || ""));
    heroCopy.appendChild(node("p", "about-hero__line", data.heroLine || ""));
    heroCopy.appendChild(node("p", "about-hero__en", data.heroEn || ""));
    hero.appendChild(heroCopy);
    if (editable) editButton(hero, "hero");
    root.appendChild(hero);

    var intro = node("section", "about-intro cms-block");
    var copy = node("div", "about-intro__copy");
    copy.appendChild(node("h2", "", data.title || ""));
    var bodyText = data.body != null ? data.body : (data.paragraphs || []).filter(Boolean).join("\n\n");
    var prose = node("div", "about-prose");
    fillProse(prose, bodyText);
    copy.appendChild(prose);
    var shop = node("a", "about-btn", (data.shopLabel || "选购产品") + " →");
    shop.href = base + "index.html";
    copy.appendChild(shop);
    intro.appendChild(copy);
    var photo = node("img", "about-intro__photo");
    photo.alt = "";
    photo.src = srcOf(data.sideImage);
    intro.appendChild(photo);
    if (editable) editButton(intro, "intro");
    root.appendChild(intro);

    var features = node("section", "about-features cms-block");
    var featureText = data.featuresText;
    if (featureText == null) {
      featureText = (data.features || []).map(function (item) {
        return [item.title, item.text].filter(Boolean).join("\n");
      }).filter(Boolean).join("\n\n");
    }
    var featureBlocks = String(featureText || "").split(/\n{2,}/).map(function (part) {
      return part.trim();
    }).filter(Boolean);
    if (featureBlocks.length > 1) {
      featureBlocks.forEach(function (block) {
        var lines = block.split("\n").map(function (line) { return line.trim(); }).filter(Boolean);
        var card = node("article", "about-feature");
        card.appendChild(node("h3", "", lines[0] || ""));
        if (lines.length > 1) card.appendChild(node("p", "", lines.slice(1).join("\n")));
        features.appendChild(card);
      });
    } else {
      var featureProse = node("div", "about-prose");
      fillProse(featureProse, featureText);
      features.appendChild(featureProse);
    }
    if (editable) editButton(features, "features");
    root.appendChild(features);

    var stats = node("section", "about-stats cms-block");
    (data.stats || []).forEach(function (item, index) {
      var card = node("article", "about-stat");
      var mark = node("span", "about-stat__icon");
      mark.appendChild(icon(statIcons[index] || statIcons[0]));
      card.appendChild(mark);
      card.appendChild(node("strong", "", item.value || ""));
      card.appendChild(node("span", "", item.label || ""));
      stats.appendChild(card);
    });
    if (editable) editButton(stats, "stats");
    root.appendChild(stats);

    var contact = node("section", "about-contact cms-block");
    var words = node("div");
    words.appendChild(node("h2", "", data.contactTitle || ""));
    words.appendChild(node("p", "", data.contactText || ""));
    contact.appendChild(words);
    var link = node("a", "about-btn about-btn--ghost", (data.contactLabel || "联系我们") + " →");
    link.href = base + "index.html?page=contact";
    contact.appendChild(link);
    if (editable) editButton(contact, "contact");
    root.appendChild(contact);

    var back = node("a", "about-back", "← " + (data.backLabel || "返回首页"));
    back.href = base + "index.html";
    root.appendChild(back);
  }

  function tr(key) {
    if (window.YINSCENT_I18N && window.YINSCENT_I18N.t) return window.YINSCENT_I18N.t(key);
    return key;
  }

  function plain(text) {
    return String(text || "").replace(/<[^>]+>/g, "");
  }

  function currentLang() {
    return window.YINSCENT_I18N && window.YINSCENT_I18N.getLang ? window.YINSCENT_I18N.getLang() : "zh";
  }

  function traditionalCopy(data) {
    var convert = window.YINSCENT_I18N && window.YINSCENT_I18N.toTraditional;
    if (!convert) return data;
    var copy = {};
    Object.keys(data || {}).forEach(function (key) {
      var value = data[key];
      if (typeof value === "string") copy[key] = convert(value);
      else if (Array.isArray(value)) {
        copy[key] = value.map(function (item) {
          if (typeof item === "string") return convert(item);
          if (!item || typeof item !== "object") return item;
          var next = {};
          Object.keys(item).forEach(function (field) {
            next[field] = typeof item[field] === "string" ? convert(item[field]) : item[field];
          });
          return next;
        });
      } else copy[key] = value;
    });
    return copy;
  }

  function dictionaryStory(data) {
    var features = [1, 2, 3, 4].map(function (n) {
      return tr("story.f" + n + "_title") + "\n" + tr("story.f" + n + "_text");
    }).join("\n\n");
    return {
      heroImage: data && data.heroImage,
      sideImage: data && data.sideImage,
      heroEyebrow: tr("story.hero_eyebrow"),
      heroTitle: tr("story.hero_title"),
      heroLine: tr("story.hero_line"),
      heroEn: tr("story.hero_en"),
      crumb: tr("story.crumb"),
      title: tr("story.brand"),
      body: [plain(tr("story.p1")), plain(tr("story.p2")), plain(tr("story.p3"))].join("\n\n"),
      shopLabel: tr("story.shop"),
      featuresText: features,
      stats: [1, 2, 3, 4].map(function (n) {
        return { value: tr("story.s" + n + "_value"), label: tr("story.s" + n + "_label") };
      }),
      contactTitle: tr("story.contact_title"),
      contactText: tr("story.contact_text"),
      contactLabel: tr("story.contact_btn"),
      backLabel: tr("story.back_label"),
    };
  }

  function storyForLang(data) {
    var lang = currentLang();
    if (lang !== "zh" && lang !== "zh-Hant") return dictionaryStory(data);
    if (lang === "zh-Hant") return traditionalCopy(data || {});
    return data;
  }

  window.YINSCENT_STORY = { render: render };

  var lastPayload = null;

  function paint() {
    var root = document.getElementById("storyDetail");
    if (!root) return;
    render(root, storyForLang(lastPayload && lastPayload.story), false);
    document.title = tr("meta.story");
  }

  function show() {
    if (new URLSearchParams(window.location.search).get("page") !== "story") return;
    var root = document.getElementById("storyDetail");
    if (!root) return;
    document.body.classList.add("page-story");
    fetch(base + "api/content").then(function (res) { return res.json(); }).then(function (data) {
      lastPayload = data;
      paint();
    }).catch(function () {
      lastPayload = null;
      paint();
    });
  }
  window.addEventListener("yinscent:langchange", function () {
    if (new URLSearchParams(window.location.search).get("page") !== "story") return;
    paint();
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", show);
  else show();
})();
