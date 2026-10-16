(function () {
  function isHome() {
    var path = String(location.pathname || "").replace(/\\/g, "/");
    var file = path.split("/").pop() || "";
    if (file && file !== "index.html") return false;
    var params = new URLSearchParams(location.search);
    if (params.get("id")) return false;
    var page = params.get("page");
    return !page || page === "home";
  }

  function text(key, fallback) {
    var i18n = window.YINSCENT_I18N;
    if (i18n && i18n.t) {
      var value = i18n.t(key);
      if (value && value !== key) return value;
    }
    return fallback;
  }

  var dock = document.createElement("div");
  dock.className = "float-dock";
  dock.id = "floatDock";

  var cart = document.createElement("button");
  cart.type = "button";
  cart.className = "float-cart";
  cart.id = "floatCart";
  cart.hidden = !isHome();
  cart.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="19" r="1.25" fill="currentColor"></circle><circle cx="17" cy="19" r="1.25" fill="currentColor"></circle><path d="M4 5.5h2.1l1.35 9.1a1.35 1.35 0 0 0 1.33 1.15H17a1.35 1.35 0 0 0 1.32-1.08L19.7 8H7.2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path></svg>';

  var button = document.createElement("button");
  button.type = "button";
  button.className = "to-top";
  button.id = "toTop";
  button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 14.5 12 8.5l6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg>';

  dock.appendChild(cart);
  dock.appendChild(button);
  document.body.appendChild(dock);

  function paintLabel() {
    button.setAttribute("aria-label", text("top.up", "回到顶部"));
    cart.setAttribute("aria-label", text("cart.title", "购物车"));
    cart.hidden = !isHome();
  }

  function offset() {
    return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
  }

  function paint() {
    button.classList.toggle("is-on", offset() > 280);
  }

  cart.addEventListener("click", function () {
    var overlay = document.getElementById("cartOverlay");
    if (!overlay) return;
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
  });

  button.addEventListener("click", function () {
    var root = document.scrollingElement || document.documentElement;
    if (root.scrollTo) root.scrollTo({ top: 0, behavior: "smooth" });
    else root.scrollTop = 0;
  });

  window.addEventListener("scroll", paint, { passive: true });
  window.addEventListener("yinscent:langchange", paintLabel);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", paintLabel);
  else paintLabel();
  paint();
})();
