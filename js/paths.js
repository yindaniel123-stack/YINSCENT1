(function () {
  var path = window.location.pathname || "/";
  var slash = path.lastIndexOf("/");
  window.YINSCENT_BASE = slash < 0 ? "/" : path.slice(0, slash + 1);
})();
