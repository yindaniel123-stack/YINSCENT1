/*
 * Order store. Persists to data/orders.json when the filesystem is writable
 * (local dev server); falls back to instance memory on read-only hosts.
 * NOTE: on Vercel the filesystem is ephemeral, so orders recorded there only
 * live as long as the serverless instance. Move to a database (Vercel KV,
 * Supabase, etc.) when order history must be durable in production.
 */
const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", "..", "data");
const dataFile = path.join(dataDir, "orders.json");
let memoryOrders = null;

function readOrders() {
  if (memoryOrders) return memoryOrders;
  try {
    const orders = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    return Array.isArray(orders) ? orders : [];
  } catch (e) {
    return [];
  }
}

function saveOrders(orders) {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(dataFile, JSON.stringify(orders, null, 2));
    memoryOrders = null;
  } catch (e) {
    memoryOrders = orders;
  }
}

function addOrder(order) {
  const orders = readOrders();
  if (orders.some(function (existing) { return existing.id === order.id; })) {
    return false;
  }
  orders.push(order);
  saveOrders(orders);
  return true;
}

function updateOrder(id, patch) {
  const orders = readOrders();
  const row = orders.find(function (order) { return order.id === id; });
  if (!row) return null;
  ["payStatus", "shipStatus", "service", "serviceNote", "orderStatus", "customerName", "phone", "tracking", "urgedAt", "shipStage", "address", "warehouse", "carrier"].forEach(function (key) {
    if (patch[key] != null) row[key] = patch[key];
  });
  saveOrders(orders);
  return row;
}

function clip(value, max) {
  return String(value || "").replace(/[\u0000-\u001f]/g, "").trim().slice(0, max);
}

function money(value) {
  const n = Number(value);
  if (!isFinite(n) || n < 0) return 0;
  return Math.round(Math.min(n, 1000000) * 100) / 100;
}

function createOrder(input) {
  const orders = readOrders();
  const now = new Date();
  const day = String(now.getFullYear()) + String(now.getMonth() + 1).padStart(2, "0") + String(now.getDate()).padStart(2, "0");
  let seq = 0;
  orders.forEach(function (order) {
    const id = String(order.id || "");
    if (id.indexOf("ORD" + day) !== 0) return;
    const n = parseInt(id.slice(11), 10);
    if (n > seq) seq = n;
  });
  const id = "ORD" + day + String(seq + 1).padStart(4, "0");
  const paid = input.payStatus === "已付款";
  let createdAt = now.toISOString();
  if (input.createdAt) {
    const when = new Date(input.createdAt);
    if (isFinite(when.getTime()) && when.getFullYear() >= 2000 && when.getFullYear() <= 2100) createdAt = when.toISOString();
  }
  const goods = money(input.goodsTotal != null ? input.goodsTotal : input.total);
  const freight = money(input.freight);
  const discount = money(input.discount);
  const payable = input.goodsTotal != null || input.freight != null || input.discount != null
    ? Math.max(0, Math.round((goods + freight - discount) * 100) / 100)
    : money(input.total);
  const shipDate = /^\d{4}-\d{2}-\d{2}$/.test(String(input.shipDate || "")) ? String(input.shipDate) : "";
  const row = {
    id: id,
    total: payable,
    currency: "CNY",
    items: input.items || [],
    userId: clip(input.userId, 40),
    customerName: clip(input.customerName, 40),
    customerType: clip(input.customerType, 20),
    phone: clip(input.phone, 20),
    contactPhone: clip(input.contactPhone, 20),
    receiver: clip(input.receiver, 40),
    country: clip(input.country, 40),
    city: clip(input.city, 40),
    address: clip(input.address, 200),
    postcode: clip(input.postcode, 20),
    note: clip(input.note, 500),
    source: clip(input.source, 40),
    freight: freight,
    discount: discount,
    goodsTotal: goods,
    shipDate: shipDate,
    status: "已提交",
    payStatus: paid ? "已付款" : "未付款",
    shipStatus: "未发货",
    orderStatus: paid ? "待审核" : "待付款",
    createdAt: createdAt,
  };
  orders.push(row);
  saveOrders(orders);
  return row;
}

module.exports = { readOrders, addOrder, updateOrder, createOrder };
