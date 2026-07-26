/*
 * Admin auth client. The real session lives in an HttpOnly cookie issued by
 * /api/admin/login and is verified server-side; this module only mirrors that
 * state for the UI. The sessionStorage flag is a display hint (instant header
 * rendering before the server check resolves) and grants no access by itself.
 */
(function () {
  var flagKey = "yinscent-admin-ui-v1";
  var base = window.YINSCENT_BASE || "/";
  var state = { admin: readFlag(), checked: false };

  function readFlag() {
    try {
      return sessionStorage.getItem(flagKey) === "1";
    } catch (e) {
      return false;
    }
  }

  function setAdmin(isAdmin) {
    state.admin = isAdmin;
    state.checked = true;
    try {
      if (isAdmin) sessionStorage.setItem(flagKey, "1");
      else sessionStorage.removeItem(flagKey);
    } catch (e) {
      /* UI hint only; server keeps the real session. */
    }
    document.dispatchEvent(new CustomEvent("yinscent:auth", { detail: { admin: isAdmin } }));
  }

  function api(path, options) {
    return fetch(base + "api/admin/" + path, options).then(function (res) {
      return res.json().then(function (data) {
        return { ok: res.ok, status: res.status, data: data };
      });
    });
  }

  window.YinscentAuth = {
    /* Synchronous UI hint; may be stale until refresh() resolves. */
    isAdmin: function () {
      return state.admin;
    },
    /* Server-verified check. */
    refresh: function () {
      return api("me", { method: "GET" })
        .then(function (res) {
          setAdmin(res.ok);
          return res.ok;
        })
        .catch(function () {
          /* API unreachable (e.g. plain static hosting): treat as signed out. */
          setAdmin(false);
          return false;
        });
    },
    signIn: function (password) {
      return api("login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password }),
      }).then(function (res) {
        setAdmin(res.ok);
        if (!res.ok) {
          throw new Error(res.data.error || "Sign in failed");
        }
        return true;
      });
    },
    signOut: function () {
      return api("logout", { method: "POST" })
        .catch(function () {})
        .then(function () {
          setAdmin(false);
        });
    },
  };

  window.YinscentAuth.refresh();
})();
