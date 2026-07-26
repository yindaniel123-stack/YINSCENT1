(function () {
  if (new URLSearchParams(window.location.search).get("page") !== "contact") return;

  /** Public inbox for FormSubmit delivery (no secret required). */
  var CONTACT_EMAIL = "yindaniel123@gmail.com";
  var FORMSUBMIT_ENDPOINT = "https://formsubmit.co/ajax/" + CONTACT_EMAIL;
  var isFileProtocol = window.location.protocol === "file:";

  document.body.classList.add("page-contact");

  function t(key, fallback) {
    if (window.YINSCENT_I18N && window.YINSCENT_I18N.t) {
      return window.YINSCENT_I18N.t(key);
    }
    return fallback;
  }

  function setContactTitle() {
    document.title = t("meta.contact", "YINSCENT — Contact");
  }
  setContactTitle();
  window.addEventListener("yinscent:langchange", setContactTitle);

  var form = document.getElementById("contactForm");
  var thanks = document.getElementById("contactThanks");
  var errorEl = document.getElementById("contactError");
  var nextInput = document.getElementById("contactNext");
  var urlInput = document.getElementById("contactUrl");
  if (!form) return;

  // Native POST fallback: return to this contact page after FormSubmit.
  if (nextInput && !isFileProtocol) {
    nextInput.value =
      window.location.origin +
      window.location.pathname +
      "?page=contact&sent=1" +
      (window.location.hash || "");
  }

  // Helps FormSubmit accept submissions (avoids "open through a web server" rejection).
  if (urlInput && !isFileProtocol) {
    urlInput.value = window.location.href;
  }

  function mailtoHref(payload) {
    var subject = encodeURIComponent(payload._subject || "YINSCENT contact");
    var body = encodeURIComponent(
      "Name: " +
        payload.name +
        "\nEmail: " +
        payload.email +
        "\n\n" +
        payload.message
    );
    return "mailto:" + CONTACT_EMAIL + "?subject=" + subject + "&body=" + body;
  }

  function friendlyDetail(raw) {
    if (!raw) return "";
    var lower = String(raw).toLowerCase();
    if (lower.indexOf("activat") !== -1) {
      return (
        "FormSubmit still needs a one-time activation for " +
        CONTACT_EMAIL +
        ". Check that inbox for an “Activate Form” email, click the link, then try again."
      );
    }
    if (lower.indexOf("web server") !== -1 || lower.indexOf("html files") !== -1) {
      return "Open this site via a local web server (http://localhost…), not as a file:// page.";
    }
    return String(raw);
  }

  function showThanks() {
    if (errorEl) errorEl.hidden = true;
    if (thanks) {
      thanks.hidden = false;
      thanks.focus();
    }
  }

  function showError(detail, payload) {
    if (thanks) thanks.hidden = true;
    if (!errorEl) return;

    var base = t(
      "contact.error",
      "Sorry — we could not send your message. Please try again."
    );
    var extra = friendlyDetail(detail);
    errorEl.textContent = "";

    var text = document.createElement("span");
    text.textContent = extra ? base + " " + extra : base;
    errorEl.appendChild(text);

    if (payload) {
      errorEl.appendChild(document.createTextNode(" "));
      var link = document.createElement("a");
      link.href = mailtoHref(payload);
      link.textContent = t("contact.mailto_fallback", "Email us instead");
      errorEl.appendChild(link);
    }

    errorEl.hidden = false;
  }

  // After a non-AJAX FormSubmit redirect back with ?sent=1
  if (new URLSearchParams(window.location.search).get("sent") === "1") {
    showThanks();
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (errorEl) errorEl.hidden = true;
    if (thanks) thanks.hidden = true;

    var submitBtn = form.querySelector('button[type="submit"]');
    var prevDisabled = submitBtn ? submitBtn.disabled : false;
    if (submitBtn) submitBtn.disabled = true;

    var payload = {
      name: form.elements.namedItem("name").value.trim(),
      email: form.elements.namedItem("email").value.trim(),
      message: form.elements.namedItem("message").value.trim(),
      _subject: "YINSCENT contact",
      _captcha: "false",
      _template: "table",
    };

    // file:// has no Origin FormSubmit accepts — skip AJAX and offer mailto.
    if (isFileProtocol) {
      showError(
        "Make sure you open this page through a web server, FormSubmit will not work in pages browsed as HTML files.",
        payload
      );
      if (submitBtn) submitBtn.disabled = prevDisabled;
      return;
    }

    payload._url = window.location.href;

    function nativePostFallback() {
      // form.submit() does not re-fire the submit event, so no infinite loop.
      if (submitBtn) submitBtn.disabled = prevDisabled;
      HTMLFormElement.prototype.submit.call(form);
    }

    fetch(FORMSUBMIT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        return res.json().then(
          function (data) {
            return { ok: res.ok, data: data, networkOk: true };
          },
          function () {
            return { ok: false, data: null, networkOk: false };
          }
        );
      })
      .then(function (result) {
        if (!result.networkOk) {
          nativePostFallback();
          return;
        }

        var success =
          result.ok &&
          result.data &&
          String(result.data.success) !== "false";
        if (!success) {
          showError((result.data && result.data.message) || "send failed", payload);
          return;
        }
        form.reset();
        showThanks();
      })
      .catch(function () {
        // Network / CORS failure: fall back to native FormSubmit POST.
        try {
          nativePostFallback();
        } catch (err) {
          showError("", payload);
        }
      })
      .finally(function () {
        if (submitBtn) submitBtn.disabled = prevDisabled;
      });
  });
})();
