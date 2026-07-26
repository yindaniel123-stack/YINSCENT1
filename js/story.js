(function () {
  if (new URLSearchParams(window.location.search).get("page") !== "story") return;

  document.body.classList.add("page-story");
  function setStoryTitle() {
    if (window.YINSCENT_I18N && window.YINSCENT_I18N.t) {
      document.title = window.YINSCENT_I18N.t("meta.story");
    } else {
      document.title = "YINSCENT — Our Story";
    }
  }
  setStoryTitle();
  window.addEventListener("yinscent:langchange", setStoryTitle);

  var mainImg = document.getElementById("storyMainImage");
  var thumbs = document.querySelectorAll(".story-gallery__thumb");

  thumbs.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var src = btn.getAttribute("data-src");
      var alt = btn.getAttribute("data-alt");
      if (!src || !mainImg) return;

      mainImg.src = src;
      mainImg.alt = alt || "";

      thumbs.forEach(function (t) {
        t.classList.remove("is-active");
      });
      btn.classList.add("is-active");
    });
  });
})();
