(function () {
  var gate = document.getElementById("gate");
  var siteWrap = document.getElementById("siteWrap");
  var gateContinue = document.getElementById("gateContinue");
  var yearEl = document.getElementById("year");
  var drawer = document.getElementById("drawer");
  var menuOpen = document.getElementById("menuOpen");
  var menuClose = document.getElementById("menuClose");
  var selectedRegion = "uk";

  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  document.querySelectorAll(".gate__regions button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".gate__regions button").forEach(function (b) {
        b.classList.remove("is-selected");
      });
      btn.classList.add("is-selected");
      selectedRegion = btn.getAttribute("data-region") || "uk";
    });
  });

  function closeGate() {
    if (!gate || !siteWrap) return;
    gate.classList.add("is-hidden");
    gate.setAttribute("aria-hidden", "true");
    siteWrap.removeAttribute("inert");
    try {
      sessionStorage.setItem("yinscent_region", selectedRegion);
    } catch (e) {
      /* ignore */
    }
  }

  if (gateContinue) {
    gateContinue.addEventListener("click", closeGate);
  }

  try {
    if (sessionStorage.getItem("yinscent_region")) {
      closeGate();
    }
  } catch (e) {
    /* show gate */
  }

  function setDrawerOpen(open) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", open);
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    document.body.style.overflow = open ? "hidden" : "";
  }

  if (menuOpen) {
    menuOpen.addEventListener("click", function () {
      setDrawerOpen(true);
    });
  }
  if (menuClose) {
    menuClose.addEventListener("click", function () {
      setDrawerOpen(false);
    });
  }
  if (drawer) {
    drawer.addEventListener("click", function (e) {
      if (e.target === drawer) setDrawerOpen(false);
    });
  }
})();
