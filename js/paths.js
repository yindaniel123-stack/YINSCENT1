(function () {
  var path = window.location.pathname || "/";
  var slash = path.lastIndexOf("/");
  window.YINSCENT_BASE = slash < 0 ? "/" : path.slice(0, slash + 1);
  window.YINSCENT_CURRENCY = "CNY";
  window.YINSCENT_MONEY = function (amount) {
    var n = Number(amount);
    if (!isFinite(n)) n = 0;
    return "¥" + n.toFixed(2);
  };
})();
