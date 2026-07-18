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

module.exports = { readOrders, addOrder };
