(function () {
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  var products = window.YINSCENT_PRODUCTS || [];
  var categoryLabel = window.YINSCENT_CATEGORY || "Scented tealight candles";

  function productImage(slug) {
    return "assets/products/" + slug + ".png";
  }

  function productFullName(p) {
    return p.cartName || "Scented Tealight Candles — " + p.name;
  }

  function renderProductCard(p, grid) {
    var article = document.createElement("article");
    article.className = "product" + (grid ? " product--grid" : "");
    article.setAttribute("data-id", p.id);
    article.setAttribute("data-name", productFullName(p));
    article.setAttribute("data-price", p.price);

    article.innerHTML =
      '<a href="#tealights" class="product__img-wrap">' +
      '<img class="product__img" src="' + productImage(p.slug) + '" alt="YINSCENT ' + p.name + ' scented tealight candles" loading="lazy" />' +
      '<button type="button" class="product__wish" aria-label="Add to wishlist">♡</button>' +
      "</a>" +
      '<p class="product__cat">' + categoryLabel + "</p>" +
      '<h3 class="product__name"><a href="#tealights">' + p.name + "</a></h3>" +
      (grid ? '<p class="product__desc">' + p.desc + "</p>" : "") +
      '<p class="product__price">£' + p.price + "</p>" +
      '<button type="button" class="btn btn--cart add-to-cart">Add to cart</button>';

    return article;
  }

  function renderCatalog() {
    var track = document.getElementById("categoryTrack");
    var topTrack = document.getElementById("productTrack");
    var grid = document.getElementById("productGrid");

    if (track) {
      products.forEach(function (p, i) {
        var a = document.createElement("a");
        a.href = "#tealights";
        a.className = "category-pill" + (i === 0 ? " is-active" : "");
        a.innerHTML =
          '<img class="category-pill__img" src="' + productImage(p.slug) + '" alt="" width="72" height="72" />' +
          "<span>" + p.name + "</span>";
        track.appendChild(a);
      });
    }

    if (topTrack) {
      products
        .filter(function (p) { return p.featured; })
        .forEach(function (p) {
          topTrack.appendChild(renderProductCard(p, false));
        });
    }

    if (grid) {
      products.forEach(function (p) {
        grid.appendChild(renderProductCard(p, true));
      });
    }
  }

  renderCatalog();

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
  var cart = [];

  function setCartOpen(open) {
    if (!cartOverlay) return;
    cartOverlay.classList.toggle("is-open", open);
    cartOverlay.setAttribute("aria-hidden", open ? "false" : "true");
    document.body.style.overflow = open ? "hidden" : "";
  }

  function updateCartUI() {
    var n = cart.length;
    if (cartCount) {
      cartCount.textContent = String(n);
      cartCount.style.display = n > 0 ? "" : "none";
    }
    if (cartDrawerCount) cartDrawerCount.textContent = String(n);
    if (cartOpen) {
      cartOpen.setAttribute("aria-label", "Open cart, " + n + " item" + (n === 1 ? "" : "s"));
    }
    if (cartEmpty) cartEmpty.hidden = n > 0;
    if (cartList) {
      cartList.hidden = n === 0;
      cartList.innerHTML = "";
      cart.forEach(function (item) {
        var li = document.createElement("li");
        li.textContent = item.name + " — £" + item.price;
        cartList.appendChild(li);
      });
    }
  }

  function addToCart(product) {
    cart.push({
      id: product.getAttribute("data-id"),
      name: product.getAttribute("data-name"),
      price: product.getAttribute("data-price"),
    });
    updateCartUI();
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
