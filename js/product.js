(function () {
  var id = new URLSearchParams(window.location.search).get("id");
  if (!id) return;

  var root = document.getElementById("productDetail");
  var shopMain = document.getElementById("shopMain");
  if (!root) return;

  if (shopMain) shopMain.hidden = true;
  root.hidden = false;
  document.body.classList.add("page-product");

  var products = window.YINSCENT_PRODUCTS || [];
  var categories = window.YINSCENT_CATEGORIES || [];
  var categoryById = {};
  categories.forEach(function (c) {
    categoryById[c.id] = c;
  });

  var product = products.find(function (p) {
    return p.id === id;
  });

  var base = window.YINSCENT_BASE || "/";

  function productCategory(p) {
    return p.category || "tealights";
  }

  function categoryLabel(p) {
    var cat = categoryById[productCategory(p)];
    return cat ? cat.label : "Scented tealight candles";
  }

  function categoryBackHref(p) {
    var cat = categoryById[productCategory(p)];
    if (cat) return base + "index.html" + cat.anchor;
    return base + "index.html#tealights";
  }

  function productImage(slug) {
    return base + "assets/products/" + slug + ".png";
  }

  function productImages(p) {
    if (p.images && p.images.length) return p.images;
    return [p.slug];
  }

  function productFullName(p) {
    if (p.cartName) return p.cartName;
    if (productCategory(p) === "scented-candles") {
      return "Scented Candle — " + p.name;
    }
    if (productCategory(p) === "reed-diffusers") {
      return "Reed Diffuser — " + p.name;
    }
    if (productCategory(p) === "tealight-holders") {
      return "Tealight Holder — " + p.name.replace(" — 12 Pack", "");
    }
    if (productCategory(p) === "scented-sachets") {
      return "Scented Sachet — " + p.name;
    }
    if (productCategory(p) === "essential-oils") {
      return "Essential Oil — " + p.name;
    }
    if (productCategory(p) === "smart-aroma-refills") {
      return "Smart Aroma Diffuser Refill — " + p.name;
    }
    return "Scented Tealight Candles — " + p.name;
  }

  function productAlt(p, index) {
    var suffix = index === 1 ? " — alternate view" : "";
    if (productCategory(p) === "scented-candles") {
      return "YINSCENT " + p.name + " scented candle" + suffix;
    }
    if (productCategory(p) === "reed-diffusers") {
      return "YINSCENT " + p.name + " reed diffuser" + suffix;
    }
    if (productCategory(p) === "tealight-holders") {
      return "YINSCENT " + p.name.replace(" — 12 Pack", "") + " tealight holder" + suffix;
    }
    if (productCategory(p) === "scented-sachets") {
      return "YINSCENT " + p.name + " scented sachet" + suffix;
    }
    if (productCategory(p) === "essential-oils") {
      return "YINSCENT " + p.name + " essential oil" + suffix;
    }
    if (productCategory(p) === "smart-aroma-refills") {
      return "YINSCENT " + p.name + " smart aroma diffuser refill" + suffix;
    }
    return "YINSCENT " + p.name + " scented tealight candles" + suffix;
  }

  function renderNotFound() {
    root.innerHTML =
      '<div class="pdp-not-found">' +
      "<h1>Product not found</h1>" +
      '<p>We could not find that item. Browse our collection on the homepage.</p>' +
      '<a href="' + base + 'index.html" class="btn btn--gold">Back to shop</a>' +
      "</div>";
    document.title = "YINSCENT — Product not found";
  }

  if (!product) {
    renderNotFound();
    return;
  }

  var imgs = productImages(product);
  var hasGallery = imgs.length > 1;
  var featuresHtml = "";

  if (product.features && product.features.length) {
    featuresHtml =
      '<ul class="pdp-features">' +
      product.features
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
        '" aria-label="View image ' +
        (i + 1) +
        " of " +
        imgs.length +
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
    '<a href="' + base + 'index.html">Home</a>' +
    '<span aria-hidden="true">/</span>' +
    '<a href="' + categoryBackHref(product) + '">' + categoryLabel(product) + "</a>" +
    '<span aria-hidden="true">/</span>' +
    "<span>" + product.name + "</span>" +
    "</nav>" +
    '<div class="pdp-layout' + (hasGallery ? " pdp-layout--gallery" : "") + '">' +
    '<div class="pdp-gallery">' +
    '<figure class="pdp-gallery__main">' +
    '<img id="pdpMainImage" src="' + productImage(imgs[0]) + '" alt="' + productAlt(product, 0) + '" />' +
    "</figure>" +
    (hasGallery
      ? '<div class="pdp-gallery__thumbs" role="tablist" aria-label="Product images">' + thumbsHtml + "</div>"
      : "") +
    "</div>" +
    '<article class="pdp-info product" data-id="' + product.id + '" data-name="' + productFullName(product) + '" data-price="' + product.price + '">' +
    '<p class="product__cat">' + categoryLabel(product) + "</p>" +
    '<h1 class="pdp-info__title">' + product.name + "</h1>" +
    (product.tagline ? '<p class="pdp-info__tagline">' + product.tagline + "</p>" : "") +
    '<p class="pdp-info__desc">' + product.desc + "</p>" +
    featuresHtml +
    '<p class="pdp-info__price product__price">£' + product.price + "</p>" +
    '<button type="button" class="btn btn--cart add-to-cart pdp-info__cart">Add to cart</button>' +
    '<a href="' + categoryBackHref(product) + '" class="pdp-info__back">← Continue shopping</a>' +
    "</article></div>";

  document.title = "YINSCENT — " + product.name;

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
})();
