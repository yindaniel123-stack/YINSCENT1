(function () {
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  var products = window.YINSCENT_PRODUCTS || [];
  var categories = window.YINSCENT_CATEGORIES || [
    { id: "tealights", label: "Scented tealight candles", anchor: "#tealights", gridId: "productGrid" },
  ];

  var categoryById = {};
  categories.forEach(function (c) {
    categoryById[c.id] = c;
  });

  function productCategory(p) {
    return p.category || "tealights";
  }

  function categoryLabel(p) {
    var cat = categoryById[productCategory(p)];
    return cat ? cat.label : "Scented tealight candles";
  }

  function categoryAnchor(p) {
    var cat = categoryById[productCategory(p)];
    return cat ? cat.anchor : "#tealights";
  }

  var base = window.YINSCENT_BASE || "/";

  function productImage(slug) {
    return base + "assets/products/" + slug + ".png";
  }

  function productUrl(p) {
    return base + "index.html?id=" + encodeURIComponent(p.id);
  }

  function productThumb(p) {
    var imgs = p.images && p.images.length ? p.images : [p.slug];
    return productImage(imgs[0]);
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

  function productAlt(p) {
    if (productCategory(p) === "scented-candles") {
      return "YINSCENT " + p.name + " scented candle";
    }
    if (productCategory(p) === "reed-diffusers") {
      return "YINSCENT " + p.name + " reed diffuser";
    }
    if (productCategory(p) === "tealight-holders") {
      return "YINSCENT " + p.name.replace(" — 12 Pack", "") + " tealight holder";
    }
    if (productCategory(p) === "scented-sachets") {
      return "YINSCENT " + p.name + " scented sachet";
    }
    if (productCategory(p) === "essential-oils") {
      return "YINSCENT " + p.name + " essential oil";
    }
    if (productCategory(p) === "smart-aroma-refills") {
      return "YINSCENT " + p.name + " smart aroma diffuser refill";
    }
    return "YINSCENT " + p.name + " scented tealight candles";
  }

  function isLandscapeProduct(catId) {
    return (
      catId === "scented-candles" ||
      catId === "reed-diffusers" ||
      catId === "tealight-holders" ||
      catId === "scented-sachets" ||
      catId === "essential-oils" ||
      catId === "smart-aroma-refills"
    );
  }

  function renderProductCard(p, grid) {
    var article = document.createElement("article");
    var catId = productCategory(p);
    article.className =
      "product" +
      (grid ? " product--grid" : "") +
      (isLandscapeProduct(catId) ? " product--landscape" : "");
    article.setAttribute("data-id", p.id);
    article.setAttribute("data-name", productFullName(p));
    article.setAttribute("data-price", p.price);

    article.innerHTML =
      '<a href="' + productUrl(p) + '" class="product__img-wrap">' +
      '<img class="product__img" src="' + productThumb(p) + '" alt="' + productAlt(p) + '" loading="lazy" />' +
      '<button type="button" class="product__wish" aria-label="Add to wishlist">♡</button>' +
      "</a>" +
      '<p class="product__cat">' + categoryLabel(p) + "</p>" +
      '<h3 class="product__name"><a href="' + productUrl(p) + '">' + p.name + "</a></h3>" +
      (grid ? '<p class="product__desc">' + p.desc + "</p>" : "") +
      '<p class="product__price">£' + p.price + "</p>" +
      '<button type="button" class="btn btn--cart add-to-cart">Add to cart</button>';

    return article;
  }

  function renderCatalog() {
    var track = document.getElementById("categoryTrack");
    var topTrack = document.getElementById("productTrack");

    if (track) {
      products.forEach(function (p, i) {
        var a = document.createElement("a");
        a.href = productUrl(p);
        a.className = "category-pill" + (i === 0 ? " is-active" : "");
        a.innerHTML =
          '<img class="category-pill__img" src="' + productThumb(p) + '" alt="" width="72" height="72" />' +
          "<span>" +
          p.name +
          (productCategory(p) === "scented-candles"
            ? " · Candle"
            : productCategory(p) === "reed-diffusers"
              ? " · Diffuser"
              : productCategory(p) === "tealight-holders"
                ? " · Holder"
                : productCategory(p) === "scented-sachets"
                  ? " · Sachet"
                  : productCategory(p) === "essential-oils"
                    ? " · Oil"
                    : productCategory(p) === "smart-aroma-refills"
                      ? " · Refill"
                      : "") +
          "</span>";
        track.appendChild(a);
      });
    }

    if (topTrack) {
      products
        .filter(function (p) {
          return p.featured;
        })
        .forEach(function (p) {
          topTrack.appendChild(renderProductCard(p, false));
        });
    }

    categories.forEach(function (cat) {
      var grid = document.getElementById(cat.gridId);
      if (!grid) return;
      products
        .filter(function (p) {
          return productCategory(p) === cat.id;
        })
        .forEach(function (p) {
          grid.appendChild(renderProductCard(p, true));
        });
    });
  }

  var pageParams = new URLSearchParams(window.location.search);
  if (!pageParams.get("id") && pageParams.get("page") !== "story") {
    renderCatalog();
  }

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
  var userMenuAdmin = document.getElementById("userMenuAdmin");

  function updateAdminMenuItem() {
    if (userMenuAdmin) {
      userMenuAdmin.hidden = !(window.YinscentAuth && window.YinscentAuth.isAdmin());
    }
  }
  updateAdminMenuItem();
  document.addEventListener("yinscent:auth", updateAdminMenuItem);

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
    if (e.key === "Escape") setUserMenuOpen(false);
  });

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

  /* Cart drawer */
  var cartOverlay = document.getElementById("cartOverlay");
  var cartOpen = document.getElementById("cartOpen");
  var cartClose = document.getElementById("cartClose");
  var cartContinue = document.getElementById("cartContinue");
  var cartCount = document.getElementById("cartCount");
  var cartDrawerCount = document.getElementById("cartDrawerCount");
  var cartEmpty = document.getElementById("cartEmpty");
  var cartList = document.getElementById("cartList");
  var cartSummary = document.getElementById("cartSummary");
  var cartSubtotal = document.getElementById("cartSubtotal");
  var cartCheckout = document.getElementById("cartCheckout");
  var cartClear = document.getElementById("cartClear");
  var cartStatus = document.getElementById("cartStatus");
  var cartStorageKey = "yinscent-cart-v1";
  var cart = loadCart();

  function findProduct(id) {
    return products.find(function (p) {
      return p.id === id;
    });
  }

  function formatMoney(value) {
    return "£" + Number(value).toFixed(2);
  }

  function loadCart() {
    try {
      var saved = JSON.parse(localStorage.getItem(cartStorageKey) || "[]");
      if (!Array.isArray(saved)) return [];
      return saved
        .map(function (item) {
          var product = findProduct(item.id);
          var qty = Math.max(1, Math.min(99, parseInt(item.qty, 10) || 1));
          return product ? { id: product.id, qty: qty } : null;
        })
        .filter(Boolean);
    } catch (e) {
      return [];
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(cartStorageKey, JSON.stringify(cart));
    } catch (e) {
      /* Cart still works for the current page if storage is unavailable. */
    }
  }

  function setCartOpen(open) {
    if (!cartOverlay) return;
    cartOverlay.classList.toggle("is-open", open);
    cartOverlay.setAttribute("aria-hidden", open ? "false" : "true");
    document.body.style.overflow = open ? "hidden" : "";
  }

  function updateCartUI() {
    var n = cart.reduce(function (total, item) {
      return total + item.qty;
    }, 0);
    var subtotal = 0;

    if (cartCount) {
      cartCount.textContent = String(n);
      cartCount.setAttribute("data-count", String(n));
    }
    if (cartDrawerCount) cartDrawerCount.textContent = String(n);
    if (cartOpen) {
      cartOpen.setAttribute("aria-label", "Open cart, " + n + " item" + (n === 1 ? "" : "s"));
    }
    if (cartEmpty) cartEmpty.hidden = n > 0;
    if (cartSummary) cartSummary.hidden = n === 0;

    if (cartList) {
      cartList.hidden = n === 0;
      cartList.innerHTML = "";

      cart.forEach(function (item) {
        var product = findProduct(item.id);
        if (!product) return;
        var price = Number(product.price);
        var lineTotal = price * item.qty;
        subtotal += lineTotal;

        var li = document.createElement("li");
        li.className = "cart-item";
        li.setAttribute("data-cart-id", item.id);

        var imageLink = document.createElement("a");
        imageLink.className = "cart-item__image";
        imageLink.href = productUrl(product);
        var image = document.createElement("img");
        image.src = productThumb(product);
        image.alt = "";
        image.width = 84;
        image.height = 84;
        imageLink.appendChild(image);

        var details = document.createElement("div");
        details.className = "cart-item__details";

        var top = document.createElement("div");
        top.className = "cart-item__top";
        var info = document.createElement("div");
        var name = document.createElement("p");
        name.className = "cart-item__name";
        var nameLink = document.createElement("a");
        nameLink.href = productUrl(product);
        nameLink.textContent = productFullName(product);
        name.appendChild(nameLink);
        var priceText = document.createElement("p");
        priceText.className = "cart-item__price";
        priceText.textContent = formatMoney(price) + " each";
        info.appendChild(name);
        info.appendChild(priceText);

        var remove = document.createElement("button");
        remove.type = "button";
        remove.className = "cart-item__remove";
        remove.setAttribute("data-cart-action", "remove");
        remove.setAttribute("aria-label", "Remove " + productFullName(product));
        remove.textContent = "×";
        top.appendChild(info);
        top.appendChild(remove);

        var bottom = document.createElement("div");
        bottom.className = "cart-item__bottom";
        var quantity = document.createElement("div");
        quantity.className = "cart-quantity";
        quantity.setAttribute("aria-label", "Quantity");

        var minus = document.createElement("button");
        minus.type = "button";
        minus.setAttribute("data-cart-action", "decrease");
        minus.setAttribute("aria-label", "Decrease quantity");
        minus.textContent = "−";
        var quantityText = document.createElement("span");
        quantityText.textContent = String(item.qty);
        var plus = document.createElement("button");
        plus.type = "button";
        plus.setAttribute("data-cart-action", "increase");
        plus.setAttribute("aria-label", "Increase quantity");
        plus.textContent = "+";
        quantity.appendChild(minus);
        quantity.appendChild(quantityText);
        quantity.appendChild(plus);

        var total = document.createElement("span");
        total.className = "cart-item__total";
        total.textContent = formatMoney(lineTotal);
        bottom.appendChild(quantity);
        bottom.appendChild(total);

        details.appendChild(top);
        details.appendChild(bottom);
        li.appendChild(imageLink);
        li.appendChild(details);
        cartList.appendChild(li);
      });
    }

    if (cartSubtotal) cartSubtotal.textContent = formatMoney(subtotal);
    saveCart();
  }

  function addToCart(product) {
    var id = product.getAttribute("data-id");
    var item = cart.find(function (cartItem) {
      return cartItem.id === id;
    });
    if (item) {
      item.qty = Math.min(99, item.qty + 1);
    } else if (findProduct(id)) {
      cart.push({ id: id, qty: 1 });
    } else {
      return;
    }
    updateCartUI();
    if (cartStatus) cartStatus.textContent = "Item added to cart.";
    setCartOpen(true);
  }

  if (cartOpen) cartOpen.addEventListener("click", function () { setCartOpen(true); });
  if (cartClose) cartClose.addEventListener("click", function () { setCartOpen(false); });
  if (cartContinue) {
    cartContinue.addEventListener("click", function () { setCartOpen(false); });
  }
  if (cartOverlay) {
    cartOverlay.addEventListener("click", function (e) {
      if (e.target === cartOverlay) setCartOpen(false);
    });
  }
  if (cartList) {
    cartList.addEventListener("click", function (e) {
      var button = e.target.closest("[data-cart-action]");
      if (!button) return;
      var row = button.closest("[data-cart-id]");
      var item = row && cart.find(function (cartItem) {
        return cartItem.id === row.getAttribute("data-cart-id");
      });
      if (!item) return;

      var action = button.getAttribute("data-cart-action");
      if (action === "increase") item.qty = Math.min(99, item.qty + 1);
      if (action === "decrease") item.qty -= 1;
      if (action === "remove" || item.qty < 1) {
        cart = cart.filter(function (cartItem) {
          return cartItem.id !== item.id;
        });
        if (cartStatus) cartStatus.textContent = "Item removed from cart.";
      }
      updateCartUI();
    });
  }
  if (cartClear) {
    cartClear.addEventListener("click", function () {
      cart = [];
      updateCartUI();
      if (cartStatus) cartStatus.textContent = "Cart cleared.";
    });
  }
  if (cartCheckout) {
    cartCheckout.addEventListener("click", function () {
      if (!cart.length) return;
      window.location.href = base + "checkout.html";
    });
  }

  document.body.addEventListener("click", function (e) {
    var cartBtn = e.target.closest(".add-to-cart");
    if (cartBtn) {
      var productEl = cartBtn.closest(".product");
      if (productEl) addToCart(productEl);
      return;
    }
    var wishBtn = e.target.closest(".product__wish");
    if (wishBtn) {
      e.preventDefault();
      e.stopPropagation();
      var on = wishBtn.classList.toggle("is-active");
      wishBtn.textContent = on ? "♥" : "♡";
      wishBtn.setAttribute("aria-label", on ? "Remove from wishlist" : "Add to wishlist");
    }
  });

  updateCartUI();

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
