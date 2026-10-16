window.YinscentCatalog = (function () {
  var pending = null;

  function load() {
    if (window.YINSCENT_PRODUCTS && window.YINSCENT_PRODUCTS.length) return Promise.resolve(true);
    if (pending) return pending;
    var base = window.YINSCENT_BASE || "/";
    pending = fetch(base + "api/catalog", { credentials: "same-origin" })
      .then(function (res) {
        if (res.status === 401) {
          var next = "index.html" + window.location.search + window.location.hash;
          window.location.replace(base + "login.html?next=" + encodeURIComponent(next));
          return null;
        }
        if (!res.ok) throw new Error("catalog");
        return res.json();
      })
      .then(function (data) {
        if (!data) return false;
        window.YINSCENT_PRODUCTS = data.products || [];
        window.YINSCENT_CATEGORIES = data.categories || [];
        return true;
      })
      .catch(function () {
        pending = null;
        return false;
      });
    return pending;
  }

  return { load: load };
})();
