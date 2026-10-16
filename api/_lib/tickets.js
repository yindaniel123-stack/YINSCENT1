const fs = require("fs");
const path = require("path");

const dataFile = path.join(__dirname, "..", "..", "data", "tickets.json");
const STATUSES = ["待处理", "处理中", "已解决", "已关闭"];
const PRIORITIES = ["普通", "紧急"];

function read() {
  try {
    const data = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    return Array.isArray(data) ? data : [];
  } catch (e) {
    if (e.code === "ENOENT") return [];
    throw e;
  }
}

function write(rows) {
  fs.mkdirSync(path.dirname(dataFile), { recursive: true });
  const tmp = dataFile + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(rows, null, 2));
  fs.renameSync(tmp, dataFile);
}

function update(id, patch) {
  const rows = read();
  const row = rows.filter(function (item) { return item.id === id; })[0];
  if (!row) return null;
  const now = new Date().toISOString();
  if (!Array.isArray(row.messages)) row.messages = [];
  if (!Array.isArray(row.logs)) row.logs = [];
  if (patch.status && STATUSES.indexOf(patch.status) !== -1 && patch.status !== row.status) {
    row.status = patch.status;
    row.logs.push({ text: "状态改为" + patch.status, at: now, actor: patch.actor || "" });
  }
  if (patch.priority && PRIORITIES.indexOf(patch.priority) !== -1 && patch.priority !== row.priority) {
    row.priority = patch.priority;
    row.logs.push({ text: "优先级改为" + patch.priority, at: now, actor: patch.actor || "" });
  }
  if (patch.reply) {
    row.messages.push({ from: "staff", actor: patch.actor || "", text: patch.reply, at: now });
    row.logs.push({ text: "回复了客户", at: now, actor: patch.actor || "" });
    if (row.status === "待处理") {
      row.status = "处理中";
      row.logs.push({ text: "状态改为处理中", at: now, actor: patch.actor || "" });
    }
  }
  write(rows);
  return row;
}

function create(input) {
  const rows = read();
  const now = new Date();
  const day = String(now.getFullYear()) + String(now.getMonth() + 1).padStart(2, "0") + String(now.getDate()).padStart(2, "0");
  let seq = 0;
  rows.forEach(function (row) {
    const id = String(row.id || "");
    if (id.indexOf("CS" + day) !== 0) return;
    const n = parseInt(id.slice(10), 10);
    if (n > seq) seq = n;
  });
  const types = ["产品咨询", "订单问题", "售后申请", "物流查询", "退换货", "投诉建议", "发货问题"];
  const type = types.indexOf(input.type) === -1 ? "售后申请" : input.type;
  const note = String(input.note || "").replace(/[\u0000-\u001f]/g, "").trim().slice(0, 500);
  const row = {
    id: "CS" + day + String(seq + 1).padStart(4, "0"),
    customerName: String(input.customerName || "").slice(0, 40),
    customerType: input.customerType === "经销商" ? "经销商" : "客户",
    phone: String(input.phone || "").slice(0, 20),
    email: String(input.email || "").slice(0, 120),
    orderId: String(input.orderId || "").slice(0, 40),
    type: type,
    note: note,
    status: "待处理",
    priority: "普通",
    userId: String(input.userId || "").slice(0, 40),
    createdAt: now.toISOString(),
    messages: note ? [{ from: "customer", actor: input.customerName || "", text: note, at: now.toISOString() }] : [],
    logs: [{ text: "提交了申请", at: now.toISOString(), actor: input.customerName || "" }],
  };
  rows.push(row);
  write(rows);
  return row;
}

module.exports = { read: read, update: update, create: create, STATUSES: STATUSES, PRIORITIES: PRIORITIES };
