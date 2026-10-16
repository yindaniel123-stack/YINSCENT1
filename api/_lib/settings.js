const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", "..", "data");
const dataFile = path.join(dataDir, "settings.json");

const DEFAULT_TEMPLATES = {
  "注册申请": "收到注册申请。\n姓名：{{姓名}}\n电话：{{电话}}\n邮箱：{{邮箱}}\n状态：{{状态}}\n时间：{{时间}}",
  "审核通过": "注册申请已通过。新密码只在后台操作时显示一次，请立刻交给用户。\n账号：{{账号}}\n姓名：{{姓名}}\n电话：{{电话}}\n邮箱：{{邮箱}}\n会员到期：{{会员到期}}\n时间：{{时间}}",
  "审核拒绝": "注册申请已拒绝。\n姓名：{{姓名}}\n电话：{{电话}}\n邮箱：{{邮箱}}\n时间：{{时间}}",
  "密码已重置": "固定密码已重置。旧密码和旧会话已失效。新密码只在后台操作时显示一次。\n账号：{{账号}}\n姓名：{{姓名}}\n电话：{{电话}}\n邮箱：{{邮箱}}\n会员到期：{{会员到期}}\n时间：{{时间}}",
  "用户登录": "用户登录。\n账号：{{账号}}\n姓名：{{姓名}}\n电话：{{电话}}\n邮箱：{{邮箱}}\n状态：{{状态}}\n会员到期：{{会员到期}}\n时间：{{时间}}\nIP：{{IP}}",
  "重置密码申请": "收到重置密码申请。\n账号：{{账号}}\n姓名：{{姓名}}\n电话：{{电话}}\n邮箱：{{邮箱}}\n时间：{{时间}}",
  "资料更新": "用户资料已更新。\n账号：{{账号}}\n姓名：{{姓名}}\n电话：{{电话}}\n邮箱：{{邮箱}}\n状态：{{状态}}\n会员到期：{{会员到期}}\n时间：{{时间}}",
  "账号禁用": "账号已禁用。\n账号：{{账号}}\n姓名：{{姓名}}\n电话：{{电话}}\n邮箱：{{邮箱}}\n时间：{{时间}}",
  "账号启用": "账号已启用。\n账号：{{账号}}\n姓名：{{姓名}}\n电话：{{电话}}\n邮箱：{{邮箱}}\n会员到期：{{会员到期}}\n时间：{{时间}}",
  "账号删除": "账号已删除。\n账号：{{账号}}\n姓名：{{姓名}}\n电话：{{电话}}\n邮箱：{{邮箱}}\n时间：{{时间}}",
  "会员续期": "会员已续期。\n账号：{{账号}}\n姓名：{{姓名}}\n电话：{{电话}}\n邮箱：{{邮箱}}\n会员到期：{{会员到期}}\n时间：{{时间}}",
  "直接创建": "已创建会员账号。新密码只在后台操作时显示一次，请立刻交给用户。\n账号：{{账号}}\n会员到期：{{会员到期}}\n时间：{{时间}}",
  "分配账号": "已为用户分配登录账号。新密码只在后台操作时显示一次。\n账号：{{账号}}\n姓名：{{姓名}}\n电话：{{电话}}\n邮箱：{{邮箱}}\n会员到期：{{会员到期}}\n时间：{{时间}}",
  "创建管理员": "已创建管理员。密码可在员工账号资料中查看。\n账号：{{账号}}\n姓名：{{姓名}}\n权限：{{权限}}\n时间：{{时间}}",
  "重置管理员密码": "管理员密码已重置。新密码可在员工账号资料中查看。\n账号：{{账号}}\n时间：{{时间}}",
  "产品权限": "产品访问权限已变更。\n账号：{{账号}}\n姓名：{{姓名}}\n产品权限：{{产品权限}}\n时间：{{时间}}",
};

const NOTICE_DEFAULTS = [
  ["register_admin", "新客户注册（管理员）", "admin", "YINSCENT 新客户注册", "收到新的客户注册申请。\n账号：{{账号}}\n联系人：{{联系人}}\n联系电话：{{联系电话}}\n邮箱：{{邮箱}}\n公司名称：{{公司名称}}\n国家/地区：{{国家地区}}\n申请时间：{{申请时间}}"],
  ["register_customer", "新客户注册（客户）", "customer", "YINSCENT 注册申请已提交", "{{联系人}}，您好。\n您的注册申请已提交，正在等待审核。审核通过前无法登录。\n账号：{{账号}}\n申请时间：{{申请时间}}"],
  ["review_pass", "注册审核通过", "customer", "YINSCENT 注册审核通过", "{{联系人}}，您好。\n您的注册申请已通过，可以使用账号 {{账号}} 登录。\n审核时间：{{审核时间}}"],
  ["review_reject", "注册审核未通过", "customer", "YINSCENT 注册审核未通过", "{{联系人}}，您好。\n您的注册申请未通过。\n审核时间：{{审核时间}}"],
  ["order_admin", "新订单（管理员）", "admin", "YINSCENT 新订单 {{订单号}}", "收到新订单。\n订单号：{{订单号}}\n客户名称：{{客户名称}}\n订单状态：{{订单状态}}\n总金额：{{总金额}}\n收货信息：{{收货信息}}\n{{订单明细}}"],
  ["order_customer", "新订单（客户）", "customer", "YINSCENT 订单确认 {{订单号}}", "{{客户名称}}，您好。\n我们已收到您的订单。\n订单号：{{订单号}}\n订单状态：{{订单状态}}\n总金额：{{总金额}}\n收货信息：{{收货信息}}\n{{订单明细}}"],
  ["pay_admin", "付款成功（管理员）", "admin", "YINSCENT 订单已付款 {{订单号}}", "订单已付款。\n订单号：{{订单号}}\n客户名称：{{客户名称}}\n总金额：{{总金额}}\n{{订单明细}}"],
  ["pay_customer", "付款成功（客户）", "customer", "YINSCENT 付款成功 {{订单号}}", "{{客户名称}}，您好。\n订单 {{订单号}} 已付款。\n总金额：{{总金额}}\n{{订单明细}}"],
  ["ship_customer", "订单发货", "customer", "YINSCENT 订单已发货 {{订单号}}", "{{客户名称}}，您好。\n您的订单已发货。\n订单号：{{订单号}}\n物流公司：{{物流公司}}\n物流单号：{{物流单号}}\n发货时间：{{发货时间}}"],
  ["done_customer", "订单完成", "customer", "YINSCENT 订单已完成 {{订单号}}", "{{客户名称}}，您好。\n订单 {{订单号}} 已完成。\n完成时间：{{完成时间}}"],
  ["service_admin", "售后申请（管理员）", "admin", "YINSCENT 售后申请 {{工单号}}", "收到售后申请。\n工单号：{{工单号}}\n客户：{{客户名称}}\n问题类型：{{问题类型}}\n关联订单：{{订单号}}\n申请内容：{{申请内容}}\n申请时间：{{申请时间}}"],
  ["service_customer", "售后申请（客户）", "customer", "YINSCENT 售后申请已提交 {{工单号}}", "{{客户名称}}，您好。\n您的售后申请已提交。\n工单号：{{工单号}}\n问题类型：{{问题类型}}\n申请时间：{{申请时间}}"],
  ["stock_admin", "库存预警", "admin", "YINSCENT 库存预警 {{产品名称}}", "产品库存已低于预警数量。\n产品名称：{{产品名称}}\n货号：{{货号}}\n当前库存：{{当前库存}}\n预警数量：{{预警数量}}"],
];

function noticeDefaults() {
  const out = {};
  NOTICE_DEFAULTS.forEach(function (item) {
    out[item[0]] = { enabled: true, subject: item[3], body: item[4] };
  });
  return out;
}

function noticeList(saved) {
  return NOTICE_DEFAULTS.map(function (item) {
    const custom = saved && saved[item[0]] ? saved[item[0]] : {};
    return {
      id: item[0],
      label: item[1],
      audience: item[2],
      enabled: custom.enabled !== false,
      subject: String(custom.subject || item[3]).slice(0, 120),
      body: String(custom.body || item[4]).slice(0, 4000),
    };
  });
}

function clipText(value, max) {
  return String(value == null ? "" : value).replace(/[\u0000-\u001f]/g, "").trim().slice(0, max);
}

function siteDefaults() {
  return {
    name: "YINSCENT",
    subtitle: "香薰蜡烛与茶蜡",
    keywords: "YINSCENT, Home Fragrance, Reed Diffuser, Scented Candle, Air Freshener",
    description: "YINSCENT 香薰蜡烛与茶蜡，总部位于中国义乌。",
    company: "",
    phone: "",
    email: "",
    address: "",
    domain: "",
    logo: "",
    defaultLanguage: "zh",
    languages: ["zh", "en", "es", "pt"],
    currency: "CNY",
    timezone: "Asia/Shanghai",
    dateFormat: "YYYY-MM-DD",
    timeFormat: "24",
    allowRegister: true,
    requireReview: true,
    showStock: false,
    enableOrder: true,
    showPrice: true,
    enableInquiry: true,
    defaultHome: "products",
    pageSize: 24,
    uploadMaxMb: 5,
    uploadTypes: ["jpg", "png", "webp"],
    imageSize: "800×800px 或 1000×1000px",
    copyright: "© {year} YINSCENT. All rights reserved.",
    carriers: "",
    social: { facebook: "", instagram: "", youtube: "", pinterest: "" },
  };
}

function normalizeSite(input, previous) {
  const base = Object.assign(siteDefaults(), previous || {});
  const src = input && typeof input === "object" ? input : {};
  const langs = ["zh", "en", "es", "pt"];
  let languages = Array.isArray(src.languages) ? src.languages.filter(function (item) { return langs.indexOf(item) !== -1; }) : base.languages.slice();
  if (!languages.length) languages = ["zh"];
  let defaultLanguage = langs.indexOf(src.defaultLanguage) !== -1 ? src.defaultLanguage : base.defaultLanguage;
  if (languages.indexOf(defaultLanguage) === -1) defaultLanguage = languages[0];
  let logo = typeof src.logo === "string" ? src.logo : base.logo || "";
  if (logo && !/^data:image\/(png|jpeg|webp|svg\+xml);base64,/.test(logo.slice(0, 48))) logo = "";
  if (logo.length > 2800000) logo = "";
  const typeNames = ["jpg", "png", "webp"];
  let uploadTypes = Array.isArray(src.uploadTypes) ? src.uploadTypes.filter(function (item) { return typeNames.indexOf(item) !== -1; }) : (base.uploadTypes || []).slice();
  if (!uploadTypes.length) uploadTypes = ["jpg", "png", "webp"];
  const pageSize = Math.min(100, Math.max(6, Math.round(Number(src.pageSize) || base.pageSize || 24)));
  const uploadMaxMb = Math.min(20, Math.max(1, Math.round(Number(src.uploadMaxMb) || base.uploadMaxMb || 5)));
  function flag(key, fallback) {
    if (typeof src[key] === "boolean") return src[key];
    if (typeof base[key] === "boolean") return base[key];
    return fallback;
  }
  function link(value) {
    const text = clipText(value, 200);
    if (!text) return "";
    return /^https?:\/\//i.test(text) ? text : "";
  }
  const socialIn = src.social && typeof src.social === "object" ? src.social : {};
  const prevSocial = base.social || {};
  const email = clipText(src.email != null ? src.email : base.email, 80);
  return {
    name: clipText(src.name != null ? src.name : base.name, 40) || "YINSCENT",
    subtitle: clipText(src.subtitle != null ? src.subtitle : base.subtitle, 60),
    keywords: clipText(src.keywords != null ? src.keywords : base.keywords, 200),
    description: clipText(src.description != null ? src.description : base.description, 200),
    company: clipText(src.company != null ? src.company : base.company, 80),
    phone: clipText(src.phone != null ? src.phone : base.phone, 40),
    email: email.indexOf("@") === -1 ? "" : email,
    address: clipText(src.address != null ? src.address : base.address, 200),
    domain: clipText(src.domain != null ? src.domain : base.domain, 80).replace(/^https?:\/\//i, "").replace(/\/.*$/, ""),
    logo: logo,
    defaultLanguage: defaultLanguage,
    languages: languages,
    currency: "CNY",
    timezone: "Asia/Shanghai",
    dateFormat: src.dateFormat === "DD/MM/YYYY" || src.dateFormat === "MM/DD/YYYY" ? src.dateFormat : "YYYY-MM-DD",
    timeFormat: src.timeFormat === "12" ? "12" : "24",
    allowRegister: flag("allowRegister", true),
    requireReview: flag("requireReview", true),
    showStock: flag("showStock", false),
    enableOrder: flag("enableOrder", true),
    showPrice: flag("showPrice", true),
    enableInquiry: flag("enableInquiry", true),
    defaultHome: src.defaultHome === "story" || src.defaultHome === "contact" ? src.defaultHome : "products",
    pageSize: pageSize,
    uploadMaxMb: uploadMaxMb,
    uploadTypes: uploadTypes,
    imageSize: clipText(src.imageSize != null ? src.imageSize : base.imageSize, 80) || "800×800px 或 1000×1000px",
    copyright: clipText(src.copyright != null ? src.copyright : base.copyright, 200),
    carriers: clipText(src.carriers != null ? src.carriers : base.carriers, 200),
    social: {
      facebook: link(socialIn.facebook != null ? socialIn.facebook : prevSocial.facebook),
      instagram: link(socialIn.instagram != null ? socialIn.instagram : prevSocial.instagram),
      youtube: link(socialIn.youtube != null ? socialIn.youtube : prevSocial.youtube),
      pinterest: link(socialIn.pinterest != null ? socialIn.pinterest : prevSocial.pinterest),
    },
  };
}

function defaults() {
  return {
    membershipMonths: 12,
    notifyEmail: "",
    smtp: { host: "", port: 587, user: "", pass: "", from: "", fromName: "", secure: "tls", provider: "smtp", apiKey: "" },
    templates: Object.assign({}, DEFAULT_TEMPLATES),
    notifyEmails: [],
    stockMin: 5,
    notices: noticeDefaults(),
    site: siteDefaults(),
  };
}

function read() {
  const base = defaults();
  try {
    const saved = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    if (saved && typeof saved === "object") {
      base.membershipMonths = clampMonths(saved.membershipMonths);
      base.notifyEmail = String(saved.notifyEmail || "");
      const smtp = saved.smtp || {};
      base.smtp = {
        host: String(smtp.host || ""),
        port: Number(smtp.port) || 587,
        user: String(smtp.user || ""),
        pass: String(smtp.pass || ""),
        from: String(smtp.from || ""),
        fromName: String(smtp.fromName || "").slice(0, 60),
        secure: smtp.secure === "ssl" ? "ssl" : "tls",
        provider: smtp.provider === "resend" || smtp.provider === "sendgrid" ? smtp.provider : "smtp",
        apiKey: String(smtp.apiKey || ""),
      };
      const templates = Object.assign({}, DEFAULT_TEMPLATES, saved.templates || {});
      base.templates = templates;
      const emails = Array.isArray(saved.notifyEmails) ? saved.notifyEmails : [];
      base.notifyEmails = emails.map(function (item) { return String(item || "").trim(); }).filter(Boolean).slice(0, 10);
      if (!base.notifyEmails.length && base.notifyEmail) base.notifyEmails = [base.notifyEmail];
      if (base.notifyEmails.length) base.notifyEmail = base.notifyEmails[0];
      const min = Number(saved.stockMin);
      base.stockMin = isFinite(min) && min >= 0 ? Math.min(100000, Math.round(min)) : 5;
      base.site = normalizeSite(saved.site || {}, siteDefaults());
      base.notices = noticeDefaults();
      const custom = saved.notices || {};
      Object.keys(base.notices).forEach(function (id) {
        if (!custom[id]) return;
        if (custom[id].enabled === false) base.notices[id].enabled = false;
        if (typeof custom[id].subject === "string" && custom[id].subject.trim()) base.notices[id].subject = custom[id].subject.trim().slice(0, 120);
        if (typeof custom[id].body === "string") base.notices[id].body = custom[id].body.slice(0, 4000);
      });
    }
  } catch (e) {}
  return base;
}

function write(next) {
  fs.mkdirSync(dataDir, { recursive: true });
  const tmp = dataFile + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(next, null, 2));
  fs.renameSync(tmp, dataFile);
}

function clampMonths(value) {
  const months = Number(value);
  if (!months || months < 1) return 12;
  return Math.min(36, Math.round(months));
}

function publicView() {
  const saved = read();
  return {
    membershipMonths: saved.membershipMonths,
    notifyEmail: saved.notifyEmail,
    smtp: {
      host: saved.smtp.host,
      port: saved.smtp.port,
      user: saved.smtp.user,
      from: saved.smtp.from,
      fromName: saved.smtp.fromName || "",
      secure: saved.smtp.secure === "ssl" ? "ssl" : "tls",
      hasPassword: !!saved.smtp.pass,
      provider: saved.smtp.provider || "smtp",
      hasApiKey: !!saved.smtp.apiKey,
    },
    templates: saved.templates,
    templateNames: Object.keys(DEFAULT_TEMPLATES),
    notifyEmails: saved.notifyEmails,
    stockMin: saved.stockMin,
    notices: noticeList(saved.notices),
    site: saved.site,
  };
}

function template(event) {
  const saved = read();
  return saved.templates[event] || DEFAULT_TEMPLATES[event] || "";
}

function notice(id) {
  const saved = read();
  return noticeList(saved.notices).filter(function (item) { return item.id === id; })[0] || null;
}

module.exports = {
  read: read,
  write: write,
  publicView: publicView,
  template: template,
  notice: notice,
  noticeList: noticeList,
  clampMonths: clampMonths,
  defaults: defaults,
  siteDefaults: siteDefaults,
  normalizeSite: normalizeSite,
};
