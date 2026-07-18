(function () {
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  var loading = document.getElementById("adminLoading");
  var loginSection = document.getElementById("adminLogin");
  var dashboard = document.getElementById("adminDashboard");
  var form = document.getElementById("adminLoginForm");
  var passwordInput = document.getElementById("adminPassword");
  var errorEl = document.getElementById("adminLoginError");
  var submitBtn = document.getElementById("adminLoginSubmit");
  var signOutBtn = document.getElementById("adminSignOut");
  var products = window.YINSCENT_PRODUCTS || [];
  var categories = window.YINSCENT_CATEGORIES || [];
  var base = window.YINSCENT_BASE || "/";

  function productCategory(product) {
    return product.category || "tealights";
  }

  function productImage(product) {
    var images = product.images && product.images.length ? product.images : [product.slug];
    return base + "assets/products/" + images[0] + ".png";
  }

  function renderOverview() {
    var featured = products.filter(function (product) {
      return product.featured;
    });
    var totalPrice = products.reduce(function (total, product) {
      return total + (Number(product.price) || 0);
    }, 0);
    var averagePrice = products.length ? totalPrice / products.length : 0;

    document.getElementById("adminProductCount").textContent = String(products.length);
    document.getElementById("adminCategoryCount").textContent = String(categories.length);
    document.getElementById("adminFeaturedCount").textContent = String(featured.length);
    document.getElementById("adminAveragePrice").textContent = "£" + averagePrice.toFixed(2);
    document.getElementById("adminFeaturedMeta").textContent =
      featured.length + " product" + (featured.length === 1 ? "" : "s") + " featured";

    var welcome = document.getElementById("adminWelcome");
    if (welcome) {
      welcome.textContent = new Intl.DateTimeFormat("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(new Date());
    }

    var categoryList = document.getElementById("adminCategoryList");
    if (categoryList) {
      categoryList.innerHTML = "";
      categories.forEach(function (category) {
        var count = products.filter(function (product) {
          return productCategory(product) === category.id;
        }).length;
        var percentage = products.length ? Math.round((count / products.length) * 100) : 0;
        var row = document.createElement("div");
        row.className = "admin-category-row";
        row.innerHTML =
          '<div class="admin-category-row__text"><span>' +
          category.label +
          "</span><strong>" +
          count +
          '</strong></div><div class="admin-category-row__track"><span style="width:' +
          percentage +
          '%"></span></div>';
        categoryList.appendChild(row);
      });
    }

    var featuredList = document.getElementById("adminFeaturedList");
    if (featuredList) {
      featuredList.innerHTML = "";
      featured.slice(0, 6).forEach(function (product) {
        var link = document.createElement("a");
        link.className = "admin-featured-product";
        link.href = base + "index.html?id=" + encodeURIComponent(product.id);
        link.innerHTML =
          '<img src="' +
          productImage(product) +
          '" alt="" width="64" height="64" />' +
          '<span class="admin-featured-product__info"><strong>' +
          product.name +
          "</strong><small>" +
          (categories.find(function (category) {
            return category.id === productCategory(product);
          }) || { label: "Scented tealight candles" }).label +
          '</small></span><span class="admin-featured-product__price">£' +
          Number(product.price).toFixed(2) +
          "</span>";
        featuredList.appendChild(link);
      });
    }
  }

  function showView(view) {
    if (loading) loading.hidden = view !== "loading";
    if (loginSection) loginSection.hidden = view !== "login";
    if (dashboard) dashboard.hidden = view !== "dashboard";
    if (view === "login" && passwordInput) passwordInput.focus();
  }

  function showError(message) {
    if (!errorEl) return;
    errorEl.textContent = message || "";
    errorEl.hidden = !message;
  }

  function setMetric(valueId, deltaId, valueText, deltaText, direction) {
    var valueEl = document.getElementById(valueId);
    var deltaEl = document.getElementById(deltaId);
    if (valueEl) valueEl.textContent = valueText;
    if (deltaEl) {
      deltaEl.textContent = deltaText;
      deltaEl.className =
        "admin-stat__delta" +
        (direction === "up" ? " is-up" : direction === "down" ? " is-down" : "");
    }
  }

  function deltaText(current, previous) {
    if (previous <= 0) {
      return current > 0
        ? { text: "new this period", direction: "up" }
        : { text: "no orders yet", direction: "" };
    }
    var change = Math.round(((current - previous) / previous) * 100);
    if (change === 0) return { text: "same as previous 30 days", direction: "" };
    return {
      text: (change > 0 ? "+" : "") + change + "% vs previous 30 days",
      direction: change > 0 ? "up" : "down",
    };
  }

  function renderKeyMetrics() {
    fetch(base + "api/orders", { method: "GET" })
      .then(function (res) {
        if (!res.ok) throw new Error("unavailable");
        return res.json();
      })
      .then(function (data) {
        var orders = data.orders || [];
        var now = Date.now();
        var day = 24 * 60 * 60 * 1000;

        function summarize(fromMs, toMs) {
          var summary = { revenue: 0, orders: 0, units: 0 };
          orders.forEach(function (order) {
            var when = Date.parse(order.createdAt);
            if (isNaN(when) || when < fromMs || when >= toMs) return;
            summary.revenue += Number(order.total) || 0;
            summary.orders += 1;
            (order.items || []).forEach(function (item) {
              summary.units += Number(item.qty) || 0;
            });
          });
          return summary;
        }

        var current = summarize(now - 30 * day, now + day);
        var previous = summarize(now - 60 * day, now - 30 * day);
        var currentAov = current.orders ? current.revenue / current.orders : 0;
        var previousAov = previous.orders ? previous.revenue / previous.orders : 0;

        var d = deltaText(current.revenue, previous.revenue);
        setMetric("adminRevenue", "adminRevenueDelta", "£" + current.revenue.toFixed(2), d.text, d.direction);
        d = deltaText(current.orders, previous.orders);
        setMetric("adminOrders", "adminOrdersDelta", String(current.orders), d.text, d.direction);
        d = deltaText(currentAov, previousAov);
        setMetric("adminAov", "adminAovDelta", "£" + currentAov.toFixed(2), d.text, d.direction);
        d = deltaText(current.units, previous.units);
        setMetric("adminUnits", "adminUnitsDelta", String(current.units), d.text, d.direction);
      })
      .catch(function () {
        ["adminRevenue", "adminOrders", "adminAov", "adminUnits"].forEach(function (id, i) {
          setMetric(
            id,
            id + "Delta",
            i === 0 || i === 2 ? "£0.00" : "0",
            "order data unavailable",
            ""
          );
        });
      });
  }

  // ---- Sales analytics ----
  var analyticsPeriod = 7;
  var analyticsOrders = null;

  var productIndex = {};
  products.forEach(function (product) {
    productIndex[product.id] = product;
  });

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function categoryLabelById(id) {
    var match = categories.find(function (category) {
      return category.id === id;
    });
    return match ? match.label : "Scented tealight candles";
  }

  function productMeta(id) {
    var product = productIndex[id];
    if (product) {
      return {
        name: product.cartName || product.name,
        category: product.category || "tealights",
      };
    }
    return { name: id, category: "tealights" };
  }

  function analyticsEl(id) {
    return document.getElementById(id);
  }

  function showAnalyticsState(state) {
    var map = {
      loading: "adminAnalyticsLoading",
      error: "adminAnalyticsError",
      empty: "adminAnalyticsEmpty",
      body: "adminAnalyticsBody",
    };
    Object.keys(map).forEach(function (key) {
      var el = analyticsEl(map[key]);
      if (el) el.hidden = key !== state;
    });
  }

  function formatDay(ms) {
    return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(ms));
  }

  function analyze(orders, days) {
    var now = Date.now();
    var dayMs = 24 * 60 * 60 * 1000;
    var start = now - days * dayMs;
    var totals = { revenue: 0, orders: 0, units: 0 };
    var byCategory = {};
    var byProduct = {};

    var bucketDays = days <= 30 ? 1 : 7;
    var bucketCount = Math.ceil(days / bucketDays);
    var buckets = [];
    for (var i = 0; i < bucketCount; i++) {
      var end = now - (bucketCount - 1 - i) * bucketDays * dayMs;
      buckets.push({ start: end - bucketDays * dayMs, end: end, revenue: 0 });
    }

    orders.forEach(function (order) {
      var when = Date.parse(order.createdAt);
      if (isNaN(when) || when < start || when > now + dayMs) return;
      var orderTotal = Number(order.total) || 0;
      totals.revenue += orderTotal;
      totals.orders += 1;

      var fromEnd = Math.floor((now - when) / (bucketDays * dayMs));
      var idx = bucketCount - 1 - fromEnd;
      if (idx >= 0 && idx < bucketCount) buckets[idx].revenue += orderTotal;

      (order.items || []).forEach(function (item) {
        var qty = Number(item.qty) || 0;
        var lineRevenue = (Number(item.price) || 0) * qty;
        totals.units += qty;
        var meta = productMeta(item.id);
        byCategory[meta.category] = (byCategory[meta.category] || 0) + lineRevenue;
        if (!byProduct[item.id]) {
          byProduct[item.id] = { name: meta.name, revenue: 0, units: 0 };
        }
        byProduct[item.id].revenue += lineRevenue;
        byProduct[item.id].units += qty;
      });
    });

    return {
      days: days,
      totals: totals,
      byCategory: byCategory,
      byProduct: byProduct,
      buckets: buckets,
      bucketDays: bucketDays,
    };
  }

  function renderSummary(result) {
    var container = analyticsEl("adminAnalyticsSummary");
    if (!container) return;
    var aov = result.totals.orders ? result.totals.revenue / result.totals.orders : 0;
    var items = [
      { label: "Revenue", value: "£" + result.totals.revenue.toFixed(2) },
      { label: "Orders", value: String(result.totals.orders) },
      { label: "Units sold", value: String(result.totals.units) },
      { label: "Avg order", value: "£" + aov.toFixed(2) },
    ];
    container.innerHTML = items
      .map(function (item) {
        return (
          '<div class="admin-analytics__summary-item"><span>' +
          item.label +
          "</span><strong>" +
          item.value +
          "</strong></div>"
        );
      })
      .join("");
  }

  function renderChart(result) {
    var container = analyticsEl("adminRevenueChart");
    if (!container) return;
    var buckets = result.buckets;
    var n = buckets.length;
    var W = 640;
    var H = 220;
    var padX = 10;
    var padTop = 14;
    var padBottom = 28;
    var plotW = W - padX * 2;
    var plotH = H - padTop - padBottom;
    var maxRev = buckets.reduce(function (m, b) {
      return Math.max(m, b.revenue);
    }, 0) || 1;

    function xAt(i) {
      if (n === 1) return padX + plotW / 2;
      return padX + (plotW * i) / (n - 1);
    }
    function yAt(v) {
      return padTop + plotH - (v / maxRev) * plotH;
    }

    var linePoints = buckets.map(function (b, i) {
      return xAt(i).toFixed(1) + "," + yAt(b.revenue).toFixed(1);
    });
    var areaPoints =
      padX +
      "," +
      (padTop + plotH) +
      " " +
      linePoints.join(" ") +
      " " +
      xAt(n - 1).toFixed(1) +
      "," +
      (padTop + plotH);

    var gridLines = "";
    for (var g = 0; g <= 4; g++) {
      var gy = (padTop + (plotH * g) / 4).toFixed(1);
      gridLines +=
        '<line class="admin-chart__grid" x1="' +
        padX +
        '" y1="' +
        gy +
        '" x2="' +
        (W - padX) +
        '" y2="' +
        gy +
        '" />';
    }

    var dots = buckets
      .map(function (b, i) {
        return (
          '<circle class="admin-chart__dot" cx="' +
          xAt(i).toFixed(1) +
          '" cy="' +
          yAt(b.revenue).toFixed(1) +
          '" r="3"><title>' +
          formatDay(b.end - 1) +
          ": £" +
          b.revenue.toFixed(2) +
          "</title></circle>"
        );
      })
      .join("");

    var labelIdx = n === 1 ? [0] : [0, Math.floor((n - 1) / 2), n - 1];
    var uniqueIdx = labelIdx.filter(function (v, i, arr) {
      return arr.indexOf(v) === i;
    });
    var axis = uniqueIdx
      .map(function (i) {
        var anchor = i === 0 ? "start" : i === n - 1 ? "end" : "middle";
        return (
          '<text class="admin-chart__axis" x="' +
          xAt(i).toFixed(1) +
          '" y="' +
          (H - 8) +
          '" text-anchor="' +
          anchor +
          '">' +
          formatDay(buckets[i].end - 1) +
          "</text>"
        );
      })
      .join("");

    var ariaLabel =
      "Revenue trend over the last " +
      result.days +
      " days. Peak £" +
      maxRev.toFixed(2) +
      " per " +
      (result.bucketDays === 1 ? "day" : "week") +
      ".";

    var svg =
      '<svg viewBox="0 0 ' +
      W +
      " " +
      H +
      '" role="img" aria-label="' +
      escapeHtml(ariaLabel) +
      '">' +
      '<defs><linearGradient id="adminChartFill" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="rgba(201,169,98,0.35)" />' +
      '<stop offset="100%" stop-color="rgba(201,169,98,0)" />' +
      "</linearGradient></defs>" +
      gridLines +
      '<polygon class="admin-chart__area" points="' +
      areaPoints +
      '" />' +
      '<polyline class="admin-chart__line" points="' +
      linePoints.join(" ") +
      '" />' +
      dots +
      axis +
      "</svg>";

    var table =
      '<table class="visually-hidden"><caption>Revenue by ' +
      (result.bucketDays === 1 ? "day" : "week") +
      "</caption><thead><tr><th>Period ending</th><th>Revenue</th></tr></thead><tbody>" +
      buckets
        .map(function (b) {
          return "<tr><td>" + formatDay(b.end - 1) + "</td><td>£" + b.revenue.toFixed(2) + "</td></tr>";
        })
        .join("") +
      "</tbody></table>";

    container.innerHTML = svg + table;
  }

  function renderSalesByCategory(result) {
    var container = analyticsEl("adminSalesByCategory");
    if (!container) return;
    var entries = Object.keys(result.byCategory)
      .map(function (id) {
        return { id: id, label: categoryLabelById(id), revenue: result.byCategory[id] };
      })
      .sort(function (a, b) {
        return b.revenue - a.revenue;
      });
    if (!entries.length) {
      container.innerHTML = '<p class="admin-analytics__state">No category sales in this period.</p>';
      return;
    }
    var totalCat = entries.reduce(function (sum, entry) {
      return sum + entry.revenue;
    }, 0) || 1;
    container.innerHTML = entries
      .map(function (entry) {
        var pct = Math.round((entry.revenue / totalCat) * 100);
        return (
          '<div class="admin-category-row"><div class="admin-category-row__text"><span>' +
          escapeHtml(entry.label) +
          "</span><strong>£" +
          entry.revenue.toFixed(2) +
          '</strong></div><div class="admin-category-row__track"><span style="width:' +
          pct +
          '%"></span></div></div>'
        );
      })
      .join("");
  }

  function renderTopProducts(result) {
    var container = analyticsEl("adminTopProducts");
    if (!container) return;
    var entries = Object.keys(result.byProduct)
      .map(function (id) {
        return result.byProduct[id];
      })
      .sort(function (a, b) {
        return b.revenue - a.revenue;
      })
      .slice(0, 5);
    if (!entries.length) {
      container.innerHTML = '<li class="admin-analytics__state">No product sales in this period.</li>';
      return;
    }
    container.innerHTML = entries
      .map(function (entry) {
        return (
          '<li><span class="admin-top-products__info"><strong>' +
          escapeHtml(entry.name) +
          "</strong><small>" +
          entry.units +
          " unit" +
          (entry.units === 1 ? "" : "s") +
          " sold</small></span>" +
          '<span class="admin-top-products__value">£' +
          entry.revenue.toFixed(2) +
          "</span></li>"
        );
      })
      .join("");
  }

  function renderAnalytics() {
    if (!analyticsOrders) return;
    var result = analyze(analyticsOrders, analyticsPeriod);
    if (result.totals.orders === 0) {
      showAnalyticsState("empty");
      return;
    }
    renderSummary(result);
    renderChart(result);
    renderSalesByCategory(result);
    renderTopProducts(result);
    showAnalyticsState("body");
  }

  function loadAnalytics() {
    showAnalyticsState("loading");
    fetch(base + "api/orders", { method: "GET" })
      .then(function (res) {
        if (!res.ok) throw new Error("unavailable");
        return res.json();
      })
      .then(function (data) {
        analyticsOrders = data.orders || [];
        renderAnalytics();
      })
      .catch(function () {
        analyticsOrders = null;
        showAnalyticsState("error");
      });
  }

  (function initAnalyticsControls() {
    var periods = analyticsEl("adminAnalyticsPeriods");
    if (periods) {
      periods.addEventListener("click", function (e) {
        var btn = e.target && e.target.closest ? e.target.closest(".admin-period__btn") : null;
        if (!btn) return;
        var value = parseInt(btn.getAttribute("data-period"), 10);
        if (!value || value === analyticsPeriod) return;
        analyticsPeriod = value;
        Array.prototype.forEach.call(periods.querySelectorAll(".admin-period__btn"), function (b) {
          var active = b === btn;
          b.classList.toggle("is-active", active);
          b.setAttribute("aria-pressed", active ? "true" : "false");
        });
        if (analyticsOrders) renderAnalytics();
        else loadAnalytics();
      });
    }
    var retry = analyticsEl("adminAnalyticsRetry");
    if (retry) retry.addEventListener("click", loadAnalytics);
  })();

  showView("loading");
  renderOverview();
  window.YinscentAuth.refresh().then(function (isAdmin) {
    showView(isAdmin ? "dashboard" : "login");
    if (isAdmin) {
      renderKeyMetrics();
      loadAnalytics();
    }
  });

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      showError("");
      if (submitBtn) submitBtn.disabled = true;

      window.YinscentAuth.signIn(passwordInput ? passwordInput.value : "")
        .then(function () {
          if (passwordInput) passwordInput.value = "";
          showView("dashboard");
          renderKeyMetrics();
          loadAnalytics();
        })
        .catch(function (err) {
          showError(err.message || "Sign in failed. Please try again.");
        })
        .then(function () {
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  }

  if (signOutBtn) {
    signOutBtn.addEventListener("click", function () {
      signOutBtn.disabled = true;
      window.YinscentAuth.signOut().then(function () {
        signOutBtn.disabled = false;
        showView("login");
      });
    });
  }
})();
