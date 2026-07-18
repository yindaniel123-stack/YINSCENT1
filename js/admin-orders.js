/*
 * Order statistics panel on the admin dashboard. Reads recorded orders from
 * the admin-protected GET /api/orders endpoint and renders aggregate stats
 * plus a recent-orders list. Loads only after the server confirms an admin
 * session (via the yinscent:auth event dispatched by js/auth.js), and shows
 * only data actually stored per order: id, createdAt, items, total, currency.
 */
(function () {
  var base = window.YINSCENT_BASE || "/";
  var section = document.getElementById("adminOrderStats");
  if (!section) return;

  var stateEl = document.getElementById("adminOrderStatsState");
  var grid = document.getElementById("adminOrderStatsGrid");
  var recentWrap = document.getElementById("adminOrderRecent");
  var tableBody = document.getElementById("adminOrderTableBody");
  var metaEl = document.getElementById("adminOrderStatsMeta");
  var loading = false;
  var loaded = false;

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function money(amount, currency) {
    var value = (Number(amount) || 0).toFixed(2);
    if (!currency || currency === "GBP") return "£" + value;
    return currency + " " + value;
  }

  function orderUnits(order) {
    return (order.items || []).reduce(function (units, item) {
      return units + (Number(item.qty) || 0);
    }, 0);
  }

  function formatDate(ms) {
    if (isNaN(ms)) return "—";
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(ms));
  }

  function showState(message, isError, withRetry) {
    if (grid) grid.hidden = true;
    if (recentWrap) recentWrap.hidden = true;
    if (!stateEl) return;
    stateEl.hidden = false;
    stateEl.className = "admin-order-state" + (isError ? " is-error" : "");
    stateEl.textContent = message;
    if (withRetry) {
      var retry = document.createElement("button");
      retry.type = "button";
      retry.className = "admin-order-retry";
      retry.textContent = "Try again";
      retry.addEventListener("click", load);
      stateEl.appendChild(document.createElement("br"));
      stateEl.appendChild(retry);
    }
  }

  function render(orders) {
    if (!orders.length) {
      showState("No orders recorded yet. Completed checkouts will appear here.", false, false);
      if (metaEl) metaEl.textContent = "";
      return;
    }

    var sorted = orders.slice().sort(function (a, b) {
      return (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0);
    });

    var weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    var recentCount = 0;
    var totalUnits = 0;
    var largest = null;

    orders.forEach(function (order) {
      var when = Date.parse(order.createdAt);
      if (!isNaN(when) && when >= weekAgo) recentCount += 1;
      totalUnits += orderUnits(order);
      if (!largest || (Number(order.total) || 0) > (Number(largest.total) || 0)) {
        largest = order;
      }
    });

    setText("adminOrderTotal", String(orders.length));
    setText("adminOrderRecentCount", String(recentCount));
    setText("adminOrderAvgItems", (totalUnits / orders.length).toFixed(1));
    setText("adminOrderLargest", money(largest.total, largest.currency));
    setText("adminOrderLargestNote", largest.id ? "order " + largest.id : "by order total");

    if (metaEl) {
      var lastWhen = Date.parse(sorted[0].createdAt);
      metaEl.textContent = isNaN(lastWhen)
        ? orders.length + " recorded"
        : "last order " + formatDate(lastWhen);
    }

    if (tableBody) {
      tableBody.innerHTML = "";
      sorted.slice(0, 8).forEach(function (order) {
        var row = document.createElement("tr");
        [
          { text: order.id || "—", className: "admin-order-table__id" },
          { text: formatDate(Date.parse(order.createdAt)) },
          { text: String(orderUnits(order)) },
          { text: money(order.total, order.currency) },
        ].forEach(function (cell) {
          var td = document.createElement("td");
          if (cell.className) td.className = cell.className;
          td.textContent = cell.text;
          row.appendChild(td);
        });
        tableBody.appendChild(row);
      });
    }

    if (stateEl) stateEl.hidden = true;
    if (grid) grid.hidden = false;
    if (recentWrap) recentWrap.hidden = false;
  }

  function load() {
    if (loading) return;
    loading = true;
    showState("Loading order data…", false, false);
    fetch(base + "api/orders", { method: "GET" })
      .then(function (res) {
        if (res.status === 401) throw new Error("unauthorized");
        if (!res.ok) throw new Error("unavailable");
        return res.json();
      })
      .then(function (data) {
        loaded = true;
        render(Array.isArray(data.orders) ? data.orders : []);
      })
      .catch(function (err) {
        showState(
          err && err.message === "unauthorized"
            ? "Your admin session has expired. Sign in again to view order statistics."
            : "Couldn't load order data. Check the connection and try again.",
          true,
          true
        );
      })
      .then(function () {
        loading = false;
      });
  }

  document.addEventListener("yinscent:auth", function (event) {
    var isAdmin = !!(event.detail && event.detail.admin);
    if (isAdmin && !loaded) load();
    if (!isAdmin) loaded = false;
  });
})();
