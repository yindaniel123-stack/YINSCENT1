const fs = require("fs");
const path = require("path");
const notify = require("./notify");
const users = require("./users");

const stateFile = path.join(__dirname, "..", "..", "data", "notify-state.json");

function readState() {
  try {
    const data = JSON.parse(fs.readFileSync(stateFile, "utf8"));
    return data && typeof data === "object" ? data : {};
  } catch (e) {
    return {};
  }
}

function writeState(data) {
  try {
    fs.mkdirSync(path.dirname(stateFile), { recursive: true });
    fs.writeFileSync(stateFile, JSON.stringify(data));
  } catch (e) {}
}

function when(value) {
  const date = value ? new Date(value) : new Date();
  if (!isFinite(date.getTime())) return "";
  function pad(n) { return n < 10 ? "0" + n : String(n); }
  return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate()) + " " + pad(date.getHours()) + ":" + pad(date.getMinutes());
}

function money(value) {
  const number = Number(value);
  return "¥" + (isFinite(number) ? number : 0).toFixed(2);
}

function customerEmail(order) {
  if (order.email && notify.cleanEmail(order.email)) return notify.cleanEmail(order.email);
  if (order.userId) {
    const user = users.findById(order.userId);
    if (user && user.email) return notify.cleanEmail(user.email);
  }
  const phone = String(order.phone || order.contactPhone || "").replace(/\D/g, "");
  if (!phone) return "";
  const hit = users.listUsers().filter(function (user) {
    return user.email && String(user.phone || "").replace(/\D/g, "") === phone;
  })[0];
  return hit ? notify.cleanEmail(hit.email) : "";
}

function productRows() {
  try {
    return require("./trade-products").list();
  } catch (e) {
    return [];
  }
}

function orderLines(order, origin) {
  const catalog = productRows();
  const lines = (order.items || []).map(function (item) {
    const product = catalog.filter(function (row) { return row.id === item.id; })[0] || {};
    const qty = Number(item.qty) || 1;
    const price = Number(item.price);
    const image = product.image || "";
    const src = image && origin ? String(origin).replace(/\/$/, "") + "/" + image.replace(/^\//, "") : "";
    return {
      sku: product.sku || item.id || "",
      name: product.name || item.id || "",
      qty: qty,
      price: isFinite(price) ? price : 0,
      image: src,
    };
  });
  const text = lines.map(function (line) {
    return line.sku + "　" + line.name + "　× " + line.qty + "　单价 " + money(line.price) + "　小计 " + money(line.price * line.qty);
  }).join("\n");
  const html = "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin-top:12px;border-collapse:collapse;\">" +
    lines.map(function (line) {
      const img = line.image ? "<img src=\"" + line.image.replace(/"/g, "") + "\" width=\"48\" height=\"48\" alt=\"\" style=\"display:block;border-radius:6px;object-fit:cover;\">" : "";
      return "<tr><td style=\"padding:8px 0;border-top:1px solid #f0e7d8;width:56px;\">" + img + "</td>" +
        "<td style=\"padding:8px;\">" + esc(line.name) + "<br><span style=\"color:#8d867c;\">" + esc(line.sku) + "</span></td>" +
        "<td style=\"padding:8px;white-space:nowrap;\">× " + line.qty + "</td>" +
        "<td style=\"padding:8px;white-space:nowrap;\">" + esc(money(line.price)) + "</td></tr>";
    }).join("") + "</table>";
  return { text: text, html: html };
}

function esc(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function addressOf(order) {
  return [order.receiver, order.phone, order.country, order.city, order.address, order.postcode].filter(Boolean).join(" ");
}

function fieldsFor(order, origin) {
  const lines = orderLines(order, origin);
  const base = {
    订单号: order.id || "",
    客户名称: order.customerName || "",
    订单状态: order.orderStatus || order.status || "",
    总金额: money(order.total),
    收货信息: addressOf(order) || "未填写",
    物流公司: order.carrier || "未填写",
    物流单号: order.tracking || "未填写",
    发货时间: when(order.shippedAt || new Date().toISOString()),
    完成时间: when(new Date().toISOString()),
  };
  return {
    plain: Object.assign({ 订单明细: lines.text }, base),
    rich: Object.assign({ 订单明细: lines.html }, base),
  };
}

async function emitRich(kind, to, dedupe, plain, rich) {
  return notify.emit(kind, { to: to, dedupe: dedupe, fields: plain, htmlFields: rich });
}

async function register(user) {
  const fields = {
    账号: user.username || "",
    联系人: user.name || "",
    联系电话: user.phone || "",
    邮箱: user.email || "",
    公司名称: user.company || "未填写",
    国家地区: user.country || "",
    申请时间: when(user.createdAt),
  };
  const id = user.id || user.email || user.username || "";
  await notify.emit("register_admin", { to: notify.recipients(), dedupe: "register_admin:" + id, fields: fields });
  await notify.emit("register_customer", { to: [user.email || ""], dedupe: "register_customer:" + id, fields: fields });
}

async function review(user, passed) {
  const fields = {
    联系人: user.name || "",
    账号: user.username || "",
    审核时间: when(new Date().toISOString()),
  };
  const kind = passed ? "review_pass" : "review_reject";
  await notify.emit(kind, { to: [user.email || ""], dedupe: kind + ":" + (user.id || user.email || ""), fields: fields });
}

async function orderCreated(order, origin) {
  const packed = fieldsFor(order, origin);
  const id = order.id || "";
  await emitRich("order_admin", notify.recipients(), "order_admin:" + id, packed.plain, packed.rich);
  await emitRich("order_customer", [customerEmail(order)], "order_customer:" + id, packed.plain, packed.rich);
  if (order.payStatus === "已付款") await paid(order, origin);
}

async function paid(order, origin) {
  const packed = fieldsFor(order, origin);
  const id = order.id || "";
  await emitRich("pay_admin", notify.recipients(), "pay_admin:" + id, packed.plain, packed.rich);
  await emitRich("pay_customer", [customerEmail(order)], "pay_customer:" + id, packed.plain, packed.rich);
}

async function shipped(order, origin) {
  const packed = fieldsFor(order, origin);
  const id = order.id || "";
  const tracking = order.tracking || "";
  await notify.emit("ship_customer", {
    to: [customerEmail(order)],
    dedupe: "ship_customer:" + id + ":" + tracking,
    fields: packed.plain,
  });
}

async function completed(order) {
  const packed = fieldsFor(order, "");
  await notify.emit("done_customer", {
    to: [customerEmail(order)],
    dedupe: "done_customer:" + (order.id || ""),
    fields: packed.plain,
  });
}

function isShipped(order) {
  if (!order) return false;
  return order.orderStatus === "已发货" || order.shipStatus === "已发货" || order.shipStage === "已发货" || order.shipStage === "运输中";
}

function isDone(order) {
  if (!order) return false;
  return order.orderStatus === "已完成" || order.shipStage === "已签收";
}

async function orderUpdated(before, after, origin) {
  if (!after) return;
  if ((!before || before.payStatus !== "已付款") && after.payStatus === "已付款") await paid(after, origin);
  if (!isShipped(before) && isShipped(after)) await shipped(after, origin);
  else if (isShipped(after) && before && (before.tracking || "") !== (after.tracking || "") && after.tracking) await shipped(after, origin);
  if (!isDone(before) && isDone(after)) await completed(after);
}

async function serviceOpened(ticket) {
  const fields = {
    工单号: ticket.id || "",
    客户名称: ticket.customerName || "",
    问题类型: ticket.type || "",
    订单号: ticket.orderId || "未填写",
    申请内容: ticket.note || "",
    申请时间: when(ticket.createdAt),
  };
  const id = ticket.id || "";
  await notify.emit("service_admin", { to: notify.recipients(), dedupe: "service_admin:" + id, fields: fields });
  await notify.emit("service_customer", { to: [ticket.email || ""], dedupe: "service_customer:" + id, fields: fields });
}

async function stockChanged(product, previous, next) {
  const settings = require("./settings").read();
  const min = Number(settings.stockMin);
  const qty = Number(next);
  const before = previous == null || previous === "" ? null : Number(previous);
  const state = readState();
  if (!state.stock) state.stock = {};
  const id = product.id || product.sku || "";
  if (!isFinite(qty) || qty >= min) {
    if (state.stock[id]) {
      delete state.stock[id];
      writeState(state);
    }
    return;
  }
  if (state.stock[id]) return;
  if (before != null && before < min) {
    state.stock[id] = state.stock[id] || new Date().toISOString();
    writeState(state);
    return;
  }
  const stamp = new Date().toISOString();
  state.stock[id] = stamp;
  writeState(state);
  await notify.emit("stock_admin", {
    to: notify.recipients(),
    dedupe: "stock_admin:" + id + ":" + stamp,
    fields: {
      产品名称: product.name || id,
      货号: product.sku || id,
      当前库存: String(qty),
      预警数量: String(min),
    },
  });
}

module.exports = {
  register: register,
  review: review,
  orderCreated: orderCreated,
  orderUpdated: orderUpdated,
  serviceOpened: serviceOpened,
  stockChanged: stockChanged,
};
