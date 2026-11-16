(function () {
  if (new URLSearchParams(window.location.search).get("page") !== "contact") return;

  var CONTACT_EMAIL = "yinscent.store@gmail.com";
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
  var contactCopy = null;
  function contactText(value) {
    var lang = window.YINSCENT_I18N && window.YINSCENT_I18N.getLang ? window.YINSCENT_I18N.getLang() : "zh";
    if (lang === "zh-Hant" && window.YINSCENT_I18N && window.YINSCENT_I18N.toTraditional) {
      return window.YINSCENT_I18N.toTraditional(value);
    }
    return value;
  }
  function applyContactCopy() {
    if (!contactCopy) return;
    var lang = window.YINSCENT_I18N && window.YINSCENT_I18N.getLang ? window.YINSCENT_I18N.getLang() : "zh";
    if (lang !== "zh" && lang !== "zh-Hant") return;
    var map = {
      "contact.title": contactCopy.title,
      "contact.intro": contactCopy.intro,
      "contact.intro2": contactCopy.intro2,
      "contact.form_title": contactCopy.formTitle,
      "contact.thanks": contactCopy.thanks,
      "contact.error": contactCopy.error,
      "contact.crumb": contactCopy.crumb,
      "contact.back": contactCopy.back,
    };
    Object.keys(map).forEach(function (key) {
      if (!map[key]) return;
      document.querySelectorAll('[data-i18n="' + key + '"]').forEach(function (node) {
        node.textContent = contactText(map[key]);
      });
    });
  }
  window.addEventListener("yinscent:langchange", function () {
    setContactTitle();
    applyContactCopy();
  });
  document.addEventListener("DOMContentLoaded", applyContactCopy);
  fetch((window.YINSCENT_BASE || "/") + "api/content").then(function (res) { return res.json(); }).then(function (data) {
    contactCopy = data && data.contact;
    applyContactCopy();
  }).catch(function () {});

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

  function showThanks() {
    if (errorEl) errorEl.hidden = true;
    if (thanks) {
      thanks.hidden = false;
      thanks.focus();
    }
  }

  function showError(payload) {
    if (thanks) thanks.hidden = true;
    if (!errorEl) return;

    errorEl.textContent = "";

    var text = document.createElement("span");
    text.textContent = t(
      "contact.error",
      "Sorry — we could not send your message. Please try again."
    );
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
    };

    if (isFileProtocol) {
      showError(payload);
      if (submitBtn) submitBtn.disabled = prevDisabled;
      return;
    }

    fetch((window.YINSCENT_BASE || "/") + "api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name: payload.name,
        email: payload.email,
        message: payload.message,
      }),
    })
      .then(function (res) {
        return res.json().then(
          function (data) {
            return { ok: res.ok && data && data.ok === true };
          },
          function () {
            return { ok: false };
          }
        );
      })
      .then(function (result) {
        if (!result.ok) {
          showError(payload);
          return;
        }
        form.reset();
        showThanks();
      })
      .catch(function () {
        showError(payload);
      })
      .finally(function () {
        if (submitBtn) submitBtn.disabled = prevDisabled;
      });
  });
})();
