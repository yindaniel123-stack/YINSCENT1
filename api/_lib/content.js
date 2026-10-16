const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", "..", "data");
const dataFile = path.join(dataDir, "content.json");

function clip(value, max) {
  return String(value == null ? "" : value).replace(/[\u0000-\u001f]/g, "").trim().slice(0, max);
}

function clipBlock(value, max) {
  return String(value == null ? "" : value).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, max);
}

function defaults() {
  return {
    heroEyebrow: "ABOUT YINSCENT",
    heroTitle: "公司简介",
    heroLine: "让普通家庭买得起香氛",
    heroEn: "MAKE FRAGRANCE A PART OF EVERY HOME",
    heroImage: "assets/story-building.jpg",
    crumb: "我们的故事",
    title: "YINSCENT 伊馨",
    paragraphs: [
      "我们总部位于中国义乌，是一家致力于通过香氛力量丰富日常生活的香氛公司。依托自有生产工厂，我们生产 100 多种高品质香氛产品，面向广泛的家庭、偏好与场合。",
      "我们的使命是将香氛带进每一个家庭，让品香成为一种普遍的生活方式。凭借可靠的制造能力、用心的产品研发与始终如一的品质，我们致力为您创造美好的香氛体验，并服务全球顾客。",
      "我们诚挚欢迎批发询盘及长期合作机会。欢迎立即联系我们的团队，索取报价，并为您的市场找到合适的香氛产品。",
    ],
    sideImage: "assets/products/apple-candle-display.png",
    shopLabel: "选购产品",
    features: [
      { title: "高品质产品", text: "100+ 款香氛产品\n满足不同场景需求" },
      { title: "自有生产工厂", text: "稳定的供应链\n严格的品质控制" },
      { title: "面向全球市场", text: "服务全球批发商、经销商及零售客户" },
      { title: "长期合作伙伴", text: "诚邀合作\n共创更大的市场机会" },
    ],
    stats: [
      { value: "100+", label: "香氛产品" },
      { value: "全球市场", label: "多国销售" },
      { value: "自有工厂", label: "稳定生产" },
      { value: "合作客户", label: "批发 · 经销 · 零售" },
    ],
    contactTitle: "联系我们",
    contactText: "了解更多产品信息，获取最新报价，与我们建立长期合作关系。",
    contactLabel: "联系我们",
    backLabel: "返回首页",
  };
}

function contactDefaults() {
  return {
    title: "CONTACT",
    intro: "我们期待您的来信。无论是产品咨询、批发合作还是伙伴关系，义乌团队都将乐意协助。",
    intro2: "询价时，请提供所需数量、收货地址和联系电话，以便我们为您准备准确的报价。",
    formTitle: "发送消息",
    thanks: "感谢您的留言 — 我们会尽快回复。",
    error: "抱歉 — 消息未能发送，请重试。",
    crumb: "联系我们",
    back: "← 返回首页",
  };
}

function imageOf(value, fallback) {
  const text = String(value || "");
  if (!text) return fallback;
  if (/^data:image\/(png|jpeg|webp);base64,/.test(text.slice(0, 40)) && text.length <= 2800000) return text;
  if (/^assets\/[a-z0-9_./-]+$/i.test(text) && text.indexOf("..") === -1) return text;
  return fallback;
}

function joinParts(list) {
  return (Array.isArray(list) ? list : []).map(function (item) {
    return String(item == null ? "" : item).trim();
  }).filter(Boolean).join("\n\n");
}

function joinFeatures(list) {
  return (Array.isArray(list) ? list : []).map(function (item) {
    const title = item && item.title != null ? String(item.title).trim() : "";
    const text = item && item.text != null ? String(item.text).trim() : "";
    return [title, text].filter(Boolean).join("\n");
  }).filter(Boolean).join("\n\n");
}

function paragraphsOf(body) {
  const parts = String(body || "").split(/\n{2,}/).map(function (part) {
    return clipBlock(part, 1500);
  }).filter(Boolean);
  return parts.length ? parts.slice(0, 12) : [""];
}

function normalize(input) {
  const base = defaults();
  const src = input && typeof input === "object" ? input : {};
  const paragraphs = Array.isArray(src.paragraphs) ? src.paragraphs : base.paragraphs;
  const features = Array.isArray(src.features) ? src.features : base.features;
  const stats = Array.isArray(src.stats) ? src.stats : base.stats;
  const body = src.body != null ? clipBlock(src.body, 4000) : clipBlock(joinParts(paragraphs), 4000);
  const featuresText = src.featuresText != null ? clipBlock(src.featuresText, 4000) : clipBlock(joinFeatures(features), 4000);
  return {
    heroEyebrow: clip(src.heroEyebrow != null ? src.heroEyebrow : base.heroEyebrow, 40),
    heroTitle: clip(src.heroTitle != null ? src.heroTitle : base.heroTitle, 40),
    heroLine: clip(src.heroLine != null ? src.heroLine : base.heroLine, 80),
    heroEn: clip(src.heroEn != null ? src.heroEn : base.heroEn, 80),
    heroImage: imageOf(src.heroImage, base.heroImage),
    crumb: clip(src.crumb != null ? src.crumb : base.crumb, 40),
    title: clip(src.title != null ? src.title : base.title, 60),
    body: body,
    paragraphs: paragraphsOf(body),
    sideImage: imageOf(src.sideImage, base.sideImage),
    shopLabel: clip(src.shopLabel != null ? src.shopLabel : base.shopLabel, 20),
    featuresText: featuresText,
    features: src.featuresText != null ? [] : [0, 1, 2, 3].map(function (index) {
      const item = features[index] || base.features[index];
      return {
        title: clip(item.title != null ? item.title : base.features[index].title, 24),
        text: clipBlock(item.text != null ? item.text : base.features[index].text, 80),
      };
    }),
    stats: [0, 1, 2, 3].map(function (index) {
      const item = stats[index] || base.stats[index];
      return {
        value: clip(item.value != null ? item.value : base.stats[index].value, 16),
        label: clip(item.label != null ? item.label : base.stats[index].label, 24),
      };
    }),
    contactTitle: clip(src.contactTitle != null ? src.contactTitle : base.contactTitle, 24),
    contactText: clip(src.contactText != null ? src.contactText : base.contactText, 120),
    contactLabel: clip(src.contactLabel != null ? src.contactLabel : base.contactLabel, 20),
    backLabel: clip(src.backLabel != null ? src.backLabel : base.backLabel, 20),
  };
}

function normalizeContact(input) {
  const base = contactDefaults();
  const src = input && typeof input === "object" ? input : {};
  return {
    title: clip(src.title != null ? src.title : base.title, 40),
    intro: clipBlock(src.intro != null ? src.intro : base.intro, 240),
    intro2: clipBlock(src.intro2 != null ? src.intro2 : base.intro2, 240),
    formTitle: clip(src.formTitle != null ? src.formTitle : base.formTitle, 40),
    thanks: clipBlock(src.thanks != null ? src.thanks : base.thanks, 160),
    error: clipBlock(src.error != null ? src.error : base.error, 160),
    crumb: clip(src.crumb != null ? src.crumb : base.crumb, 40),
    back: clip(src.back != null ? src.back : base.back, 40),
  };
}

function readRaw() {
  try {
    return JSON.parse(fs.readFileSync(dataFile, "utf8")) || {};
  } catch (e) {
    return {};
  }
}

function save(doc) {
  fs.mkdirSync(dataDir, { recursive: true });
  const tmp = dataFile + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(doc, null, 2));
  fs.renameSync(tmp, dataFile);
}

function read() {
  return normalize(readRaw().story);
}

function readContact() {
  return normalizeContact(readRaw().contact);
}

function write(story) {
  const raw = readRaw();
  const next = { story: normalize(story), contact: normalizeContact(raw.contact) };
  save(next);
  return next.story;
}

function writeAll(input) {
  const raw = readRaw();
  const src = input && typeof input === "object" ? input : {};
  const next = {
    story: normalize(src.story != null ? src.story : raw.story),
    contact: normalizeContact(src.contact != null ? src.contact : raw.contact),
  };
  save(next);
  return next;
}

module.exports = {
  defaults: defaults,
  contactDefaults: contactDefaults,
  normalize: normalize,
  normalizeContact: normalizeContact,
  read: read,
  readContact: readContact,
  write: write,
  writeAll: writeAll,
};
