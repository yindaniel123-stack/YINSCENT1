(function () {
  var base = window.YINSCENT_BASE || "/";
  var GROUPS = [
    ["总览", [["home", "首页"], ["reports", "数据报表"]]],
    ["客户管理", [
      ["signup", "新客户注册"], ["review", "客户注册审核"], ["clients", "客户信息"],
    ]],
    ["商品与供应链", [
      ["productNew", "新增产品"], ["productAll", "所有产品信息"],
      ["orders", "订单管理"], ["shipping", "发货管理"],
    ]],
    ["客户服务", [["service", "售后客服"]]],
    ["系统管理", [
      ["content", "内容管理"],
      ["admins", "员工管理"], ["roles", "角色权限"], ["logs", "操作日志"],
      ["settings", "系统设置"],
    ]],
  ];
  var LABELS = {};
  GROUPS.forEach(function (group) {
    group[1].forEach(function (item) { LABELS[item[0]] = item[1]; });
  });
  var state = { admin: null, tab: "reports", orders: [], users: [], products: [], alerts: { review: 0, service: 0 } };

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }
  function clear(node) { if (node) node.innerHTML = ""; }
  function money(amount) {
    var n = Number(amount);
    if (!isFinite(n)) n = 0;
    return "¥" + n.toFixed(2);
  }
  function menuOn(perms, key) {
    if (perms.indexOf(key) !== -1) return true;
    if (key === "home" && perms.indexOf("desk") !== -1) return true;
    if (key === "reports" && perms.indexOf("dashboard") !== -1) return true;
    return false;
  }
  function allowed(key) {
    var admin = state.admin;
    if (!admin) return false;
    if (admin.super) return true;
    return menuOn(admin.permissions || [], key);
  }
  function json(url, body) {
    return fetch(base + url, {
      method: body ? "POST" : "GET",
      credentials: "same-origin",
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
    }).then(function (res) {
      return res.json().then(function (data) { return { ok: res.ok, data: data || {} }; }).catch(function () {
        return { ok: res.ok, data: {} };
      });
    });
  }
  function askConfirm() {
    return Promise.resolve("确认");
  }
  function saveDesk(body, message) {
    return askConfirm(message).then(function (confirmText) {
      if (confirmText !== "确认") return { ok: false, data: { error: "confirm_required" } };
      body.confirm = confirmText;
      return json("api/admin/desk", body);
    });
  }

  function icon(name) {
    var alias = { signup: "customers", clients: "customers", productNew: "products", productAll: "products" };
    name = alias[name] || name;
    var paths = {
      desk: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.2"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.2"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.2"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.2"/>',
      reports: '<path d="M4 19V10M10 19V5M16 19v-7M22 19H2"/>',
      customers: '<circle cx="9" cy="8" r="2.4"/><path d="M4.5 18c.6-2.4 2.4-3.6 4.5-3.6s3.9 1.2 4.5 3.6"/><circle cx="16.5" cy="8.5" r="2"/><path d="M15.2 14.4c1.6.2 2.9 1.1 3.5 2.6"/>',
      review: '<rect x="6" y="3.5" width="12" height="17" rx="1.5"/><path d="M9 3.5h6v2.5H9zM9 11l2 2 4-4"/>',
      prices: '<path d="M4 12.5 11.5 5H19v7.5L11.5 20z"/><circle cx="15.2" cy="8.8" r="1.1"/>',
      orders: '<path d="M7 3.5h7l5 5V20.5H7z"/><path d="M14 3.5V9h5M9.5 13h6M9.5 16.5h4"/>',
      payments: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/>',
      products: '<path d="M12 3.5 20 8v8l-8 4.5L4 16V8z"/><path d="M12 12.2 20 8M12 12.2 4 8M12 12.2V20.5"/>',
      stock: '<path d="M4 8.5 12 4.5l8 4-8 4z"/><path d="M4 12.5l8 4 8-4M4 16.5l8 4 8-4"/>',
      shipping: '<path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z"/><circle cx="7" cy="17.5" r="1.6"/><circle cx="17" cy="17.5" r="1.6"/>',
      service: '<path d="M4 13a8 8 0 0 1 16 0"/><path d="M4 13v3.5A2.5 2.5 0 0 0 6.5 19H8v-6H6.2A2.2 2.2 0 0 0 4 15.2V13zM20 13v2.2a2.2 2.2 0 0 1-2.2 2.2H16v-6h1.5A2.5 2.5 0 0 1 20 13.8V13zM12 19.5h3"/>',
      content: '<path d="M7 3.5h7l5 5V20.5H7z"/><path d="M14 3.5V9h5M9.5 13h6M9.5 16.5h6"/>',
      files: '<rect x="3.5" y="6" width="17" height="12" rx="1.6"/><path d="M4 7.5 12 13l8-5.5"/>',
      mail: '<rect x="3.5" y="6" width="17" height="12" rx="1.6"/><path d="M4 7.5 12 13l8-5.5"/>',
      admins: '<rect x="3.5" y="5" width="17" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6.2 16.2c.5-1.5 1.6-2.2 2.8-2.2s2.3.7 2.8 2.2M14 10.5h4M14 14h3"/>',
      roles: '<path d="M12 3.5 19 6.5v5.2c0 4.2-2.8 6.8-7 8.3-4.2-1.5-7-4.1-7-8.3V6.5z"/>',
      logs: '<path d="M8 4.5h11M8 12h11M8 19.5h11M4.5 4.5h.1M4.5 12h.1M4.5 19.5h.1"/>',
      settings: '<circle cx="12" cy="12" r="3"/><path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6.1 6.1l1.6 1.6M16.3 16.3l1.6 1.6M17.9 6.1l-1.6 1.6M7.7 16.3l-1.6 1.6"/>',
      regions: '<path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10z"/><circle cx="12" cy="11" r="2"/>',
      home: '<path d="M4 11.5 12 4.5l8 7"/><path d="M7 10.5V19.5h10v-9"/>',
      logout: '<path d="M10 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19H10"/><path d="M13 8.5 17.5 12 13 15.5M17 12H9"/>',
    };
    var span = el("span", "desk__ico");
    span.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + (paths[name] || "") + "</svg>";
    return span;
  }

  function alertCount(key) {
    var count = state.alerts && Number(state.alerts[key]);
    if (!count || count < 1) return 0;
    return count;
  }

  function appendAlert(node, key) {
    var count = alertCount(key);
    if (!count) return;
    var badge = el("span", "desk-alert", count > 99 ? "99+" : String(count));
    badge.setAttribute("aria-label", badge.textContent + "条待处理");
    node.appendChild(badge);
  }

  function refreshAlerts() {
    return json("api/admin/alerts").then(function (res) {
      var data = res.ok && res.data ? res.data : {};
      state.alerts = {
        review: Number(data.review) || 0,
        service: Number(data.service) || 0,
      };
      if (document.getElementById("deskSide")) renderSide();
    }).catch(function () {});
  }

  function renderSide() {
    var side = document.getElementById("deskSide");
    if (!side) return;
    clear(side);
    var brand = el("div", "desk__brand");
    brand.appendChild(el("strong", "", "YINSCENT"));
    brand.appendChild(el("span", "", "伊馨 · 业务管理系统"));
    side.appendChild(brand);
    var nav = el("div", "desk__nav");
    GROUPS.forEach(function (group) {
      var block = el("div", "desk__group");
      block.appendChild(el("p", "desk__label", group[0]));
      group[1].forEach(function (item) {
        if (!allowed(item[0])) {
          var locked = el("span", "desk__link is-locked");
          locked.setAttribute("aria-disabled", "true");
          locked.appendChild(icon(item[0]));
          locked.appendChild(document.createTextNode(item[1]));
          block.appendChild(locked);
          return;
        }
        if (item[0] === "home") {
          var jump = el("a", "desk__link");
          jump.href = base + "index.html";
          jump.appendChild(icon(item[0]));
          jump.appendChild(document.createTextNode(item[1]));
          appendAlert(jump, item[0]);
          block.appendChild(jump);
          return;
        }
        var btn = el("button", "desk__link" + (state.tab === item[0] ? " is-active" : ""));
        btn.type = "button";
        btn.appendChild(icon(item[0]));
        btn.appendChild(document.createTextNode(item[1]));
        appendAlert(btn, item[0]);
        btn.addEventListener("click", function () { open(item[0]); });
        block.appendChild(btn);
      });
      nav.appendChild(block);
    });
    side.appendChild(nav);
    var foot = el("div", "desk__foot");
    var logout = el("button", "desk__link desk__logout");
    logout.type = "button";
    logout.appendChild(icon("logout"));
    logout.appendChild(document.createTextNode("退出登录"));
    logout.addEventListener("click", function () {
      var signOut = document.getElementById("adminSignOut");
      if (signOut) signOut.click();
    });
    foot.appendChild(logout);
    side.appendChild(foot);
  }

  function open(key) {
    if (key === "home") {
      window.location.href = base + "index.html";
      return;
    }
    if (!allowed(key)) key = firstTab();
    state.tab = key || "reports";
    var crumb = document.getElementById("deskCrumb");
    if (crumb) crumb.textContent = LABELS[state.tab] || "首页";
    renderSide();
    var main = document.getElementById("deskMain");
    var members = document.getElementById("memberConsole");
    if (members) members.hidden = true;
    if (main) main.hidden = false;
    renderMain();
  }

  function firstTab() {
    var found = "";
    GROUPS.forEach(function (group) {
      group[1].forEach(function (item) {
        if (!found && item[0] !== "home" && allowed(item[0])) found = item[0];
      });
    });
    return found;
  }

  function customerName(order) {
    var user = state.users.filter(function (item) { return item.id === order.userId; })[0];
    return (user && (user.name || user.username)) || "客户";
  }
  function payOf(order) { return order.payStatus || "未付款"; }
  function shipOf(order) { return order.shipStatus || "未发货"; }
  function serviceOf(order) { return order.service || "无"; }

  function pill(text, kind) {
    return el("span", "desk-pill desk-pill--" + kind, text);
  }
  function payKind(text) {
    if (text === "已付款") return "ok";
    if (text === "未付款") return "wait";
    return "muted";
  }
  function shipKind(text) {
    if (text === "已发货") return "ok";
    if (text === "待发货") return "ship";
    return "muted";
  }

  function svgEl(tag) {
    return document.createElementNS("http://www.w3.org/2000/svg", tag);
  }

  function renderReports(root) {
    var today = new Date();
    var view = "overview";
    var tabs = [
      ["overview", "销售概览", "reports"],
      ["orders", "订单报表", "orders"],
      ["products", "产品报表", "products"],
      ["customers", "客户报表", "customers"],
      ["stock", "库存报表", "stock"],
      ["regions", "地区报表", "regions"],
    ];
    var statuses = [
      ["待付款", "#d4b483"],
      ["待审核", "#8d867c"],
      ["待发货", "#c4a06a"],
      ["已发货", "#1d3b34"],
      ["已完成", "#5d8a7b"],
      ["已取消", "#c47a6a"],
    ];

    var top = el("div", "rpt-top");
    var titles = el("div");
    titles.appendChild(el("h1", "desk__title", "数据报表"));
    titles.appendChild(el("p", "rpt-sub", "统计订单、销售、客户、产品、库存等数据，帮助您了解业务情况。"));
    top.appendChild(titles);
    var tools = el("div", "rpt-tools");
    var range = el("div", "rpt-range");
    var startInput = el("input");
    startInput.type = "date";
    startInput.value = ymd(new Date(today.getFullYear(), today.getMonth(), 1));
    startInput.setAttribute("aria-label", "开始日期");
    var endInput = el("input");
    endInput.type = "date";
    endInput.value = ymd(today);
    endInput.setAttribute("aria-label", "结束日期");
    range.appendChild(startInput);
    range.appendChild(el("span", "", "—"));
    range.appendChild(endInput);
    var exportBtn = el("button", "rpt-export", "导出报表");
    exportBtn.type = "button";
    tools.appendChild(range);
    tools.appendChild(exportBtn);
    top.appendChild(tools);
    root.appendChild(top);

    var tabBar = el("div", "rpt-tabs");
    root.appendChild(tabBar);
    var body = el("div", "rpt-body");
    root.appendChild(body);

    function ymd(date) {
      var month = date.getMonth() + 1;
      var day = date.getDate();
      return date.getFullYear() + "-" + (month < 10 ? "0" : "") + month + "-" + (day < 10 ? "0" : "") + day;
    }
    function parseDay(value) {
      var parts = String(value || "").split("-");
      if (parts.length !== 3) return null;
      var date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return isFinite(date.getTime()) ? date : null;
    }
    function bounds() {
      var start = parseDay(startInput.value) || new Date(today.getFullYear(), today.getMonth(), 1);
      var end = parseDay(endInput.value) || new Date(today.getFullYear(), today.getMonth(), today.getDate());
      if (start.getTime() > end.getTime()) {
        var swap = start;
        start = end;
        end = swap;
      }
      var from = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
      var to = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1).getTime();
      var span = Math.max(1, Math.round((to - from) / 86400000));
      return { start: start, end: end, from: from, to: to, prevFrom: from - span * 86400000, prevTo: from };
    }
    function between(list, from, to) {
      return list.filter(function (item) {
        var time = Date.parse(item.createdAt);
        return time >= from && time < to;
      });
    }
    function selling(orders) {
      return orders.filter(function (order) { return stageOf(order) !== "已取消"; });
    }
    function moneyComma(amount, currency) {
      var number = Number(amount);
      if (!isFinite(number)) number = 0;
      var bodyText = number.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return currency === "USD" ? "$" + bodyText : "¥" + bodyText;
    }
    function bagOf(orders) {
      var cny = 0;
      var usd = 0;
      selling(orders).forEach(function (order) {
        var number = Number(order.total) || 0;
        if (order.currency === "USD") usd += number;
        else cny += number;
      });
      return { cny: cny, usd: usd };
    }
    function showBag(value) {
      if (value.usd && value.cny) return moneyComma(value.cny) + " / " + moneyComma(value.usd, "USD");
      if (value.usd && !value.cny) return moneyComma(value.usd, "USD");
      return moneyComma(value.cny);
    }
    function bagNumber(value) {
      return value.usd && !value.cny ? value.usd : value.cny;
    }
    function paidOrders(orders) {
      return orders.filter(function (order) { return payOf(order) === "已付款"; });
    }
    function shippedCount(orders) {
      return orders.filter(function (order) {
        var stage = stageOf(order);
        return stage === "已发货" || stage === "已完成" || shipOf(order) === "已发货";
      }).length;
    }
    function onSaleCount() {
      return state.products.filter(function (product) {
        if (product.stock == null || product.stock === "") return true;
        return Number(product.stock) > 0;
      }).length;
    }
    function compact(number) {
      return String(Math.round(number) || 0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    function productOf(id) {
      return state.products.filter(function (item) { return item.id === id; })[0];
    }
    function salesRows(orders) {
      var map = {};
      selling(orders).forEach(function (order) {
        (order.items || []).forEach(function (item) {
          if (!item.id) return;
          var product = productOf(item.id);
          var qty = Number(item.qty) || 0;
          var price = Number(item.price != null ? item.price : product && product.price) || 0;
          if (!map[item.id]) {
            map[item.id] = {
              id: item.id,
              name: (product && product.name) || item.id,
              sku: (product && (product.sku || product.id)) || item.id,
              qty: 0,
              amount: 0,
              product: product,
            };
          }
          map[item.id].qty += qty;
          map[item.id].amount += qty * price;
        });
      });
      return Object.keys(map).map(function (id) { return map[id]; }).sort(function (a, b) {
        return b.amount - a.amount || b.qty - a.qty;
      });
    }
    function regionRows(orders) {
      var map = {};
      selling(orders).forEach(function (order) {
        var key = order.country || "未填写";
        if (!map[key]) map[key] = [];
        map[key].push(order);
      });
      return Object.keys(map).map(function (key) {
        return { name: key, count: map[key].length, bag: bagOf(map[key]) };
      }).sort(function (a, b) { return bagNumber(b.bag) - bagNumber(a.bag) || b.count - a.count; });
    }
    function statusRows(orders) {
      var counts = {};
      statuses.forEach(function (item) { counts[item[0]] = 0; });
      orders.forEach(function (order) {
        var stage = stageOf(order);
        if (counts[stage] == null) counts[stage] = 0;
        counts[stage] += 1;
      });
      return Object.keys(counts).map(function (label) {
        var known = statuses.filter(function (item) { return item[0] === label; })[0];
        return { label: label, color: known ? known[1] : "#8d867c", value: counts[label] };
      });
    }
    function slotsFor(orders, from, to) {
      var span = Math.round((to - from) / 86400000);
      var slots = [];
      if (span > 62) {
        var cursor = new Date(from);
        while (cursor.getTime() < to) {
          var sliceFrom = Math.max(new Date(cursor.getFullYear(), cursor.getMonth(), 1).getTime(), from);
          var sliceTo = Math.min(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1).getTime(), to);
          var list = between(orders, sliceFrom, sliceTo);
          slots.push({ label: cursor.getFullYear() + "/" + (cursor.getMonth() + 1), count: list.length, amount: bagOf(list).cny });
          cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
        }
        return slots;
      }
      for (var time = from; time < to; time += 86400000) {
        var day = new Date(time);
        var list = between(orders, time, time + 86400000);
        slots.push({ label: (day.getMonth() + 1) + "/" + day.getDate(), count: list.length, amount: bagOf(list).cny });
      }
      return slots;
    }
    function userLabel(user) {
      if (user.disabled || user.status === "disabled") return "已禁用";
      if (user.status === "pending") return "待审核";
      if (user.status === "rejected") return "已拒绝";
      return "正常";
    }
    function stockLabel(product) {
      if (product.stock == null || product.stock === "") return "未录入";
      var number = Number(product.stock);
      if (number <= 0) return "缺货";
      if (number <= 5) return "库存预警";
      return "在售";
    }
    function deltaNode(current, previous) {
      var dir = "flat";
      var text = "0.0%";
      if (previous === 0 && current === 0) dir = "flat";
      else if (previous === 0) {
        dir = "up";
        text = "新增";
      } else {
        var pct = ((current - previous) / Math.abs(previous)) * 100;
        if (pct > 0.05) dir = "up";
        else if (pct < -0.05) dir = "down";
        text = Math.abs(pct).toFixed(1) + "%";
      }
      var node = el("p", "rpt-delta " + dir);
      node.appendChild(el("strong", "", (dir === "up" ? "↑ " : dir === "down" ? "↓ " : "— ") + text));
      node.appendChild(el("small", "", "较上周期"));
      return node;
    }
    function kpi(mark, tone, label, value, delta) {
      var card = el("article", "rpt-kpi");
      var head = el("div", "rpt-kpi__top");
      var badge = el("span", "rpt-kpi__mark rpt-kpi__mark--" + tone);
      badge.appendChild(icon(mark));
      head.appendChild(badge);
      head.appendChild(el("span", "", label));
      card.appendChild(head);
      card.appendChild(el("strong", "rpt-kpi__value", value));
      card.appendChild(delta);
      return card;
    }
    function cardHead(title, more, openView) {
      var head = el("div", "rpt-card__head");
      head.appendChild(el("h2", "", title));
      if (more) {
        var button = el("button", "rpt-more", more);
        button.type = "button";
        button.addEventListener("click", function () { setView(openView); });
        head.appendChild(button);
      }
      return head;
    }
    function thumb(product) {
      var src = orderImage(product);
      if (!src) return el("span", "rpt-thumb rpt-thumb--empty");
      var img = el("img", "rpt-thumb");
      img.alt = "";
      img.src = base + src.replace(/^\//, "");
      img.addEventListener("error", function () {
        var blank = el("span", "rpt-thumb rpt-thumb--empty");
        if (img.parentNode) img.parentNode.replaceChild(blank, img);
      });
      return img;
    }
    function drawCombo(host, slots) {
      clear(host);
      if (!slots.length) {
        host.appendChild(el("p", "desk__hint", "请选择有效日期"));
        return;
      }
      var width = 720;
      var height = 248;
      var left = 36;
      var right = 54;
      var upper = 14;
      var lower = 30;
      var innerW = width - left - right;
      var innerH = height - upper - lower;
      var maxCount = slots.reduce(function (peak, slot) { return Math.max(peak, slot.count); }, 0);
      var maxAmount = slots.reduce(function (peak, slot) { return Math.max(peak, slot.amount); }, 0);
      var topCount = maxCount > 0 ? maxCount : 1;
      var topAmount = maxAmount > 0 ? maxAmount : 1;
      var svg = svgEl("svg");
      svg.setAttribute("viewBox", "0 0 " + width + " " + height);
      svg.setAttribute("class", "trend-svg");
      svg.setAttribute("role", "img");
      svg.setAttribute("aria-label", "销售趋势");
      var tick;
      var seenLeft = {};
      var seenRight = {};
      for (tick = 0; tick <= 3; tick++) {
        var y = upper + innerH - (innerH * tick) / 3;
        var grid = svgEl("line");
        grid.setAttribute("x1", left);
        grid.setAttribute("x2", width - right);
        grid.setAttribute("y1", y);
        grid.setAttribute("y2", y);
        grid.setAttribute("class", "trend-grid");
        svg.appendChild(grid);
        var leftText = svgEl("text");
        leftText.setAttribute("x", left - 6);
        leftText.setAttribute("y", y + 4);
        leftText.setAttribute("class", "trend-axis");
        leftText.setAttribute("text-anchor", "end");
        leftText.textContent = String(Math.round(maxCount > 0 ? (topCount * tick) / 3 : 0));
        if (!seenLeft[leftText.textContent]) {
          seenLeft[leftText.textContent] = true;
          svg.appendChild(leftText);
        }
        var rightText = svgEl("text");
        rightText.setAttribute("x", width - right + 6);
        rightText.setAttribute("y", y + 4);
        rightText.setAttribute("class", "trend-axis");
        var axis = maxAmount > 0 ? (topAmount * tick) / 3 : 0;
        rightText.textContent = axis >= 10000 ? "¥" + (axis / 10000).toFixed(1) + "万" : "¥" + Math.round(axis);
        if (!seenRight[rightText.textContent]) {
          seenRight[rightText.textContent] = true;
          svg.appendChild(rightText);
        }
      }
      var gap = innerW / slots.length;
      var barW = Math.max(4, Math.min(18, gap * 0.42));
      var points = [];
      slots.forEach(function (slot, index) {
        var cx = left + gap * index + gap / 2;
        var barH = (slot.count / topCount) * innerH;
        var rect = svgEl("rect");
        rect.setAttribute("x", cx - barW / 2);
        rect.setAttribute("y", upper + innerH - barH);
        rect.setAttribute("width", barW);
        rect.setAttribute("height", barH);
        rect.setAttribute("rx", "2");
        rect.setAttribute("class", "rpt-bar");
        var tip = svgEl("title");
        tip.textContent = slot.label + "　订单 " + slot.count + "　销售 " + money(slot.amount);
        rect.appendChild(tip);
        svg.appendChild(rect);
        points.push(cx + "," + (upper + innerH - (slot.amount / topAmount) * innerH));
        var step = Math.ceil(slots.length / 8);
        if (slots.length <= 12 || index % step === 0 || index === slots.length - 1) {
          var text = svgEl("text");
          text.setAttribute("x", cx);
          text.setAttribute("y", height - 8);
          text.setAttribute("class", "trend-axis");
          text.setAttribute("text-anchor", "middle");
          text.textContent = slot.label;
          svg.appendChild(text);
        }
      });
      var line = svgEl("polyline");
      line.setAttribute("points", points.join(" "));
      line.setAttribute("class", "rpt-line");
      svg.appendChild(line);
      points.forEach(function (point, index) {
        var parts = point.split(",");
        var dot = svgEl("circle");
        dot.setAttribute("cx", parts[0]);
        dot.setAttribute("cy", parts[1]);
        dot.setAttribute("r", "3");
        dot.setAttribute("class", "rpt-dot");
        var tip = svgEl("title");
        tip.textContent = slots[index].label + "　销售 " + money(slots[index].amount);
        dot.appendChild(tip);
        svg.appendChild(dot);
      });
      host.appendChild(svg);
    }
    function drawDonut(host, rows, total) {
      clear(host);
      var svg = svgEl("svg");
      svg.setAttribute("viewBox", "0 0 180 180");
      var radius = 62;
      var circ = 2 * Math.PI * radius;
      if (!total) {
        var empty = svgEl("circle");
        empty.setAttribute("cx", "90");
        empty.setAttribute("cy", "90");
        empty.setAttribute("r", String(radius));
        empty.setAttribute("class", "rpt-ring rpt-ring--empty");
        empty.setAttribute("fill", "none");
        empty.setAttribute("stroke", "#efe8dc");
        empty.setAttribute("stroke-width", "16");
        svg.appendChild(empty);
      } else {
        var offset = 0;
        rows.forEach(function (row) {
          if (!row.value) return;
          var len = (row.value / total) * circ;
          var arc = svgEl("circle");
          arc.setAttribute("cx", "90");
          arc.setAttribute("cy", "90");
          arc.setAttribute("r", String(radius));
          arc.setAttribute("class", "rpt-ring");
          arc.setAttribute("fill", "none");
          arc.setAttribute("stroke", row.color);
          arc.setAttribute("stroke-width", "16");
          arc.setAttribute("transform", "rotate(-90 90 90)");
          arc.setAttribute("stroke-dasharray", len + " " + (circ - len));
          arc.setAttribute("stroke-dashoffset", String(-offset));
          svg.appendChild(arc);
          offset += len;
        });
      }
      host.appendChild(svg);
      var center = el("div", "rpt-donut__center");
      center.appendChild(el("strong", "", compact(total)));
      center.appendChild(el("span", "", "总订单数"));
      host.appendChild(center);
    }
    function regionList(host, rows) {
      if (!rows.length) {
        host.appendChild(el("p", "desk__hint", "所选区间还没有地区销售"));
        return;
      }
      var peak = rows.reduce(function (max, row) { return Math.max(max, bagNumber(row.bag), row.count); }, 1);
      rows.forEach(function (row) {
        var line = el("div", "rpt-region");
        line.appendChild(el("span", "rpt-region__name", row.name));
        var track = el("span", "rpt-region__track");
        var bar = el("span", "rpt-region__bar");
        bar.style.width = Math.max(4, (bagNumber(row.bag) || row.count) / peak * 100) + "%";
        track.appendChild(bar);
        line.appendChild(track);
        line.appendChild(el("span", "rpt-region__meta", row.count + " 单 · " + showBag(row.bag)));
        host.appendChild(line);
      });
    }
    function salesTable(host, rows, ranked) {
      if (!rows.length) {
        host.appendChild(el("p", "desk__hint", "所选区间还没有销量"));
        return;
      }
      var wrap = el("div", "rpt-tablewrap");
      var table = el("table", "desk-table rpt-table");
      var head = el("tr");
      (ranked ? ["排名", "图片", "货号", "产品名称", "销量", "销售额"] : ["图片", "货号", "产品名称", "销量", "销售额"]).forEach(function (label) {
        head.appendChild(el("th", "", label));
      });
      table.appendChild(head);
      rows.forEach(function (row, index) {
        var tr = el("tr");
        if (ranked) {
          var cell = el("td");
          cell.appendChild(el("span", "rpt-rank" + (index < 3 ? " rpt-rank--" + (index + 1) : ""), String(index + 1)));
          tr.appendChild(cell);
        }
        var photo = el("td");
        photo.appendChild(thumb(row.product));
        tr.appendChild(photo);
        tr.appendChild(el("td", "", row.sku));
        tr.appendChild(el("td", "", row.name));
        tr.appendChild(el("td", "", compact(row.qty)));
        tr.appendChild(el("td", "", moneyComma(row.amount)));
        table.appendChild(tr);
      });
      wrap.appendChild(table);
      host.appendChild(wrap);
    }
    function paintOverview(period, previous) {
      var sales = bagOf(period);
      var prevSales = bagOf(previous);
      var paid = bagOf(paidOrders(period));
      var prevPaid = bagOf(paidOrders(previous));
      var fresh = between(state.users, bounds().from, bounds().to);
      var prevFresh = between(state.users, bounds().prevFrom, bounds().prevTo);
      var kpis = el("div", "rpt-kpis");
      kpis.appendChild(kpi("orders", "1", "订单总数", compact(period.length), deltaNode(period.length, previous.length)));
      kpis.appendChild(kpi("prices", "2", "销售总额", showBag(sales), deltaNode(bagNumber(sales), bagNumber(prevSales))));
      kpis.appendChild(kpi("payments", "3", "已付款金额", showBag(paid), deltaNode(bagNumber(paid), bagNumber(prevPaid))));
      kpis.appendChild(kpi("shipping", "4", "已发货订单", compact(shippedCount(period)), deltaNode(shippedCount(period), shippedCount(previous))));
      kpis.appendChild(kpi("customers", "5", "新客户数", compact(fresh.length), deltaNode(fresh.length, prevFresh.length)));
      var stockNow = el("p", "rpt-delta flat");
      stockNow.appendChild(el("strong", "", "当前目录"));
      stockNow.appendChild(el("small", "", "在售 " + compact(onSaleCount()) + " / 共 " + compact(state.products.length)));
      kpis.appendChild(kpi("products", "6", "在售产品", compact(onSaleCount()), stockNow));
      body.appendChild(kpis);

      var charts = el("div", "rpt-split");
      var trend = el("section", "desk-card rpt-card");
      var trendHead = cardHead("销售趋势");
      var legend = el("div", "rpt-legendline");
      var barKey = el("span", "");
      barKey.appendChild(el("i", "rpt-swatch rpt-swatch--bar"));
      barKey.appendChild(document.createTextNode("订单数量"));
      var lineKey = el("span", "");
      lineKey.appendChild(el("i", "rpt-swatch rpt-swatch--line"));
      lineKey.appendChild(document.createTextNode("销售金额"));
      legend.appendChild(barKey);
      legend.appendChild(lineKey);
      trendHead.appendChild(legend);
      trend.appendChild(trendHead);
      var plot = el("div", "rpt-plot");
      trend.appendChild(plot);
      drawCombo(plot, slotsFor(period, bounds().from, bounds().to));
      charts.appendChild(trend);

      var status = el("section", "desk-card rpt-card");
      status.appendChild(cardHead("订单状态分布"));
      var rows = statusRows(period);
      var total = period.length;
      var statusBody = el("div", "rpt-status");
      var donut = el("div", "rpt-donut");
      drawDonut(donut, rows, total);
      statusBody.appendChild(donut);
      var key = el("div", "rpt-legend");
      rows.forEach(function (row) {
        var line = el("div", "rpt-legend__row");
        var name = el("span", "rpt-legend__name");
        var dot = el("i", "rpt-swatch");
        dot.style.background = row.color;
        name.appendChild(dot);
        name.appendChild(document.createTextNode(row.label));
        line.appendChild(name);
        var pct = total ? (row.value / total * 100).toFixed(1) : "0.0";
        line.appendChild(el("span", "", pct + "%（" + row.value + "）"));
        key.appendChild(line);
      });
      statusBody.appendChild(key);
      status.appendChild(statusBody);
      charts.appendChild(status);
      body.appendChild(charts);

      var bottom = el("div", "rpt-split");
      var hot = el("section", "desk-card rpt-card");
      hot.appendChild(cardHead("热销产品 TOP 10", "查看更多", "products"));
      salesTable(hot, salesRows(period).slice(0, 10), true);
      bottom.appendChild(hot);
      var places = el("section", "desk-card rpt-card");
      places.appendChild(cardHead("销售地区分布", "查看更多", "regions"));
      regionList(places, regionRows(period).slice(0, 8));
      bottom.appendChild(places);
      body.appendChild(bottom);
    }
    function paintOrders(period) {
      var card = el("section", "desk-card rpt-card");
      card.appendChild(cardHead("订单报表"));
      card.appendChild(el("p", "desk__hint rpt-note", "共 " + period.length + " 笔订单"));
      if (!period.length) {
        card.appendChild(el("p", "desk__hint", "所选区间还没有订单"));
        body.appendChild(card);
        return;
      }
      var wrap = el("div", "rpt-tablewrap");
      var table = el("table", "desk-table rpt-table");
      var head = el("tr");
      ["订单号", "客户", "国家/地区", "订单金额", "付款状态", "发货状态", "订单状态", "下单时间"].forEach(function (label) {
        head.appendChild(el("th", "", label));
      });
      table.appendChild(head);
      period.slice().reverse().forEach(function (order) {
        var tr = el("tr");
        tr.appendChild(el("td", "", order.id || "—"));
        tr.appendChild(el("td", "", orderName(order)));
        tr.appendChild(el("td", "", order.country || "—"));
        tr.appendChild(el("td", "", order.currency === "USD" ? moneyComma(order.total, "USD") : moneyComma(order.total)));
        var pay = el("td");
        pay.appendChild(pill(payOf(order), payKind(payOf(order))));
        tr.appendChild(pay);
        var ship = el("td");
        ship.appendChild(pill(shipOf(order), shipKind(shipOf(order))));
        tr.appendChild(ship);
        tr.appendChild(el("td", "", stageOf(order)));
        tr.appendChild(el("td", "", orderWhen(order.createdAt)));
        table.appendChild(tr);
      });
      wrap.appendChild(table);
      card.appendChild(wrap);
      body.appendChild(card);
    }
    function paintProducts(period) {
      var card = el("section", "desk-card rpt-card");
      card.appendChild(cardHead("产品报表"));
      var search = el("input", "desk-input rpt-search");
      search.type = "search";
      search.placeholder = "搜索产品名称 / 货号 / 香味";
      card.appendChild(search);
      var list = el("div");
      card.appendChild(list);
      function draw() {
        clear(list);
        var q = search.value.trim().toLowerCase();
        var sold = {};
        salesRows(period).forEach(function (row) { sold[row.id] = row; });
        var rows = state.products.map(function (product) {
          var hit = sold[product.id];
          return {
            id: product.id,
            name: product.name || product.id,
            sku: product.sku || product.id,
            qty: hit ? hit.qty : 0,
            amount: hit ? hit.amount : 0,
            product: product,
          };
        }).filter(function (row) {
          if (!q) return true;
          return (row.name + " " + row.sku + " " + (row.product.barcode || "")).toLowerCase().indexOf(q) !== -1;
        }).sort(function (a, b) { return b.amount - a.amount || b.qty - a.qty || a.name.localeCompare(b.name); });
        if (!rows.length) {
          list.appendChild(el("p", "desk__hint", q ? "没有匹配的产品" : "还没有产品"));
          return;
        }
        var wrap = el("div", "rpt-tablewrap");
        var table = el("table", "desk-table rpt-table");
        var head = el("tr");
        ["图片", "货号", "产品名称", "香味", "价格", "销量", "销售额", "库存"].forEach(function (label) {
          head.appendChild(el("th", "", label));
        });
        table.appendChild(head);
        rows.forEach(function (row) {
          var tr = el("tr");
          var photo = el("td");
          photo.appendChild(thumb(row.product));
          tr.appendChild(photo);
          tr.appendChild(el("td", "", row.sku));
          tr.appendChild(el("td", "", row.name));
          tr.appendChild(el("td", "", row.product.barcode || "—"));
          tr.appendChild(el("td", "", moneyComma(row.product.price)));
          tr.appendChild(el("td", "", compact(row.qty)));
          tr.appendChild(el("td", "", moneyComma(row.amount)));
          tr.appendChild(el("td", "", row.product.stock == null || row.product.stock === "" ? "未录入" : String(row.product.stock)));
          table.appendChild(tr);
        });
        wrap.appendChild(table);
        list.appendChild(wrap);
      }
      search.addEventListener("input", draw);
      draw();
      body.appendChild(card);
    }
    function paintCustomers(period) {
      var card = el("section", "desk-card rpt-card");
      card.appendChild(cardHead("客户报表"));
      var freshIds = {};
      between(state.users, bounds().from, bounds().to).forEach(function (user) { freshIds[user.id] = true; });
      if (!state.users.length) {
        card.appendChild(el("p", "desk__hint", "还没有客户"));
        body.appendChild(card);
        return;
      }
      var wrap = el("div", "rpt-tablewrap");
      var table = el("table", "desk-table rpt-table");
      var head = el("tr");
      ["客户", "账号", "国家/地区", "状态", "注册时间", "区间订单", "区间消费"].forEach(function (label) {
        head.appendChild(el("th", "", label));
      });
      table.appendChild(head);
      state.users.slice().sort(function (a, b) { return Date.parse(b.createdAt) - Date.parse(a.createdAt); }).forEach(function (user) {
        var mine = period.filter(function (order) { return order.userId && order.userId === user.id; });
        var tr = el("tr");
        var who = el("td", "", user.name || "—");
        if (freshIds[user.id]) who.appendChild(el("span", "rpt-new", "新"));
        tr.appendChild(who);
        tr.appendChild(el("td", "", user.username || "—"));
        tr.appendChild(el("td", "", user.country || "—"));
        tr.appendChild(el("td", "", userLabel(user)));
        tr.appendChild(el("td", "", orderWhen(user.createdAt)));
        tr.appendChild(el("td", "", String(mine.length)));
        tr.appendChild(el("td", "", showBag(bagOf(mine))));
        table.appendChild(tr);
      });
      wrap.appendChild(table);
      card.appendChild(wrap);
      body.appendChild(card);
    }
    function paintStock() {
      var card = el("section", "desk-card rpt-card");
      card.appendChild(cardHead("库存报表"));
      var low = state.products.filter(function (product) { return stockLabel(product) === "库存预警"; }).length;
      var out = state.products.filter(function (product) { return stockLabel(product) === "缺货"; }).length;
      var missing = state.products.filter(function (product) { return stockLabel(product) === "未录入"; }).length;
      card.appendChild(el("p", "desk__hint rpt-note", "在售 " + onSaleCount() + " · 库存预警 " + low + " · 缺货 " + out + " · 未录入 " + missing));
      var search = el("input", "desk-input rpt-search");
      search.type = "search";
      search.placeholder = "搜索产品名称 / 货号 / 香味";
      card.appendChild(search);
      var list = el("div");
      card.appendChild(list);
      function rank(product) {
        var label = stockLabel(product);
        if (label === "缺货") return 0;
        if (label === "库存预警") return 1;
        if (label === "未录入") return 2;
        return 3;
      }
      function draw() {
        clear(list);
        var q = search.value.trim().toLowerCase();
        var rows = state.products.filter(function (product) {
          if (!q) return true;
          return ((product.name || "") + " " + (product.sku || product.id || "") + " " + (product.barcode || "")).toLowerCase().indexOf(q) !== -1;
        }).sort(function (a, b) { return rank(a) - rank(b) || String(a.name || "").localeCompare(String(b.name || "")); });
        if (!rows.length) {
          list.appendChild(el("p", "desk__hint", q ? "没有匹配的产品" : "还没有产品"));
          return;
        }
        var wrap = el("div", "rpt-tablewrap");
        var table = el("table", "desk-table rpt-table");
        var head = el("tr");
        ["图片", "货号", "产品名称", "香味", "价格", "库存", "状态"].forEach(function (label) {
          head.appendChild(el("th", "", label));
        });
        table.appendChild(head);
        rows.forEach(function (product) {
          var tr = el("tr");
          var photo = el("td");
          photo.appendChild(thumb(product));
          tr.appendChild(photo);
          tr.appendChild(el("td", "", product.sku || product.id));
          tr.appendChild(el("td", "", product.name || product.id));
          tr.appendChild(el("td", "", product.barcode || "—"));
          tr.appendChild(el("td", "", moneyComma(product.price)));
          tr.appendChild(el("td", "", product.stock == null || product.stock === "" ? "—" : String(product.stock)));
          var stateCell = el("td");
          var label = stockLabel(product);
          stateCell.appendChild(pill(label, label === "在售" ? "ok" : label === "未录入" ? "muted" : "wait"));
          tr.appendChild(stateCell);
          table.appendChild(tr);
        });
        wrap.appendChild(table);
        list.appendChild(wrap);
      }
      search.addEventListener("input", draw);
      draw();
      body.appendChild(card);
    }
    function paintRegions(period) {
      var card = el("section", "desk-card rpt-card");
      card.appendChild(cardHead("地区报表"));
      var rows = regionRows(period);
      if (!rows.length) {
        card.appendChild(el("p", "desk__hint", "所选区间还没有地区销售"));
        body.appendChild(card);
        return;
      }
      regionList(card, rows);
      body.appendChild(card);
    }
    function csvRows(period, previous) {
      var when = ymd(bounds().start) + " 至 " + ymd(bounds().end);
      if (view === "orders") {
        var orderRows = [["区间", "订单号", "客户", "国家/地区", "订单金额", "币种", "付款状态", "发货状态", "订单状态", "下单时间"]];
        period.forEach(function (order) {
          orderRows.push([when, order.id || "", orderName(order), order.country || "", Number(order.total) || 0, order.currency === "USD" ? "USD" : "CNY", payOf(order), shipOf(order), stageOf(order), orderWhen(order.createdAt)]);
        });
        return orderRows;
      }
      if (view === "products") {
        var productRows = [["区间", "货号", "产品名称", "香味", "价格", "销量", "销售额", "库存"]];
        var sold = {};
        salesRows(period).forEach(function (row) { sold[row.id] = row; });
        state.products.forEach(function (product) {
          var hit = sold[product.id];
          productRows.push([when, product.sku || product.id, product.name || product.id, product.barcode || "", Number(product.price) || 0, hit ? hit.qty : 0, hit ? hit.amount.toFixed(2) : "0.00", product.stock == null ? "" : product.stock]);
        });
        return productRows;
      }
      if (view === "customers") {
        var people = [["区间", "客户", "账号", "国家/地区", "状态", "注册时间", "区间订单", "区间消费"]];
        state.users.forEach(function (user) {
          var mine = period.filter(function (order) { return order.userId && order.userId === user.id; });
          people.push([when, user.name || "", user.username || "", user.country || "", userLabel(user), orderWhen(user.createdAt), mine.length, showBag(bagOf(mine))]);
        });
        return people;
      }
      if (view === "stock") {
        var stockRows = [["货号", "产品名称", "香味", "价格", "库存", "状态"]];
        state.products.forEach(function (product) {
          stockRows.push([product.sku || product.id, product.name || product.id, product.barcode || "", Number(product.price) || 0, product.stock == null ? "" : product.stock, stockLabel(product)]);
        });
        return stockRows;
      }
      if (view === "regions") {
        var placeRows = [["区间", "国家/地区", "订单数", "销售额"]];
        regionRows(period).forEach(function (row) {
          placeRows.push([when, row.name, row.count, showBag(row.bag)]);
        });
        return placeRows;
      }
      var sales = bagOf(period);
      var prevSales = bagOf(previous);
      return [
        ["区间", when],
        ["对比区间", ymd(new Date(bounds().prevFrom)) + " 至 " + ymd(new Date(bounds().prevTo - 1))],
        ["订单总数", period.length, "上周期", previous.length],
        ["销售总额", showBag(sales), "上周期", showBag(prevSales)],
        ["已付款金额", showBag(bagOf(paidOrders(period)))],
        ["已发货订单", shippedCount(period)],
        ["新客户数", between(state.users, bounds().from, bounds().to).length],
        ["在售产品", onSaleCount()],
      ];
    }
    function downloadCsv() {
      var box = bounds();
      var period = between(state.orders, box.from, box.to);
      var previous = between(state.orders, box.prevFrom, box.prevTo);
      var name = tabs.filter(function (item) { return item[0] === view; })[0];
      var rows = csvRows(period, previous);
      var csv = rows.map(function (row) {
        return row.map(function (cell) {
          return '"' + String(cell == null ? "" : cell).replace(/"/g, '""') + '"';
        }).join(",");
      }).join("\r\n");
      var blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
      var link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "数据报表-" + (name ? name[1] : "销售概览") + "-" + ymd(box.start) + "_" + ymd(box.end) + ".csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(function () { URL.revokeObjectURL(link.href); }, 1500);
    }
    function setView(next) {
      view = next;
      paint();
    }
    function paint() {
      clear(tabBar);
      tabs.forEach(function (item) {
        var button = el("button", "rpt-tab" + (view === item[0] ? " is-on" : ""));
        button.type = "button";
        button.appendChild(icon(item[2]));
        button.appendChild(document.createTextNode(item[1]));
        button.addEventListener("click", function () { setView(item[0]); });
        tabBar.appendChild(button);
      });
      clear(body);
      var box = bounds();
      var period = between(state.orders, box.from, box.to);
      var previous = between(state.orders, box.prevFrom, box.prevTo);
      if (view === "orders") paintOrders(period);
      else if (view === "products") paintProducts(period);
      else if (view === "customers") paintCustomers(period);
      else if (view === "stock") paintStock();
      else if (view === "regions") paintRegions(period);
      else paintOverview(period, previous);
    }
    startInput.addEventListener("change", paint);
    endInput.addEventListener("change", paint);
    exportBtn.addEventListener("click", downloadCsv);
    paint();
  }

  function productRows(root, mode) {
    root.appendChild(el("h1", "desk__title", LABELS[mode]));
    if (!state.products.length) {
      root.appendChild(el("p", "desk__hint", "还没有产品"));
      return;
    }
    var table = el("table", "desk-table");
    var head = el("tr");
    var headers = mode === "prices" ? ["产品", "现价", "新价格"] : mode === "stock" ? ["产品", "库存", "调整"] : ["产品", "价格", "库存"];
    headers.forEach(function (label) { head.appendChild(el("th", "", label)); });
    table.appendChild(head);
    state.products.forEach(function (product) {
      var tr = el("tr");
      tr.appendChild(el("td", "", product.name || product.id));
      if (mode === "products") {
        tr.appendChild(el("td", "", money(product.price)));
        tr.appendChild(el("td", "", product.stock == null ? "未录入" : String(product.stock)));
      } else if (mode === "prices") {
        tr.appendChild(el("td", "", money(product.price)));
        var cell = el("td");
        var input = el("input", "desk-input");
        input.value = Number(product.price || 0).toFixed(2);
        var btn = el("button", "desk-op", "保存");
        btn.type = "button";
        btn.addEventListener("click", function () {
          saveDesk({ action: "price", id: product.id, price: input.value }, "修改 " + product.name + " 的价格。").then(function (res) {
            if (res.ok) loadAll().then(function () { open("prices"); });
          });
        });
        cell.appendChild(input);
        cell.appendChild(btn);
        tr.appendChild(cell);
      } else {
        tr.appendChild(el("td", "", product.stock == null ? "未录入" : String(product.stock)));
        var stockCell = el("td");
        var stockInput = el("input", "desk-input");
        stockInput.value = product.stock == null ? "" : String(product.stock);
        stockInput.placeholder = "数量";
        var stockBtn = el("button", "desk-op", "保存");
        stockBtn.type = "button";
        stockBtn.addEventListener("click", function () {
          json("api/admin/desk", { action: "stock", id: product.id, stock: stockInput.value }).then(function (res) {
            if (res.ok) loadAll().then(function () { open("stock"); });
          });
        });
        stockCell.appendChild(stockInput);
        stockCell.appendChild(stockBtn);
        tr.appendChild(stockCell);
      }
      table.appendChild(tr);
    });
    root.appendChild(el("div", "desk-card")).appendChild(table);
  }

  function statusEditor(root, field, title, options) {
    root.appendChild(el("h1", "desk__title", title));
    if (!state.orders.length) {
      root.appendChild(el("p", "desk__hint", "还没有订单"));
      return;
    }
    var card = el("section", "desk-card");
    state.orders.slice().reverse().forEach(function (order) {
      var row = el("div", "desk-line");
      row.appendChild(el("strong", "", order.id || "—"));
      row.appendChild(el("span", "", customerName(order) + " · " + money(order.total)));
      var select = el("select", "desk-input");
      options.forEach(function (name) {
        var option = el("option", "", name);
        option.value = name;
        select.appendChild(option);
      });
      var current = field === "payStatus" ? payOf(order) : field === "shipStatus" ? shipOf(order) : serviceOf(order);
      select.value = current;
      var btn = el("button", "desk-op", "保存");
      btn.type = "button";
      btn.addEventListener("click", function () {
        var body = { action: "order", id: order.id };
        body[field] = select.value;
        saveDesk(body, "更新订单 " + order.id + "。").then(function (res) {
          if (res.ok) loadAll().then(function () { open(state.tab); });
        });
      });
      row.appendChild(select);
      row.appendChild(btn);
      card.appendChild(row);
    });
    root.appendChild(card);
  }

  function renderContent(root) {
    root.appendChild(el("h1", "desk__title", "内容管理"));
    root.appendChild(el("p", "desk__hint", "编辑品牌故事和联系页。保存后，未登录访客也能看到更新。产品内容仍只对已登录账号开放。"));
    var links = el("div", "desk-ops");
    [["查看品牌故事", "index.html?page=story"], ["查看联系页", "index.html?page=contact"]].forEach(function (item) {
      var link = el("a", "desk-op", item[0]);
      link.href = base + item[1];
      link.target = "_blank";
      link.rel = "noopener";
      links.appendChild(link);
    });
    root.appendChild(links);
    var tabs = el("div", "set-tabs");
    var body = el("div", "cms-form");
    var hint = el("p", "desk__hint");
    hint.hidden = true;
    var save = el("button", "review-pass", "保存内容");
    save.type = "button";
    root.appendChild(tabs);
    root.appendChild(body);
    root.appendChild(hint);
    root.appendChild(save);
    var draft = null;
    var view = "story";

    function note(text) {
      hint.hidden = !text;
      hint.textContent = text || "";
    }
    function line(parent, label, bag, key, max, wide) {
      var box = el("label", "set-field" + (wide ? " cms-span" : ""));
      box.appendChild(el("span", "", label));
      var input = el("input", "desk-input");
      input.maxLength = max;
      input.value = bag[key] || "";
      input.addEventListener("input", function () { bag[key] = input.value; });
      box.appendChild(input);
      parent.appendChild(box);
    }
    function block(parent, label, bag, key, max, rows) {
      var box = el("label", "set-field cms-span");
      if (label) box.appendChild(el("span", "", label));
      var area = el("textarea", "desk-input" + (rows > 6 ? " cms-prose" : ""));
      area.rows = rows || 3;
      area.maxLength = max;
      area.value = bag[key] || "";
      area.addEventListener("input", function () { bag[key] = area.value; });
      box.appendChild(area);
      parent.appendChild(box);
    }
    function picture(parent, label, bag, key, fallback) {
      var box = el("label", "set-field cms-span");
      box.appendChild(el("span", "", label));
      var row = el("div", "cms-photo");
      var img = el("img");
      img.alt = "";
      function srcOf(value) {
        var text = String(value || fallback || "");
        if (text.indexOf("data:image/") === 0) return text;
        if (text.indexOf("assets/") === 0) return base + text;
        return base + fallback;
      }
      img.src = srcOf(bag[key]);
      var file = el("input");
      file.type = "file";
      file.accept = "image/jpeg,image/png,image/webp";
      file.hidden = true;
      var button = el("button", "review-ghost", "更换图片");
      button.type = "button";
      button.addEventListener("click", function () { file.click(); });
      file.addEventListener("change", function () {
        var picked = file.files && file.files[0];
        if (!picked) return;
        if (picked.size > 1800000) {
          note("图片请小于 1.8 MB");
          return;
        }
        var reader = new FileReader();
        reader.onload = function () {
          bag[key] = String(reader.result || "");
          img.src = bag[key];
          note("");
        };
        reader.readAsDataURL(picked);
      });
      row.appendChild(img);
      row.appendChild(button);
      row.appendChild(file);
      box.appendChild(row);
      parent.appendChild(box);
    }
    function card(title) {
      var section = el("section", "desk-card");
      section.appendChild(el("h2", "", title));
      var grid = el("div", "cms-grid");
      section.appendChild(grid);
      body.appendChild(section);
      return grid;
    }
    function paintTabs() {
      clear(tabs);
      [["story", "品牌故事"], ["contact", "联系页"]].forEach(function (item) {
        var button = el("button", "set-tab" + (view === item[0] ? " is-on" : ""), item[1]);
        button.type = "button";
        button.addEventListener("click", function () {
          view = item[0];
          paint();
        });
        tabs.appendChild(button);
      });
    }
    function fillStoryText(story) {
      if (story.body == null) {
        story.body = (story.paragraphs || []).map(function (part) {
          return String(part || "").trim();
        }).filter(Boolean).join("\n\n");
      }
      if (story.featuresText == null) {
        story.featuresText = (story.features || []).map(function (item) {
          var title = String(item && item.title || "").trim();
          var text = String(item && item.text || "").trim();
          return [title, text].filter(Boolean).join("\n");
        }).filter(Boolean).join("\n\n");
      }
    }
    function paintStory() {
      var story = draft.story;
      fillStoryText(story);
      var hero = card("横幅");
      line(hero, "眉题", story, "heroEyebrow", 40, false);
      line(hero, "主标题", story, "heroTitle", 40, false);
      line(hero, "副标题", story, "heroLine", 80, true);
      line(hero, "英文标语", story, "heroEn", 80, true);
      picture(hero, "横幅图片", story, "heroImage", "assets/story-building.jpg");
      var intro = card("简介");
      line(intro, "面包屑", story, "crumb", 40, false);
      line(intro, "标题", story, "title", 60, false);
      line(intro, "选购按钮", story, "shopLabel", 20, false);
      block(intro, "正文", story, "body", 4000, 16);
      picture(intro, "配图", story, "sideImage", "assets/products/apple-candle-display.png");
      var features = card("特点");
      block(features, "", story, "featuresText", 4000, 16);
      var stats = card("四项数据");
      story.stats.forEach(function (item, index) {
        line(stats, "数据 " + (index + 1), item, "value", 16, false);
        line(stats, "说明 " + (index + 1), item, "label", 24, false);
      });
      var foot = card("故事页底部");
      line(foot, "标题", story, "contactTitle", 24, false);
      line(foot, "按钮", story, "contactLabel", 20, false);
      line(foot, "返回按钮", story, "backLabel", 20, false);
      block(foot, "说明", story, "contactText", 120);
    }
    function paintContact() {
      var contact = draft.contact;
      var page = card("联系页");
      line(page, "面包屑", contact, "crumb", 40, false);
      line(page, "标题", contact, "title", 40, false);
      line(page, "表单标题", contact, "formTitle", 40, false);
      line(page, "返回按钮", contact, "back", 40, false);
      block(page, "介绍", contact, "intro", 240);
      block(page, "询价说明", contact, "intro2", 240);
      block(page, "发送成功提示", contact, "thanks", 160);
      block(page, "发送失败提示", contact, "error", 160);
    }
    function paint() {
      if (!draft) return;
      paintTabs();
      clear(body);
      if (view === "contact") paintContact();
      else paintStory();
    }
    save.addEventListener("click", function () {
      if (!draft) return;
      save.disabled = true;
      note("");
      json("api/admin/content", { story: draft.story, contact: draft.contact }).then(function (res) {
        save.disabled = false;
        if (!res.ok) {
          note("保存没有完成");
          return;
        }
        draft.story = res.data.story || draft.story;
        draft.contact = res.data.contact || draft.contact;
        note("已保存");
        paint();
      });
    });
    json("api/admin/content").then(function (res) {
      if (!res.ok) {
        note("当前账号不能编辑内容");
        save.hidden = true;
        return;
      }
      draft = { story: res.data.story || {}, contact: res.data.contact || {} };
      if (!draft.story.paragraphs) draft.story.paragraphs = ["", "", ""];
      if (!draft.story.features) draft.story.features = [];
      if (!draft.story.stats) draft.story.stats = [];
      paint();
    });
  }

  function renderFiles(root) {
    root.appendChild(el("h1", "desk__title", "邮箱通知管理"));
    json("api/admin/settings").then(function (res) {
      var settings = res.ok ? res.data : {};
      var card = el("section", "desk-card");
      card.appendChild(el("p", "", "通知邮箱 " + (settings.notifyEmail || "未设置")));
      card.appendChild(el("p", "", "会员期限 " + (settings.membershipMonths || 12) + " 个月"));
      card.appendChild(el("p", "", "SMTP " + (settings.smtp && settings.smtp.hasPassword ? "已配置" : "未配置")));
      root.appendChild(card);
    });
  }

  function pageGranted(perms, key) {
    return menuOn(perms || [], key);
  }

  function permEditor(selected) {
    var wrap = el("div", "desk-perm-groups");
    var boxes = {};
    var keys = [];
    GROUPS.forEach(function (group) {
      wrap.appendChild(el("p", "desk-permgroup", group[0]));
      var row = el("div", "desk-perms");
      group[1].forEach(function (item) {
        var key = item[0];
        keys.push(key);
        var label = el("label", "desk-check");
        var input = el("input");
        input.type = "checkbox";
        input.checked = pageGranted(selected || [], key);
        label.appendChild(input);
        label.appendChild(document.createTextNode(item[1]));
        row.appendChild(label);
        boxes[key] = input;
      });
      wrap.appendChild(row);
    });
    return {
      node: wrap,
      chosen: function () {
        return keys.filter(function (key) { return boxes[key].checked; });
      },
      reset: function () {
        keys.forEach(function (key) { boxes[key].checked = false; });
      },
    };
  }

  function renderAdmins(root) {
    root.appendChild(el("h1", "desk__title", "员工管理"));
    root.appendChild(el("p", "desk__hint", "超级管理员可以看到全部模块。员工账号只看到被勾选的权限。"));
    var tools = el("div", "desk-admin-tools");
    var search = el("input", "desk-input desk-search");
    search.type = "search";
    search.placeholder = "搜索员工账号";
    search.setAttribute("aria-label", "搜索员工账号");
    var addBtn = el("button", "desk-op", "新增员工账号");
    addBtn.type = "button";
    tools.appendChild(search);
    tools.appendChild(addBtn);
    root.appendChild(tools);

    var form = el("form", "desk-card desk-form");
    form.hidden = true;
    var username = el("input", "desk-input");
    username.placeholder = "员工账号";
    username.required = true;
    username.maxLength = 32;
    var person = el("input", "desk-input");
    person.placeholder = "姓名";
    person.maxLength = 40;
    var pass = el("input", "desk-input");
    pass.placeholder = "密码，留空则自动生成";
    pass.maxLength = 64;
    pass.autocomplete = "new-password";
    var perms = permEditor([]);
    var submit = el("button", "desk-op", "保存");
    submit.type = "submit";
    form.appendChild(el("label", "", "账号"));
    form.appendChild(username);
    form.appendChild(el("label", "", "姓名"));
    form.appendChild(person);
    form.appendChild(el("label", "", "密码"));
    form.appendChild(pass);
    form.appendChild(el("label", "", "权限"));
    form.appendChild(perms.node);
    form.appendChild(submit);
    root.appendChild(form);

    var message = el("div");
    var list = el("div");
    root.appendChild(message);
    root.appendChild(list);
    var admins = [];
    var openId = "";

    function staffError(code) {
      if (code === "confirm_required") return "已取消";
      if (code === "invalid_username") return "账号需为 3–32 位字母、数字或下划线";
      if (code === "username_taken") return "这个账号已被使用";
      if (code === "invalid_password") return "密码需为 8–64 位";
      return "操作没有完成";
    }

    function draw() {
      clear(list);
      var q = search.value.trim().toLowerCase();
      var rows = admins.filter(function (admin) {
        if (!q) return true;
        return (admin.username || "").toLowerCase().indexOf(q) !== -1 || (admin.name || "").toLowerCase().indexOf(q) !== -1;
      });
      var card = el("section", "desk-card");
      if (!rows.length) {
        card.appendChild(el("p", "desk__hint", admins.length ? "没有匹配的员工账号" : "还没有员工账号"));
      } else {
        var table = el("table", "desk-table");
        var head = el("tr");
        ["账号", "姓名", "状态", "操作"].forEach(function (label) { head.appendChild(el("th", "", label)); });
        table.appendChild(head);
        rows.forEach(function (admin) {
          var tr = el("tr");
          tr.appendChild(el("td", "", admin.username || "—"));
          tr.appendChild(el("td", "", admin.name || "—"));
          tr.appendChild(el("td", admin.disabled ? "desk-state desk-state--off" : "desk-state desk-state--on", admin.disabled ? "禁用" : "启用"));
          var view = el("button", "desk-op", openId === admin.id ? "收起" : "查看");
          view.type = "button";
          view.addEventListener("click", function () {
            openId = openId === admin.id ? "" : admin.id;
            draw();
          });
          var op = el("td");
          op.appendChild(view);
          tr.appendChild(op);
          table.appendChild(tr);
          if (openId === admin.id) {
            var detail = el("tr");
            var cell = el("td", "desk-staff");
            cell.colSpan = 4;
            var names = [];
            GROUPS.forEach(function (group) {
              group[1].forEach(function (item) {
                if (pageGranted(admin.permissions || [], item[0])) names.push(item[1]);
              });
            });
            cell.appendChild(el("p", "", "账号　" + (admin.username || "—")));
            cell.appendChild(el("p", "", "姓名　" + (admin.name || "—")));
            cell.appendChild(el("p", "", "密码　" + (admin.password || "需重置后显示")));
            var stateLine = el("p", "");
            stateLine.appendChild(document.createTextNode("状态　"));
            stateLine.appendChild(el("span", admin.disabled ? "desk-state desk-state--off" : "desk-state desk-state--on", admin.disabled ? "禁用" : "启用"));
            cell.appendChild(stateLine);
            cell.appendChild(el("p", "", "权限　" + (names.length ? names.join("、") : "未勾选")));
            detail.appendChild(cell);
            table.appendChild(detail);
          }
        });
        card.appendChild(table);
      }
      list.appendChild(card);
    }

    addBtn.addEventListener("click", function () {
      form.hidden = false;
      username.focus();
    });
    search.addEventListener("input", draw);
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      clear(message);
      askConfirm("新增员工账号 " + username.value.trim() + "。").then(function (confirmText) {
        if (confirmText !== "确认") {
          clear(message);
          message.appendChild(el("p", "desk__hint", "已取消"));
          return;
        }
        var chosen = perms.chosen();
        json("api/admin/staff", {
          action: "create",
          username: username.value,
          name: person.value,
          password: pass.value,
          permissions: chosen,
          confirm: confirmText,
        }).then(function (res) {
          clear(message);
          if (!res.ok) {
            message.appendChild(el("p", "desk__hint", staffError(res.data && res.data.error)));
            return;
          }
          message.appendChild(el("p", "desk__hint", "已保存"));
          openId = (res.data.admin && res.data.admin.id) || "";
          username.value = "";
          person.value = "";
          pass.value = "";
          perms.reset();
          form.hidden = true;
          loadStaff();
        });
      });
    });

    function loadStaff() {
      json("api/admin/staff").then(function (res) {
        if (!res.ok) {
          clear(list);
          list.appendChild(el("p", "desk__hint", "当前账号不能管理管理员"));
          return;
        }
        admins = res.data.admins || [];
        draw();
      });
    }
    loadStaff();
  }

  function renderRoles(root) {
    root.appendChild(el("h1", "desk__title", "角色权限"));
    root.appendChild(el("p", "desk__hint", "员工侧栏与管理员系统同一套菜单，已开通的权限留在原来的位置。"));
    json("api/admin/staff").then(function (res) {
      if (!res.ok) {
        root.appendChild(el("p", "desk__hint", "当前账号不能修改权限"));
        return;
      }
      (res.data.admins || []).forEach(function (admin) {
        var card = el("section", "desk-card");
        card.appendChild(el("h2", "", admin.username));
        var editor = permEditor(admin.permissions || []);
        card.appendChild(editor.node);
        var btn = el("button", "desk-op", "保存权限");
        btn.type = "button";
        btn.addEventListener("click", function () {
          var chosen = editor.chosen();
          askConfirm("修改管理员 " + admin.username + " 的权限。").then(function (confirmText) {
            if (confirmText !== "确认") return;
            json("api/admin/staff", { action: "permissions", id: admin.id, permissions: chosen, confirm: confirmText }).then(function () {
              open("roles");
            });
          });
        });
        card.appendChild(btn);
        root.appendChild(card);
      });
    });
  }

  function renderLogs(root) {
    var head = el("div", "desk-loghead");
    head.appendChild(el("h1", "desk__title", "操作日志"));
    var clearBtn = el("button", "review-ghost desk-loghead__clear", "全部清空");
    clearBtn.type = "button";
    head.appendChild(clearBtn);
    root.appendChild(head);
    var card = el("section", "desk-card");
    root.appendChild(card);
    function draw(res) {
      clear(card);
      var rows = res && res.ok ? (res.data.records || []) : [];
      if (!rows.length) card.appendChild(el("p", "desk__hint", res && res.ok ? "还没有操作记录" : "当前账号不能查看操作日志"));
      rows.slice(0, 40).forEach(function (row) {
        card.appendChild(el("p", "", (row.at || "").replace("T", " ").slice(0, 19) + " · " + (row.actorName || "管理员") + " · " + (row.action || "")));
      });
      clearBtn.disabled = !(res && res.ok && rows.length);
    }
    function load() {
      return json("api/admin/audit").then(draw);
    }
    clearBtn.addEventListener("click", function () {
      clearBtn.disabled = true;
      json("api/admin/audit", { action: "clear" }).then(function (res) {
        if (!res.ok) {
          clearBtn.disabled = false;
          return;
        }
        draw({ ok: true, data: { records: [] } });
      });
    });
    load();
  }

  function renderSettings(root) {
    var head = el("div", "set-head");
    head.appendChild(el("h1", "desk__title", "系统设置"));
    head.appendChild(el("p", "rpt-sub", "配置网站的基本信息、品牌信息、显示设置等系统参数。"));
    root.appendChild(head);
    var tabBar = el("div", "set-tabs");
    root.appendChild(tabBar);
    var body = el("div", "set-body");
    root.appendChild(body);
    var hint = el("p", "desk__hint set-hint");
    hint.hidden = true;
    root.appendChild(hint);
    var saveBar = el("div", "set-savebar");
    var saveBtn = el("button", "set-save", "保存设置");
    saveBtn.type = "button";
    saveBar.appendChild(saveBtn);
    root.appendChild(saveBar);

    var tabs = [
      ["basic", "基础设置", "settings"],
      ["pay", "支付设置", "payments"],
      ["ship", "物流设置", "shipping"],
    ];
    var view = "basic";
    var draft = null;
    var loaded = null;

    function note(text) {
      hint.hidden = !text;
      hint.textContent = text || "";
    }
    function field(parent, label, node, required) {
      var box = el("label", "set-field");
      var title = el("span", "", label);
      if (required) title.appendChild(el("i", "signup-req", " *"));
      box.appendChild(title);
      box.appendChild(node);
      parent.appendChild(box);
      return node;
    }
    function bindText(node, key, max) {
      node.maxLength = max;
      node.value = draft[key] || "";
      node.addEventListener("input", function () { draft[key] = node.value; });
    }
    function counted(parent, label, key, max) {
      var box = el("label", "set-field");
      box.appendChild(el("span", "", label));
      var wrap = el("div", "set-countbox");
      var area = el("textarea", "desk-input");
      area.rows = 3;
      area.maxLength = max;
      area.value = draft[key] || "";
      var count = el("em", "", (area.value.length) + "/" + max);
      area.addEventListener("input", function () {
        draft[key] = area.value;
        count.textContent = area.value.length + "/" + max;
      });
      wrap.appendChild(area);
      wrap.appendChild(count);
      box.appendChild(wrap);
      parent.appendChild(box);
    }
    function choose(parent, label, key, options, required) {
      var select = el("select", "desk-input");
      options.forEach(function (item) {
        var option = el("option", "", item[1]);
        option.value = item[0];
        select.appendChild(option);
      });
      select.value = draft[key];
      select.addEventListener("change", function () { draft[key] = select.value; });
      field(parent, label, select, required);
    }
    function toggle(parent, label, key) {
      var row = el("div", "set-toggle");
      row.appendChild(el("span", "", label));
      var button = el("button", "set-switch" + (draft[key] ? " is-on" : ""));
      button.type = "button";
      button.setAttribute("aria-pressed", draft[key] ? "true" : "false");
      button.appendChild(el("i"));
      button.addEventListener("click", function () {
        draft[key] = !draft[key];
        button.classList.toggle("is-on", draft[key]);
        button.setAttribute("aria-pressed", draft[key] ? "true" : "false");
      });
      row.appendChild(button);
      parent.appendChild(row);
    }
    function card(title, iconName) {
      var section = el("section", "desk-card set-card");
      var titleRow = el("h2", "set-card__title");
      if (iconName) titleRow.appendChild(icon(iconName));
      titleRow.appendChild(document.createTextNode(title));
      section.appendChild(titleRow);
      return section;
    }
    function paintTabs() {
      clear(tabBar);
      tabs.forEach(function (item) {
        var button = el("button", "set-tab" + (view === item[0] ? " is-on" : ""));
        button.type = "button";
        button.appendChild(icon(item[2]));
        button.appendChild(document.createTextNode(item[1]));
        button.addEventListener("click", function () {
          view = item[0];
          paint();
        });
        tabBar.appendChild(button);
      });
    }
    function paintBasic() {
      var grid = el("div", "set-grid");
      var brand = card("品牌信息", "content");
      var brandGrid = el("div", "set-brand");
      var logoBox = el("div", "set-logo");
      var preview = el("img", "set-logo__img");
      preview.alt = "网站 Logo";
      preview.src = draft.logo || (base + "assets/logo.png");
      logoBox.appendChild(preview);
      logoBox.appendChild(el("p", "desk__hint", "建议尺寸 400×400px。支持 JPG、PNG、WebP、SVG，不超过 " + draft.uploadMaxMb + " MB。"));
      var logoActs = el("div", "set-logo__acts");
      var file = el("input");
      file.type = "file";
      file.accept = "image/jpeg,image/png,image/webp,image/svg+xml";
      file.hidden = true;
      var replace = el("button", "set-gold", "更换图片");
      replace.type = "button";
      var remove = el("button", "review-ghost", "删除");
      remove.type = "button";
      replace.addEventListener("click", function () { file.click(); });
      remove.addEventListener("click", function () {
        draft.logo = "";
        preview.src = base + "assets/logo.png";
        file.value = "";
      });
      file.addEventListener("change", function () {
        var picked = file.files && file.files[0];
        if (!picked) return;
        var max = (Number(draft.uploadMaxMb) || 5) * 1024 * 1024;
        if (picked.size > max) {
          note("图片超过 " + draft.uploadMaxMb + " MB");
          return;
        }
        if (!/^image\/(jpeg|png|webp|svg\+xml)$/.test(picked.type)) {
          note("请上传 JPG、PNG、WebP 或 SVG");
          return;
        }
        var reader = new FileReader();
        reader.onload = function () {
          draft.logo = String(reader.result || "");
          preview.src = draft.logo;
          note("");
        };
        reader.readAsDataURL(picked);
      });
      logoActs.appendChild(replace);
      logoActs.appendChild(remove);
      logoBox.appendChild(logoActs);
      logoBox.appendChild(file);
      var brandFields = el("div");
      var name = el("input", "desk-input");
      bindText(name, "name", 40);
      field(brandFields, "网站名称", name, true);
      var subtitle = el("input", "desk-input");
      bindText(subtitle, "subtitle", 60);
      field(brandFields, "网站副标题", subtitle, false);
      var keywords = el("input", "desk-input");
      bindText(keywords, "keywords", 200);
      field(brandFields, "网站关键词（SEO）", keywords, false);
      counted(brandFields, "网站描述（SEO）", "description", 200);
      brandGrid.appendChild(logoBox);
      brandGrid.appendChild(brandFields);
      brand.appendChild(brandGrid);
      grid.appendChild(brand);

      var contact = card("联系信息", "service");
      var company = el("input", "desk-input");
      company.placeholder = "对外显示的公司名称";
      bindText(company, "company", 80);
      field(contact, "公司名称", company, false);
      var phone = el("input", "desk-input");
      phone.placeholder = "对外联系电话";
      bindText(phone, "phone", 40);
      field(contact, "联系电话", phone, false);
      var email = el("input", "desk-input");
      email.placeholder = "对外邮箱，留空则不在联系页展示";
      bindText(email, "email", 80);
      field(contact, "邮箱地址", email, false);
      var address = el("textarea", "desk-input");
      address.rows = 3;
      address.placeholder = "公司地址";
      bindText(address, "address", 200);
      field(contact, "公司地址", address, false);
      var domain = el("input", "desk-input");
      domain.placeholder = "例如 www.yinscent.com";
      bindText(domain, "domain", 80);
      field(contact, "网站域名", domain, false);
      grid.appendChild(contact);
      body.appendChild(grid);

      var second = el("div", "set-grid");
      var region = card("区域与语言设置", "content");
      choose(region, "默认语言", "defaultLanguage", [["zh", "中文（简体）"], ["en", "English"], ["es", "Español"], ["pt", "Português"]], true);
      var langBox = el("div", "set-field");
      langBox.appendChild(el("span", "", "支持语言"));
      var checks = el("div", "set-checks");
      [["zh", "中文"], ["en", "English"], ["es", "Español"], ["pt", "Português"]].forEach(function (item) {
        var label = el("label", "set-check");
        var input = el("input");
        input.type = "checkbox";
        input.checked = (draft.languages || []).indexOf(item[0]) !== -1;
        input.addEventListener("change", function () {
          var list = draft.languages.filter(function (code) { return code !== item[0]; });
          if (input.checked) list.push(item[0]);
          if (!list.length) {
            input.checked = true;
            note("至少保留一种语言");
            return;
          }
          draft.languages = list;
          if (list.indexOf(draft.defaultLanguage) === -1) draft.defaultLanguage = list[0];
          note("");
        });
        label.appendChild(input);
        label.appendChild(document.createTextNode(item[1]));
        checks.appendChild(label);
      });
      langBox.appendChild(checks);
      langBox.appendChild(el("p", "desk__hint", "网站已有这四种语言。法文、意大利文、德文和俄文还没有译文。"));
      region.appendChild(langBox);
      choose(region, "默认货币", "currency", [["CNY", "CNY - 人民币 (¥)"]], true);
      region.appendChild(el("p", "desk__hint", "前台金额使用人民币（¥），按录入价格显示，不做汇率换算。"));
      choose(region, "时区设置", "timezone", [["Asia/Shanghai", "(GMT+08:00) 北京，上海，香港"]], true);
      choose(region, "日期格式", "dateFormat", [["YYYY-MM-DD", "YYYY-MM-DD"], ["DD/MM/YYYY", "DD/MM/YYYY"], ["MM/DD/YYYY", "MM/DD/YYYY"]], false);
      choose(region, "时间格式", "timeFormat", [["24", "24 小时制（14:30）"], ["12", "12 小时制（02:30 PM）"]], false);
      second.appendChild(region);

      var features = card("网站功能设置", "settings");
      var featGrid = el("div", "set-toggles");
      toggle(featGrid, "允许新用户注册", "allowRegister");
      toggle(featGrid, "需要管理员审核", "requireReview");
      toggle(featGrid, "显示产品库存数量", "showStock");
      toggle(featGrid, "启用在线下单", "enableOrder");
      toggle(featGrid, "显示价格（统一批发价）", "showPrice");
      toggle(featGrid, "启用询盘功能", "enableInquiry");
      features.appendChild(featGrid);
      features.appendChild(el("p", "desk__hint", "关闭注册后，登录页不再显示新客户注册。审核保持打开时，申请通过前不能登录。库存只显示已经录入数量的产品。"));
      choose(features, "默认首页", "defaultHome", [["products", "产品列表页"], ["story", "品牌故事"], ["contact", "联系页"]], false);
      var pageSize = el("input", "desk-input set-narrow");
      pageSize.type = "number";
      pageSize.min = "6";
      pageSize.max = "100";
      pageSize.value = String(draft.pageSize || 24);
      pageSize.addEventListener("input", function () { draft.pageSize = pageSize.value; });
      var sizeRow = el("div", "set-inline");
      field(sizeRow, "每页显示数量", pageSize, false);
      sizeRow.appendChild(el("span", "", "条"));
      features.appendChild(sizeRow);
      second.appendChild(features);
      body.appendChild(second);

      var third = el("div", "set-grid");
      var upload = card("文件上传设置", "products");
      var maxMb = el("input", "desk-input set-narrow");
      maxMb.type = "number";
      maxMb.min = "1";
      maxMb.max = "20";
      maxMb.value = String(draft.uploadMaxMb || 5);
      maxMb.addEventListener("input", function () { draft.uploadMaxMb = maxMb.value; });
      var maxRow = el("div", "set-inline");
      field(maxRow, "产品图片最大大小", maxMb, false);
      maxRow.appendChild(el("span", "", "MB"));
      upload.appendChild(maxRow);
      var typeBox = el("div", "set-field");
      typeBox.appendChild(el("span", "", "允许的文件格式"));
      var typeChecks = el("div", "set-checks");
      [["jpg", "JPG"], ["png", "PNG"], ["webp", "WebP"]].forEach(function (item) {
        var label = el("label", "set-check");
        var input = el("input");
        input.type = "checkbox";
        input.checked = (draft.uploadTypes || []).indexOf(item[0]) !== -1;
        input.addEventListener("change", function () {
          var list = (draft.uploadTypes || []).filter(function (code) { return code !== item[0]; });
          if (input.checked) list.push(item[0]);
          if (!list.length) {
            input.checked = true;
            return;
          }
          draft.uploadTypes = list;
        });
        label.appendChild(input);
        label.appendChild(document.createTextNode(item[1]));
        typeChecks.appendChild(label);
      });
      typeBox.appendChild(typeChecks);
      upload.appendChild(typeBox);
      var imageSize = el("input", "desk-input");
      bindText(imageSize, "imageSize", 80);
      field(upload, "图片建议尺寸", imageSize, false);
      third.appendChild(upload);

      var footer = card("网站底部信息", "content");
      counted(footer, "版权信息", "copyright", 200);
      footer.appendChild(el("p", "set-social-label", "社交媒体链接"));
      [["facebook", "Facebook"], ["instagram", "Instagram"], ["youtube", "YouTube"], ["pinterest", "Pinterest"]].forEach(function (item) {
        var input = el("input", "desk-input");
        input.placeholder = "https://";
        input.maxLength = 200;
        input.value = (draft.social && draft.social[item[0]]) || "";
        input.addEventListener("input", function () {
          if (!draft.social) draft.social = {};
          draft.social[item[0]] = input.value.trim();
        });
        field(footer, item[1], input, false);
      });
      footer.appendChild(el("p", "desk__hint", "链接需以 http:// 或 https:// 开头。留空则底部仍显示原来的入口。Pinterest 是网站页脚已有的入口。"));
      third.appendChild(footer);
      body.appendChild(third);
    }
    function paintPay() {
      var section = card("支付设置", "payments");
      section.appendChild(el("p", "", "结算货币　人民币（¥）"));
      section.appendChild(el("p", "", "付款状态在订单管理中标记为已付款或未付款。"));
      section.appendChild(el("p", "desk__hint", "网站没有单独的支付密钥。结账说明里保留 PayPal 文案，金额仍按人民币录入值显示。"));
      var jump = el("button", "review-ghost", "打开订单管理");
      jump.type = "button";
      jump.addEventListener("click", function () { open("orders"); });
      section.appendChild(jump);
      body.appendChild(section);
    }
    function paintShip() {
      var section = card("物流设置", "shipping");
      section.appendChild(el("p", "desk__hint", "发货管理按每一张订单填写物流公司和物流单号。下面可以记下常用物流公司，方便查看。"));
      var area = el("textarea", "desk-input");
      area.rows = 4;
      area.maxLength = 200;
      area.placeholder = "每行一个物流公司";
      area.value = draft.carriers || "";
      area.addEventListener("input", function () { draft.carriers = area.value; });
      field(section, "常用物流公司", area, false);
      var jump = el("button", "review-ghost", "打开发货管理");
      jump.type = "button";
      jump.addEventListener("click", function () { open("shipping"); });
      section.appendChild(jump);
      body.appendChild(section);
    }
    function paint() {
      if (!draft) return;
      paintTabs();
      clear(body);
      saveBar.hidden = false;
      if (view === "pay") paintPay();
      else if (view === "ship") paintShip();
      else paintBasic();
    }
    saveBtn.addEventListener("click", function () {
      if (!draft) return;
      note("");
      saveBtn.disabled = true;
      json("api/admin/settings", {
        action: "site",
        membershipMonths: draft.membershipMonths,
        site: draft,
      }).then(function (res) {
        saveBtn.disabled = false;
        if (!res.ok) {
          note(res.data && res.data.error === "invalid_email" ? "邮箱格式不正确" : "保存没有完成");
          return;
        }
        loaded = res.data.settings || loaded;
        if (loaded && loaded.site) draft = JSON.parse(JSON.stringify(loaded.site));
        if (loaded) draft.membershipMonths = loaded.membershipMonths;
        note("已保存");
        paint();
      });
    });
    json("api/admin/settings").then(function (res) {
      if (!res.ok || !res.data.site) {
        saveBar.hidden = true;
        body.appendChild(el("p", "desk__hint", "当前账号不能修改系统设置"));
        return;
      }
      loaded = res.data;
      draft = JSON.parse(JSON.stringify(res.data.site));
      draft.membershipMonths = res.data.membershipMonths || 12;
      if (!draft.social) draft.social = {};
      if (!draft.languages) draft.languages = ["zh", "en", "es", "pt"];
      if (!draft.uploadTypes) draft.uploadTypes = ["jpg", "png", "webp"];
      paint();
    });
  }

  function userError(code) {
    if (code === "invalid_application") return "请填写姓名和电话";
    if (code === "invalid_email") return "邮箱格式不正确";
    if (code === "invalid_username") return "账号需为 4–20 位字母或数字";
    if (code === "username_taken") return "这个账号已被使用";
    if (code === "email_taken") return "这个邮箱已被使用";
    if (code === "invalid_password") return "密码需为 6–20 位，并包含字母和数字";
    if (code === "invalid_company") return "请填写公司名称";
    if (code === "invalid_country") return "请选择国家/地区";
    if (code === "not_pending") return "这条申请已经处理过";
    return "操作没有完成";
  }

  function renderSignup(root) {
    root.appendChild(el("h1", "desk__title", "新客户注册"));
    root.appendChild(el("p", "desk__hint", "填写客户注册信息，提交后将进入审核流程。"));
    var form = el("form", "signup-form");
    var message = el("div");
    function section(title) {
      var card = el("section", "desk-card signup-card");
      card.appendChild(el("h2", "signup-card__title", title));
      form.appendChild(card);
      return card;
    }
    function pair(card) {
      var grid = el("div", "signup-grid");
      card.appendChild(grid);
      return grid;
    }
    function field(parent, label, input, required) {
      var box = el("label", "signup-field");
      var title = el("span", "", label);
      if (required) title.appendChild(el("i", "signup-req", " *"));
      box.appendChild(title);
      box.appendChild(input);
      parent.appendChild(box);
      return input;
    }
    var basic = section("基本信息");
    var basicGrid = pair(basic);
    var person = field(basicGrid, "姓名", el("input", "desk-input"), true);
    person.required = true;
    person.maxLength = 40;
    person.placeholder = "请输入姓名";
    var phone = field(basicGrid, "联系电话", el("input", "desk-input"), true);
    phone.required = true;
    phone.maxLength = 20;
    phone.placeholder = "请输入联系电话";
    var email = field(basicGrid, "邮箱", el("input", "desk-input"), true);
    email.type = "email";
    email.required = true;
    email.maxLength = 80;
    email.placeholder = "请输入邮箱地址（支持网易、QQ、Gmail等）";
    var account = field(basicGrid, "账号", el("input", "desk-input"), true);
    account.required = true;
    account.maxLength = 20;
    account.placeholder = "请输入登录账号（4-20位，字母或数字）";
    var pass = el("input", "desk-input");
    pass.readOnly = true;
    pass.placeholder = "保存后自动生成固定密码";
    field(basic, "密码", pass, true);

    var companyCard = section("公司信息");
    var companyGrid = pair(companyCard);
    var company = field(companyGrid, "公司名称", el("input", "desk-input"), true);
    company.required = true;
    company.maxLength = 80;
    company.placeholder = "请输入公司名称";
    var country = el("select", "desk-input");
    var blank = el("option", "", "请选择国家/地区");
    blank.value = "";
    country.appendChild(blank);
    [
      ["CN", "中国大陆"], ["HK", "中国香港"], ["MO", "中国澳门"], ["TW", "中国台湾"],
      ["US", "美国"], ["CA", "加拿大"], ["GB", "英国"], ["AU", "澳大利亚"], ["NZ", "新西兰"],
      ["JP", "日本"], ["KR", "韩国"], ["SG", "新加坡"], ["MY", "马来西亚"], ["TH", "泰国"],
      ["VN", "越南"], ["ID", "印度尼西亚"], ["PH", "菲律宾"], ["IN", "印度"], ["AE", "阿联酋"],
      ["SA", "沙特阿拉伯"], ["DE", "德国"], ["FR", "法国"], ["IT", "意大利"], ["ES", "西班牙"],
      ["PT", "葡萄牙"], ["NL", "荷兰"], ["BE", "比利时"], ["CH", "瑞士"], ["SE", "瑞典"],
      ["NO", "挪威"], ["DK", "丹麦"], ["FI", "芬兰"], ["IE", "爱尔兰"], ["RU", "俄罗斯"],
      ["BR", "巴西"], ["MX", "墨西哥"], ["AR", "阿根廷"], ["ZA", "南非"], ["TR", "土耳其"], ["EG", "埃及"],
    ].forEach(function (item) {
      var option = el("option", "", item[1]);
      option.value = item[0];
      country.appendChild(option);
    });
    field(companyGrid, "国家/地区", country, true);
    var address = field(companyCard, "详细地址", el("input", "desk-input"), false);
    address.maxLength = 200;
    address.placeholder = "请输入详细地址（街道、城市、邮编等）";

    var extra = section("其他信息");
    var noteBox = el("div", "signup-note");
    var note = el("textarea", "desk-input");
    note.maxLength = 500;
    note.placeholder = "请输入备注信息，如业务类型、合作需求等（选填）";
    var count = el("span", "signup-count", "0/500");
    note.addEventListener("input", function () { count.textContent = note.value.length + "/500"; });
    noteBox.appendChild(note);
    noteBox.appendChild(count);
    field(extra, "备注", noteBox, false);

    var bar = el("div", "signup-bar");
    var cancel = el("button", "review-ghost", "取消");
    cancel.type = "button";
    var submit = el("button", "review-pass", "保存");
    submit.type = "submit";
    bar.appendChild(cancel);
    bar.appendChild(submit);
    form.appendChild(bar);
    root.appendChild(form);
    root.appendChild(message);

    function resetForm() {
      person.value = "";
      phone.value = "";
      email.value = "";
      account.value = "";
      company.value = "";
      country.value = "";
      address.value = "";
      note.value = "";
      count.textContent = "0/500";
    }
    cancel.addEventListener("click", function () {
      resetForm();
      pass.value = "";
      clear(message);
    });
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      clear(message);
      json("api/admin/users", {
        action: "register",
        name: person.value,
        phone: phone.value,
        email: email.value,
        username: account.value,
        company: company.value,
        country: country.value,
        address: address.value,
        note: note.value,
      }).then(function (res) {
        if (!res.ok) {
          message.appendChild(el("p", "desk__hint", userError(res.data && res.data.error)));
          return;
        }
        pass.value = res.data.password || "";
        message.appendChild(el("p", "desk__hint", "已提交，等待审核。固定密码已显示在上方，之后仍可在审核和客户信息里查看。"));
        resetForm();
        loadAll();
      });
    });
  }

  function renderClientReview(root) {
    clear(root);
    root.appendChild(el("h1", "desk__title", "客户注册审核"));
    root.appendChild(el("p", "desk__hint", "审核新用户的注册申请，审核通过后用户可正常登录系统。"));
    var message = el("div");
    root.appendChild(message);

    var filters = el("section", "desk-card review-filters");
    function filterField(label, node) {
      var box = el("label", "review-field");
      box.appendChild(el("span", "", label));
      box.appendChild(node);
      filters.appendChild(box);
      return node;
    }
    var accountInput = filterField("账号", el("input", "desk-input"));
    accountInput.placeholder = "请输入账号";
    var nameInput = filterField("申请人", el("input", "desk-input"));
    nameInput.placeholder = "请输入申请人姓名";
    var actions = el("div", "review-filter-actions");
    var queryBtn = el("button", "review-pass", "查询");
    queryBtn.type = "button";
    var resetBtn = el("button", "review-ghost", "重置");
    resetBtn.type = "button";
    actions.appendChild(queryBtn);
    actions.appendChild(resetBtn);
    filters.appendChild(actions);
    root.appendChild(filters);

    var tabs = el("div", "review-tabs");
    root.appendChild(tabs);
    var tableCard = el("section", "desk-card desk-sheet");
    root.appendChild(tableCard);
    var pager = el("div", "review-pager");
    root.appendChild(pager);

    var users = [];
    var applied = { account: "", name: "", status: "all" };
    var page = 1;
    var pageSize = 10;
    var openId = "";

    function reviewKey(user) {
      if (user.status === "pending") return "pending";
      if (user.status === "rejected") return "rejected";
      if (user.disabled || user.status === "disabled") return "disabled";
      return "approved";
    }
    function reviewText(key) {
      if (key === "pending") return "待审核";
      if (key === "rejected") return "已拒绝";
      if (key === "disabled") return "已禁用";
      return "已审核";
    }
    function stamp(value) {
      return value ? String(value).replace("T", " ").slice(0, 19) : "—";
    }
    function maskPhone(phone) {
      var digits = String(phone || "").replace(/\D/g, "");
      if (digits.length < 7) return phone || "—";
      return digits.slice(0, 3) + "****" + digits.slice(-4);
    }
    function textMatch(user) {
      var account = applied.account.trim().toLowerCase();
      var name = applied.name.trim().toLowerCase();
      if (account && String(user.username || "").toLowerCase().indexOf(account) === -1) return false;
      if (name && String(user.name || "").toLowerCase().indexOf(name) === -1) return false;
      return true;
    }
    function loginName(user, typed) {
      var wanted = String(typed || user.username || "").trim();
      if (wanted) return wanted;
      var digits = String(user.phone || "").replace(/\D/g, "");
      return digits.length >= 6 ? ("c" + digits).slice(0, 32) : "";
    }

    function draw() {
      clear(tabs);
      clear(tableCard);
      clear(pager);
      var baseRows = users.filter(textMatch);
      var counts = { all: baseRows.length, pending: 0, approved: 0, rejected: 0 };
      baseRows.forEach(function (user) {
        var key = reviewKey(user);
        if (counts[key] != null) counts[key] += 1;
      });
      [["all", "全部"], ["pending", "待审核"], ["approved", "已审核"], ["rejected", "已拒绝"]].forEach(function (item) {
        var tab = el("button", "review-tab" + (applied.status === item[0] ? " is-active" : ""), item[1] + " (" + counts[item[0]] + ")");
        tab.type = "button";
        tab.addEventListener("click", function () {
          applied.status = item[0];
          page = 1;
          draw();
        });
        tabs.appendChild(tab);
      });
      var rows = baseRows.filter(function (user) {
        return applied.status === "all" || reviewKey(user) === applied.status;
      });
      var pages = Math.max(1, Math.ceil(rows.length / pageSize));
      if (page > pages) page = pages;
      var slice = rows.slice((page - 1) * pageSize, page * pageSize);
      var table = el("table", "desk-table review-table");
      var head = el("tr");
      ["", "序号", "账号", "申请人", "联系方式", "申请时间", "审核状态", "操作"].forEach(function (label) {
        head.appendChild(el("th", "", label));
      });
      table.appendChild(head);
      if (!slice.length) {
        var empty = el("tr");
        var emptyCell = el("td", "desk__hint", users.length ? "没有匹配的申请" : "还没有注册申请");
        emptyCell.colSpan = 8;
        empty.appendChild(emptyCell);
        table.appendChild(empty);
      }
      slice.forEach(function (user, index) {
          var key = reviewKey(user);
          var tr = el("tr");
          var checkCell = el("td");
          var check = el("input");
          check.type = "checkbox";
          checkCell.appendChild(check);
          tr.appendChild(checkCell);
          tr.appendChild(el("td", "", String((page - 1) * pageSize + index + 1)));
          tr.appendChild(el("td", "", user.username || "—"));
          tr.appendChild(el("td", "", user.name || "—"));
          tr.appendChild(el("td", "", maskPhone(user.phone)));
          tr.appendChild(el("td", "", stamp(user.createdAt)));
          tr.appendChild(el("td", "review-status review-status--" + key, reviewText(key)));
          var op = el("td", "review-ops");
          if (key === "pending") {
            var pass = el("button", "review-pass", "通过");
            pass.type = "button";
            var reject = el("button", "review-ghost", "拒绝");
            reject.type = "button";
            pass.addEventListener("click", function () { approve(user); });
            reject.addEventListener("click", function () { rejectUser(user); });
            op.appendChild(pass);
            op.appendChild(reject);
          } else {
            op.appendChild(el("span", "review-dash", "—"));
            op.appendChild(el("span", "review-dash", "—"));
          }
          var view = el("button", "review-ghost", openId === user.id ? "收起" : "查看");
          view.type = "button";
          view.addEventListener("click", function () {
            openId = openId === user.id ? "" : user.id;
            draw();
          });
          op.appendChild(view);
          tr.appendChild(op);
          table.appendChild(tr);
          if (openId === user.id) {
            var detail = el("tr");
            var cell = el("td", "desk-staff");
            cell.colSpan = 8;
            cell.appendChild(el("p", "", "账号　" + (user.username || "未分配")));
            cell.appendChild(el("p", "", "申请人　" + (user.name || "—")));
            cell.appendChild(el("p", "", "电话　" + (user.phone || "—")));
            cell.appendChild(el("p", "", "邮箱　" + (user.email || "—")));
            if (user.company) cell.appendChild(el("p", "", "公司　" + user.company));
            if (user.country) cell.appendChild(el("p", "", "国家　" + user.country));
            if (user.city) cell.appendChild(el("p", "", "城市　" + user.city));
            if (user.address) cell.appendChild(el("p", "", "地址　" + user.address));
            if (user.note) cell.appendChild(el("p", "", "备注　" + user.note));
            cell.appendChild(el("p", "", "申请时间　" + stamp(user.createdAt)));
            cell.appendChild(el("p", "", "审核状态　" + reviewText(key)));
            if (user.password) cell.appendChild(el("p", "", "密码　" + user.password));
            if (key === "pending" && !user.username) {
              var typed = el("input", "desk-input");
              typed.placeholder = "通过后的登录账号";
              typed.maxLength = 32;
              typed.value = loginName(user);
              cell.appendChild(typed);
              user._typed = typed;
            }
            detail.appendChild(cell);
            table.appendChild(detail);
          }
        });
        tableCard.appendChild(table);
      pager.appendChild(el("span", "", "共 " + rows.length + " 条数据"));
      var pagesBox = el("div", "review-pages");
      var prev = el("button", "review-ghost", "‹");
      prev.type = "button";
      prev.disabled = page <= 1;
      prev.addEventListener("click", function () { page -= 1; draw(); });
      pagesBox.appendChild(prev);
      var current = el("span", "review-page is-active", String(page));
      pagesBox.appendChild(current);
      if (pages > 1) {
        var next = el("button", "review-ghost", "›");
        next.type = "button";
        next.disabled = page >= pages;
        next.addEventListener("click", function () { page += 1; draw(); });
        pagesBox.appendChild(next);
      }
      pager.appendChild(pagesBox);
      var size = el("select", "desk-input review-size");
      [10, 20, 50].forEach(function (count) {
        var option = el("option", "", count + "条/页");
        option.value = String(count);
        if (count === pageSize) option.selected = true;
        size.appendChild(option);
      });
      size.addEventListener("change", function () {
        pageSize = Number(size.value) || 10;
        page = 1;
        draw();
      });
      pager.appendChild(size);
    }

    function approve(user) {
      var typed = openId === user.id && user._typed ? user._typed.value : "";
      var username = loginName(user, typed);
      if (!username) {
        clear(message);
        message.appendChild(el("p", "desk__hint", "请先在查看里填写账号"));
        return;
      }
      json("api/admin/users", { action: "approve", id: user.id, username: username }).then(function (saved) {
        clear(message);
        if (!saved.ok) {
          message.appendChild(el("p", "desk__hint", userError(saved.data && saved.data.error)));
          return;
        }
        message.appendChild(el("p", "desk__hint", "已审核。账号 " + (saved.data.username || "") + "，密码 " + (saved.data.password || "")));
        load();
        refreshAlerts();
      });
    }
    function rejectUser(user) {
      json("api/admin/users", { action: "reject", id: user.id }).then(function (saved) {
        clear(message);
        if (!saved.ok) {
          message.appendChild(el("p", "desk__hint", "拒绝没有完成"));
          return;
        }
        message.appendChild(el("p", "desk__hint", "已拒绝"));
        load();
        refreshAlerts();
      });
    }
    function load() {
      json("api/admin/users").then(function (res) {
        if (!res.ok) {
          clear(tableCard);
          tableCard.appendChild(el("p", "desk__hint", "当前账号不能查看注册审核"));
          return;
        }
        users = res.data.users || [];
        draw();
      });
    }
    queryBtn.addEventListener("click", function () {
      applied.account = accountInput.value;
      applied.name = nameInput.value;
      page = 1;
      draw();
    });
    resetBtn.addEventListener("click", function () {
      accountInput.value = "";
      nameInput.value = "";
      applied.account = "";
      applied.name = "";
      page = 1;
      draw();
    });
    load();
  }

  function renderClients(root) {
    root.appendChild(el("h1", "desk__title", "客户信息"));
    var tools = el("div", "client-tools");
    var addBtn = el("button", "review-pass client-action", "+ 新增客户");
    addBtn.type = "button";
    addBtn.addEventListener("click", function () { open("signup"); });
    var row = el("div", "client-tools__row");
    var search = el("input", "desk-input desk-search");
    search.type = "search";
    search.placeholder = "搜索账号 / 姓名 / 电话 / 邮箱";
    search.setAttribute("aria-label", "搜索账号或姓名");
    var searchBtn = el("button", "review-pass client-action client-query");
    searchBtn.type = "button";
    var glass = svgEl("svg");
    glass.setAttribute("viewBox", "0 0 16 16");
    glass.setAttribute("class", "client-action__ico");
    glass.setAttribute("aria-hidden", "true");
    var ring = svgEl("circle");
    ring.setAttribute("cx", "7");
    ring.setAttribute("cy", "7");
    ring.setAttribute("r", "4.2");
    var handle = svgEl("path");
    handle.setAttribute("d", "M10.4 10.4L14 14");
    glass.appendChild(ring);
    glass.appendChild(handle);
    searchBtn.appendChild(glass);
    searchBtn.appendChild(document.createTextNode("查询"));
    row.appendChild(search);
    row.appendChild(searchBtn);
    tools.appendChild(addBtn);
    tools.appendChild(row);
    root.appendChild(tools);
    var list = el("div");
    root.appendChild(list);
    var users = state.users || [];
    var openId = "";
    var query = "";
    var selected = {};
    function clientStamp(value) {
      return value ? String(value).replace("T", " ").slice(0, 19) : "—";
    }
    function clientLine(label, value) {
      var row = el("p", "client-detail__row");
      row.appendChild(el("span", "", label));
      row.appendChild(el("strong", "", value));
      return row;
    }
    function saveClient(action, id) {
      json("api/admin/users", { action: action, id: id }).then(function (res) {
        if (!res.ok) return;
        if (action === "delete") {
          openId = "";
          delete selected[id];
        }
        json("api/admin/users").then(function (next) {
          users = next.ok ? (next.data.users || []) : users;
          state.users = users;
          draw();
        });
      });
    }
    function clientStatus(user) {
      if (user.disabled || user.status === "disabled") return ["禁用", "disabled"];
      if (user.status === "pending") return ["待审核", "pending"];
      if (user.status === "rejected") return ["已拒绝", "rejected"];
      return ["启用", "approved"];
    }
    function draw() {
      clear(list);
      var q = query;
      var rows = users.filter(function (user) {
        if (!q) return true;
        return [user.username, user.name, user.phone, user.email].join(" ").toLowerCase().indexOf(q) !== -1;
      });
      var card = el("section", "desk-card desk-sheet");
      var table = el("table", "desk-table client-table");
      var head = el("tr");
      var checkHead = el("th");
      var checkAll = el("input");
      checkAll.type = "checkbox";
      checkAll.checked = rows.length > 0 && rows.every(function (user) { return selected[user.id]; });
      checkAll.addEventListener("change", function () {
        rows.forEach(function (user) { selected[user.id] = checkAll.checked; });
        draw();
      });
      checkHead.appendChild(checkAll);
      head.appendChild(checkHead);
      ["账号", "姓名", "电话", "邮箱", "注册时间", "客户状态", "操作"].forEach(function (label) {
        head.appendChild(el("th", "", label));
      });
      table.appendChild(head);
      if (!rows.length) {
        var empty = el("tr");
        var emptyCell = el("td", "desk__hint", users.length ? "没有匹配的客户" : "还没有客户");
        emptyCell.colSpan = 8;
        empty.appendChild(emptyCell);
        table.appendChild(empty);
      }
      rows.forEach(function (user) {
        var tr = el("tr");
        var checkCell = el("td");
        var check = el("input");
        check.type = "checkbox";
        check.checked = !!selected[user.id];
        check.addEventListener("change", function () {
          selected[user.id] = check.checked;
          draw();
        });
        checkCell.appendChild(check);
        tr.appendChild(checkCell);
        tr.appendChild(el("td", "", user.username || "—"));
        tr.appendChild(el("td", "", user.name || "—"));
        tr.appendChild(el("td", "", user.phone || "—"));
        tr.appendChild(el("td", "", user.email || "—"));
        tr.appendChild(el("td", "", clientStamp(user.createdAt)));
        var status = clientStatus(user);
        tr.appendChild(el("td", "review-status review-status--" + status[1], status[0]));
        var view = el("button", "desk-op", openId === user.id ? "收起" : "查看");
        view.type = "button";
        view.addEventListener("click", function () {
          openId = openId === user.id ? "" : user.id;
          draw();
        });
        var op = el("td");
        op.appendChild(view);
        tr.appendChild(op);
        table.appendChild(tr);
        if (openId === user.id) {
          var detail = el("tr");
          var cell = el("td", "client-detail");
          cell.colSpan = 8;
          [
            ["账号", user.username || "—"],
            ["姓名", user.name || "—"],
            ["电话", user.phone || "—"],
            ["邮箱", user.email || "—"],
            ["密码", user.password || "需重置后显示"],
            ["国家", user.country || "—"],
          ].forEach(function (item) {
            cell.appendChild(clientLine(item[0], item[1]));
          });
          if (user.city) cell.appendChild(clientLine("城市", user.city));
          cell.appendChild(clientLine("注册时间", clientStamp(user.createdAt)));
          var actions = el("div", "client-detail__actions");
          var ban = el("button", "review-ghost", user.disabled ? "启用" : "禁用");
          ban.type = "button";
          ban.addEventListener("click", function () {
            saveClient(user.disabled ? "enable" : "disable", user.id);
          });
          var remove = el("button", "pall-del", "删除");
          remove.type = "button";
          remove.addEventListener("click", function () {
            saveClient("delete", user.id);
          });
          actions.appendChild(ban);
          actions.appendChild(remove);
          cell.appendChild(actions);
          detail.appendChild(cell);
          table.appendChild(detail);
        }
      });
      card.appendChild(table);
      list.appendChild(card);
    }
    function applySearch() {
      query = search.value.trim().toLowerCase();
      openId = "";
      draw();
    }
    searchBtn.addEventListener("click", applySearch);
    search.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        applySearch();
      }
    });
    if (!users.length) {
      json("api/admin/users").then(function (res) {
        users = res.ok ? (res.data.users || []) : [];
        draw();
      });
    } else draw();
  }

  function productFields(product) {
    return {
      id: product.id,
      sku: product.sku || "",
      name: product.name || "",
      image: product.image || "",
      barcode: product.barcode || "",
      innerPack: product.innerPack || "",
      carton: product.carton || "",
      size: product.size || "",
      weight: product.weight || "",
      price: product.price || "",
      stock: product.stock || "",
    };
  }

  function renderProductNew(root) {
    root.appendChild(el("h1", "desk__title", "新增产品"));
    root.appendChild(el("p", "desk__hint", "这里新增的产品保存后，首页会同步产品名称和价格。"));
    var form = el("form", "signup-form product-form");
    var message = el("div");
    function section(title) {
      var card = el("section", "desk-card signup-card");
      card.appendChild(el("h2", "signup-card__title product-card__title", title));
      form.appendChild(card);
      return card;
    }
    function grid(card, className) {
      var box = el("div", className || "signup-grid");
      card.appendChild(box);
      return box;
    }
    function field(parent, label, input, required) {
      var box = el("label", "signup-field");
      var title = el("span", "", label);
      if (required) title.appendChild(el("i", "signup-req", " *"));
      box.appendChild(title);
      box.appendChild(input);
      parent.appendChild(box);
      return input;
    }
    function textInput(placeholder, max) {
      var input = el("input", "desk-input");
      input.placeholder = placeholder;
      input.maxLength = max || 80;
      return input;
    }

    var basic = section("基本信息");
    var basicGrid = grid(basic);
    var sku = field(basicGrid, "货号", textInput("请输入货号", 64), true);
    var name = field(basicGrid, "产品名称", textInput("请输入产品名称", 120), true);
    var barcode = field(basicGrid, "香味", textInput("请输入香味", 64), false);
    var category = el("select", "desk-input");
    var blank = el("option", "", "请选择产品分类");
    blank.value = "";
    category.appendChild(blank);
    ["香薰茶蜡", "香薰蜡烛", "藤条香薰", "藤条香薰补充液", "茶蜡烛台", "香包", "留香木珠", "精油", "智能香薰机", "智能香薰机补充液"].forEach(function (label) {
      var option = el("option", "", label);
      option.value = label;
      category.appendChild(option);
    });
    field(basicGrid, "产品分类", category, true);
    var brand = field(basicGrid, "品牌", textInput("", 40), false);
    brand.value = "YINSCENT";
    brand.readOnly = true;
    brand.classList.add("product-lock");
    var noteBox = el("div", "signup-note");
    var description = el("textarea", "desk-input");
    description.maxLength = 500;
    description.placeholder = "请输入产品描述（可选）";
    var count = el("span", "signup-count", "0/500");
    description.addEventListener("input", function () { count.textContent = description.value.length + "/500"; });
    noteBox.appendChild(description);
    noteBox.appendChild(count);
    field(basic, "产品描述", noteBox, false);

    var spec = section("规格信息");
    var specGrid = grid(spec, "product-spec");
    var innerPack = field(specGrid, "中包数", textInput("请输入中包数", 20), false);
    var carton = field(specGrid, "装箱数", textInput("请输入装箱数", 20), false);
    var sizeBox = el("div", "product-size");
    var length = textInput("长", 20);
    var width = textInput("宽", 20);
    var height = textInput("高", 20);
    sizeBox.appendChild(length);
    sizeBox.appendChild(width);
    sizeBox.appendChild(height);
    field(specGrid, "尺寸 (cm)", sizeBox, false);
    var weight = field(specGrid, "重量 (kg)", textInput("请输入重量", 40), false);
    var price = field(specGrid, "价格 (¥)", textInput("请输入价格", 20), false);
    var stock = field(specGrid, "库存", textInput("请输入库存数量", 20), false);

    var photos = section("产品图片");
    var photoRow = el("div", "product-photos");
    photos.appendChild(photoRow);
    var slots = [];
    function photoSlot(main) {
      var label = el("label", "product-photo" + (main ? " product-photo--main" : ""));
      var input = el("input");
      input.type = "file";
      input.accept = "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";
      var preview = el("img");
      preview.alt = "";
      preview.hidden = true;
      var hint = el("span", "product-photo__hint");
      if (main) {
        var icon = svgEl("svg");
        icon.setAttribute("viewBox", "0 0 24 24");
        icon.setAttribute("class", "product-photo__icon");
        icon.setAttribute("aria-hidden", "true");
        var cloud = svgEl("path");
        cloud.setAttribute("d", "M7 18h10a4 4 0 0 0 .4-8 5 5 0 0 0-9.6-1.5A3.5 3.5 0 0 0 7 18z");
        var arrow = svgEl("path");
        arrow.setAttribute("d", "M12 16V9M9.5 11.5L12 9l2.5 2.5");
        icon.appendChild(cloud);
        icon.appendChild(arrow);
        hint.appendChild(icon);
        hint.appendChild(el("strong", "", "点击上传图片"));
        hint.appendChild(el("small", "", "支持 JPG、PNG、WEBP 格式"));
        hint.appendChild(el("small", "", "建议尺寸 800×800px 以上"));
      } else {
        hint.appendChild(el("span", "product-photo__plus", "+"));
      }
      label.appendChild(input);
      label.appendChild(preview);
      label.appendChild(hint);
      var slot = { input: input, preview: preview, hint: hint, value: "" };
      input.addEventListener("change", function () {
        var chosen = input.files && input.files[0];
        clear(message);
        if (!chosen) return;
        if (chosen.size > 280000) {
          input.value = "";
          message.appendChild(el("p", "desk__hint", "图片过大"));
          return;
        }
        var reader = new FileReader();
        reader.onload = function () {
          slot.value = String(reader.result || "");
          preview.src = slot.value;
          preview.hidden = false;
          hint.hidden = true;
        };
        reader.readAsDataURL(chosen);
      });
      photoRow.appendChild(label);
      slots.push(slot);
    }
    photoSlot(true);
    for (var n = 0; n < 4; n++) photoSlot(false);

    var bar = el("div", "signup-bar");
    var cancel = el("button", "review-ghost", "取消");
    cancel.type = "button";
    var submit = el("button", "review-pass", "保存");
    submit.type = "submit";
    bar.appendChild(cancel);
    bar.appendChild(submit);
    form.appendChild(bar);
    root.appendChild(form);
    root.appendChild(message);

    function resetForm() {
      [sku, name, barcode, series, description, innerPack, carton, length, width, height, weight, price, stock].forEach(function (input) {
        input.value = "";
      });
      category.value = "";
      brand.value = "YINSCENT";
      count.textContent = "0/500";
      slots.forEach(function (slot) {
        slot.value = "";
        slot.input.value = "";
        slot.preview.hidden = true;
        slot.preview.removeAttribute("src");
        slot.hint.hidden = false;
      });
    }
    cancel.addEventListener("click", function () {
      resetForm();
      clear(message);
    });
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      clear(message);
      if (!sku.value.trim() || !name.value.trim()) {
        message.appendChild(el("p", "desk__hint", "请填写货号和产品名称"));
        return;
      }
      if (!category.value) {
        message.appendChild(el("p", "desk__hint", "请选择产品分类"));
        return;
      }
      var images = slots.map(function (slot) { return slot.value; }).filter(Boolean);
      json("api/admin/trade-products", {
        action: "create",
        sku: sku.value,
        name: name.value,
        barcode: barcode.value,
        category: category.value,
        brand: brand.value,
        description: description.value,
        innerPack: innerPack.value,
        carton: carton.value,
        length: length.value,
        width: width.value,
        height: height.value,
        size: [length.value, width.value, height.value].map(function (part) { return part.trim(); }).filter(Boolean).join(" × "),
        weight: weight.value,
        price: price.value,
        stock: stock.value,
        images: images,
        image: images[0] || "",
      }).then(function (res) {
        clear(message);
        if (!res.ok) {
          var code = res.data && res.data.error;
          var text = code === "invalid_image" ? "图片过大" : code === "invalid_category" ? "请选择产品分类" : "请填写货号和产品名称";
          message.appendChild(el("p", "desk__hint", text));
          return;
        }
        message.appendChild(el("p", "desk__hint", "已保存。首页系列标题和价格已同步。"));
        resetForm();
      });
    });
  }

  function renderProductAll(root) {
    var head = el("div", "pall-head");
    var titles = el("div");
    titles.appendChild(el("h1", "desk__title", "所有产品信息"));
    titles.appendChild(el("p", "desk__hint", "以下内容可以编辑。保存后，首页系列标题和价格会同步。"));
    var add = el("button", "review-pass client-action", "+ 新增产品");
    add.type = "button";
    add.addEventListener("click", function () { open("productNew"); });
    head.appendChild(titles);
    head.appendChild(add);
    root.appendChild(head);

    var filters = el("div", "pall-filters");
    var search = el("input", "desk-input desk-search");
    search.type = "search";
    search.placeholder = "搜索货号 / 产品名称 / 分类 / 香味";
    var categoryInput = el("select", "desk-input pall-select");
    var statusInput = el("select", "desk-input pall-select");
    [["", "全部状态"], ["enabled", "启用"], ["disabled", "停用"]].forEach(function (item) {
      var option = el("option", "", item[1]);
      option.value = item[0];
      statusInput.appendChild(option);
    });
    var queryBtn = el("button", "review-pass pall-query", "查询");
    queryBtn.type = "button";
    var resetBtn = el("button", "review-ghost pall-reset");
    resetBtn.type = "button";
    resetBtn.appendChild(document.createTextNode("重置"));
    filters.appendChild(search);
    filters.appendChild(categoryInput);
    filters.appendChild(statusInput);
    filters.appendChild(queryBtn);
    filters.appendChild(resetBtn);
    root.appendChild(filters);

    var message = el("div");
    var sheet = el("div", "desk-sheet");
    var foot = el("div", "pall-foot");
    root.appendChild(message);
    root.appendChild(sheet);
    root.appendChild(foot);

    var products = [];
    var applied = { q: "", category: "", status: "" };
    var page = 1;
    var pageSize = 10;
    var selected = {};
    var editing = "";
    var categories = ["香薰茶蜡", "香薰蜡烛", "藤条香薰", "藤条香薰补充液", "茶蜡烛台", "香包", "留香木珠", "精油", "智能香薰机", "智能香薰机补充液"];

    function fillCategories() {
      var current = categoryInput.value;
      clear(categoryInput);
      var all = el("option", "", "全部分类");
      all.value = "";
      categoryInput.appendChild(all);
      var seen = {};
      categories.forEach(function (label) { seen[label] = true; });
      products.forEach(function (product) {
        if (product.category && !seen[product.category]) {
          seen[product.category] = true;
          categories.push(product.category);
        }
      });
      categories.forEach(function (label) {
        var option = el("option", "", label);
        option.value = label;
        categoryInput.appendChild(option);
      });
      categoryInput.value = current;
    }
    function skuParts(sku) {
      return String(sku || "").match(/\d+|\D+/g) || [""];
    }
    function compareSku(a, b) {
      var left = skuParts(a);
      var right = skuParts(b);
      var count = Math.max(left.length, right.length);
      for (var i = 0; i < count; i++) {
        var x = left[i] || "";
        var y = right[i] || "";
        var xNum = /^\d+$/.test(x);
        var yNum = /^\d+$/.test(y);
        if (xNum && yNum) {
          var diff = parseInt(x, 10) - parseInt(y, 10);
          if (diff) return diff;
        } else if (x !== y) {
          return x < y ? -1 : 1;
        }
      }
      return 0;
    }
    function bySeriesSku(list) {
      var groups = [];
      var index = {};
      list.forEach(function (product) {
        var key = String(product.name || "");
        if (index[key] == null) {
          index[key] = groups.length;
          groups.push([]);
        }
        groups[index[key]].push(product);
      });
      var ordered = [];
      groups.forEach(function (group) {
        group.sort(function (a, b) { return compareSku(a.sku, b.sku) || String(a.barcode || "").localeCompare(String(b.barcode || ""), "zh"); });
        group.forEach(function (product) { ordered.push(product); });
      });
      return ordered;
    }
    function matched() {
      var q = applied.q.trim().toLowerCase();
      return bySeriesSku(products.filter(function (product) {
        if (q && [product.sku, product.name, product.category, product.barcode].join(" ").toLowerCase().indexOf(q) === -1) return false;
        if (applied.category && product.category !== applied.category) return false;
        if (applied.status === "enabled" && product.status === "disabled") return false;
        if (applied.status === "disabled" && product.status !== "disabled") return false;
        return true;
      }));
    }
    function amount(value) {
      if (value === "" || value == null) return "";
      var number = Number(value);
      return isFinite(number) ? number.toFixed(2) : String(value);
    }
    function note(text) {
      clear(message);
      message.appendChild(el("p", "desk__hint", text));
    }
    function chosenIds(rows) {
      return rows.filter(function (product) { return selected[product.id]; }).map(function (product) { return product.id; });
    }
    function runBatch(op, ids) {
      if (!ids.length) {
        note("请先选择产品");
        return;
      }
      json("api/admin/trade-products", { action: "batch", op: op, ids: ids }).then(function (res) {
        if (!res.ok) {
          note("操作没有完成");
          return;
        }
        editing = "";
        ids.forEach(function (id) { delete selected[id]; });
        note(op === "remove" ? "已处理。首页不再显示已删除的产品。" : "状态已更新。停用的产品不再显示在首页。");
        load();
      });
    }
    function saveRow(product, inputs) {
      json("api/admin/trade-products", {
        action: "update",
        id: product.id,
        sku: inputs.sku.value,
        name: inputs.name.value,
        barcode: inputs.barcode.value,
        innerPack: inputs.innerPack.value,
        carton: inputs.carton.value,
        size: inputs.size.value,
        weight: inputs.weight.value,
        price: inputs.price.value,
        stock: inputs.stock.value,
        status: product.status === "disabled" ? "disabled" : "enabled",
        category: product.category || "",
        brand: product.brand || "YINSCENT",
      }).then(function (res) {
        if (!res.ok) {
          note("保存没有完成");
          return;
        }
        editing = "";
        note("已保存。首页系列标题和价格已同步。");
        load();
      });
    }

    function draw() {
      clear(sheet);
      clear(foot);
      fillCategories();
      var rows = matched();
      var pages = Math.max(1, Math.ceil(rows.length / pageSize));
      if (page > pages) page = pages;
      var slice = rows.slice((page - 1) * pageSize, page * pageSize);
      var table = el("table", "desk-table pall-table");
      var headRow = el("tr");
      var checkHead = el("th");
      var checkAll = el("input");
      checkAll.type = "checkbox";
      checkAll.checked = slice.length > 0 && slice.every(function (product) { return selected[product.id]; });
      checkAll.addEventListener("change", function () {
        slice.forEach(function (product) { selected[product.id] = checkAll.checked; });
        draw();
      });
      checkHead.appendChild(checkAll);
      headRow.appendChild(checkHead);
      ["货号", "产品名称", "图片", "香味", "中包数", "装箱数", "尺寸 (cm)", "重量 (kg)", "价格 (¥)", "库存", "状态", "操作"].forEach(function (label) {
        headRow.appendChild(el("th", "", label));
      });
      table.appendChild(headRow);
      if (!slice.length) {
        var empty = el("tr");
        var emptyCell = el("td", "desk__hint", products.length ? "没有匹配的产品" : "还没有产品");
        emptyCell.colSpan = 13;
        empty.appendChild(emptyCell);
        table.appendChild(empty);
      }
      slice.forEach(function (product) {
        var open = editing === product.id;
        var inputs = {};
        var tr = el("tr");
        var checkCell = el("td");
        var check = el("input");
        check.type = "checkbox";
        check.checked = !!selected[product.id];
        check.addEventListener("change", function () {
          selected[product.id] = check.checked;
          draw();
        });
        checkCell.appendChild(check);
        tr.appendChild(checkCell);
        function cellInput(key, value) {
          var cell = el("td");
          var box = el("input", "desk-input pall-input");
          box.value = value == null ? "" : String(value);
          box.readOnly = !open;
          inputs[key] = box;
          cell.appendChild(box);
          tr.appendChild(cell);
          return box;
        }
        cellInput("sku", product.sku);
        cellInput("name", product.name);
        var photo = el("td");
        var img = el("img", "pall-photo");
        img.alt = "";
        if (product.image) img.src = freshImage(product.image);
        else img.hidden = true;
        img.addEventListener("dblclick", function () {
          if (!img.getAttribute("src")) return;
          var mask = el("div", "pall-view");
          var big = el("img", "pall-view__img");
          big.src = img.src;
          big.alt = product.name || "";
          mask.appendChild(big);
          mask.addEventListener("click", function (event) {
            if (event.target === mask) mask.remove();
          });
          document.body.appendChild(mask);
        });
        photo.appendChild(img);
        tr.appendChild(photo);
        cellInput("barcode", product.barcode);
        cellInput("innerPack", product.innerPack);
        cellInput("carton", product.carton);
        cellInput("size", product.size);
        cellInput("weight", product.weight);
        cellInput("price", amount(product.price));
        cellInput("stock", product.stock);
        var statusCell = el("td");
        var statusWrap = el("span", "pall-status");
        statusWrap.appendChild(el("i", "pall-dot" + (product.status === "disabled" ? " is-off" : "")));
        var status = el("select", "desk-input pall-input");
        [["enabled", "启用"], ["disabled", "停用"]].forEach(function (item) {
          var option = el("option", "", item[1]);
          option.value = item[0];
          if ((product.status === "disabled" ? "disabled" : "enabled") === item[0]) option.selected = true;
          status.appendChild(option);
        });
        status.addEventListener("change", function () {
          json("api/admin/trade-products", { action: "batch", op: status.value === "disabled" ? "disable" : "enable", ids: [product.id] }).then(function (res) {
            note(res.ok ? "状态已更新。停用的产品不再显示在首页。" : "操作没有完成");
            if (res.ok) load();
          });
        });
        statusWrap.appendChild(status);
        statusCell.appendChild(statusWrap);
        tr.appendChild(statusCell);
        var ops = el("td", "pall-ops");
        var edit = el("button", "pall-edit", open ? "保存" : "编辑");
        edit.type = "button";
        edit.addEventListener("click", function () {
          if (open) saveRow(product, inputs);
          else {
            editing = product.id;
            draw();
          }
        });
        var remove = el("button", "pall-del", "删除");
        remove.type = "button";
        remove.addEventListener("click", function () { runBatch("remove", [product.id]); });
        ops.appendChild(edit);
        ops.appendChild(remove);
        tr.appendChild(ops);
        table.appendChild(tr);
      });
      sheet.appendChild(table);

      var pick = el("label", "pall-all");
      var pickBox = el("input");
      pickBox.type = "checkbox";
      pickBox.checked = slice.length > 0 && slice.every(function (product) { return selected[product.id]; });
      pickBox.addEventListener("change", function () {
        slice.forEach(function (product) { selected[product.id] = pickBox.checked; });
        draw();
      });
      pick.appendChild(pickBox);
      pick.appendChild(document.createTextNode("全选"));
      foot.appendChild(pick);
      [["enable", "批量启用", ""], ["disable", "批量停用", ""], ["remove", "批量删除", " pall-del"]].forEach(function (item) {
        var button = el("button", "review-ghost pall-batch" + item[2], item[1]);
        button.type = "button";
        button.addEventListener("click", function () { runBatch(item[0], chosenIds(rows)); });
        foot.appendChild(button);
      });
      foot.appendChild(el("span", "pall-count", "共 " + rows.length + " 条数据"));
      var pagesBox = el("div", "review-pages");
      var prev = el("button", "review-ghost", "‹");
      prev.type = "button";
      prev.disabled = page <= 1;
      prev.addEventListener("click", function () { page -= 1; draw(); });
      pagesBox.appendChild(prev);
      var marks = pages <= 7 ? null : [1, 2, 3, 4, 5, "…", pages];
      var labels = [];
      if (!marks) {
        for (var n = 1; n <= pages; n++) labels.push(n);
      } else labels = marks;
      labels.forEach(function (label) {
        if (label === "…") {
          pagesBox.appendChild(el("span", "pall-gap", "…"));
          return;
        }
        var button = el("button", "review-ghost" + (label === page ? " is-on" : ""), String(label));
        button.type = "button";
        button.addEventListener("click", function () { page = label; draw(); });
        pagesBox.appendChild(button);
      });
      var next = el("button", "review-ghost", "›");
      next.type = "button";
      next.disabled = page >= pages;
      next.addEventListener("click", function () { page += 1; draw(); });
      pagesBox.appendChild(next);
      foot.appendChild(pagesBox);
      var size = el("select", "desk-input review-size");
      [10, 20, 50].forEach(function (count) {
        var option = el("option", "", count + "条/页");
        option.value = String(count);
        if (count === pageSize) option.selected = true;
        size.appendChild(option);
      });
      size.addEventListener("change", function () {
        pageSize = Number(size.value) || 10;
        page = 1;
        draw();
      });
      foot.appendChild(size);
    }

    queryBtn.addEventListener("click", function () {
      applied.q = search.value;
      applied.category = categoryInput.value;
      applied.status = statusInput.value;
      page = 1;
      draw();
    });
    search.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        queryBtn.click();
      }
    });
    resetBtn.addEventListener("click", function () {
      search.value = "";
      categoryInput.value = "";
      statusInput.value = "";
      applied = { q: "", category: "", status: "" };
      page = 1;
      draw();
    });
    function load() {
      json("api/admin/trade-products").then(function (res) {
        products = res.ok ? (res.data.products || []) : [];
        draw();
      });
    }
    load();
  }

  function stageOf(order) {
    if (order.orderStatus) return order.orderStatus;
    if (serviceOf(order) === "已完成") return "已完成";
    if (payOf(order) !== "已付款") return "待付款";
    if (shipOf(order) === "已发货") return "已发货";
    if (shipOf(order) === "待发货") return "待发货";
    return "待审核";
  }
  function orderName(order) {
    if (order.customerName) return order.customerName;
    return customerName(order);
  }
  function orderPhone(order) {
    if (order.phone) return order.phone;
    var user = state.users.filter(function (item) { return item.id === order.userId; })[0];
    return (user && user.phone) || "";
  }
  function orderPieces(order) {
    return (order.items || []).reduce(function (sum, item) { return sum + (Number(item.qty) || 1); }, 0);
  }
  function orderWhen(value) {
    var date = new Date(value || "");
    if (!isFinite(date.getTime())) return "—";
    function pad(n) { return n < 10 ? "0" + n : String(n); }
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate()) + " " + pad(date.getHours()) + ":" + pad(date.getMinutes());
  }
  function orderAmount(value) {
    var number = Number(value);
    if (!isFinite(number)) number = 0;
    return number.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  function orderProduct(id) {
    return state.products.filter(function (item) { return item.id === id; })[0];
  }
  function imageVersion(slug) {
    if (/^(apple|mango|cinnamon|cotton|cherry|ocean|jasmine|lavender|orange-blossom|coconut|vanilla|rose)-diffuser$/.test(slug)) return "2";
    if (/^(apple|mango|cinnamon|cotton|cherry|ocean|jasmine|lavender|orange-blossom|coconut|vanilla|rose)-diffuser-35$/.test(slug)) return "3";
    if (/^(vanilla|cotton|cherry|cinnamon|rose|mango|lavender|ocean|jasmine|apple|coconut|orange-blossom|strawberry-cream)-cozy$/.test(slug)) return "4";
    if (/^(lavender|cotton|ocean|rose|cherry|jasmine)-refill$/.test(slug)) return "5";
    if (/^(lavender|cotton|ocean|rose|cherry|jasmine)-refill-300$/.test(slug)) return "6";
    if (/^smart-diffuser-(aurora|halo|kitty)$/.test(slug)) return "7";
    if (/^(lavender|cotton|cherry|apple|rose|jasmine|coconut|cinnamon|mango|vanilla|ocean|orange-blossom)-pack$/.test(slug)) return "8";
    if (/^(eucalyptus|agarwood|amber-rose|red-berries|coconut|pinecone|vanilla|sandalwood|gardenia)-wood$/.test(slug)) return "10";
    if (/^(square|star|heart|plum-blossom)-tealight-holder$/.test(slug)) return "11";
    if (/^(passion-fruit-palo-santo|mango-sandalwood|pear-amber|sandalwood-ocean|freesia-amber|lavender-cotton)-diffuser$/.test(slug)) return "12";
    if (/^[a-z]+-zodiac-diffuser$/.test(slug)) return "13";
    if (/-reed-refill$/.test(slug)) return "14";
    if (/-christmas-diffuser$/.test(slug)) return "15";
    if (/-cup-candle$/.test(slug)) return "16";
    return "";
  }
  function freshImage(src) {
    var url = String(src || "");
    var match = url.match(/assets\/products\/([^/?#]+)\.png/);
    if (!match) return url;
    var version = imageVersion(match[1]);
    var clean = url.replace(/\?.*$/, "");
    return version ? clean + "?v=" + version : clean;
  }
    function orderImage(product) {
    if (!product) return "";
    var raw = product.image || "";
    if (!raw && product.images && product.images.length) {
      var first = String(product.images[0] || "");
      raw = first.indexOf("/") === -1 ? "assets/products/" + first + ".png" : first;
    }
    if (!raw) {
      var slug = product.slug || product.id || "";
      if (slug) raw = "assets/products/" + slug + ".png";
    }
    return raw ? freshImage(raw) : "";
  }

  function renderOrders(root) {
    var head = el("div", "pall-head");
    var titles = el("div");
    titles.appendChild(el("h1", "desk__title", "订单管理"));
    titles.appendChild(el("p", "desk__hint", "查看、处理和管理所有订单，支持订单查询、发货、收款和导出。"));
    var add = el("button", "review-pass client-action", "+ 新建订单");
    add.type = "button";
    head.appendChild(titles);
    head.appendChild(add);
    root.appendChild(head);

    var modal = el("form", "ord-modal");
    modal.hidden = true;
    var orderSheet = el("div", "ord-sheet");
    modal.appendChild(orderSheet);
    var sheetHead = el("div", "ord-sheet__head");
    sheetHead.appendChild(el("h2", "", "新增订单"));
    sheetHead.appendChild(el("p", "desk__hint", "添加订单信息，选择产品并填写数量，确认后提交订单。"));
    orderSheet.appendChild(sheetHead);
    var formError = el("p", "ord-error");
    formError.hidden = true;
    orderSheet.appendChild(formError);

    function svgIcon(path) {
      var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("aria-hidden", "true");
      var shape = document.createElementNS("http://www.w3.org/2000/svg", "path");
      shape.setAttribute("d", path);
      shape.setAttribute("fill", "none");
      shape.setAttribute("stroke", "currentColor");
      shape.setAttribute("stroke-width", "1.7");
      shape.setAttribute("stroke-linecap", "round");
      shape.setAttribute("stroke-linejoin", "round");
      svg.appendChild(shape);
      return svg;
    }
    var iconUser = "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8";
    var iconPhone = "M22 16.9v2a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h2a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L7.1 9.9a16 16 0 0 0 6 6l1.5-1.1a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2z";
    var iconPin = "M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11zM12 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z";
    var iconCity = "M3 21h18M6 21V5l6-2 6 2v16M10 9h.01M14 9h.01M10 13h.01M14 13h.01M10 17h4";
    var iconMail = "M4 6h16v12H4zM4 6l8 7 8-7";
    var iconBox = "M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8";
    var iconNote = "M8 3h7l5 5v13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM15 3v6h6";
    var iconCoin = "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM9 9.5c.4-1 1.5-1.5 3-1.5s2.5.6 2.5 1.7S13.4 11.5 12 12s-2.6.7-2.6 1.8S10.6 16 12 16s2.6-.5 3-1.5M12 6.5V8M12 16v1.5";
    var iconInfo = "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h.01";
    var iconSearch = "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3";
    var iconTrash = "M4 7h16M9 7V5h6v2M8 7l1 13h6l1-13";

    function cardTitle(text, path) {
      var title = el("h2", "ord-card__title");
      var mark = el("span", "ord-ico");
      mark.appendChild(svgIcon(path));
      title.appendChild(mark);
      title.appendChild(document.createTextNode(text));
      return title;
    }
    function field(parent, label, input, required, path, span) {
      var box = el("label", "ord-field" + (span ? " ord-span-" + span : ""));
      var title = el("span", "", label);
      if (required) title.appendChild(el("i", "signup-req", " *"));
      box.appendChild(title);
      var wrap = el("div", "ord-input");
      if (path) {
        var mark = el("span", "ord-input__ico");
        mark.appendChild(svgIcon(path));
        wrap.appendChild(mark);
        input.classList.add("has-ico");
      }
      wrap.appendChild(input);
      box.appendChild(wrap);
      parent.appendChild(box);
      return input;
    }
    function selectBlank(holder, text) {
      var option = el("option", "", text);
      option.value = "";
      holder.appendChild(option);
    }

    var customerCard = el("section", "ord-card");
    customerCard.appendChild(cardTitle("客户信息", iconUser));
    var customerGrid = el("div", "ord-grid");
    customerCard.appendChild(customerGrid);
    var typeInput = el("select", "desk-input");
    selectBlank(typeInput, "请选择客户类型");
    ["客户", "经销商"].forEach(function (name) {
      var option = el("option", "", name);
      option.value = name;
      typeInput.appendChild(option);
    });
    field(customerGrid, "客户类型", typeInput, true, iconUser);
    var nameInput = el("input", "desk-input");
    nameInput.maxLength = 40;
    nameInput.placeholder = "请选择或输入客户名称";
    nameInput.autocomplete = "off";
    field(customerGrid, "客户名称", nameInput, true, iconSearch);
    var nameMenu = el("div", "ord-combo");
    nameMenu.hidden = true;
    nameInput.parentNode.appendChild(nameMenu);
    var contactInput = el("input", "desk-input");
    contactInput.maxLength = 20;
    contactInput.placeholder = "请输入联系电话";
    field(customerGrid, "联系电话", contactInput, false, iconPhone);
    var receiverInput = el("input", "desk-input");
    receiverInput.maxLength = 40;
    receiverInput.placeholder = "请输入收货人姓名";
    field(customerGrid, "收货人", receiverInput, true, iconUser);
    var receiverPhone = el("input", "desk-input");
    receiverPhone.maxLength = 20;
    receiverPhone.placeholder = "请输入收货人电话";
    field(customerGrid, "联系电话", receiverPhone, true, iconPhone);
    var countryInput = el("select", "desk-input");
    selectBlank(countryInput, "请选择国家/地区");
    var countries = [
      ["CN", "中国大陆"], ["HK", "中国香港"], ["MO", "中国澳门"], ["TW", "中国台湾"],
      ["US", "美国"], ["CA", "加拿大"], ["GB", "英国"], ["AU", "澳大利亚"], ["NZ", "新西兰"],
      ["JP", "日本"], ["KR", "韩国"], ["SG", "新加坡"], ["MY", "马来西亚"], ["TH", "泰国"],
      ["VN", "越南"], ["ID", "印度尼西亚"], ["PH", "菲律宾"], ["IN", "印度"], ["AE", "阿联酋"],
      ["SA", "沙特阿拉伯"], ["DE", "德国"], ["FR", "法国"], ["IT", "意大利"], ["ES", "西班牙"],
      ["PT", "葡萄牙"], ["NL", "荷兰"], ["BE", "比利时"], ["CH", "瑞士"], ["SE", "瑞典"],
      ["NO", "挪威"], ["DK", "丹麦"], ["FI", "芬兰"], ["IE", "爱尔兰"], ["RU", "俄罗斯"],
      ["BR", "巴西"], ["MX", "墨西哥"], ["AR", "阿根廷"], ["ZA", "南非"], ["TR", "土耳其"], ["EG", "埃及"]
    ];
    countries.forEach(function (item) {
      var option = el("option", "", item[1]);
      option.value = item[1];
      countryInput.appendChild(option);
    });
    field(customerGrid, "国家/地区", countryInput, true, iconPin);
    var cityInput = el("input", "desk-input");
    cityInput.maxLength = 40;
    cityInput.placeholder = "请输入城市";
    field(customerGrid, "城市", cityInput, false, iconCity);
    var addressInput = el("input", "desk-input");
    addressInput.maxLength = 200;
    addressInput.placeholder = "请输入详细地址";
    field(customerGrid, "详细地址", addressInput, true, iconPin, 3);
    var postcodeInput = el("input", "desk-input");
    postcodeInput.maxLength = 20;
    postcodeInput.placeholder = "请输入邮编";
    field(customerGrid, "邮编", postcodeInput, false, iconMail);
    orderSheet.appendChild(customerCard);

    var productCard = el("section", "ord-card");
    var productHead = el("div", "ord-products-head");
    productHead.appendChild(cardTitle("订单产品", iconBox));
    var productTools = el("div", "ord-products-tools");
    var lineSearchWrap = el("div", "ord-input");
    var lineSearchIco = el("span", "ord-input__ico");
    lineSearchIco.appendChild(svgIcon(iconSearch));
    var lineSearch = el("input", "desk-input has-ico");
    lineSearch.type = "search";
    lineSearch.placeholder = "搜索货号 / 产品名称 / 香味";
    lineSearchWrap.appendChild(lineSearchIco);
    lineSearchWrap.appendChild(lineSearch);
    var addProduct = el("button", "review-pass", "+ 添加产品");
    addProduct.type = "button";
    productTools.appendChild(lineSearchWrap);
    productTools.appendChild(addProduct);
    productHead.appendChild(productTools);
    productCard.appendChild(productHead);
    var lineWrap = el("div", "ord-table-wrap");
    var lineTable = el("table", "desk-table pall-table ord-table");
    lineWrap.appendChild(lineTable);
    productCard.appendChild(lineWrap);
    orderSheet.appendChild(productCard);

    var bottom = el("div", "ord-bottom");
    var noteCard = el("section", "ord-card");
    noteCard.appendChild(cardTitle("订单备注", iconNote));
    var noteWrap = el("div", "ord-note");
    var noteInput = el("textarea", "desk-input");
    noteInput.maxLength = 500;
    noteInput.placeholder = "请输入订单备注信息（如特殊要求、发货时间等）";
    var noteCount = el("span", "ord-count", "0/500");
    noteWrap.appendChild(noteInput);
    noteWrap.appendChild(noteCount);
    noteCard.appendChild(noteWrap);
    var moneyCard = el("section", "ord-card");
    moneyCard.appendChild(cardTitle("订单金额", iconCoin));
    var moneyBox = el("div", "ord-money");
    function moneyRow(label, node, due) {
      moneyBox.appendChild(el("span", due ? "ord-due-label" : "", label));
      moneyBox.appendChild(node);
    }
    var goodsText = el("strong", "", "¥ 0.00");
    var freightInput = el("input", "desk-input");
    freightInput.type = "number";
    freightInput.min = "0";
    freightInput.step = "0.01";
    freightInput.value = "0.00";
    var discountInput = el("input", "desk-input");
    discountInput.type = "number";
    discountInput.min = "0";
    discountInput.step = "0.01";
    discountInput.value = "0.00";
    var dueText = el("strong", "ord-due", "¥ 0.00");
    moneyRow("商品总金额", goodsText, false);
    moneyRow("运费", freightInput, false);
    moneyRow("优惠金额", discountInput, false);
    moneyRow("应付金额", dueText, true);
    moneyCard.appendChild(moneyBox);
    var extraCard = el("section", "ord-card");
    extraCard.appendChild(cardTitle("其他信息", iconInfo));
    var extraGrid = el("div", "ord-extra");
    var sourceInput = el("select", "desk-input");
    selectBlank(sourceInput, "请选择订单来源");
    ["官网", "电话", "邮件", "展会", "线下", "其他"].forEach(function (name) {
      var option = el("option", "", name);
      option.value = name;
      sourceInput.appendChild(option);
    });
    field(extraGrid, "订单来源", sourceInput, false, "");
    var whenInput = el("input", "desk-input");
    whenInput.type = "datetime-local";
    field(extraGrid, "下单时间", whenInput, false, "");
    var shipInput = el("input", "desk-input");
    shipInput.type = "date";
    field(extraGrid, "预计发货时间", shipInput, false, "");
    extraCard.appendChild(extraGrid);
    bottom.appendChild(noteCard);
    bottom.appendChild(moneyCard);
    bottom.appendChild(extraCard);
    orderSheet.appendChild(bottom);

    var formBar = el("div", "ord-bar");
    var formCancel = el("button", "review-ghost", "取消");
    formCancel.type = "button";
    var formSave = el("button", "review-pass", "提交订单");
    formSave.type = "submit";
    formBar.appendChild(formCancel);
    formBar.appendChild(formSave);
    orderSheet.appendChild(formBar);
    root.appendChild(modal);

    var picker = el("div", "ord-picker");
    picker.hidden = true;
    var pickerCard = el("div", "ord-picker__card");
    pickerCard.appendChild(el("h2", "", "添加产品"));
    var pickSearch = el("input", "desk-input");
    pickSearch.type = "search";
    pickSearch.placeholder = "搜索货号 / 产品名称 / 香味";
    pickerCard.appendChild(pickSearch);
    var pickList = el("div", "ord-picker__list");
    pickerCard.appendChild(pickList);
    var pickClose = el("button", "review-ghost", "关闭");
    pickClose.type = "button";
    pickerCard.appendChild(pickClose);
    picker.appendChild(pickerCard);
    modal.appendChild(picker);

    var lines = [];
    var lineChecks = {};
    var catalogRows = [];
    var pickedUser = "";
    function findProduct(id) {
      return catalogRows.filter(function (item) { return item.id === id; })[0] || orderProduct(id);
    }
    function linePrice(id) {
      var product = findProduct(id);
      var price = product ? Number(product.price) : 0;
      return isFinite(price) ? price : 0;
    }
    function goodsSum() {
      return lines.reduce(function (sum, line) { return sum + linePrice(line.id) * line.qty; }, 0);
    }
    function dueSum() {
      var freight = Math.max(0, Number(freightInput.value) || 0);
      var discount = Math.max(0, Number(discountInput.value) || 0);
      return Math.max(0, goodsSum() + freight - discount);
    }
    function paintMoney() {
      goodsText.textContent = "¥ " + orderAmount(goodsSum());
      dueText.textContent = "¥ " + orderAmount(dueSum());
    }
    function showError(text) {
      formError.hidden = !text;
      formError.textContent = text || "";
    }
    function stampNow() {
      var date = new Date();
      function pad(n) { return n < 10 ? "0" + n : String(n); }
      return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate()) + "T" + pad(date.getHours()) + ":" + pad(date.getMinutes());
    }
    function paintLines() {
      clear(lineTable);
      var headRow = el("tr");
      var checkHead = el("th");
      var shown = lines.filter(function (line) {
        var q = lineSearch.value.trim().toLowerCase();
        if (!q) return true;
        var product = findProduct(line.id) || {};
        var blob = [product.sku, product.name, product.barcode, line.id].join(" ").toLowerCase();
        return blob.indexOf(q) !== -1;
      });
      var checkAll = el("input");
      checkAll.type = "checkbox";
      checkAll.checked = shown.length > 0 && shown.every(function (line) { return lineChecks[line.id]; });
      checkAll.addEventListener("change", function () {
        shown.forEach(function (line) { lineChecks[line.id] = checkAll.checked; });
        paintLines();
      });
      checkHead.appendChild(checkAll);
      headRow.appendChild(checkHead);
      ["序号", "图片", "货号", "产品名称", "香味", "规格/尺寸", "中包数", "装箱数", "单价 (¥)", "数量", "小计 (¥)", "操作"].forEach(function (label) {
        headRow.appendChild(el("th", "", label));
      });
      lineTable.appendChild(headRow);
      if (!shown.length) {
        var empty = el("tr");
        var emptyCell = el("td", "desk__hint", lines.length ? "没有匹配的产品" : "请添加产品");
        emptyCell.colSpan = 13;
        empty.appendChild(emptyCell);
        lineTable.appendChild(empty);
      }
      shown.forEach(function (line) {
        var product = findProduct(line.id) || {};
        var index = lines.indexOf(line);
        var tr = el("tr");
        var checkCell = el("td");
        var check = el("input");
        check.type = "checkbox";
        check.checked = !!lineChecks[line.id];
        check.addEventListener("change", function () { lineChecks[line.id] = check.checked; });
        checkCell.appendChild(check);
        tr.appendChild(checkCell);
        tr.appendChild(el("td", "", String(index + 1)));
        var photo = el("td");
        if (product.image) {
          var img = el("img", "ord-photo");
          img.alt = "";
          img.src = freshImage(product.image);
          photo.appendChild(img);
        }
        tr.appendChild(photo);
        tr.appendChild(el("td", "", product.sku || line.id || "—"));
        tr.appendChild(el("td", "", product.name || "—"));
        tr.appendChild(el("td", "", product.barcode || "—"));
        tr.appendChild(el("td", "", product.size || "—"));
        tr.appendChild(el("td", "", product.innerPack || "—"));
        tr.appendChild(el("td", "", product.carton || "—"));
        tr.appendChild(el("td", "", orderAmount(linePrice(line.id))));
        var qtyCell = el("td");
        var qtyBox = el("div", "ord-qty");
        var minus = el("button", "", "−");
        minus.type = "button";
        var qty = el("input");
        qty.type = "number";
        qty.min = "1";
        qty.max = "9999";
        qty.value = String(line.qty);
        var plus = el("button", "", "+");
        plus.type = "button";
        function setQty(value) {
          line.qty = Math.max(1, Math.min(9999, parseInt(value, 10) || 1));
          qty.value = String(line.qty);
          paintMoney();
          var sub = tr.querySelector(".ord-sub");
          if (sub) sub.textContent = orderAmount(linePrice(line.id) * line.qty);
        }
        minus.addEventListener("click", function () { setQty(line.qty - 1); });
        plus.addEventListener("click", function () { setQty(line.qty + 1); });
        qty.addEventListener("change", function () { setQty(qty.value); });
        qtyBox.appendChild(minus);
        qtyBox.appendChild(qty);
        qtyBox.appendChild(plus);
        qtyCell.appendChild(qtyBox);
        tr.appendChild(qtyCell);
        tr.appendChild(el("td", "ord-sub", orderAmount(linePrice(line.id) * line.qty)));
        var ops = el("td");
        var remove = el("button", "ord-trash");
        remove.type = "button";
        remove.setAttribute("aria-label", "删除");
        remove.appendChild(svgIcon(iconTrash));
        remove.addEventListener("click", function () {
          lines.splice(index, 1);
          paintLines();
        });
        ops.appendChild(remove);
        tr.appendChild(ops);
        lineTable.appendChild(tr);
      });
      paintMoney();
    }
    function paintPicker() {
      clear(pickList);
      var q = pickSearch.value.trim().toLowerCase();
      var rows = catalogRows.filter(function (product) {
        if (product.status === "disabled") return false;
        if (!q) return true;
        return [product.sku, product.name, product.barcode, product.id].join(" ").toLowerCase().indexOf(q) !== -1;
      }).slice(0, 40);
      if (!rows.length) {
        pickList.appendChild(el("p", "desk__hint", catalogRows.length ? "没有匹配的产品" : "产品列表还没有载入"));
        return;
      }
      rows.forEach(function (product) {
        var row = el("button", "ord-picker__row", "");
        row.type = "button";
        if (product.image) {
          var img = el("img");
          img.alt = "";
          img.src = freshImage(product.image);
          row.appendChild(img);
        }
        var text = el("span");
        text.appendChild(el("strong", "", product.name || product.id));
        text.appendChild(el("small", "", (product.sku || product.id) + (product.barcode ? " · " + product.barcode : "")));
        row.appendChild(text);
        row.appendChild(el("em", "", "¥ " + orderAmount(Number(product.price) || 0)));
        row.addEventListener("click", function () {
          var found = lines.filter(function (line) { return line.id === product.id; })[0];
          if (found) found.qty = Math.min(9999, found.qty + 1);
          else lines.push({ id: product.id, qty: 1 });
          picker.hidden = true;
          paintLines();
        });
        pickList.appendChild(row);
      });
    }
    function loadCatalog() {
      if (catalogRows.length) return;
      json("api/admin/trade-products").then(function (res) {
        catalogRows = res.ok ? (res.data.products || []) : [];
        paintLines();
        if (!picker.hidden) paintPicker();
      });
    }
    function countryLabel(code) {
      var hit = countries.filter(function (item) { return item[0] === code || item[1] === code; })[0];
      return hit ? hit[1] : "";
    }
    function showCustomers() {
      clear(nameMenu);
      var q = nameInput.value.trim().toLowerCase();
      var people = state.users.filter(function (user) {
        if (!q) return true;
        return [user.name, user.username, user.phone, user.company].join(" ").toLowerCase().indexOf(q) !== -1;
      }).slice(0, 8);
      if (!people.length) {
        nameMenu.hidden = true;
        return;
      }
      people.forEach(function (user) {
        var button = el("button", "", (user.name || user.username || "客户") + (user.phone ? " · " + user.phone : ""));
        button.type = "button";
        button.addEventListener("click", function () {
          pickedUser = user.id || "";
          nameInput.value = user.name || user.username || "";
          if (user.phone && !contactInput.value) contactInput.value = user.phone;
          if (user.phone && !receiverPhone.value) receiverPhone.value = user.phone;
          if ((user.name || user.username) && !receiverInput.value) receiverInput.value = user.name || user.username || "";
          var place = countryLabel(user.country);
          if (place && !countryInput.value) countryInput.value = place;
          if (user.address && !addressInput.value) addressInput.value = user.address;
          nameMenu.hidden = true;
        });
        nameMenu.appendChild(button);
      });
      nameMenu.hidden = false;
    }
    function resetForm() {
      showError("");
      pickedUser = "";
      lines = [];
      lineChecks = {};
      typeInput.value = "";
      nameInput.value = "";
      contactInput.value = "";
      receiverInput.value = "";
      receiverPhone.value = "";
      countryInput.value = "";
      cityInput.value = "";
      addressInput.value = "";
      postcodeInput.value = "";
      noteInput.value = "";
      noteCount.textContent = "0/500";
      freightInput.value = "0.00";
      discountInput.value = "0.00";
      sourceInput.value = "";
      whenInput.value = stampNow();
      shipInput.value = "";
      lineSearch.value = "";
      pickSearch.value = "";
      nameMenu.hidden = true;
      picker.hidden = true;
      paintLines();
    }
    nameInput.addEventListener("input", function () {
      pickedUser = "";
      showCustomers();
    });
    nameInput.addEventListener("focus", showCustomers);
    noteInput.addEventListener("input", function () {
      noteCount.textContent = noteInput.value.length + "/500";
    });
    lineSearch.addEventListener("input", paintLines);
    lineSearch.addEventListener("keydown", function (event) {
      if (event.key === "Enter") event.preventDefault();
    });
    freightInput.addEventListener("input", paintMoney);
    discountInput.addEventListener("input", paintMoney);
    addProduct.addEventListener("click", function () {
      pickSearch.value = lineSearch.value.trim();
      picker.hidden = false;
      paintPicker();
      pickSearch.focus();
    });
    pickSearch.addEventListener("input", paintPicker);
    pickSearch.addEventListener("keydown", function (event) {
      if (event.key === "Enter") event.preventDefault();
    });
    pickClose.addEventListener("click", function () { picker.hidden = true; });
    add.addEventListener("click", function () {
      resetForm();
      modal.hidden = false;
      loadCatalog();
      nameInput.focus();
    });
    formCancel.addEventListener("click", function () {
      modal.hidden = true;
      picker.hidden = true;
    });
    modal.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!typeInput.value) return showError("请选择客户类型");
      if (!nameInput.value.trim()) return showError("请填写客户名称");
      if (!receiverInput.value.trim()) return showError("请填写收货人");
      if (!receiverPhone.value.trim()) return showError("请填写收货人电话");
      if (!countryInput.value) return showError("请选择国家/地区");
      if (!addressInput.value.trim()) return showError("请填写详细地址");
      if (!lines.length) return showError("请添加产品");
      showError("");
      formSave.disabled = true;
      json("api/admin/desk", {
        action: "order-create",
        customerName: nameInput.value.trim(),
        customerType: typeInput.value,
        contactPhone: contactInput.value.trim(),
        phone: receiverPhone.value.trim(),
        receiver: receiverInput.value.trim(),
        country: countryInput.value,
        city: cityInput.value.trim(),
        address: addressInput.value.trim(),
        postcode: postcodeInput.value.trim(),
        note: noteInput.value.trim(),
        source: sourceInput.value,
        freight: freightInput.value,
        discount: discountInput.value,
        shipDate: shipInput.value,
        createdAt: whenInput.value,
        userId: pickedUser,
        payStatus: "未付款",
        items: lines.map(function (line) { return { id: line.id, qty: line.qty }; }),
      }).then(function (res) {
        formSave.disabled = false;
        if (!res.ok) {
          showError("订单没有提交，请检查客户和产品");
          return;
        }
        modal.hidden = true;
        note("已新建订单。");
        refresh();
      });
    });
    var filters = el("section", "desk-card pall-filters ord-filters");
    var search = el("input", "desk-input desk-search");
    search.type = "search";
    search.placeholder = "搜索订单号 / 客户名称 / 联系电话";
    function labeled(title, node) {
      var box = el("label", "ord-filter");
      box.appendChild(el("span", "", title));
      box.appendChild(node);
      filters.appendChild(box);
      return node;
    }
    filters.appendChild(search);
    var statusInput = labeled("订单状态", el("select", "desk-input pall-select"));
    [["", "全部状态"], ["待付款", "待付款"], ["待审核", "待审核"], ["待发货", "待发货"], ["已发货", "已发货"], ["已完成", "已完成"], ["已取消", "已取消"]].forEach(function (item) {
      var option = el("option", "", item[1]);
      option.value = item[0];
      statusInput.appendChild(option);
    });
    var payInput = labeled("支付状态", el("select", "desk-input pall-select"));
    [["", "全部支付状态"], ["paid", "已支付"], ["unpaid", "未支付"]].forEach(function (item) {
      var option = el("option", "", item[1]);
      option.value = item[0];
      payInput.appendChild(option);
    });
    var dates = el("div", "ord-dates");
    var startInput = el("input", "desk-input");
    startInput.type = "date";
    var endInput = el("input", "desk-input");
    endInput.type = "date";
    dates.appendChild(startInput);
    dates.appendChild(el("span", "", "-"));
    dates.appendChild(endInput);
    labeled("下单时间", dates);
    var queryBtn = el("button", "review-pass pall-query", "查询");
    queryBtn.type = "button";
    var resetBtn = el("button", "review-ghost pall-reset", "重置");
    resetBtn.type = "button";
    filters.appendChild(queryBtn);
    filters.appendChild(resetBtn);
    root.appendChild(filters);

    var tabs = el("div", "ord-tabs");
    var message = el("div");
    var sheet = el("div", "desk-sheet");
    var foot = el("div", "pall-foot");
    root.appendChild(tabs);
    root.appendChild(message);
    root.appendChild(sheet);
    root.appendChild(foot);

    var orders = state.orders.slice();
    var applied = { q: "", status: "", pay: "", start: "", end: "" };
    var tab = "all";
    var page = 1;
    var pageSize = 10;
    var selected = {};
    var openId = "";
    var openMode = "";

    function note(text) {
      clear(message);
      message.appendChild(el("p", "desk__hint", text));
    }
    function inDate(order) {
      var time = Date.parse(order.createdAt || "");
      if (applied.start) {
        var start = new Date(applied.start + "T00:00:00").getTime();
        if (!time || time < start) return false;
      }
      if (applied.end) {
        var end = new Date(applied.end + "T23:59:59").getTime();
        if (!time || time > end) return false;
      }
      return true;
    }
    function baseRows() {
      var q = applied.q.trim().toLowerCase();
      return orders.filter(function (order) {
        if (q) {
          var blob = [order.id, orderName(order), orderPhone(order)].join(" ").toLowerCase();
          if (blob.indexOf(q) === -1) return false;
        }
        if (applied.pay === "paid" && payOf(order) !== "已付款") return false;
        if (applied.pay === "unpaid" && payOf(order) === "已付款") return false;
        return inDate(order);
      });
    }
    function stageRows(list, status) {
      return list.filter(function (order) { return stageOf(order) === status; });
    }
    function refresh() {
      return loadAll().then(function () {
        orders = state.orders.slice();
        draw();
      });
    }
    function setStage(ids, status) {
      if (!ids.length) {
        note("请先选择订单");
        return;
      }
      var body = ids.length === 1
        ? { action: "order", id: ids[0], orderStatus: status }
        : { action: "order-batch", ids: ids, orderStatus: status };
      json("api/admin/desk", body).then(function (res) {
        note(res.ok ? "已更新。" : "操作没有完成");
        if (res.ok) refresh();
      });
    }
    function again(order) {
      json("api/admin/desk", {
        action: "order-create",
        customerName: orderName(order),
        phone: orderPhone(order),
        payStatus: "未付款",
        items: (order.items || []).map(function (item) { return { id: item.id, qty: item.qty }; }),
      }).then(function (res) {
        note(res.ok ? "已再次下单。" : "再次下单没有完成");
        if (res.ok) refresh();
      });
    }

    function draw() {
      clear(tabs);
      clear(sheet);
      clear(foot);
      var base = baseRows();
      var stages = ["待付款", "待审核", "待发货", "已发货", "已完成", "已取消"];
      [["all", "全部订单", base.length]].concat(stages.map(function (name) {
        return [name, name, stageRows(base, name).length];
      })).forEach(function (item) {
        var button = el("button", "ord-tab" + ((applied.status || tab) === item[0] || (item[0] === "all" && !applied.status && tab === "all") ? " is-on" : ""), item[1] + " (" + item[2] + ")");
        if (item[0] !== "all" && applied.status === item[0]) button.className = "ord-tab is-on";
        if (item[0] === "all" && !applied.status && tab === "all") button.className = "ord-tab is-on";
        if (item[0] !== "all" && !applied.status && tab === item[0]) button.className = "ord-tab is-on";
        button.type = "button";
        button.addEventListener("click", function () {
          tab = item[0];
          applied.status = item[0] === "all" ? "" : item[0];
          statusInput.value = applied.status;
          page = 1;
          draw();
        });
        tabs.appendChild(button);
      });
      var rows = applied.status ? stageRows(base, applied.status) : base;
      var pages = Math.max(1, Math.ceil(rows.length / pageSize));
      if (page > pages) page = pages;
      var slice = rows.slice((page - 1) * pageSize, page * pageSize);
      var table = el("table", "desk-table pall-table");
      var headRow = el("tr");
      var checkHead = el("th");
      var checkAll = el("input");
      checkAll.type = "checkbox";
      checkAll.checked = slice.length > 0 && slice.every(function (order) { return selected[order.id]; });
      checkAll.addEventListener("change", function () {
        slice.forEach(function (order) { selected[order.id] = checkAll.checked; });
        draw();
      });
      checkHead.appendChild(checkAll);
      headRow.appendChild(checkHead);
      ["订单号", "下单时间", "客户信息", "产品信息", "金额 (¥)", "支付状态", "订单状态", "操作"].forEach(function (label) {
        headRow.appendChild(el("th", "", label));
      });
      table.appendChild(headRow);
      if (!slice.length) {
        var empty = el("tr");
        var emptyCell = el("td", "desk__hint", orders.length ? "没有匹配的订单" : "还没有订单");
        emptyCell.colSpan = 9;
        empty.appendChild(emptyCell);
        table.appendChild(empty);
      }
      slice.forEach(function (order) {
        var stage = stageOf(order);
        var tr = el("tr");
        var checkCell = el("td");
        var check = el("input");
        check.type = "checkbox";
        check.checked = !!selected[order.id];
        check.addEventListener("change", function () {
          selected[order.id] = check.checked;
          draw();
        });
        checkCell.appendChild(check);
        tr.appendChild(checkCell);
        tr.appendChild(el("td", "", order.id || "—"));
        tr.appendChild(el("td", "", orderWhen(order.createdAt)));
        var who = el("td", "ord-customer");
        who.appendChild(el("strong", "", orderName(order)));
        who.appendChild(el("small", "", orderPhone(order) || "—"));
        tr.appendChild(who);
        var goods = el("td");
        var pics = el("div", "ord-products");
        (order.items || []).slice(0, 3).forEach(function (item) {
          var src = orderImage(orderProduct(item.id));
          if (!src) return;
          var img = el("img");
          img.alt = "";
          img.src = src;
          pics.appendChild(img);
        });
        pics.appendChild(el("span", "", "共 " + (orderPieces(order) || 0) + " 件"));
        goods.appendChild(pics);
        tr.appendChild(goods);
        tr.appendChild(el("td", "", orderAmount(order.total)));
        tr.appendChild(el("td", "", "")).appendChild(el("span", "ord-pay" + (payOf(order) === "已付款" ? " is-paid" : ""), payOf(order) === "已付款" ? "已支付" : "未支付"));
        tr.appendChild(el("td", "", "")).appendChild(el("span", "ord-stage ord-stage--" + stage, stage));
        var ops = el("td", "ord-ops");
        function opButton(label, className, run) {
          var button = el("button", className, label);
          button.type = "button";
          button.addEventListener("click", run);
          ops.appendChild(button);
        }
        opButton("详情", "pall-edit", function () {
          openId = openId === order.id && openMode === "detail" ? "" : order.id;
          openMode = openId ? "detail" : "";
          draw();
        });
        if (stage === "待审核") opButton("审核", "pall-edit", function () { setStage([order.id], "待发货"); });
        if (stage === "待发货") opButton("发货", "pall-edit", function () { setStage([order.id], "已发货"); });
        if (stage === "待付款") opButton("催付", "pall-edit", function () {
          json("api/admin/desk", { action: "order", id: order.id, urge: true }).then(function (res) {
            note(res.ok ? "已记录催付。" : "操作没有完成");
          });
        });
        if (stage === "已发货") opButton("物流", "pall-edit", function () {
          openId = openId === order.id && openMode === "track" ? "" : order.id;
          openMode = openId ? "track" : "";
          draw();
        });
        if (stage === "已发货") opButton("完成", "ord-done", function () { setStage([order.id], "已完成"); });
        if (stage === "待审核" || stage === "待发货" || stage === "待付款") opButton("取消", "pall-del", function () { setStage([order.id], "已取消"); });
        if (stage === "已完成" || stage === "已取消") opButton("再次下单", "pall-edit", function () { again(order); });
        tr.appendChild(ops);
        table.appendChild(tr);
        if (openId === order.id) {
          var detail = el("tr");
          var cell = el("td", "desk-staff");
          cell.colSpan = 9;
          if (openMode === "track") {
            cell.appendChild(el("p", "", order.tracking ? "物流单号　" + order.tracking : "还没有物流信息"));
            var track = el("input", "desk-input");
            track.placeholder = "物流单号";
            track.maxLength = 80;
            track.value = order.tracking || "";
            var saveTrack = el("button", "pall-edit", "保存");
            saveTrack.type = "button";
            saveTrack.addEventListener("click", function () {
              json("api/admin/desk", { action: "order", id: order.id, tracking: track.value }).then(function (res) {
                note(res.ok ? "物流已保存。" : "保存没有完成");
                if (res.ok) refresh();
              });
            });
            cell.appendChild(track);
            cell.appendChild(saveTrack);
          } else {
            cell.appendChild(el("p", "", "订单号　" + (order.id || "—")));
            cell.appendChild(el("p", "", "下单时间　" + orderWhen(order.createdAt)));
            cell.appendChild(el("p", "", "客户　" + orderName(order)));
            cell.appendChild(el("p", "", "电话　" + (orderPhone(order) || "—")));
            if (order.receiver) cell.appendChild(el("p", "", "收货人　" + order.receiver));
            if (orderAddress(order)) cell.appendChild(el("p", "", "地址　" + orderAddress(order)));
            if (order.note) cell.appendChild(el("p", "", "备注　" + order.note));
            (order.items || []).forEach(function (item) {
              var product = orderProduct(item.id);
              cell.appendChild(el("p", "", (product && product.name || item.id) + " × " + (item.qty || 1)));
            });
            cell.appendChild(el("p", "", "金额　" + orderAmount(order.total)));
            cell.appendChild(el("p", "", "支付　" + (payOf(order) === "已付款" ? "已支付" : "未支付")));
            cell.appendChild(el("p", "", "状态　" + stage));
          }
          detail.appendChild(cell);
          table.appendChild(detail);
        }
      });
      sheet.appendChild(table);

      var pick = el("label", "pall-all");
      var pickBox = el("input");
      pickBox.type = "checkbox";
      pickBox.checked = slice.length > 0 && slice.every(function (order) { return selected[order.id]; });
      pickBox.addEventListener("change", function () {
        slice.forEach(function (order) { selected[order.id] = pickBox.checked; });
        draw();
      });
      pick.appendChild(pickBox);
      pick.appendChild(document.createTextNode("全选"));
      foot.appendChild(pick);
      [["已发货", "批量发货", ""], ["已完成", "批量完成", ""], ["已取消", "批量取消", " pall-del"]].forEach(function (item) {
        var button = el("button", "review-ghost pall-batch" + item[2], item[1]);
        button.type = "button";
        button.addEventListener("click", function () {
          setStage(rows.filter(function (order) { return selected[order.id]; }).map(function (order) { return order.id; }), item[0]);
        });
        foot.appendChild(button);
      });
      var exportBtn = el("button", "review-ghost pall-batch", "导出订单");
      exportBtn.type = "button";
      exportBtn.addEventListener("click", function () {
        var csv = ["订单号,下单时间,客户,电话,件数,金额,支付状态,订单状态"];
        rows.forEach(function (order) {
          csv.push([order.id, orderWhen(order.createdAt), orderName(order), orderPhone(order), orderPieces(order), orderAmount(order.total), payOf(order) === "已付款" ? "已支付" : "未支付", stageOf(order)].join(","));
        });
        var file = new Blob(["\uFEFF" + csv.join("\n")], { type: "text/csv;charset=utf-8" });
        var link = el("a");
        link.href = URL.createObjectURL(file);
        link.download = "orders.csv";
        link.click();
      });
      foot.appendChild(exportBtn);
      foot.appendChild(el("span", "pall-count", "共 " + rows.length + " 条数据"));
      var pagesBox = el("div", "review-pages");
      var prev = el("button", "review-ghost", "‹");
      prev.type = "button";
      prev.disabled = page <= 1;
      prev.addEventListener("click", function () { page -= 1; draw(); });
      pagesBox.appendChild(prev);
      var labels = [];
      if (pages <= 7) {
        for (var n = 1; n <= pages; n++) labels.push(n);
      } else labels = [1, 2, 3, 4, 5, "…", pages];
      labels.forEach(function (label) {
        if (label === "…") {
          pagesBox.appendChild(el("span", "pall-gap", "…"));
          return;
        }
        var button = el("button", "review-ghost" + (label === page ? " is-on" : ""), String(label));
        button.type = "button";
        button.addEventListener("click", function () { page = label; draw(); });
        pagesBox.appendChild(button);
      });
      var next = el("button", "review-ghost", "›");
      next.type = "button";
      next.disabled = page >= pages;
      next.addEventListener("click", function () { page += 1; draw(); });
      pagesBox.appendChild(next);
      foot.appendChild(pagesBox);
      var size = el("select", "desk-input review-size");
      [10, 20, 50].forEach(function (count) {
        var option = el("option", "", count + "条/页");
        option.value = String(count);
        if (count === pageSize) option.selected = true;
        size.appendChild(option);
      });
      size.addEventListener("change", function () {
        pageSize = Number(size.value) || 10;
        page = 1;
        draw();
      });
      foot.appendChild(size);
    }

    queryBtn.addEventListener("click", function () {
      applied.q = search.value;
      applied.status = statusInput.value;
      applied.pay = payInput.value;
      applied.start = startInput.value;
      applied.end = endInput.value;
      tab = applied.status || "all";
      page = 1;
      draw();
    });
    search.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        queryBtn.click();
      }
    });
    resetBtn.addEventListener("click", function () {
      search.value = "";
      statusInput.value = "";
      payInput.value = "";
      startInput.value = "";
      endInput.value = "";
      applied = { q: "", status: "", pay: "", start: "", end: "" };
      tab = "all";
      page = 1;
      draw();
    });
    paintLines();
    draw();
  }

  function shipFlow(order) {
    if (order.shipStage) return order.shipStage;
    var stage = stageOf(order);
    if (stage === "已取消") return "已关闭";
    if (stage === "已完成") return "已签收";
    if (stage === "已发货" || shipOf(order) === "已发货") return "已发货";
    if (stage === "待发货" || shipOf(order) === "待发货") return "待发货";
    return stage;
  }
  function orderAddress(order) {
    var parts = [order.country, order.city, order.address, order.postcode].filter(function (part) { return part; });
    if (parts.length) return parts.join(" ");
    var user = state.users.filter(function (item) { return item.id === order.userId; })[0];
    return (user && user.address) || "";
  }

  function renderShipping(root) {
    var head = el("div", "pall-head");
    var titles = el("div");
    titles.appendChild(el("h1", "desk__title", "发货管理"));
    titles.appendChild(el("p", "desk__hint", "管理订单的打包、发货、物流跟踪和签收，支持批量发货和快递单打印。"));
    var headActions = el("div", "ship-head-actions");
    var headShip = el("button", "review-pass client-action", "批量发货");
    headShip.type = "button";
    var headExport = el("button", "review-ghost client-action", "导出");
    headExport.type = "button";
    headActions.appendChild(headShip);
    headActions.appendChild(headExport);
    head.appendChild(titles);
    head.appendChild(headActions);
    root.appendChild(head);

    var filters = el("section", "desk-card pall-filters ord-filters");
    var search = el("input", "desk-input desk-search");
    search.type = "search";
    search.placeholder = "搜索订单号 / 客户名称 / 电话 / 收货人";
    function labeled(title, node) {
      var box = el("label", "ord-filter");
      box.appendChild(el("span", "", title));
      box.appendChild(node);
      return box;
    }
    var warehouseInput = el("select", "desk-input pall-select");
    var carrierInput = el("select", "desk-input pall-select");
    var dates = el("div", "ord-dates");
    var startInput = el("input", "desk-input");
    startInput.type = "date";
    var endInput = el("input", "desk-input");
    endInput.type = "date";
    dates.appendChild(startInput);
    dates.appendChild(el("span", "", "-"));
    dates.appendChild(endInput);
    filters.appendChild(search);
    filters.appendChild(labeled("发货仓库", warehouseInput));
    filters.appendChild(labeled("物流公司", carrierInput));
    filters.appendChild(labeled("下单时间", dates));
    var queryBtn = el("button", "review-pass pall-query", "查询");
    queryBtn.type = "button";
    var resetBtn = el("button", "review-ghost pall-reset", "重置");
    resetBtn.type = "button";
    filters.appendChild(queryBtn);
    filters.appendChild(resetBtn);
    root.appendChild(filters);

    var logistics = el("form", "desk-card ship-logistics");
    logistics.hidden = true;
    var warehouseField = el("input", "desk-input");
    warehouseField.placeholder = "发货仓库";
    warehouseField.maxLength = 40;
    var carrierField = el("input", "desk-input");
    carrierField.placeholder = "物流公司";
    carrierField.maxLength = 40;
    var trackingField = el("input", "desk-input");
    trackingField.placeholder = "物流单号";
    trackingField.maxLength = 80;
    var logisticsSave = el("button", "review-pass", "保存物流");
    logisticsSave.type = "submit";
    logistics.appendChild(warehouseField);
    logistics.appendChild(carrierField);
    logistics.appendChild(trackingField);
    logistics.appendChild(logisticsSave);
    root.appendChild(logistics);

    var tabs = el("div", "ord-tabs");
    root.appendChild(tabs);
    var layout = el("div", "ship-layout");
    var main = el("div", "ship-main");
    var message = el("div");
    var sheet = el("div", "desk-sheet");
    var foot = el("div", "pall-foot");
    main.appendChild(message);
    main.appendChild(sheet);
    main.appendChild(foot);
    var detail = el("aside", "desk-card ship-detail");
    layout.appendChild(main);
    layout.appendChild(detail);
    root.appendChild(layout);

    var orders = state.orders.slice();
    var applied = { q: "", warehouse: "", carrier: "", start: "", end: "" };
    var tab = "待发货";
    var page = 1;
    var pageSize = 10;
    var selected = {};
    var openId = "";

    function note(text) {
      clear(message);
      message.appendChild(el("p", "desk__hint", text));
    }
    function fillChoices() {
      function fill(select, all, key) {
        var current = select.value;
        clear(select);
        var first = el("option", "", all);
        first.value = "";
        select.appendChild(first);
        var seen = {};
        orders.forEach(function (order) {
          var value = order[key];
          if (!value || seen[value]) return;
          seen[value] = true;
          var option = el("option", "", value);
          option.value = value;
          select.appendChild(option);
        });
        select.value = current;
      }
      fill(warehouseInput, "全部仓库", "warehouse");
      fill(carrierInput, "全部物流", "carrier");
    }
    function inDate(order) {
      var time = Date.parse(order.createdAt || "");
      if (applied.start && (!time || time < new Date(applied.start + "T00:00:00").getTime())) return false;
      if (applied.end && (!time || time > new Date(applied.end + "T23:59:59").getTime())) return false;
      return true;
    }
    function baseRows() {
      var q = applied.q.trim().toLowerCase();
      return orders.filter(function (order) {
        if (q) {
          var blob = [order.id, orderName(order), orderPhone(order), orderAddress(order)].join(" ").toLowerCase();
          if (blob.indexOf(q) === -1) return false;
        }
        if (applied.warehouse && order.warehouse !== applied.warehouse) return false;
        if (applied.carrier && order.carrier !== applied.carrier) return false;
        return inDate(order);
      });
    }
    function refresh() {
      return loadAll().then(function () {
        orders = state.orders.slice();
        draw();
      });
    }
    function chosen(rows) {
      return rows.filter(function (order) { return selected[order.id]; });
    }
    function shipIds(ids) {
      if (!ids.length) {
        note("请先选择待发货订单");
        return;
      }
      json("api/admin/desk", { action: "order-batch", ids: ids, shipStage: "已发货" }).then(function (res) {
        note(res.ok ? "已发货。" : "发货没有完成");
        if (res.ok) refresh();
      });
    }
    function printOrders(list) {
      if (!list.length) {
        note("请先选择订单");
        return;
      }
      var box = document.getElementById("shipPrint");
      if (!box) {
        box = el("div", "ship-print");
        box.id = "shipPrint";
        document.body.appendChild(box);
      }
      clear(box);
      list.forEach(function (order) {
        var card = el("section", "ship-print__card");
        card.appendChild(el("h2", "", "快递单"));
        card.appendChild(el("p", "", "订单号　" + (order.id || "—")));
        card.appendChild(el("p", "", "收货人　" + orderName(order)));
        card.appendChild(el("p", "", "电话　" + (orderPhone(order) || "—")));
        card.appendChild(el("p", "", "地址　" + (orderAddress(order) || "—")));
        card.appendChild(el("p", "", "物流　" + (order.carrier || "—") + "　" + (order.tracking || "—")));
        (order.items || []).forEach(function (item) {
          var product = orderProduct(item.id);
          card.appendChild(el("p", "", (product && product.name || item.id) + " × " + (item.qty || 1)));
        });
        box.appendChild(card);
      });
      window.print();
    }
    function exportRows(rows) {
      var csv = ["订单号,下单时间,客户,电话,地址,件数,金额,发货状态,仓库,物流,单号"];
      rows.forEach(function (order) {
        csv.push([order.id, orderWhen(order.createdAt), orderName(order), orderPhone(order), orderAddress(order), orderPieces(order), orderAmount(order.total), shipFlow(order), order.warehouse || "", order.carrier || "", order.tracking || ""].join(","));
      });
      var file = new Blob(["\uFEFF" + csv.join("\n")], { type: "text/csv;charset=utf-8" });
      var link = el("a");
      link.href = URL.createObjectURL(file);
      link.download = "shipping.csv";
      link.click();
    }
    function paintDetail(order) {
      clear(detail);
      var bar = el("div", "ship-detail__bar");
      bar.appendChild(el("h2", "", "订单详情"));
      var close = el("button", "ship-detail__close", "×");
      close.type = "button";
      close.addEventListener("click", function () {
        openId = "";
        draw();
      });
      bar.appendChild(close);
      detail.appendChild(bar);
      if (!order) {
        detail.appendChild(el("p", "desk__hint", "选择一条订单查看详情"));
        return;
      }
      function line(label, value) {
        var row = el("p", "ship-detail__line");
        row.appendChild(el("span", "", label));
        row.appendChild(el("strong", "", value || "—"));
        detail.appendChild(row);
      }
      line("订单号", order.id);
      line("下单时间", orderWhen(order.createdAt));
      line("客户名称", orderName(order));
      line("联系电话", orderPhone(order));
      line("收货地址", orderAddress(order));
      line("订单金额", "¥" + orderAmount(order.total));
      line("支付方式", payOf(order) === "已付款" ? "已支付" : "未支付");
      line("发货状态", shipFlow(order));
      if (order.carrier || order.tracking) line("物流", (order.carrier || "—") + " " + (order.tracking || ""));
      detail.appendChild(el("h3", "", "产品清单 (" + (orderPieces(order) || 0) + ")"));
      (order.items || []).forEach(function (item) {
        var product = orderProduct(item.id);
        var row = el("div", "ship-item");
        var src = orderImage(product);
        if (src) {
          var img = el("img");
          img.alt = "";
          img.src = src;
          row.appendChild(img);
        }
        row.appendChild(el("span", "", (product && product.name || item.id)));
        row.appendChild(el("b", "", "x" + (item.qty || 1)));
        detail.appendChild(row);
      });
      if (shipFlow(order) === "待发货") {
        var nowShip = el("button", "review-pass ship-now", "立即发货");
        nowShip.type = "button";
        nowShip.addEventListener("click", function () { shipIds([order.id]); });
        detail.appendChild(nowShip);
      }
      var printOne = el("button", "review-ghost ship-print", "打印快递单");
      printOne.type = "button";
      printOne.addEventListener("click", function () { printOrders([order]); });
      detail.appendChild(printOne);
    }

    function draw() {
      clear(tabs);
      clear(sheet);
      clear(foot);
      fillChoices();
      var base = baseRows();
      var flows = ["待发货", "已发货", "运输中", "已签收", "异常", "已关闭"];
      [["all", "全部订单", base.length]].concat(flows.map(function (name) {
        return [name, name, base.filter(function (order) { return shipFlow(order) === name; }).length];
      })).forEach(function (item) {
        var button = el("button", "ord-tab" + (tab === item[0] ? " is-on" : ""), item[1] + " (" + item[2] + ")");
        button.type = "button";
        button.addEventListener("click", function () {
          tab = item[0];
          page = 1;
          draw();
        });
        tabs.appendChild(button);
      });
      var rows = tab === "all" ? base : base.filter(function (order) { return shipFlow(order) === tab; });
      var pages = Math.max(1, Math.ceil(rows.length / pageSize));
      if (page > pages) page = pages;
      var slice = rows.slice((page - 1) * pageSize, page * pageSize);
      var table = el("table", "desk-table pall-table");
      var headRow = el("tr");
      var checkHead = el("th");
      var checkAll = el("input");
      checkAll.type = "checkbox";
      checkAll.checked = slice.length > 0 && slice.every(function (order) { return selected[order.id]; });
      checkAll.addEventListener("change", function () {
        slice.forEach(function (order) { selected[order.id] = checkAll.checked; });
        draw();
      });
      checkHead.appendChild(checkAll);
      headRow.appendChild(checkHead);
      ["订单号", "下单时间", "客户信息", "产品(数量)", "收货地址", "金额 (¥)", "发货状态", "操作"].forEach(function (label) {
        headRow.appendChild(el("th", "", label));
      });
      table.appendChild(headRow);
      if (!slice.length) {
        var empty = el("tr");
        var emptyCell = el("td", "desk__hint", orders.length ? "没有匹配的订单" : "还没有待发货订单");
        if (tab !== "待发货" && !orders.length) emptyCell.textContent = "还没有订单";
        if (tab !== "待发货" && orders.length) emptyCell.textContent = "没有匹配的订单";
        emptyCell.colSpan = 9;
        empty.appendChild(emptyCell);
        table.appendChild(empty);
      }
      slice.forEach(function (order) {
        var flow = shipFlow(order);
        var tr = el("tr");
        if (openId === order.id) tr.className = "is-open";
        var checkCell = el("td");
        var check = el("input");
        check.type = "checkbox";
        check.checked = !!selected[order.id];
        check.addEventListener("change", function () {
          selected[order.id] = check.checked;
          draw();
        });
        checkCell.appendChild(check);
        tr.appendChild(checkCell);
        tr.appendChild(el("td", "", order.id || "—"));
        tr.appendChild(el("td", "", orderWhen(order.createdAt)));
        var who = el("td", "ord-customer");
        who.appendChild(el("strong", "", orderName(order)));
        who.appendChild(el("small", "", orderPhone(order) || "—"));
        tr.appendChild(who);
        var goods = el("td");
        var pics = el("div", "ord-products");
        (order.items || []).slice(0, 3).forEach(function (item) {
          var src = orderImage(orderProduct(item.id));
          if (!src) return;
          var img = el("img");
          img.alt = "";
          img.src = src;
          pics.appendChild(img);
        });
        pics.appendChild(el("span", "", "共 " + (orderPieces(order) || 0) + " 件"));
        goods.appendChild(pics);
        tr.appendChild(goods);
        tr.appendChild(el("td", "ship-address", orderAddress(order) || "—"));
        tr.appendChild(el("td", "", orderAmount(order.total)));
        tr.appendChild(el("td", "", "")).appendChild(el("span", "ord-stage ord-stage--" + flow, flow));
        var ops = el("td", "ord-ops");
        if (flow === "待发货") {
          var shipBtn = el("button", "review-pass ship-go", "发货");
          shipBtn.type = "button";
          shipBtn.addEventListener("click", function () { shipIds([order.id]); });
          ops.appendChild(shipBtn);
        }
        var view = el("button", "pall-edit", "详情");
        view.type = "button";
        view.addEventListener("click", function () {
          openId = order.id;
          draw();
        });
        ops.appendChild(view);
        tr.appendChild(ops);
        table.appendChild(tr);
      });
      sheet.appendChild(table);
      paintDetail(orders.filter(function (order) { return order.id === openId; })[0]);

      var pick = el("label", "pall-all");
      var pickBox = el("input");
      pickBox.type = "checkbox";
      pickBox.checked = slice.length > 0 && slice.every(function (order) { return selected[order.id]; });
      pickBox.addEventListener("change", function () {
        slice.forEach(function (order) { selected[order.id] = pickBox.checked; });
        draw();
      });
      pick.appendChild(pickBox);
      pick.appendChild(document.createTextNode("全选"));
      foot.appendChild(pick);
      var printBtn = el("button", "review-ghost pall-batch", "打印快递单");
      printBtn.type = "button";
      printBtn.addEventListener("click", function () { printOrders(chosen(rows)); });
      foot.appendChild(printBtn);
      var batchShip = el("button", "review-ghost pall-batch", "批量发货");
      batchShip.type = "button";
      batchShip.addEventListener("click", function () {
        shipIds(chosen(rows).filter(function (order) { return shipFlow(order) === "待发货"; }).map(function (order) { return order.id; }));
      });
      foot.appendChild(batchShip);
      var batchLog = el("button", "review-ghost pall-batch", "批量更新物流");
      batchLog.type = "button";
      batchLog.addEventListener("click", function () {
        if (!chosen(rows).length) {
          note("请先选择订单");
          return;
        }
        logistics.hidden = false;
        carrierField.focus();
      });
      foot.appendChild(batchLog);
      foot.appendChild(el("span", "pall-count", "共 " + rows.length + " 条数据"));
      var pagesBox = el("div", "review-pages");
      var prev = el("button", "review-ghost", "‹");
      prev.type = "button";
      prev.disabled = page <= 1;
      prev.addEventListener("click", function () { page -= 1; draw(); });
      pagesBox.appendChild(prev);
      var labels = [];
      if (pages <= 7) {
        for (var n = 1; n <= pages; n++) labels.push(n);
      } else labels = [1, 2, 3, 4, 5, "…", pages];
      labels.forEach(function (label) {
        if (label === "…") {
          pagesBox.appendChild(el("span", "pall-gap", "…"));
          return;
        }
        var button = el("button", "review-ghost" + (label === page ? " is-on" : ""), String(label));
        button.type = "button";
        button.addEventListener("click", function () { page = label; draw(); });
        pagesBox.appendChild(button);
      });
      var next = el("button", "review-ghost", "›");
      next.type = "button";
      next.disabled = page >= pages;
      next.addEventListener("click", function () { page += 1; draw(); });
      pagesBox.appendChild(next);
      foot.appendChild(pagesBox);
      var size = el("select", "desk-input review-size");
      [10, 20, 50].forEach(function (count) {
        var option = el("option", "", count + "条/页");
        option.value = String(count);
        if (count === pageSize) option.selected = true;
        size.appendChild(option);
      });
      size.addEventListener("change", function () {
        pageSize = Number(size.value) || 10;
        page = 1;
        draw();
      });
      foot.appendChild(size);
    }

    headShip.addEventListener("click", function () {
      shipIds(chosen(baseRows()).filter(function (order) { return shipFlow(order) === "待发货"; }).map(function (order) { return order.id; }));
    });
    headExport.addEventListener("click", function () {
      var base = baseRows();
      exportRows(tab === "all" ? base : base.filter(function (order) { return shipFlow(order) === tab; }));
    });
    logistics.addEventListener("submit", function (event) {
      event.preventDefault();
      var ids = chosen(baseRows()).map(function (order) { return order.id; });
      if (!ids.length) {
        note("请先选择订单");
        return;
      }
      json("api/admin/desk", {
        action: "order-batch",
        ids: ids,
        warehouse: warehouseField.value,
        carrier: carrierField.value,
        tracking: trackingField.value,
      }).then(function (res) {
        note(res.ok ? "物流已更新。" : "更新没有完成");
        if (res.ok) {
          logistics.hidden = true;
          refresh();
        }
      });
    });
    queryBtn.addEventListener("click", function () {
      applied.q = search.value;
      applied.warehouse = warehouseInput.value;
      applied.carrier = carrierInput.value;
      applied.start = startInput.value;
      applied.end = endInput.value;
      page = 1;
      draw();
    });
    search.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        queryBtn.click();
      }
    });
    resetBtn.addEventListener("click", function () {
      search.value = "";
      warehouseInput.value = "";
      carrierInput.value = "";
      startInput.value = "";
      endInput.value = "";
      applied = { q: "", warehouse: "", carrier: "", start: "", end: "" };
      tab = "待发货";
      page = 1;
      draw();
    });
    draw();
  }

  function renderService(root) {
    var head = el("div", "pall-head");
    var titles = el("div");
    titles.appendChild(el("h1", "desk__title", "售后客服"));
    titles.appendChild(el("p", "desk__hint", "处理客户咨询、售后问题和投诉建议，提升客户满意度。"));
    head.appendChild(titles);
    root.appendChild(head);

    var stats = el("div", "cs-stats");
    root.appendChild(stats);
    var filters = el("section", "desk-card pall-filters ord-filters");
    var search = el("input", "desk-input desk-search");
    search.type = "search";
    search.placeholder = "搜索工单号 / 客户名称 / 订单号 / 关键词";
    function labeled(title, node) {
      var box = el("label", "ord-filter");
      box.appendChild(el("span", "", title));
      box.appendChild(node);
      return box;
    }
    var typeInput = el("select", "desk-input pall-select");
    var customerInput = el("select", "desk-input pall-select");
    var statusInput = el("select", "desk-input pall-select");
    [["", "问题类型"], ["产品咨询", "产品咨询"], ["订单问题", "订单问题"], ["售后申请", "售后申请"], ["物流查询", "物流查询"], ["退换货", "退换货"], ["投诉建议", "投诉建议"], ["发货问题", "发货问题"]].forEach(function (item) {
      var option = el("option", "", item[1]);
      option.value = item[0];
      typeInput.appendChild(option);
    });
    [["", "客户类型"], ["客户", "客户"], ["经销商", "经销商"]].forEach(function (item) {
      var option = el("option", "", item[1]);
      option.value = item[0];
      customerInput.appendChild(option);
    });
    [["", "处理状态"], ["待处理", "待处理"], ["处理中", "处理中"], ["已解决", "已解决"], ["已关闭", "已关闭"]].forEach(function (item) {
      var option = el("option", "", item[1]);
      option.value = item[0];
      statusInput.appendChild(option);
    });
    var dates = el("div", "ord-dates");
    var startInput = el("input", "desk-input");
    startInput.type = "date";
    var endInput = el("input", "desk-input");
    endInput.type = "date";
    dates.appendChild(startInput);
    dates.appendChild(el("span", "", "-"));
    dates.appendChild(endInput);
    filters.appendChild(search);
    filters.appendChild(labeled("", typeInput));
    filters.appendChild(labeled("", customerInput));
    filters.appendChild(labeled("", statusInput));
    filters.appendChild(dates);
    var queryBtn = el("button", "review-pass pall-query", "查询");
    queryBtn.type = "button";
    var resetBtn = el("button", "review-ghost pall-reset", "重置");
    resetBtn.type = "button";
    filters.appendChild(queryBtn);
    filters.appendChild(resetBtn);
    root.appendChild(filters);

    var tabs = el("div", "ord-tabs");
    root.appendChild(tabs);
    var layout = el("div", "ship-layout");
    var main = el("div", "ship-main");
    var message = el("div");
    var sheet = el("div", "desk-sheet");
    var foot = el("div", "pall-foot");
    main.appendChild(message);
    main.appendChild(sheet);
    main.appendChild(foot);
    var detail = el("aside", "desk-card ship-detail");
    layout.appendChild(main);
    layout.appendChild(detail);
    root.appendChild(layout);

    var tickets = [];
    var applied = { q: "", type: "", customer: "", status: "", start: "", end: "" };
    var tab = "all";
    var page = 1;
    var pageSize = 10;
    var selected = {};
    var openId = "";
    var panel = "chat";

    function note(text) {
      clear(message);
      message.appendChild(el("p", "desk__hint", text));
    }
    function when(value) {
      return orderWhen(value);
    }
    function inDate(ticket) {
      var time = Date.parse(ticket.createdAt || "");
      if (applied.start && (!time || time < new Date(applied.start + "T00:00:00").getTime())) return false;
      if (applied.end && (!time || time > new Date(applied.end + "T23:59:59").getTime())) return false;
      return true;
    }
    function baseRows() {
      var q = applied.q.trim().toLowerCase();
      return tickets.filter(function (ticket) {
        if (q) {
          var blob = [ticket.id, ticket.customerName, ticket.orderId, ticket.issueType, ticket.email, ticket.phone].join(" ").toLowerCase();
          if (blob.indexOf(q) === -1) return false;
        }
        if (applied.type && ticket.issueType !== applied.type) return false;
        if (applied.customer && (ticket.customerType || "客户") !== applied.customer) return false;
        if (applied.status && ticket.status !== applied.status) return false;
        return inDate(ticket);
      });
    }
    function refresh() {
      return json("api/admin/tickets").then(function (res) {
        tickets = res.ok ? (res.data.tickets || []) : [];
        draw();
      });
    }
    function save(id, patch) {
      patch.action = "update";
      patch.id = id;
      return json("api/admin/tickets", patch).then(function (res) {
        note(res.ok ? "已保存。" : "保存没有完成");
        if (res.ok) {
          refreshAlerts();
          return refresh();
        }
      });
    }

    function paintDetail(ticket) {
      clear(detail);
      var bar = el("div", "ship-detail__bar");
      bar.appendChild(el("h2", "", "工单详情"));
      var close = el("button", "ship-detail__close", "×");
      close.type = "button";
      close.addEventListener("click", function () {
        openId = "";
        draw();
      });
      bar.appendChild(close);
      detail.appendChild(bar);
      if (!ticket) {
        detail.appendChild(el("p", "desk__hint", "选择一条工单查看详情"));
        return;
      }
      function line(label, value) {
        var row = el("p", "ship-detail__line");
        row.appendChild(el("span", "", label));
        row.appendChild(el("strong", "", value || "—"));
        detail.appendChild(row);
      }
      line("工单号", ticket.id);
      line("提交时间", when(ticket.createdAt));
      line("客户名称", ticket.customerName);
      line("客户类型", ticket.customerType || "客户");
      line("联系电话", ticket.phone);
      line("邮箱", ticket.email);
      line("关联订单", ticket.orderId);
      line("问题类型", ticket.issueType);
      var statusRow = el("label", "cs-inline");
      statusRow.appendChild(el("span", "", "处理状态"));
      var status = el("select", "desk-input");
      ["待处理", "处理中", "已解决", "已关闭"].forEach(function (name) {
        var option = el("option", "", name);
        option.value = name;
        if (ticket.status === name) option.selected = true;
        status.appendChild(option);
      });
      status.addEventListener("change", function () { save(ticket.id, { status: status.value }); });
      statusRow.appendChild(status);
      detail.appendChild(statusRow);
      var priorityRow = el("label", "cs-inline");
      priorityRow.appendChild(el("span", "", "优先级"));
      var priority = el("select", "desk-input");
      ["普通", "紧急"].forEach(function (name) {
        var option = el("option", "", name);
        option.value = name;
        if ((ticket.priority || "普通") === name) option.selected = true;
        priority.appendChild(option);
      });
      priority.addEventListener("change", function () { save(ticket.id, { priority: priority.value }); });
      priorityRow.appendChild(priority);
      detail.appendChild(priorityRow);

      var sub = el("div", "ord-tabs");
      [["chat", "沟通记录"], ["log", "处理记录"], ["order", "相关订单"]].forEach(function (item) {
        var button = el("button", "ord-tab" + (panel === item[0] ? " is-on" : ""), item[1]);
        button.type = "button";
        button.addEventListener("click", function () {
          panel = item[0];
          draw();
        });
        sub.appendChild(button);
      });
      detail.appendChild(sub);
      var body = el("div", "cs-thread");
      if (panel === "log") {
        var logs = ticket.logs || [];
        if (!logs.length) body.appendChild(el("p", "desk__hint", "还没有处理记录"));
        logs.forEach(function (item) {
          body.appendChild(el("p", "", when(item.at) + "　" + (item.actor ? item.actor + "　" : "") + item.text));
        });
      } else if (panel === "order") {
        var order = state.orders.filter(function (item) { return item.id === ticket.orderId; })[0];
        if (!ticket.orderId) body.appendChild(el("p", "desk__hint", "没有关联订单"));
        else if (!order) body.appendChild(el("p", "", ticket.orderId));
        else {
          body.appendChild(el("p", "", order.id + "　" + orderAmount(order.total)));
          body.appendChild(el("p", "", orderName(order) + "　" + stageOf(order)));
        }
      } else {
        var messages = ticket.messages || [];
        if (!messages.length) body.appendChild(el("p", "desk__hint", "还没有沟通记录"));
        messages.forEach(function (item) {
          var bubble = el("p", "cs-bubble" + (item.from === "staff" ? " is-staff" : ""));
          bubble.appendChild(el("strong", "", (item.actor || ticket.customerName || "客户") + " " + when(item.at)));
          bubble.appendChild(el("span", "", item.text));
          body.appendChild(bubble);
        });
        var reply = el("textarea", "desk-input");
        reply.maxLength = 500;
        reply.placeholder = "请输入回复内容";
        var send = el("button", "review-pass", "发送");
        send.type = "button";
        send.addEventListener("click", function () {
          if (!reply.value.trim()) return;
          save(ticket.id, { reply: reply.value });
        });
        body.appendChild(reply);
        body.appendChild(send);
      }
      detail.appendChild(body);
    }

    function draw() {
      clear(stats);
      clear(tabs);
      clear(sheet);
      clear(foot);
      var counts = { all: tickets.length, 待处理: 0, 处理中: 0, 已解决: 0, 已关闭: 0 };
      tickets.forEach(function (ticket) {
        if (counts[ticket.status] != null) counts[ticket.status] += 1;
      });
      [["all", "全部工单", "cs-ico--all"], ["待处理", "待处理", "cs-ico--wait"], ["处理中", "处理中", "cs-ico--work"], ["已解决", "已解决", "cs-ico--done"], ["已关闭", "已关闭", "cs-ico--off"]].forEach(function (item) {
        var card = el("article", "cs-stat");
        card.appendChild(el("i", "cs-ico " + item[2]));
        var text = el("span");
        text.appendChild(el("small", "", item[1]));
        text.appendChild(el("strong", "", String(item[0] === "all" ? counts.all : counts[item[0]])));
        card.appendChild(text);
        stats.appendChild(card);
      });
      var base = baseRows();
      [["all", "全部"], ["待处理", "待处理"], ["处理中", "处理中"], ["已解决", "已解决"], ["已关闭", "已关闭"]].forEach(function (item) {
        var count = item[0] === "all" ? base.length : base.filter(function (ticket) { return ticket.status === item[0]; }).length;
        var active = (tab === "all" && item[0] === "all" && !applied.status) || tab === item[0] || applied.status === item[0];
        if (applied.status && item[0] !== applied.status) active = false;
        if (!applied.status && tab === "all" && item[0] === "all") active = true;
        var button = el("button", "ord-tab" + (active ? " is-on" : ""), item[1] + " (" + count + ")");
        button.type = "button";
        button.addEventListener("click", function () {
          tab = item[0];
          applied.status = item[0] === "all" ? "" : item[0];
          statusInput.value = applied.status;
          page = 1;
          draw();
        });
        tabs.appendChild(button);
      });
      var rows = (applied.status ? base.filter(function (ticket) { return ticket.status === applied.status; }) : base);
      var pages = Math.max(1, Math.ceil(rows.length / pageSize));
      if (page > pages) page = pages;
      var slice = rows.slice((page - 1) * pageSize, page * pageSize);
      var table = el("table", "desk-table pall-table");
      var headRow = el("tr");
      var checkHead = el("th");
      var checkAll = el("input");
      checkAll.type = "checkbox";
      checkAll.checked = slice.length > 0 && slice.every(function (ticket) { return selected[ticket.id]; });
      checkAll.addEventListener("change", function () {
        slice.forEach(function (ticket) { selected[ticket.id] = checkAll.checked; });
        draw();
      });
      checkHead.appendChild(checkAll);
      headRow.appendChild(checkHead);
      ["工单号", "客户名称", "客户类型", "问题类型", "关联订单", "提交时间", "处理状态", "操作"].forEach(function (label) {
        headRow.appendChild(el("th", "", label));
      });
      table.appendChild(headRow);
      if (!slice.length) {
        var empty = el("tr");
        var emptyCell = el("td", "desk__hint", tickets.length ? "没有匹配的工单" : "还没有工单");
        emptyCell.colSpan = 9;
        empty.appendChild(emptyCell);
        table.appendChild(empty);
      }
      slice.forEach(function (ticket) {
        var tr = el("tr");
        var checkCell = el("td");
        var check = el("input");
        check.type = "checkbox";
        check.checked = !!selected[ticket.id];
        check.addEventListener("change", function () {
          selected[ticket.id] = check.checked;
          draw();
        });
        checkCell.appendChild(check);
        tr.appendChild(checkCell);
        tr.appendChild(el("td", "", ticket.id || "—"));
        tr.appendChild(el("td", "", ticket.customerName || "—"));
        tr.appendChild(el("td", "", ticket.customerType || "客户"));
        tr.appendChild(el("td", "", "")).appendChild(el("span", "cs-tag cs-tag--" + (ticket.issueType || ""), ticket.issueType || "—"));
        tr.appendChild(el("td", "", ticket.orderId || "—"));
        tr.appendChild(el("td", "", when(ticket.createdAt)));
        tr.appendChild(el("td", "", "")).appendChild(el("span", "ord-stage ord-stage--" + (ticket.status || ""), ticket.status || "—"));
        var ops = el("td", "ord-ops");
        var view = el("button", "pall-edit", "查看");
        view.type = "button";
        view.addEventListener("click", function () {
          openId = ticket.id;
          panel = "chat";
          draw();
        });
        ops.appendChild(view);
        var closed = ticket.status === "已解决" || ticket.status === "已关闭";
        var handle = el("button", "pall-edit", closed ? "详情" : "处理");
        handle.type = "button";
        handle.addEventListener("click", function () {
          openId = ticket.id;
          panel = closed ? "log" : "chat";
          if (!closed && ticket.status === "待处理") save(ticket.id, { status: "处理中" });
          else draw();
        });
        ops.appendChild(handle);
        tr.appendChild(ops);
        table.appendChild(tr);
      });
      sheet.appendChild(table);
      paintDetail(tickets.filter(function (ticket) { return ticket.id === openId; })[0]);

      var pick = el("label", "pall-all");
      var pickBox = el("input");
      pickBox.type = "checkbox";
      pickBox.checked = slice.length > 0 && slice.every(function (ticket) { return selected[ticket.id]; });
      pickBox.addEventListener("change", function () {
        slice.forEach(function (ticket) { selected[ticket.id] = pickBox.checked; });
        draw();
      });
      pick.appendChild(pickBox);
      pick.appendChild(document.createTextNode("全选"));
      foot.appendChild(pick);
      var batch = el("select", "desk-input review-size");
      var batchBlank = el("option", "", "批量处理");
      batchBlank.value = "";
      batch.appendChild(batchBlank);
      ["待处理", "处理中", "已解决", "已关闭"].forEach(function (name) {
        var option = el("option", "", name);
        option.value = name;
        batch.appendChild(option);
      });
      batch.addEventListener("change", function () {
        var ids = rows.filter(function (ticket) { return selected[ticket.id]; }).map(function (ticket) { return ticket.id; });
        var status = batch.value;
        batch.value = "";
        if (!status) return;
        if (!ids.length) {
          note("请先选择工单");
          return;
        }
        json("api/admin/tickets", { action: "batch", ids: ids, status: status }).then(function (res) {
          note(res.ok ? "已更新。" : "更新没有完成");
          if (res.ok) refresh();
        });
      });
      foot.appendChild(batch);
      var exportBtn = el("button", "review-ghost pall-batch", "导出工单");
      exportBtn.type = "button";
      exportBtn.addEventListener("click", function () {
        var csv = ["工单号,客户,客户类型,问题类型,关联订单,提交时间,处理状态"];
        rows.forEach(function (ticket) {
          csv.push([ticket.id, ticket.customerName, ticket.customerType || "客户", ticket.issueType, ticket.orderId || "", when(ticket.createdAt), ticket.status].join(","));
        });
        var file = new Blob(["\uFEFF" + csv.join("\n")], { type: "text/csv;charset=utf-8" });
        var link = el("a");
        link.href = URL.createObjectURL(file);
        link.download = "tickets.csv";
        link.click();
      });
      foot.appendChild(exportBtn);
      foot.appendChild(el("span", "pall-count", "共 " + rows.length + " 条数据"));
      var pagesBox = el("div", "review-pages");
      var prev = el("button", "review-ghost", "‹");
      prev.type = "button";
      prev.disabled = page <= 1;
      prev.addEventListener("click", function () { page -= 1; draw(); });
      pagesBox.appendChild(prev);
      var labels = [];
      if (pages <= 7) {
        for (var n = 1; n <= pages; n++) labels.push(n);
      } else labels = [1, 2, 3, 4, 5, "…", pages];
      labels.forEach(function (label) {
        if (label === "…") {
          pagesBox.appendChild(el("span", "pall-gap", "…"));
          return;
        }
        var button = el("button", "review-ghost" + (label === page ? " is-on" : ""), String(label));
        button.type = "button";
        button.addEventListener("click", function () { page = label; draw(); });
        pagesBox.appendChild(button);
      });
      var next = el("button", "review-ghost", "›");
      next.type = "button";
      next.disabled = page >= pages;
      next.addEventListener("click", function () { page += 1; draw(); });
      pagesBox.appendChild(next);
      foot.appendChild(pagesBox);
      var size = el("select", "desk-input review-size");
      [10, 20, 50].forEach(function (count) {
        var option = el("option", "", count + "条/页");
        option.value = String(count);
        if (count === pageSize) option.selected = true;
        size.appendChild(option);
      });
      size.addEventListener("change", function () {
        pageSize = Number(size.value) || 10;
        page = 1;
        draw();
      });
      foot.appendChild(size);
    }

    queryBtn.addEventListener("click", function () {
      applied.q = search.value;
      applied.type = typeInput.value;
      applied.customer = customerInput.value;
      applied.status = statusInput.value;
      tab = applied.status || "all";
      page = 1;
      draw();
    });
    search.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        queryBtn.click();
      }
    });
    resetBtn.addEventListener("click", function () {
      search.value = "";
      typeInput.value = "";
      customerInput.value = "";
      statusInput.value = "";
      startInput.value = "";
      endInput.value = "";
      applied = { q: "", type: "", customer: "", status: "", start: "", end: "" };
      tab = "all";
      page = 1;
      draw();
    });
    refresh();
  }

  function renderMail(root) {
    var head = el("div", "mail-head");
    var titles = el("div");
    titles.appendChild(el("h1", "desk__title", "邮件通知管理"));
    titles.appendChild(el("p", "desk__hint", "按实际业务发送通知，发送失败会自动重试，且不会影响注册、下单和发货。"));
    head.appendChild(titles);
    var topTest = el("button", "mail-outline");
    topTest.type = "button";
    topTest.appendChild(planeIcon());
    topTest.appendChild(document.createTextNode("发送测试邮件"));
    head.appendChild(topTest);
    root.appendChild(head);
    var message = el("div");
    root.appendChild(message);
    var tabBar = el("div", "mail-tabs");
    root.appendChild(tabBar);
    var panel = el("div");
    root.appendChild(panel);
    var view = "basic";
    var pack = null;
    var reasons = {
      unconfigured: "未配置发信",
      failed: "发送失败",
      disabled: "通知已关闭",
      duplicate: "已跳过重复",
      no_recipient: "没有收件人",
    };
    var tabs = [
      ["basic", "基础设置"],
      ["templates", "邮件模板"],
      ["records", "发送记录"],
      ["retry", "失败重试"],
      ["stats", "发送统计"],
    ];
    function note(text) {
      clear(message);
      if (text) message.appendChild(el("p", "desk__hint", text));
    }
    function stamp(value) {
      return value ? String(value).replace("T", " ").slice(0, 16) : "";
    }
    function preview(text) {
      var line = String(text || "").replace(/\s+/g, " ").trim();
      if (!line) return "—";
      return line.length > 42 ? line.slice(0, 42) + "…" : line;
    }
    function planeIcon() {
      var svg = svgEl("svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("aria-hidden", "true");
      var path = svgEl("path");
      path.setAttribute("d", "M4 12.5 20 5 14.5 20l-2.2-6.2L4 12.5z");
      svg.appendChild(path);
      return svg;
    }
    function eyeIcon() {
      var svg = svgEl("svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("aria-hidden", "true");
      var path = svgEl("path");
      path.setAttribute("d", "M2.5 12S6.5 6.5 12 6.5 21.5 12 21.5 12 17.5 17.5 12 17.5 2.5 12 2.5 12z");
      var dot = svgEl("circle");
      dot.setAttribute("cx", "12");
      dot.setAttribute("cy", "12");
      dot.setAttribute("r", "2.2");
      svg.appendChild(path);
      svg.appendChild(dot);
      return svg;
    }
    function fieldLabel(text, required) {
      var label = el("span", "mail-label", text);
      if (required) label.appendChild(el("i", "", " *"));
      return label;
    }
    function textInput(value, placeholder) {
      var input = el("input", "desk-input");
      input.value = value || "";
      input.placeholder = placeholder || "";
      return input;
    }
    function lastTest(records) {
      var rows = records || [];
      for (var i = 0; i < rows.length; i++) {
        if (rows[i].kind === "test" || rows[i].event === "测试邮件") return rows[i];
      }
      return null;
    }
    function sendTest() {
      topTest.disabled = true;
      json("api/admin/mail", { action: "test" }).then(function (sent) {
        topTest.disabled = false;
        var reason = sent.data && reasons[sent.data.reason];
        note(sent.ok && sent.data.sent ? "测试邮件已发送。" : "测试邮件未发出：" + (reason || "请先保存发信配置"));
        reload();
      });
    }
    topTest.addEventListener("click", sendTest);
    function drawTabs() {
      clear(tabBar);
      tabs.forEach(function (item) {
        var btn = el("button", "mail-tab" + (view === item[0] ? " is-on" : ""), item[1]);
        btn.type = "button";
        btn.addEventListener("click", function () {
          view = item[0];
          drawTabs();
          paint();
        });
        tabBar.appendChild(btn);
      });
    }
    function noticeTable(host, editable) {
      var card = el("section", "desk-card mail-card");
      var top = el("div", "mail-card__top");
      var title = el("h2", "signup-card__title set-card__title", "通知开关和模板");
      title.insertBefore(icon("mail"), title.firstChild);
      top.appendChild(title);
      var varsBtn = el("button", "mail-outline", "变量说明");
      varsBtn.type = "button";
      top.appendChild(varsBtn);
      card.appendChild(top);
      card.appendChild(el("p", "mail-lead", "可开启或关闭各类通知，并自定义邮件标题和内容模板。支持变量自动替换。"));
      var vars = el("div", "mail-vars");
      vars.hidden = true;
      var tokens = {};
      (pack.notices || []).forEach(function (item) {
        String(item.subject + "\n" + item.body).replace(/\{\{[^}]+\}\}/g, function (token) { tokens[token] = true; });
      });
      var names = Object.keys(tokens);
      vars.appendChild(document.createTextNode(names.length ? "模板里可以使用这些变量：" : "当前模板还没有变量。"));
      names.forEach(function (token) { vars.appendChild(el("code", "", token)); });
      card.appendChild(vars);
      varsBtn.addEventListener("click", function () { vars.hidden = !vars.hidden; });
      var sheet = el("div", "desk-sheet");
      var table = el("table", "desk-table mail-table");
      var head = el("tr");
      ["通知类型", "开关", "发送对象", "邮件标题", "邮件内容模板", "操作"].forEach(function (label) {
        head.appendChild(el("th", "", label));
      });
      table.appendChild(head);
      var editorRow = null;
      (pack.notices || []).forEach(function (item) {
        var tr = el("tr");
        var type = el("td");
        var typeBox = el("div", "mail-type");
        var mark = {
          register_admin: "customers",
          register_customer: "customers",
          review_pass: "review",
          review_reject: "review",
          order_admin: "orders",
          order_customer: "orders",
          pay_admin: "payments",
          pay_customer: "payments",
          ship_customer: "shipping",
          done_customer: "review",
          service_admin: "service",
          service_customer: "service",
          stock_admin: "stock",
        };
        typeBox.appendChild(icon(mark[item.id] || "mail"));
        typeBox.appendChild(document.createTextNode(item.label));
        type.appendChild(typeBox);
        tr.appendChild(type);
        var toggleCell = el("td");
        var toggle = el("label", "mail-switch");
        var input = el("input");
        input.type = "checkbox";
        input.checked = item.enabled !== false;
        input.addEventListener("change", function () {
          var notices = {};
          notices[item.id] = { enabled: input.checked, subject: item.subject, body: item.body };
          json("api/admin/mail", { action: "notices", notices: notices }).then(function (saved) {
            if (!saved.ok) {
              input.checked = !input.checked;
              note("开关没有保存");
              return;
            }
            item.enabled = input.checked;
            note("通知开关已保存。");
          });
        });
        toggle.appendChild(input);
        toggle.appendChild(el("span"));
        toggleCell.appendChild(toggle);
        tr.appendChild(toggleCell);
        tr.appendChild(el("td", "", "")).appendChild(el("span", "mail-who" + (item.audience === "admin" ? " mail-who--admin" : ""), item.audience === "admin" ? "管理员邮箱" : "客户邮箱"));
        tr.appendChild(el("td", "", item.subject || "—"));
        tr.appendChild(el("td", "mail-preview", preview(item.body)));
        var op = el("td");
        var edit = el("button", "pall-edit", "编辑");
        edit.type = "button";
        edit.addEventListener("click", function () {
          if (editorRow) editorRow.remove();
          editorRow = el("tr");
          var cell = el("td", "mail-editor");
          cell.colSpan = 6;
          cell.appendChild(el("p", "mail-label", "邮件标题"));
          var subject = textInput(item.subject, "邮件标题");
          var body = el("textarea", "desk-input");
          body.rows = 6;
          body.value = item.body || "";
          cell.appendChild(subject);
          cell.appendChild(el("p", "mail-label", "邮件内容"));
          cell.appendChild(body);
          var actions = el("div", "mail-actions");
          var save = el("button", "mail-save", "保存模板");
          save.type = "button";
          var cancel = el("button", "mail-outline", "取消");
          cancel.type = "button";
          save.addEventListener("click", function () {
            var notices = {};
            notices[item.id] = { enabled: input.checked, subject: subject.value, body: body.value };
            json("api/admin/mail", { action: "notices", notices: notices }).then(function (saved) {
              if (!saved.ok) return note("通知模板没有保存");
              item.subject = subject.value.trim() || item.subject;
              item.body = body.value;
              note("通知模板已保存。");
              paint();
            });
          });
          cancel.addEventListener("click", function () { editorRow.remove(); editorRow = null; });
          actions.appendChild(cancel);
          actions.appendChild(save);
          cell.appendChild(actions);
          editorRow.appendChild(cell);
          tr.insertAdjacentElement("afterend", editorRow);
        });
        op.appendChild(edit);
        tr.appendChild(op);
        table.appendChild(tr);
      });
      sheet.appendChild(table);
      card.appendChild(sheet);
      if (!editable) host.appendChild(card);
      else host.appendChild(card);
    }
    function logTable(records, emptyText) {
      var table = el("table", "desk-table mail-table");
      var head = el("tr");
      ["发送时间", "收件人", "通知类型", "发送状态", "失败原因"].forEach(function (label) {
        head.appendChild(el("th", "", label));
      });
      table.appendChild(head);
      if (!records.length) {
        var empty = el("tr");
        var cell = el("td", "desk__hint", emptyText);
        cell.colSpan = 5;
        empty.appendChild(cell);
        table.appendChild(empty);
      }
      records.forEach(function (row) {
        var tr = el("tr");
        tr.appendChild(el("td", "", stamp(row.at) || "—"));
        tr.appendChild(el("td", "", row.to || "—"));
        tr.appendChild(el("td", "", row.event || row.kind || "—"));
        var status = row.sent ? "已发送" : "未发送";
        if (!row.sent && row.attempts > 1) status += "（已重试 " + row.attempts + " 次）";
        tr.appendChild(el("td", "", status));
        tr.appendChild(el("td", "", row.sent ? "—" : (reasons[row.reason] || row.reason || "—")));
        table.appendChild(tr);
      });
      return table;
    }
    function paintBasic() {
      var emails = (pack.notifyEmails || []).slice();
      var card = el("section", "desk-card mail-card");
      var title = el("h2", "signup-card__title set-card__title", "管理员接收邮箱");
      title.insertBefore(icon("mail"), title.firstChild);
      card.appendChild(title);
      card.appendChild(el("p", "mail-lead", "当有新客户注册、新订单、售后申请等重要事件时，系统自动发送邮件到以下管理员邮箱。"));
      var row = el("div", "mail-recv");
      var emailBox = el("label");
      emailBox.appendChild(fieldLabel("接收邮箱", true));
      var chips = el("div", "mail-chips");
      var emailInput = el("input");
      emailInput.placeholder = "输入邮箱，按回车添加";
      function drawChips() {
        clear(chips);
        emails.forEach(function (email, index) {
          var chip = el("span", "mail-chip");
          chip.appendChild(document.createTextNode(email));
          var remove = el("button", "", "×");
          remove.type = "button";
          remove.setAttribute("aria-label", "移除邮箱");
          remove.addEventListener("click", function () {
            emails.splice(index, 1);
            drawChips();
          });
          chip.appendChild(remove);
          chips.appendChild(chip);
        });
        chips.appendChild(emailInput);
      }
      function addEmail() {
        var value = emailInput.value.trim();
        if (!value) return;
        if (value.indexOf("@") === -1 || emails.indexOf(value.toLowerCase()) !== -1) {
          note("请输入还没有添加的有效邮箱");
          return;
        }
        emails.push(value.toLowerCase());
        emailInput.value = "";
        drawChips();
      }
      emailInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          event.preventDefault();
          addEmail();
        }
      });
      drawChips();
      emailBox.appendChild(chips);
      var stockBox = el("label");
      stockBox.appendChild(fieldLabel("库存预警数量"));
      var stockMin = el("input", "desk-input mail-num");
      stockMin.type = "number";
      stockMin.min = "0";
      stockMin.value = String(pack.stockMin == null ? 5 : pack.stockMin);
      stockMin.title = "库存低于该数量时通知管理员";
      stockBox.appendChild(stockMin);
      var saveMail = el("button", "mail-save", "保存设置");
      saveMail.type = "button";
      saveMail.addEventListener("click", function () {
        addEmail();
        json("api/admin/mail", { action: "recipients", emails: emails.join("\n"), stockMin: stockMin.value }).then(function (saved) {
          note(saved.ok ? "接收设置已保存。" : "请填写有效邮箱");
          if (saved.ok) reload();
        });
      });
      row.appendChild(emailBox);
      row.appendChild(stockBox);
      row.appendChild(saveMail);
      card.appendChild(row);
      panel.appendChild(card);

      var smtp = pack.smtp || {};
      var mode = smtp.provider === "resend" || smtp.provider === "sendgrid" ? "api" : "smtp";
      var smtpCard = el("section", "desk-card mail-card");
      var smtpTop = el("div", "mail-card__top");
      var smtpTitle = el("h2", "signup-card__title set-card__title", "发信服务配置");
      var smtpMark = el("span", "desk__ico");
      smtpMark.appendChild(planeIcon());
      smtpTitle.insertBefore(smtpMark, smtpTitle.firstChild);
      var status = el("div", "mail-status");
      var tested = lastTest(pack.records);
      var dot = el("span", "mail-dot", tested && tested.sent ? "✓" : "·");
      var statusText = el("div");
      if (tested && tested.sent) {
        status.classList.add("mail-status--ok");
        statusText.appendChild(el("strong", "", "连接成功"));
        statusText.appendChild(document.createTextNode("上次测试：" + (stamp(tested.at) || "—")));
      } else if (tested) {
        status.classList.add("mail-status--bad");
        statusText.appendChild(el("strong", "", "尚未连通"));
        statusText.appendChild(document.createTextNode("上次测试：" + (stamp(tested.at) || "—")));
      } else if (pack.configured) {
        statusText.appendChild(el("strong", "", "已保存配置"));
        statusText.appendChild(document.createTextNode("还没有成功的测试记录"));
      } else {
        statusText.appendChild(el("strong", "", "未配置"));
        statusText.appendChild(document.createTextNode("通知会先记入发送记录"));
      }
      status.appendChild(dot);
      status.appendChild(statusText);
      smtpTop.appendChild(smtpTitle);
      smtpTop.appendChild(status);
      smtpCard.appendChild(smtpTop);
      smtpCard.appendChild(el("p", "mail-lead", "配置 SMTP 或专业邮件服务，用于发送系统通知邮件。"));
      var modes = el("div", "mail-modes");
      modes.appendChild(document.createTextNode("发送方式"));
      var smtpRadio = el("input");
      smtpRadio.type = "radio";
      smtpRadio.name = "mailMode";
      smtpRadio.checked = mode === "smtp";
      var apiRadio = el("input");
      apiRadio.type = "radio";
      apiRadio.name = "mailMode";
      apiRadio.checked = mode === "api";
      var smtpLabel = el("label");
      smtpLabel.appendChild(smtpRadio);
      smtpLabel.appendChild(document.createTextNode("SMTP"));
      var apiLabel = el("label");
      apiLabel.appendChild(apiRadio);
      apiLabel.appendChild(document.createTextNode("第三方服务"));
      modes.appendChild(smtpLabel);
      modes.appendChild(apiLabel);
      smtpCard.appendChild(modes);
      var grid = el("div", "mail-grid");
      var host = textInput(smtp.host, "smtp.example.com");
      var port = textInput(String(smtp.port || 587), "587");
      port.type = "number";
      var secure = el("select", "desk-input");
      [["tls", "TLS"], ["ssl", "SSL"]].forEach(function (item) {
        var option = el("option", "", item[1]);
        option.value = item[0];
        if ((smtp.secure || "tls") === item[0]) option.selected = true;
        secure.appendChild(option);
      });
      var user = textInput(smtp.user, "SMTP 账号");
      var passWrap = el("div", "mail-pass");
      var pass = textInput("", smtp.hasPassword ? "已保存，留空不修改" : "SMTP 密码");
      pass.type = "password";
      pass.autocomplete = "new-password";
      var eye = el("button", "mail-mini");
      eye.type = "button";
      eye.appendChild(eyeIcon());
      eye.addEventListener("click", function () {
        pass.type = pass.type === "password" ? "text" : "password";
      });
      passWrap.appendChild(pass);
      passWrap.appendChild(eye);
      var fromName = textInput(smtp.fromName, "YINSCENT");
      var from = textInput(smtp.from, "发件人邮箱");
      var provider = el("select", "desk-input");
      [["resend", "Resend"], ["sendgrid", "SendGrid"]].forEach(function (item) {
        var option = el("option", "", item[1]);
        option.value = item[0];
        if ((smtp.provider || "resend") === item[0]) option.selected = true;
        provider.appendChild(option);
      });
      var apiKey = textInput("", smtp.hasApiKey ? "已保存，留空不修改" : "服务密钥");
      apiKey.type = "password";
      apiKey.autocomplete = "new-password";
      function put(parent, label, node, required) {
        var box = el("label");
        box.appendChild(fieldLabel(label, required));
        box.appendChild(node);
        parent.appendChild(box);
      }
      function drawSmtp() {
        clear(grid);
        grid.className = apiRadio.checked ? "mail-grid mail-grid--api" : "mail-grid";
        if (apiRadio.checked) {
          put(grid, "服务", provider, true);
          put(grid, "发件人名称", fromName, false);
          put(grid, "发件人邮箱", from, true);
          put(grid, "服务密钥", apiKey, !smtp.hasApiKey);
          return;
        }
        put(grid, "SMTP 主机", host, true);
        put(grid, "端口", port, true);
        put(grid, "加密方式", secure, false);
        put(grid, "SMTP 账号", user, true);
        put(grid, "SMTP 密码", passWrap, !smtp.hasPassword);
        put(grid, "发件人名称", fromName, true);
        put(grid, "发件人邮箱", from, true);
      }
      smtpRadio.addEventListener("change", drawSmtp);
      apiRadio.addEventListener("change", drawSmtp);
      drawSmtp();
      smtpCard.appendChild(grid);
      var actions = el("div", "mail-actions");
      var testBtn = el("button", "mail-outline");
      testBtn.type = "button";
      testBtn.appendChild(planeIcon());
      testBtn.appendChild(document.createTextNode("发送测试邮件"));
      testBtn.addEventListener("click", sendTest);
      var saveSmtp = el("button", "mail-outline", "保存配置");
      saveSmtp.type = "button";
      saveSmtp.addEventListener("click", function () {
        json("api/admin/mail", {
          action: "smtp",
          provider: apiRadio.checked ? provider.value : "smtp",
          host: host.value,
          port: port.value,
          secure: secure.value,
          user: user.value,
          pass: pass.value,
          fromName: fromName.value,
          from: from.value,
          apiKey: apiKey.value,
        }).then(function (saved) {
          note(saved.ok ? "发信配置已保存。密码和密钥只留在服务器。" : "发信配置没有保存");
          if (saved.ok) reload();
        });
      });
      actions.appendChild(testBtn);
      actions.appendChild(saveSmtp);
      smtpCard.appendChild(actions);
      panel.appendChild(smtpCard);
      noticeTable(panel, false);
    }
    function paint() {
      clear(panel);
      if (!pack) return;
      if (view === "basic") return paintBasic();
      if (view === "templates") return noticeTable(panel, true);
      if (view === "records") {
        var card = el("section", "desk-card mail-card desk-sheet");
        card.appendChild(el("h2", "signup-card__title", "发送记录"));
        card.appendChild(logTable(pack.records || [], "还没有发送记录"));
        panel.appendChild(card);
        return;
      }
      if (view === "retry") {
        var failed = (pack.records || []).filter(function (row) {
          return !row.sent && (row.reason === "failed" || row.reason === "unconfigured");
        });
        var retryCard = el("section", "desk-card mail-card desk-sheet");
        var retryTop = el("div", "mail-card__top");
        retryTop.appendChild(el("h2", "signup-card__title", "失败重试"));
        var retryBtn = el("button", "mail-save", "立即重试");
        retryBtn.type = "button";
        retryBtn.addEventListener("click", function () {
          retryBtn.disabled = true;
          json("api/admin/mail", { action: "retry" }).then(function (saved) {
            retryBtn.disabled = false;
            var count = saved.data && saved.data.retried;
            note(saved.ok ? "已处理 " + (count || 0) + " 条待重试记录。" : "重试没有完成");
            if (saved.ok && saved.data && saved.data.records) {
              pack.records = saved.data.records;
              paint();
            } else reload();
          });
        });
        retryTop.appendChild(retryBtn);
        retryCard.appendChild(retryTop);
        retryCard.appendChild(el("p", "mail-lead", "未配置或发送失败的通知会留在这里。配置可用后可以再次发送，注册、下单和发货本身不受影响。"));
        retryCard.appendChild(logTable(failed, "没有等待重试的记录"));
        panel.appendChild(retryCard);
        return;
      }
      var records = pack.records || [];
      var sent = records.filter(function (row) { return row.sent; }).length;
      var retried = records.filter(function (row) { return (row.attempts || 0) > 1; }).length;
      var kpis = el("div", "mail-kpis");
      [
        ["发送总数", records.length],
        ["已发送", sent],
        ["未发送", records.length - sent],
        ["发生过重试", retried],
      ].forEach(function (item) {
        var box = el("div", "mail-kpi");
        box.appendChild(el("span", "", item[0]));
        box.appendChild(el("strong", "", String(item[1])));
        kpis.appendChild(box);
      });
      panel.appendChild(kpis);
      var statCard = el("section", "desk-card mail-card desk-sheet");
      statCard.appendChild(el("h2", "signup-card__title", "按通知类型"));
      var groups = {};
      records.forEach(function (row) {
        var name = row.event || row.kind || "其他";
        if (!groups[name]) groups[name] = { name: name, total: 0, sent: 0 };
        groups[name].total += 1;
        if (row.sent) groups[name].sent += 1;
      });
      var table = el("table", "desk-table mail-table");
      var head = el("tr");
      ["通知类型", "次数", "已发送", "未发送"].forEach(function (label) {
        head.appendChild(el("th", "", label));
      });
      table.appendChild(head);
      var names = Object.keys(groups);
      if (!names.length) {
        var empty = el("tr");
        var cell = el("td", "desk__hint", "还没有发送记录");
        cell.colSpan = 4;
        empty.appendChild(cell);
        table.appendChild(empty);
      }
      names.forEach(function (name) {
        var item = groups[name];
        var tr = el("tr");
        tr.appendChild(el("td", "", item.name));
        tr.appendChild(el("td", "", String(item.total)));
        tr.appendChild(el("td", "", String(item.sent)));
        tr.appendChild(el("td", "", String(item.total - item.sent)));
        table.appendChild(tr);
      });
      statCard.appendChild(table);
      panel.appendChild(statCard);
    }
    function reload() {
      json("api/admin/mail").then(function (res) {
        if (!res.ok) return;
        pack = res.data || {};
        paint();
      });
    }
    drawTabs();
    json("api/admin/mail").then(function (res) {
      if (!res.ok) {
        panel.appendChild(el("p", "desk__hint", "当前账号不能管理邮件通知"));
        return;
      }
      pack = res.data || {};
      paint();
    });
  }
  function renderMain() {
    var root = document.getElementById("deskMain");
    if (!root) return;
    clear(root);
    if (state.tab === "desk" || state.tab === "reports") return renderReports(root);
    if (state.tab === "products") return productRows(root, "products");
    if (state.tab === "prices") return productRows(root, "prices");
    if (state.tab === "stock") return productRows(root, "stock");
    if (state.tab === "signup") return renderSignup(root);
    if (state.tab === "review") return renderClientReview(root);
    if (state.tab === "clients") return renderClients(root);
    if (state.tab === "productNew") return renderProductNew(root);
    if (state.tab === "productAll") return renderProductAll(root);
    if (state.tab === "orders") return renderOrders(root);
    if (state.tab === "payments") return statusEditor(root, "payStatus", "收款管理", ["未付款", "已付款"]);
    if (state.tab === "shipping") return renderShipping(root);
    if (state.tab === "service") return renderService(root);
    if (state.tab === "content") return renderContent(root);
    if (state.tab === "files") return renderFiles(root);
    if (state.tab === "admins") return renderAdmins(root);
    if (state.tab === "roles") return renderRoles(root);
    if (state.tab === "logs") return renderLogs(root);
    if (state.tab === "mail") return renderMail(root);
    if (state.tab === "settings") return renderSettings(root);
  }

  function loadAll() {
    return Promise.all([
      json("api/orders"),
      json("api/admin/users"),
      json("api/admin/trade-products"),
    ]).then(function (result) {
      state.orders = result[0].ok && result[0].data.orders ? result[0].data.orders : [];
      state.users = result[1].ok && result[1].data.users ? result[1].data.users : [];
      state.products = result[2].ok && result[2].data.products ? result[2].data.products : (window.YINSCENT_PRODUCTS || []);
    });
  }

  function bindDeskUser() {
    var btn = document.getElementById("deskUserBtn");
    var menu = document.getElementById("deskUserMenu");
    if (!btn || !menu || btn.getAttribute("data-bound")) return;
    btn.setAttribute("data-bound", "1");
    btn.addEventListener("click", function (event) {
      event.stopPropagation();
      var open = menu.hidden;
      menu.hidden = !open;
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("click", function () {
      menu.hidden = true;
      btn.setAttribute("aria-expanded", "false");
    });
    var switchAccount = document.getElementById("deskUserSwitch");
    if (switchAccount) {
      switchAccount.addEventListener("click", function () {
        var auth = window.YinscentAuth;
        if (!auth) {
          window.location.href = base + "login.html";
          return;
        }
        Promise.all([auth.signOut(), auth.signOutMember()]).then(function () {
          window.location.href = base + "login.html";
        });
      });
    }
    var signOut = document.getElementById("deskUserSignOut");
    if (signOut) {
      signOut.addEventListener("click", function () {
        var exit = document.getElementById("adminSignOut");
        if (exit) exit.click();
      });
    }
  }

  function boot() {
    var desk = document.getElementById("adminDashboard");
    if (!desk || desk.hidden) return;
    json("api/admin/me").then(function (res) {
      if (!res.ok || !res.data.admin) return;
      state.admin = res.data.admin;
      var who = document.getElementById("deskUserName");
      if (who) who.textContent = state.admin.super ? "管理员" : (state.admin.name || state.admin.username || "员工");
      bindDeskUser();
      var requested = String(location.hash || "").replace(/^#/, "");
      if (requested === "home") {
        window.location.href = base + "index.html";
        return;
      }
      if (requested === "desk" || requested === "mail" || requested === "files") {
        requested = "reports";
        history.replaceState(null, "", "#reports");
      }
      if (requested && allowed(requested)) state.tab = requested;
      if (state.tab === "home" || !allowed(state.tab)) state.tab = firstTab() || "reports";
      loadAll().then(function () {
        return refreshAlerts();
      }).then(function () { open(state.tab); });
    });
  }

  document.addEventListener("yinscent:auth", boot);
  document.addEventListener("yinscent:desk", boot);
  boot();
})();
