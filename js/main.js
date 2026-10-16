(function () {
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  var products = window.YINSCENT_PRODUCTS || [];
  var categories = window.YINSCENT_CATEGORIES || [
    { id: "tealights", label: "Scented tealight candles", anchor: "#tealights", gridId: "productGrid" },
  ];

  function i18n() {
    return window.YINSCENT_I18N;
  }

  function tr(key, vars) {
    return i18n() && i18n().t ? i18n().t(key, vars) : key;
  }

  function formatMoney(amount) {
    if (window.YINSCENT_MONEY) return window.YINSCENT_MONEY(amount);
    var n = Number(amount);
    if (!isFinite(n)) n = 0;
    return "¥" + n.toFixed(2);
  }

  function locProduct(p) {
    return i18n() && i18n().localizeProduct ? i18n().localizeProduct(p) : p;
  }

  var categoryById = {};
  categories.forEach(function (c) {
    categoryById[c.id] = c;
  });

  function productCategory(p) {
    return p.category || "tealights";
  }

  function categoryLabel(p) {
    var id = productCategory(p);
    if (i18n() && i18n().categoryLabel) return i18n().categoryLabel(id);
    var cat = categoryById[id];
    return cat ? cat.label : "Scented tealight candles";
  }

  function categoryAnchor(p) {
    var cat = categoryById[productCategory(p)];
    return cat ? cat.anchor : "#tealights";
  }

  var base = window.YINSCENT_BASE || "/";

  function productImage(slug) {
    var url = base + "assets/products/" + slug + ".png";
    if (/^(apple|mango|cinnamon|cotton|cherry|ocean|jasmine|lavender|orange-blossom|coconut|vanilla|rose)-diffuser$/.test(slug)) url += "?v=2";
    if (/^(apple|mango|cinnamon|cotton|cherry|ocean|jasmine|lavender|orange-blossom|coconut|vanilla|rose)-diffuser-35$/.test(slug)) url += "?v=3";
    if (/^(vanilla|cotton|cherry|cinnamon|rose|mango|lavender|ocean|jasmine|apple|coconut|orange-blossom|strawberry-cream)-cozy$/.test(slug)) url += "?v=4";
    if (/^(lavender|cotton|ocean|rose|cherry|jasmine)-refill$/.test(slug)) url += "?v=5";
    if (/^(lavender|cotton|ocean|rose|cherry|jasmine)-refill-300$/.test(slug)) url += "?v=6";
    if (/^smart-diffuser-(aurora|halo|kitty)$/.test(slug)) url += "?v=7";
    if (/^(lavender|cotton|cherry|apple|rose|jasmine|coconut|cinnamon|mango|vanilla|ocean|orange-blossom)-pack$/.test(slug)) url += "?v=8";
    if (/^(eucalyptus|agarwood|amber-rose|red-berries|coconut|pinecone|vanilla|sandalwood|gardenia)-wood$/.test(slug)) url += "?v=10";
    if (/^(square|star|heart|plum-blossom)-tealight-holder$/.test(slug)) url += "?v=11";
    if (/^(passion-fruit-palo-santo|mango-sandalwood|pear-amber|sandalwood-ocean|freesia-amber|lavender-cotton)-diffuser$/.test(slug)) url += "?v=12";
    if (/^[a-z]+-zodiac-diffuser$/.test(slug)) url += "?v=13";
    if (/-reed-refill$/.test(slug)) url += "?v=14";
    if (/-christmas-diffuser$/.test(slug)) url += "?v=15";
    if (/-cup-candle$/.test(slug)) url += "?v=16";
    return url;
  }

  function productUrl(p) {
    return base + "index.html?id=" + encodeURIComponent(p.id);
  }

  function productThumb(p) {
    var imgs = p.images && p.images.length ? p.images : [p.slug];
    return productImage(imgs[0]);
  }

  function productFullName(p) {
    var lp = locProduct(p);
    if (lp.cartName) return lp.cartName;
    var name = lp.name;
    if (productCategory(p) === "scented-candles") {
      return tr("cat.scented-candles").replace(/s$/, "") + " — " + name;
    }
    if (productCategory(p) === "reed-diffusers") {
      return tr("cat.reed-diffusers").replace(/s$/, "") + " — " + name;
    }
    if (productCategory(p) === "tealight-holders") {
      return tr("cat.tealight-holders").replace(/s$/, "") + " — " + name.replace(" — 12 Pack", "").replace(" — 12 件装", "");
    }
    if (productCategory(p) === "ceramic-burners") {
      return tr("cat.ceramic-burners") + " — " + name;
    }
    if (productCategory(p) === "incense-holders") {
      return tr("cat.incense-holders") + " — " + name;
    }
    if (productCategory(p) === "scented-sachets") {
      return tr("cat.scented-sachets").replace(/s$/, "") + " — " + name;
    }
    if (productCategory(p) === "scented-wooden-balls") {
      return tr("cat.scented-wooden-balls") + " — " + name;
    }
    if (productCategory(p) === "deodorizing-balls") {
      return tr("cat.deodorizing-balls") + " — " + name;
    }
    if (productCategory(p) === "scented-gels") {
      return tr("cat.scented-gels") + " — " + name;
    }
    if (productCategory(p) === "essential-oils") {
      return tr("cat.essential-oils").replace(/s$/, "") + " — " + name;
    }
    if (productCategory(p) === "smart-aroma-refills") {
      return tr("cat.smart-aroma-refills") + " — " + name;
    }
    if (productCategory(p) === "smart-aroma-diffusers") {
      return tr("cat.smart-aroma-diffusers") + " — " + name;
    }
    return tr("cat.tealights") + " — " + name;
  }

  function productAlt(p) {
    var lp = locProduct(p);
    return "YINSCENT " + lp.name + " " + categoryLabel(p);
  }

  var SMART_COLOR_ORDER = [
    "smart-diffuser-aurora",
    "smart-diffuser-halo",
    "smart-diffuser-kitty",
    "amber-rose-smart-diffuser",
    "sweet-orange-smart-diffuser",
    "cedarwood-smart-diffuser",
    "gardenia-smart-diffuser",
  ];

  function sortSmartDiffusers(list) {
    return list.slice().sort(function (a, b) {
      var ia = SMART_COLOR_ORDER.indexOf(a.id);
      var ib = SMART_COLOR_ORDER.indexOf(b.id);
      if (ia === -1) ia = SMART_COLOR_ORDER.length;
      if (ib === -1) ib = SMART_COLOR_ORDER.length;
      if (ia !== ib) return ia - ib;
      return String(a.name || "").localeCompare(String(b.name || ""), undefined, { sensitivity: "base" });
    });
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
      if (/^\d+$/.test(x) && /^\d+$/.test(y)) {
        var diff = parseInt(x, 10) - parseInt(y, 10);
        if (diff) return diff;
      } else if (x !== y) {
        return x < y ? -1 : 1;
      }
    }
    return 0;
  }
  function sortBySku(list) {
    return list.slice().sort(function (a, b) {
      return compareSku(a.sku || a.ref || "", b.sku || b.ref || "") || String(a.name || "").localeCompare(String(b.name || ""), undefined, { numeric: true, sensitivity: "base" });
    });
  }

  function sortByName(list) {
    var sorted = list.slice().sort(function (a, b) {
      return String(a.name || "").localeCompare(String(b.name || ""), undefined, {
        sensitivity: "base",
        numeric: true,
      });
    });
    var from = -1;
    var after = -1;
    sorted.forEach(function (item, index) {
      if (item.id === "strawberry-cream-cozy") from = index;
      if (item.id === "vanilla-pack") after = index;
    });
    if (from !== -1 && after !== -1 && from !== after + 1) {
      var moved = sorted.splice(from, 1)[0];
      var insertAt = -1;
      sorted.forEach(function (item, index) {
        if (item.id === "vanilla-pack") insertAt = index;
      });
      sorted.splice(insertAt + 1, 0, moved);
    }
    return sorted;
  }

  function isLandscapeProduct(catId) {
    return (
      catId === "scented-candles" ||
      catId === "reed-diffusers" ||
      catId === "tealight-holders" ||
      catId === "ceramic-burners" ||
      catId === "incense-holders" ||
      catId === "scented-sachets" ||
      catId === "deodorizing-balls" ||
      catId === "scented-gels" ||
      catId === "essential-oils" ||
      catId === "smart-aroma-refills" ||
      catId === "smart-aroma-diffusers"
    );
  }

  function catSuffix(catId) {
    if (catId === "scented-candles") return tr("suffix.candle");
    if (catId === "reed-diffusers") return tr("suffix.diffuser");
    if (catId === "tealight-holders") return tr("suffix.holder");
    if (catId === "ceramic-burners") return tr("suffix.burner");
    if (catId === "incense-holders") return tr("suffix.incense");
    if (catId === "scented-sachets") return tr("suffix.sachet");
    if (catId === "scented-wooden-balls") return tr("suffix.wood");
    if (catId === "deodorizing-balls") return tr("suffix.deo");
    if (catId === "scented-gels") return tr("suffix.gel");
    if (catId === "essential-oils") return tr("suffix.oil");
    if (catId === "smart-aroma-refills") return tr("suffix.refill");
    if (catId === "smart-aroma-diffusers") return tr("suffix.smart");
    return "";
  }

  function priceLine(p) {
    var site = window.YINSCENT_SITE;
    if (site && site.showPrice === false) return "";
    return '<p class="product__price">' + formatMoney(p.price) + "</p>";
  }
  function stockLine(p) {
    var site = window.YINSCENT_SITE;
    if (!site || !site.showStock || p.stock == null || p.stock === "" || !isFinite(Number(p.stock))) return "";
    return '<p class="product__stock">' + tr("stock.label") + " " + Number(p.stock) + "</p>";
  }

  function renderProductCard(p, grid) {
    var lp = locProduct(p);
    var article = document.createElement("article");
    var catId = productCategory(p);
    article.className =
      "product" +
      (grid ? " product--grid" : "") +
      (isLandscapeProduct(catId) ? " product--landscape" : "");
    article.setAttribute("data-id", p.id);
    article.setAttribute("data-name", productFullName(p));
    article.setAttribute("data-price", p.price);

    var cardName = catId === "deodorizing-balls" ? lp.name + "-4pcs" : lp.name;

    article.innerHTML =
      '<a href="' + productUrl(p) + '" class="product__img-wrap">' +
      '<img class="product__img" src="' + productThumb(p) + '" alt="' + productAlt(p) + '" loading="lazy" />' +
      '<button type="button" class="product__wish" aria-label="' + tr("btn.wish") + '">♡</button>' +
      "</a>" +
      '<p class="product__cat">' + categoryLabel(p) + "</p>" +
      '<h3 class="product__name"><a href="' + productUrl(p) + '">' + cardName + "</a></h3>" +
      (grid ? '<p class="product__desc">' + lp.desc + "</p>" : "") +
      priceLine(p) + stockLine(p);

    return article;
  }

  function bindCatalog() {
    if (window.YINSCENT_PRODUCTS) products = window.YINSCENT_PRODUCTS;
    if (window.YINSCENT_CATEGORIES) categories = window.YINSCENT_CATEGORIES;
    categoryById = {};
    categories.forEach(function (c) {
      categoryById[c.id] = c;
    });
  }

  function setSeriesHeading(el, text) {
    var value = String(text || "");
    el.textContent = "";
    var mark = value.lastIndexOf("g");
    if (mark < 0) {
      el.textContent = value;
      return;
    }
    el.appendChild(document.createTextNode(value.slice(0, mark)));
    var unit = document.createElement("span");
    unit.className = "series-unit";
    unit.textContent = "g";
    el.appendChild(unit);
    if (mark < value.length - 1) el.appendChild(document.createTextNode(value.slice(mark + 1)));
  }

  function seriesTitle(items, fallback) {
    var lang = i18n() && i18n().getLang ? i18n().getLang() : "zh";
    if (lang !== "zh" && lang !== "zh-Hant") return fallback;
    var names = {};
    items.forEach(function (product) {
      if (product.tradeName) names[product.tradeName] = true;
    });
    var keys = Object.keys(names);
    if (keys.length !== 1) return fallback;
    if (lang === "zh-Hant" && i18n().toTraditional) return i18n().toTraditional(keys[0]);
    return keys[0];
  }

  function renderSeriesBlock(host, id, title, items) {
    if (!host || !items.length) return;
    var block = document.createElement("section");
    block.className = "series-block";
    block.id = id;
    var heading = document.createElement("h3");
    heading.className = "series-block__title";
    heading.textContent = title;
    var grid = document.createElement("div");
    grid.className = "product-grid product-grid--candles";
    items.forEach(function (product) { grid.appendChild(renderProductCard(product, true)); });
    block.appendChild(heading);
    block.appendChild(grid);
    host.appendChild(block);
  }

  function renderDiffuserSeries(host, list) {
    ["35", "100", "beige", "animal", "zodiac", "christmas", "mexico", "fiber"].forEach(function (key) {
      var items = sortBySku(list.filter(function (product) { return product.series === key; }));
      renderSeriesBlock(host, "diffuser-series-" + key, seriesTitle(items, tr("diffusers.series." + key)), items);
    });
    var refills = sortBySku(list.filter(function (product) { return product.series === "refill"; }));
    renderSeriesBlock(
      document.getElementById("refillSeries") || host,
      "diffuser-series-refill",
      seriesTitle(refills, tr("diffusers.series.refill")),
      refills
    );
  }

  function clearCatalog() {
    var track = document.getElementById("categoryTrack");
    var topTrack = document.getElementById("productTrack");
    if (track) track.innerHTML = "";
    if (topTrack) topTrack.innerHTML = "";
    categories.forEach(function (cat) {
      var grid = document.getElementById(cat.gridId);
      if (grid) grid.innerHTML = "";
    });
    var candleSeries = document.getElementById("candleSeries");
    if (candleSeries) candleSeries.innerHTML = "";
    var tealightGrid9 = document.getElementById("tealightGrid9");
    if (tealightGrid9) tealightGrid9.innerHTML = "";
    var tealightGridWhite = document.getElementById("tealightGridWhite");
    if (tealightGridWhite) tealightGridWhite.innerHTML = "";
    var refillGrid300 = document.getElementById("refillGrid300");
    if (refillGrid300) refillGrid300.innerHTML = "";
    var cupGrid = document.getElementById("cupGrid");
    if (cupGrid) cupGrid.innerHTML = "";
    var refillSeries = document.getElementById("refillSeries");
    if (refillSeries) refillSeries.innerHTML = "";
  }

  function renderCatalog() {
    var track = document.getElementById("categoryTrack");
    var topTrack = document.getElementById("productTrack");
    var sortedProducts = sortByName(products);

    if (track) {
      sortedProducts.forEach(function (p, i) {
        var lp = locProduct(p);
        var a = document.createElement("a");
        a.href = productUrl(p);
        a.className = "category-pill" + (i === 0 ? " is-active" : "");
        a.innerHTML =
          '<img class="category-pill__img" src="' + productThumb(p) + '" alt="" width="72" height="72" />' +
          "<span>" +
          lp.name +
          catSuffix(productCategory(p)) +
          "</span>";
        track.appendChild(a);
      });
    }

    if (topTrack) {
      sortByName(
        products.filter(function (p) {
          return p.featured;
        })
      ).forEach(function (p) {
        topTrack.appendChild(renderProductCard(p, false));
      });
    }

    categories.forEach(function (cat) {
      var grid = document.getElementById(cat.gridId);
      if (!grid) return;
      var items = products.filter(function (p) {
        return productCategory(p) === cat.id;
      });
      if (cat.id === "tealights") {
        function isWhiteTealight(product) {
          return product.series === "white" || /^white-tealight-/.test(product.id);
        }
        var whiteItems = sortBySku(items.filter(isWhiteTealight));
        var rest = items.filter(function (product) { return !isWhiteTealight(product); });
        var sixItems = sortBySku(rest.filter(function (product) { return /-cozy$/.test(product.id); }));
        var nineItems = sortBySku(rest.filter(function (product) { return !/-cozy$/.test(product.id); }));
        sixItems.forEach(function (product) { grid.appendChild(renderProductCard(product, true)); });
        var nine = document.getElementById("tealightGrid9");
        if (nine) nineItems.forEach(function (product) { nine.appendChild(renderProductCard(product, true)); });
        var whiteGrid = document.getElementById("tealightGridWhite");
        if (whiteGrid) whiteItems.forEach(function (product) { whiteGrid.appendChild(renderProductCard(product, true)); });
        var sixHead = document.querySelector("#tealight-series-6 h3");
        var nineHead = document.querySelector("#tealight-series-9 h3");
        var whiteHead = document.querySelector("#tealight-series-white h3");
        if (sixHead) sixHead.textContent = seriesTitle(sixItems, tr("tealights.series.6"));
        if (nineHead) nineHead.textContent = seriesTitle(nineItems, tr("tealights.series.9"));
        if (whiteHead) whiteHead.textContent = seriesTitle(whiteItems, tr("tealights.series.white"));
        return;
      }
      if (cat.id === "scented-candles") {
        var jars = sortBySku(items.filter(function (product) { return product.series !== "cup"; }));
        jars.forEach(function (product) { grid.appendChild(renderProductCard(product, true)); });
        var jarHead = document.querySelector("#candle-series-jar h3");
        if (jarHead) jarHead.textContent = seriesTitle(jars, tr("candles.series.jar"));
        var stack = document.getElementById("candleSeries");
        var cups = sortBySku(items.filter(function (product) { return product.series === "cup"; }));
        if (stack && cups.length) {
          var block = document.createElement("section");
          block.className = "series-block";
          block.id = "candle-series-cup";
          var title = document.createElement("h3");
          title.className = "series-block__title";
          setSeriesHeading(title, seriesTitle(cups, tr("candles.series.cup")));
          var inner = document.createElement("div");
          inner.className = "product-grid product-grid--candles";
          cups.forEach(function (product) { inner.appendChild(renderProductCard(product, true)); });
          block.appendChild(title);
          block.appendChild(inner);
          stack.appendChild(block);
        }
        return;
      }
      if (cat.id === "reed-diffusers") {
        renderDiffuserSeries(grid, items);
        return;
      }
      if (cat.id === "smart-aroma-diffusers") {
        sortSmartDiffusers(items).forEach(function (product) {
          grid.appendChild(renderProductCard(product, true));
        });
        return;
      }
      if (cat.id === "smart-aroma-refills") {
        var hundred = sortBySku(items.filter(function (product) { return !/-refill-300$/.test(product.id); }));
        var threeHundred = sortBySku(items.filter(function (product) { return /-refill-300$/.test(product.id); }));
        hundred.forEach(function (product) { grid.appendChild(renderProductCard(product, true)); });
        var grid300 = document.getElementById("refillGrid300");
        if (grid300) threeHundred.forEach(function (product) { grid300.appendChild(renderProductCard(product, true)); });
        var head100 = document.querySelector("#refill-series-100 h3");
        var head300 = document.querySelector("#refill-series-300 h3");
        if (head100) head100.textContent = seriesTitle(hundred, tr("refills.series.100"));
        if (head300) head300.textContent = seriesTitle(threeHundred, tr("refills.series.300"));
        return;
      }
      if (cat.id === "tealight-holders") {
        var cups = sortBySku(items.filter(function (product) { return product.id === "ribbed-tealight-cup"; }));
        var holders = sortBySku(items.filter(function (product) { return product.id !== "ribbed-tealight-cup"; }));
        holders.forEach(function (product) { grid.appendChild(renderProductCard(product, true)); });
        var cupGrid = document.getElementById("cupGrid");
        if (cupGrid) cups.forEach(function (product) { cupGrid.appendChild(renderProductCard(product, true)); });
        var holderHead = document.querySelector("#holder-series h3");
        var cupHead = document.querySelector("#tealight-cup h3");
        if (holderHead) holderHead.textContent = seriesTitle(holders, tr("holders.title"));
        if (cupHead) cupHead.textContent = seriesTitle(cups, tr("holders.cup"));
        return;
      }
      if (cat.id === "ceramic-burners") {
        var burnerItems = sortBySku(items);
        var burnerHead = document.querySelector("#ceramic-burners h3");
        if (burnerHead) burnerHead.textContent = seriesTitle(burnerItems, tr("burners.title"));
        burnerItems.forEach(function (product) { grid.appendChild(renderProductCard(product, true)); });
        return;
      }
      var sortedItems = sortBySku(items);
      if (cat.id === "scented-gels") {
        var gelHead = document.querySelector("#scented-gels h2");
        if (gelHead) gelHead.textContent = seriesTitle(sortedItems, tr("gels.title"));
      }
      if (cat.id === "deodorizing-balls") {
        var deoHead = document.querySelector("#deodorizing-balls h2");
        if (deoHead) deoHead.textContent = seriesTitle(sortedItems, tr("balls.title"));
      }
      if (cat.id === "incense-holders") {
        var incenseHead = document.querySelector("#incense-holders h2");
        if (incenseHead) incenseHead.textContent = seriesTitle(sortedItems, tr("incense.title"));
      }
      sortedItems.forEach(function (p) {
        grid.appendChild(renderProductCard(p, true));
      });
    });
    applyHeaderSearch();
    scrollToCurrentHash();
  }

  function scrollToCurrentHash() {
    var id = (window.location.hash || "").replace(/^#/, "");
    if (!id) return;
    var target = document.getElementById(id);
    if (!target) return;
    var root = document.documentElement;
    var prev = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    target.scrollIntoView({ block: "start" });
    root.style.scrollBehavior = prev;
  }

  var pageParams = new URLSearchParams(window.location.search);
  var detailPage = pageParams.get("page");
  var isDetailView = Boolean(pageParams.get("id")) || detailPage === "story" || detailPage === "contact";

  function openCatalog() {
    if (isDetailView) return;
    bindCatalog();
    document.documentElement.classList.add("is-member");
    clearCatalog();
    renderCatalog();
  }

  function signedInForShop() {
    var auth = window.YinscentAuth;
    if (!auth) return false;
    if (auth.getMember && auth.getMember()) return true;
    return !!(auth.isAdmin && auth.isAdmin());
  }

  function requireMember() {
    var page = pageParams.get("page");
    var member = signedInForShop();
    var next = "index.html" + window.location.search + window.location.hash;
    if (!member) {
      if (page === "story" || page === "contact") return;
      window.location.replace(base + "login.html?next=" + encodeURIComponent(next));
      return;
    }
    if (page === "story" || page === "contact") return;
    if (window.YinscentCatalog && window.YinscentCatalog.load) {
      window.YinscentCatalog.load().then(function (ok) {
        if (ok) openCatalog();
      });
      return;
    }
    openCatalog();
  }

  if (window.YinscentAuth && window.YinscentAuth.whenReady) {
    window.YinscentAuth.whenReady().then(requireMember);
  }

  window.addEventListener("yinscent:langchange", function () {
    if (!isDetailView && document.documentElement.classList.contains("is-member")) {
      clearCatalog();
      renderCatalog();
    }
  });

  /* Hidden admin access: click the footer copyright line 5 times within 3s */
  var adminTapTarget = document.querySelector(".footer__copy");
  var adminTapCount = 0;
  var adminTapTimer;
  if (adminTapTarget) {
    adminTapTarget.addEventListener("click", function () {
      adminTapCount += 1;
      clearTimeout(adminTapTimer);
      adminTapTimer = setTimeout(function () {
        adminTapCount = 0;
      }, 3000);
      if (adminTapCount >= 5) {
        adminTapCount = 0;
        window.location.href = base + "admin.html";
      }
    });
  }

  /* User menu */
  var userMenu = document.getElementById("userMenu");
  var userMenuToggle = document.getElementById("userMenuToggle");
  var userMenuDropdown = document.getElementById("userMenuDropdown");
  function updateUserMenu() {
    var auth = window.YinscentAuth;
    var user = auth && auth.getMember ? auth.getMember() : null;
    var admin = auth && auth.isAdmin && auth.isAdmin();
    var signedIn = !!(user || admin);
    var nameEl = document.getElementById("headUserName");
    var idEl = document.getElementById("headUserId");
    var accountName = tr("account.guest");
    var accountId = "";
    if (user) {
      accountName = user.name || user.username || tr("account.member");
      accountId = user.username || "";
    } else if (admin && auth.getAdmin && auth.getAdmin()) {
      var person = auth.getAdmin();
      accountName = person.super ? tr("account.admin_name") : (person.name || person.username || tr("account.staff"));
      accountId = person.super ? "" : (person.username || "");
    }
    if (nameEl) nameEl.textContent = accountName;
    if (idEl) {
      idEl.textContent = accountId;
      idEl.hidden = !accountId;
    }
    var signIn = document.getElementById("userMenuSignIn");
    var orders = document.getElementById("userMenuOrders");
    var cart = document.getElementById("userMenuCart");
    var switchAccount = document.getElementById("userMenuSwitch");
    var signOut = document.getElementById("userMenuSignOut");
    var adminMenu = !!(admin && !user);
    if (signIn) signIn.hidden = signedIn;
    if (orders) orders.hidden = !user;
    if (cart) cart.hidden = !user;
    if (switchAccount) switchAccount.hidden = !adminMenu;
    if (signOut) signOut.hidden = !signedIn;
    if (userMenu) userMenu.classList.toggle("is-signed-in", signedIn);
    var desk = document.getElementById("headerDesk");
    if (desk) desk.hidden = !adminMenu;
    paintDeskAlert(desk, adminMenu);
    var pages = document.getElementById("headerPages");
    if (pages) {
      pages.innerHTML = "";
      pages.hidden = true;
    }
  }
  function paintDeskAlert(desk, adminMenu) {
    if (!desk) return;
    var existing = desk.querySelectorAll(".header__alert");
    for (var i = 0; i < existing.length; i++) existing[i].remove();
    if (!adminMenu) return;
    var stamp = String(Date.now()) + Math.random();
    desk.setAttribute("data-alert", stamp);
    fetch(base + "api/admin/alerts", { credentials: "same-origin" }).then(function (res) {
      return res.ok ? res.json() : null;
    }).then(function (data) {
      if (!data || desk.hidden || desk.getAttribute("data-alert") !== stamp) return;
      var stale = desk.querySelectorAll(".header__alert");
      for (var n = 0; n < stale.length; n++) stale[n].remove();
      var count = (Number(data.review) || 0) + (Number(data.service) || 0);
      if (count < 1) return;
      var badge = document.createElement("span");
      badge.className = "header__alert";
      badge.textContent = count > 99 ? "99+" : String(count);
      desk.appendChild(badge);
    }).catch(function () {});
  }

  updateUserMenu();
  document.addEventListener("yinscent:auth", updateUserMenu);

  function leaveToLogin(adminOnly) {
    setUserMenuOpen(false);
    var auth = window.YinscentAuth;
    if (!auth) {
      window.location.href = base + "login.html";
      return;
    }
    var jobs = [auth.signOut()];
    if (!adminOnly && auth.signOutMember) jobs.push(auth.signOutMember());
    Promise.all(jobs).then(function () {
      window.location.href = base + "login.html";
    });
  }

  var switchBtn = document.getElementById("userMenuSwitch");
  if (switchBtn) {
    switchBtn.addEventListener("click", function () {
      leaveToLogin(false);
    });
  }

  var signOutBtn = document.getElementById("userMenuSignOut");
  if (signOutBtn) {
    signOutBtn.addEventListener("click", function () {
      var auth = window.YinscentAuth;
      var member = auth && auth.getMember && auth.getMember();
      var admin = auth && auth.isAdmin && auth.isAdmin();
      leaveToLogin(!!(admin && !member));
    });
  }

  var cartBtn = document.getElementById("userMenuCart");
  if (cartBtn) {
    cartBtn.addEventListener("click", function () {
      setUserMenuOpen(false);
      var overlay = document.getElementById("cartOverlay");
      if (!overlay) return;
      overlay.classList.add("is-open");
      overlay.setAttribute("aria-hidden", "false");
    });
  }
  var cartClose = document.getElementById("cartClose");
  var cartOverlay = document.getElementById("cartOverlay");
  var cartEmpty = document.getElementById("cartEmpty");
  var cartList = document.getElementById("cartList");
  var cartSummary = document.getElementById("cartSummary");
  var cartSubtotal = document.getElementById("cartSubtotal");
  var CART_KEY = "yinscent-cart";

  function readCart() {
    try {
      var parsed = JSON.parse(sessionStorage.getItem(CART_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function writeCart(items) {
    try {
      sessionStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch (e) {}
  }

  function cartMoney(amount) {
    if (window.YINSCENT_MONEY) return window.YINSCENT_MONEY(amount);
    var n = Number(amount);
    if (!isFinite(n)) n = 0;
    return "¥" + n.toFixed(2);
  }

  function cartText(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function openCart() {
    if (!cartOverlay) return;
    cartOverlay.classList.add("is-open");
    cartOverlay.setAttribute("aria-hidden", "false");
  }

  function renderCart() {
    if (!cartList || !cartEmpty) return;
    var items = readCart();
    cartEmpty.hidden = items.length > 0;
    cartList.hidden = !items.length;
    if (cartSummary) cartSummary.hidden = !items.length;
    var total = 0;
    cartList.innerHTML = items
      .map(function (item) {
        var qty = Math.max(1, parseInt(item.qty, 10) || 1);
        var price = Number(item.price) || 0;
        total += price * qty;
        return (
          '<li class="cart-item">' +
          '<span class="cart-item__image"><img src="' + cartText(item.image) + '" alt="" /></span>' +
          '<div class="cart-item__details">' +
          '<div class="cart-item__top"><p class="cart-item__name">' + cartText(item.name) + "</p>" +
          '<button type="button" class="cart-item__remove" data-id="' + cartText(item.id) + '" aria-label="移除">×</button></div>' +
          '<p class="cart-item__price">' + cartMoney(price) + "</p>" +
          '<div class="cart-item__bottom"><span class="cart-quantity">' +
          '<button type="button" data-qty="minus" data-id="' + cartText(item.id) + '" aria-label="减少数量"' + (qty <= 1 ? " disabled" : "") + ">−</button>" +
          "<span>" + qty + "</span>" +
          '<button type="button" data-qty="plus" data-id="' + cartText(item.id) + '" aria-label="增加数量">+</button>' +
          "</span>" +
          '<strong class="cart-item__total">' + cartMoney(price * qty) + "</strong></div>" +
          "</div></li>"
        );
      })
      .join("");
    if (cartSubtotal) cartSubtotal.textContent = cartMoney(total);
  }

  if (cartList) {
    cartList.addEventListener("click", function (event) {
      var target = event.target.closest ? event.target.closest("button") : null;
      if (!target) return;
      var id = target.getAttribute("data-id");
      if (!id) return;
      var items = readCart();
      if (target.classList.contains("cart-item__remove")) {
        writeCart(items.filter(function (item) { return item.id !== id; }));
        renderCart();
        return;
      }
      var step = target.getAttribute("data-qty");
      if (!step) return;
      items.forEach(function (item) {
        if (item.id !== id) return;
        var qty = Math.max(1, parseInt(item.qty, 10) || 1);
        if (step === "plus") item.qty = qty + 1;
        if (step === "minus") item.qty = Math.max(1, qty - 1);
      });
      writeCart(items);
      renderCart();
    });
  }

  window.YinscentCart = {
    add: function (item) {
      if (!item || !item.id) return;
      var items = readCart();
      var found = items.find(function (row) { return row.id === item.id; });
      if (found) found.qty = (parseInt(found.qty, 10) || 1) + 1;
      else items.push({ id: item.id, name: item.name || "", price: item.price, image: item.image || "", qty: 1 });
      writeCart(items);
      renderCart();
      openCart();
    },
  };
  renderCart();

  if (cartClose && cartOverlay) {
    cartClose.addEventListener("click", function () {
      cartOverlay.classList.remove("is-open");
      cartOverlay.setAttribute("aria-hidden", "true");
    });
    cartOverlay.addEventListener("click", function (e) {
      if (e.target === cartOverlay) {
        cartOverlay.classList.remove("is-open");
        cartOverlay.setAttribute("aria-hidden", "true");
      }
    });
  }

  function setUserMenuOpen(open) {
    if (!userMenuDropdown || !userMenuToggle) return;
    userMenuDropdown.hidden = !open;
    userMenuToggle.setAttribute("aria-expanded", open ? "true" : "false");
  }

  if (userMenuToggle) {
    userMenuToggle.addEventListener("click", function () {
      setUserMenuOpen(userMenuDropdown && userMenuDropdown.hidden);
    });
  }
  document.addEventListener("click", function (e) {
    if (userMenu && !userMenu.contains(e.target)) setUserMenuOpen(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      setUserMenuOpen(false);
      setLangMenu(false);
    }
  });

  var langNames = { zh: "简体中文", "zh-Hant": "繁體中文", en: "English", es: "Español", pt: "Português" };
  var langBtn = document.getElementById("headLangBtn");
  var langMenu = document.getElementById("headLangMenu");
  var langLabel = document.getElementById("headLangLabel");
  function paintLang() {
    var lang = window.YINSCENT_I18N && window.YINSCENT_I18N.getLang ? window.YINSCENT_I18N.getLang() : "zh";
    if (langLabel) langLabel.textContent = langNames[lang] || "简体中文";
    var searchBox = document.getElementById("headSearchInput");
    if (searchBox) {
      searchBox.placeholder = tr("search.placeholder");
      searchBox.setAttribute("aria-label", tr("search.placeholder"));
    }
    var searchGo = document.querySelector(".head-search__go");
    if (searchGo) searchGo.setAttribute("aria-label", tr("search.go"));
    var orderLink = document.getElementById("userMenuOrders");
    if (orderLink) orderLink.textContent = tr("account.orders_menu");
    var cartItem = document.getElementById("userMenuCart");
    if (cartItem) cartItem.textContent = tr("account.cart");
    var switchItem = document.getElementById("userMenuSwitch");
    if (switchItem) switchItem.textContent = tr("account.switch");
    var signOutItem = document.getElementById("userMenuSignOut");
    if (signOutItem) signOutItem.textContent = tr("account.signout");
    var deskLabel = document.getElementById("headerDeskLabel");
    if (deskLabel) deskLabel.textContent = tr("desk.work");
  }
  function setLangMenu(open) {
    if (!langMenu || !langBtn) return;
    langMenu.hidden = !open;
    langBtn.setAttribute("aria-expanded", open ? "true" : "false");
  }
  paintLang();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", paintLang);
  else paintLang();
  window.addEventListener("yinscent:langchange", function () {
    paintLang();
    updateUserMenu();
    setLangMenu(false);
  });
  if (langBtn) {
    langBtn.addEventListener("click", function (event) {
      event.stopPropagation();
      setLangMenu(langMenu && langMenu.hidden);
    });
  }
  document.addEventListener("click", function (event) {
    var host = document.getElementById("headLang");
    if (host && !host.contains(event.target)) setLangMenu(false);
  });

  var searchForm = document.getElementById("headSearch");
  var searchInput = document.getElementById("headSearchInput");
  function applyHeaderSearch() {
    var input = document.getElementById("headSearchInput");
    var q = input ? input.value.trim().toLowerCase() : "";
    var cards = document.querySelectorAll("#shopMain .product");
    cards.forEach(function (card) {
      var name = (card.getAttribute("data-name") || card.textContent || "").toLowerCase();
      card.hidden = !!q && name.indexOf(q) === -1;
    });
    document.querySelectorAll("#shopMain .section--category, #top-sellers, .category-strip").forEach(function (section) {
      if (!q) {
        section.hidden = false;
        return;
      }
      if (section.classList.contains("category-strip")) {
        section.hidden = true;
        return;
      }
      section.hidden = !section.querySelector(".product:not([hidden])");
    });
    document.querySelectorAll(".series-block").forEach(function (block) {
      block.hidden = !!q && !block.querySelector(".product:not([hidden])");
    });
    var empty = document.getElementById("catalogSearchEmpty");
    var shop = document.getElementById("shopMain");
    if (shop && !empty) {
      empty = document.createElement("p");
      empty.id = "catalogSearchEmpty";
      empty.className = "catalog-empty";
      empty.hidden = true;
      var anchor = document.getElementById("top-sellers");
      if (anchor) shop.insertBefore(empty, anchor);
      else shop.appendChild(empty);
    }
    if (empty) {
      var any = document.querySelector("#shopMain .product:not([hidden])");
      empty.hidden = !q || !!any;
      empty.textContent = q && !any ? tr("search.empty") : "";
    }
  }
  window.applyHeaderSearch = applyHeaderSearch;
  if (searchForm) {
    searchForm.addEventListener("submit", function (event) {
      event.preventDefault();
      applyHeaderSearch();
      var first = document.querySelector("#shopMain .section--category:not([hidden]), #top-sellers:not([hidden])");
      if (first && searchInput && searchInput.value.trim()) first.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  /* Menu drawer */
  var menuOverlay = document.getElementById("menuOverlay");
  var menuOpen = document.getElementById("menuOpen");
  var menuClose = document.getElementById("menuClose");

  function setMenuOpen(open) {
    if (!menuOverlay) return;
    menuOverlay.classList.toggle("is-open", open);
    menuOverlay.setAttribute("aria-hidden", open ? "false" : "true");
    document.body.style.overflow = open ? "hidden" : "";
  }

  if (menuOpen) menuOpen.addEventListener("click", function () { setMenuOpen(true); });
  if (menuClose) menuClose.addEventListener("click", function () { setMenuOpen(false); });
  if (menuOverlay) {
    menuOverlay.addEventListener("click", function (e) {
      if (e.target === menuOverlay) setMenuOpen(false);
    });
    menuOverlay.querySelectorAll(".drawer__nav a, .drawer__sub a").forEach(function (link) {
      link.addEventListener("click", function () { setMenuOpen(false); });
    });
  }

  document.body.addEventListener("click", function (e) {
    var wishBtn = e.target.closest(".product__wish");
    if (wishBtn) {
      e.preventDefault();
      e.stopPropagation();
      var on = wishBtn.classList.toggle("is-active");
      wishBtn.textContent = on ? "♥" : "♡";
      wishBtn.setAttribute("aria-label", on ? tr("btn.unwish") : tr("btn.wish"));
    }
  });

  document.getElementById("categoryTrack") &&
    document.getElementById("categoryTrack").addEventListener("click", function (e) {
      var pill = e.target.closest(".category-pill");
      if (!pill) return;
      e.preventDefault();
      document.querySelectorAll(".category-pill").forEach(function (p) {
        p.classList.remove("is-active");
      });
      pill.classList.add("is-active");
    });

  /* Hero poster carousel */
  var heroPoster = document.getElementById("heroPoster");
  if (heroPoster) {
    var heroSlides = heroPoster.querySelectorAll(".hero-poster__img");
    var heroDots = heroPoster.querySelectorAll(".hero-poster__dot");
    var heroLink = document.getElementById("heroPosterLink");
    var heroIndex = 0;
    var heroTimer;

    function showHeroSlide(index) {
      heroIndex = index;
      heroSlides.forEach(function (img, i) {
        img.classList.toggle("is-active", i === index);
      });
      heroDots.forEach(function (dot, i) {
        var on = i === index;
        dot.classList.toggle("is-active", on);
        dot.setAttribute("aria-selected", on ? "true" : "false");
      });
      if (heroLink && heroSlides[index]) {
        var target = heroSlides[index].getAttribute("data-target") || "#tealights";
        heroLink.setAttribute("href", target);
      }
    }

    function nextHeroSlide() {
      showHeroSlide((heroIndex + 1) % heroSlides.length);
    }

    function startHeroTimer() {
      clearInterval(heroTimer);
      heroTimer = setInterval(nextHeroSlide, 6000);
    }

    heroDots.forEach(function (dot) {
      dot.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var i = parseInt(dot.getAttribute("data-slide"), 10);
        if (!isNaN(i)) {
          showHeroSlide(i);
          startHeroTimer();
        }
      });
    });

    if (heroSlides.length > 1) {
      showHeroSlide(0);
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        startHeroTimer();
      }
    }
  }

  function markCurrentNav() {
    var hash = window.location.hash;
    var params = new URLSearchParams(window.location.search);
    var onShop = !params.get("page") && !params.get("id");
    document.querySelectorAll(".header__nav a, .drawer__nav a, .drawer__sub a").forEach(function (a) {
      var href = a.getAttribute("href") || "";
      var mark = href.indexOf("#");
      var linkHash = mark >= 0 ? href.slice(mark) : "";
      a.classList.toggle("is-current", Boolean(onShop && hash && linkHash === hash));
    });
  }
  markCurrentNav();
  window.addEventListener("hashchange", function () {
    markCurrentNav();
    scrollToCurrentHash();
  });

  function applyPublicSite(site) {
    if (!site) return;
    window.YINSCENT_SITE = site;
    if (site.logo && String(site.logo).indexOf("data:image/") === 0) {
      document.querySelectorAll(".header__logo img, .drawer__logo img, .footer__logo img").forEach(function (img) {
        img.src = site.logo;
      });
    }
    var copy = document.querySelector(".footer__copy");
    var defaultCopy = "© {year} YINSCENT. All rights reserved.";
    if (copy && site.copyright && String(site.copyright).trim() !== defaultCopy) {
      copy.removeAttribute("data-i18n");
      copy.textContent = String(site.copyright).replace("{year}", String(new Date().getFullYear()));
    }
    var social = site.social || {};
    var names = { Instagram: "instagram", Facebook: "facebook", Pinterest: "pinterest" };
    document.querySelectorAll(".footer__social a").forEach(function (link) {
      var key = names[link.getAttribute("aria-label") || ""];
      if (key && social[key]) link.href = social[key];
    });
    if (social.youtube && !document.querySelector('.footer__social a[data-social="youtube"]')) {
      var host = document.querySelector(".footer__social");
      if (host) {
        var youtube = document.createElement("a");
        youtube.href = social.youtube;
        youtube.setAttribute("aria-label", "YouTube");
        youtube.setAttribute("data-social", "youtube");
        youtube.textContent = "YouTube";
        host.appendChild(youtube);
      }
    }
    var facts = document.getElementById("contactFacts");
    if (facts) {
      var lines = [site.company, site.phone, site.email, site.address, site.domain].filter(Boolean);
      facts.hidden = !lines.length;
      facts.innerHTML = "";
      lines.forEach(function (line) {
        var row = document.createElement("p");
        row.textContent = line;
        facts.appendChild(row);
      });
    }
    if (site.enableInquiry === false) {
      document.querySelectorAll('a[href*="page=contact"]').forEach(function (link) {
        if (link.closest && link.closest("#contactDetail")) return;
        link.hidden = true;
      });
    }
    document.documentElement.classList.toggle("is-hide-price", site.showPrice === false);
    if (window.YINSCENT_I18N && site.languages && site.languages.length) {
      function langEnabled(code) {
        if (site.languages.indexOf(code) !== -1) return true;
        return code === "zh-Hant" && site.languages.indexOf("zh") !== -1;
      }
      document.querySelectorAll(".lang-switch__btn").forEach(function (btn) {
        btn.hidden = !langEnabled(btn.getAttribute("data-lang"));
      });
      var stored = "";
      try { stored = localStorage.getItem("yinscent-lang") || ""; } catch (e) {}
      if (!stored) window.YINSCENT_I18N.setLang(site.defaultLanguage || "zh", { silent: true });
      else if (!langEnabled(window.YINSCENT_I18N.getLang())) window.YINSCENT_I18N.setLang(site.defaultLanguage || site.languages[0]);
    }
    if (!isDetailView && document.documentElement.classList.contains("is-member")) {
      clearCatalog();
      renderCatalog();
    }
  }
  fetch(base + "api/site").then(function (res) { return res.json(); }).then(function (data) {
    applyPublicSite(data && data.site);
  }).catch(function () {});

  /* Newsletter */
  var newsletterForm = document.getElementById("newsletterForm");
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = newsletterForm.querySelector('input[type="email"]');
      if (input && input.value) {
        alert("Thank you for subscribing to YINSCENT.");
        input.value = "";
      }
    });
  }
})();
