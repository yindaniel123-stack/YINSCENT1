(function () {
  var id = new URLSearchParams(window.location.search).get("id");
  if (!id) return;

  var root = document.getElementById("productDetail");
  var shopMain = document.getElementById("shopMain");
  if (!root) return;

  var products = [];
  var categories = [];
  var categoryById = {};
  var product = null;

  function bindCatalog() {
    products = window.YINSCENT_PRODUCTS || [];
    categories = window.YINSCENT_CATEGORIES || [];
    categoryById = {};
    categories.forEach(function (c) {
      categoryById[c.id] = c;
    });
    product = products.find(function (p) {
      return p.id === id;
    });
  }

  var base = window.YINSCENT_BASE || "/";

  function productCategory(p) {
    return p.category || "tealights";
  }

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

  function categoryLabel(p) {
    var id = productCategory(p);
    if (i18n() && i18n().categoryLabel) return i18n().categoryLabel(id);
    var cat = categoryById[id];
    return cat ? cat.label : "Scented tealight candles";
  }

  function categoryBackHref(p) {
    var cat = categoryById[productCategory(p)];
    if (cat) return base + "index.html" + cat.anchor;
    return base + "index.html#tealights";
  }

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

  function productImages(p) {
    if (p.images && p.images.length) return p.images;
    return [p.slug];
  }

  function productFullName(p) {
    var lp = locProduct(p);
    if (lp.cartName) return lp.cartName;
    return categoryLabel(p) + " — " + lp.name;
  }

  function productAlt(p, index) {
    var lp = locProduct(p);
    var suffix = index === 1 ? " — 2" : "";
    return "YINSCENT " + lp.name + " " + categoryLabel(p) + suffix;
  }

  function renderNotFound() {
    root.innerHTML =
      '<div class="pdp-not-found">' +
      "<h1>" + tr("pdp.missing") + "</h1>" +
      "<p>" + tr("pdp.missing_body") + "</p>" +
      '<a href="' + base + 'index.html" class="btn btn--gold">' + tr("pdp.back_shop") + "</a>" +
      "</div>";
    document.title = "YINSCENT — " + tr("pdp.missing");
  }

  function renderPdp() {
    if (!product) {
      renderNotFound();
      return;
    }
    var lp = locProduct(product);
    var imgs = productImages(product);
    var hasGallery = imgs.length > 1;
    var featuresHtml = "";

    if (lp.features && lp.features.length) {
      featuresHtml =
        '<ul class="pdp-features">' +
        lp.features
          .map(function (f) {
            return (
              "<li>" +
              '<span class="pdp-features__icon" aria-hidden="true">' +
              f.icon +
              "</span>" +
              "<span><strong>" +
              f.label +
              "</strong> " +
              f.text +
              "</span></li>"
            );
          })
          .join("") +
        "</ul>";
    }

    var thumbsHtml = imgs
      .map(function (slug, i) {
        return (
          '<button type="button" class="pdp-gallery__thumb' +
          (i === 0 ? " is-active" : "") +
          '" data-index="' +
          i +
          '" aria-label="' +
          tr("pdp.image", { n: i + 1, total: imgs.length }) +
          '">' +
          '<img src="' +
          productImage(slug) +
          '" alt="" width="96" height="96" />' +
          "</button>"
        );
      })
      .join("");

    root.innerHTML =
      '<nav class="pdp-breadcrumb" aria-label="Breadcrumb">' +
      '<a href="' + base + 'index.html">' + tr("pdp.home") + "</a>" +
      '<span aria-hidden="true">/</span>' +
      '<a href="' + categoryBackHref(product) + '">' + categoryLabel(product) + "</a>" +
      '<span aria-hidden="true">/</span>' +
      "<span>" + lp.name + "</span>" +
      "</nav>" +
      '<div class="pdp-layout' + (hasGallery ? " pdp-layout--gallery" : "") + '">' +
      '<div class="pdp-gallery">' +
      '<figure class="pdp-gallery__main">' +
      '<img id="pdpMainImage" src="' + productImage(imgs[0]) + '" alt="' + productAlt(product, 0) + '" />' +
      "</figure>" +
      (hasGallery
        ? '<div class="pdp-gallery__thumbs" role="tablist" aria-label="' + tr("pdp.images") + '">' + thumbsHtml + "</div>"
        : "") +
      "</div>" +
      '<article class="pdp-info product" data-id="' + product.id + '" data-name="' + productFullName(product) + '" data-price="' + product.price + '">' +
      '<p class="product__cat">' + categoryLabel(product) + "</p>" +
      '<h1 class="pdp-info__title">' + lp.name + "</h1>" +
      (lp.tagline ? '<p class="pdp-info__tagline">' + lp.tagline + "</p>" : "") +
      '<p class="pdp-info__desc">' + lp.desc + "</p>" +
      featuresHtml +
      '<div class="pdp-price-row"><p class="pdp-info__price product__price">' +
      formatMoney(product.price) +
      '</p><button type="button" class="pdp-add" id="pdpAdd">' +
      tr("btn.add") +
      "</button></div>" +
      '<a href="' + base + 'index.html?page=contact" class="btn btn--cart pdp-info__enquire">' + tr("nav.contact") + "</a>" +
      '<a href="' + categoryBackHref(product) + '" class="pdp-info__back">' + tr("pdp.continue") + "</a>" +
      "</article></div>";

    document.title = "YINSCENT — " + lp.name;

    var addBtn = document.getElementById("pdpAdd");
    if (addBtn && window.YinscentCart) {
      addBtn.addEventListener("click", function () {
        window.YinscentCart.add({
          id: product.id,
          name: productFullName(product),
          price: product.price,
          image: productImage(imgs[0]),
        });
      });
    }

    if (!hasGallery) return;

    var mainImg = document.getElementById("pdpMainImage");
    var thumbs = root.querySelectorAll(".pdp-gallery__thumb");

    thumbs.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var index = parseInt(btn.getAttribute("data-index"), 10);
        var slug = imgs[index];
        if (!slug || !mainImg) return;

        mainImg.src = productImage(slug);
        mainImg.alt = productAlt(product, index);

        thumbs.forEach(function (t) {
          t.classList.remove("is-active");
        });
        btn.classList.add("is-active");
      });
    });
  }

  function showProduct() {
    if (shopMain) shopMain.hidden = true;
    root.hidden = false;
    document.body.classList.add("page-product");
    document.documentElement.classList.add("is-member");
    renderPdp();
  }

  if (window.YinscentAuth && window.YinscentAuth.whenReady) {
    window.YinscentAuth.whenReady().then(function () {
      var member = window.YinscentAuth.getMember() || (window.YinscentAuth.isAdmin && window.YinscentAuth.isAdmin());
      var next = "index.html" + window.location.search;
      if (!member) {
        window.location.replace(base + "login.html?next=" + encodeURIComponent(next));
        return;
      }
      var ready = window.YinscentCatalog && window.YinscentCatalog.load
        ? window.YinscentCatalog.load()
        : Promise.resolve(true);
      ready.then(function (ok) {
        if (!ok) return;
        bindCatalog();
        showProduct();
        window.addEventListener("yinscent:langchange", renderPdp);
      });
    });
  }
})();
