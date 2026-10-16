/*
 * Auth client. Admin and member sessions live in HttpOnly cookies.
 * This module only mirrors them for the header. It does not grant access.
 */
(function () {
  var flagKey = "yinscent-admin-ui-v1";
  var base = window.YINSCENT_BASE || "/";
  var state = { admin: readFlag(), user: null, checked: false };

  function readFlag() {
    try {
      return sessionStorage.getItem(flagKey) === "1";
    } catch (e) {
      return false;
    }
  }

  function isAdmin() {
    return !!state.admin || !!(state.user && state.user.role === "admin");
  }

  function isSuper() {
    return !!(state.admin && typeof state.admin === "object" && state.admin.super);
  }

  function emit() {
    document.dispatchEvent(
      new CustomEvent("yinscent:auth", { detail: { admin: isAdmin(), user: state.user } })
    );
  }

  function rememberAdmin(on) {
    try {
      if (on) sessionStorage.setItem(flagKey, "1");
      else sessionStorage.removeItem(flagKey);
    } catch (e) {}
  }

  function readJson(res) {
    return res.json().then(
      function (data) {
        return { ok: res.ok, status: res.status, data: data || {} };
      },
      function () {
        return { ok: res.ok, status: res.status, data: {} };
      }
    );
  }

  function api(path, options) {
    return fetch(base + "api/admin/" + path, options).then(readJson);
  }

  function memberApi(path, options) {
    var opts = options || {};
    opts.credentials = "same-origin";
    return fetch(base + "api/auth/" + path, opts).then(readJson);
  }

  window.YinscentAuth = {
    isAdmin: isAdmin,
    isSuper: isSuper,
    getAdmin: function () {
      return state.admin && typeof state.admin === "object" ? state.admin : null;
    },
    getMember: function () {
      return state.user;
    },
    memberApi: memberApi,
    refresh: function () {
      return Promise.all([
        api("me", { method: "GET", credentials: "same-origin" })
          .then(function (res) {
            return res.ok && res.data.admin ? res.data.admin : null;
          })
          .catch(function () {
            return null;
          }),
        memberApi("me", { method: "GET" })
          .then(function (res) {
            return res.ok ? res.data.user || null : null;
          })
          .catch(function () {
            return null;
          }),
      ]).then(function (pair) {
        state.admin = pair[0];
        state.user = pair[1];
        state.checked = true;
        rememberAdmin(isAdmin());
        emit();
        return isAdmin();
      });
    },
    signIn: function (password, username) {
      return api("login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password, username: username || "" }),
      }).then(function (res) {
        state.admin = res.ok ? { super: !!(res.data && res.data.super) } : null;
        rememberAdmin(!!state.admin);
        emit();
        if (!res.ok) throw new Error((res.data && res.data.error) || "Sign in failed");
        return true;
      });
    },
    signOut: function () {
      return api("logout", { method: "POST", credentials: "same-origin" })
        .catch(function () {})
        .then(function () {
          state.admin = null;
          rememberAdmin(isAdmin());
          emit();
        });
    },
    signOutMember: function () {
      return memberApi("logout", { method: "POST" })
        .catch(function () {})
        .then(function () {
          state.user = null;
          rememberAdmin(isAdmin());
          emit();
        });
    },
  };

  var readyPromise = window.YinscentAuth.refresh();
  window.YinscentAuth.whenReady = function () {
    return readyPromise;
  };
})();
