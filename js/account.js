(function () {
  var base = window.YINSCENT_BASE || "/";
  var params = new URLSearchParams(window.location.search);

  function safeNext(value) {
    var next = String(value || "");
    if (!next || next.charAt(0) === "/" || next.indexOf("\\") !== -1) return "";
    if (/^[a-z]+:/i.test(next)) return "";
    if (next.indexOf("login.html") === 0) return "";
    return next;
  }

  function post(path, body) {
    return window.YinscentAuth.memberApi(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {}),
    });
  }

  function t(key) {
    return window.YINSCENT_I18N && window.YINSCENT_I18N.t ? window.YINSCENT_I18N.t(key) : key;
  }

  function money(order) {
    if (window.YINSCENT_MONEY && (!order.currency || order.currency === "CNY")) return window.YINSCENT_MONEY(order.total);
    var symbol = order.currency === "USD" ? "$" : "¥";
    return symbol + Number(order.total || 0).toFixed(2);
  }

  function renderCenter(user) {
    document.getElementById("panelSetup").hidden = true;
    document.getElementById("panelCenter").hidden = false;
    var facts = document.getElementById("accountFacts");
    facts.innerHTML = "";
    [
      [t("acct.username"), user.username],
      [t("acct.name"), user.name],
      [t("acct.phone"), user.phone],
      [t("acct.email"), user.email + (user.emailVerified ? t("acct.verified") : t("acct.unverified"))],
      [t("acct.expires"), user.membershipExpiresAt ? String(user.membershipExpiresAt).slice(0, 10) : t("acct.unset")],
    ].forEach(function (row) {
      var dt = document.createElement("dt");
      var dd = document.createElement("dd");
      dt.textContent = row[0];
      dd.textContent = row[1] || "—";
      facts.appendChild(dt);
      facts.appendChild(dd);
    });
    var next = safeNext(params.get("next")) || "index.html";
    var link = document.getElementById("continueLink");
    var blocked = document.getElementById("accessNote");
    link.hidden = false;
    link.href = base + next;
    if (blocked) blocked.hidden = true;
    window.YinscentAuth.memberApi("orders", { method: "GET" }).then(function (res) {
      var list = document.getElementById("orderList");
      var orders = res.ok && res.data.orders ? res.data.orders : [];
      if (!orders.length) {
        list.textContent = t("acct.no_orders");
        return;
      }
      list.innerHTML = "";
      orders.forEach(function (order) {
        var item = document.createElement("p");
        item.textContent = (order.id || "") + " · " + money(order) + " · " + (order.status || t("acct.submitted"));
        list.appendChild(item);
      });
    });
  }

  function renderSetup(user) {
    document.getElementById("panelCenter").hidden = true;
    document.getElementById("panelSetup").hidden = false;
    if (user.name) document.getElementById("setupName").value = user.name;
    if (user.phone) document.getElementById("setupPhone").value = user.phone;
    if (user.email) document.getElementById("setupEmail").value = user.email;
  }

  function show(user) {
    if (user.profileReady) renderCenter(user);
    else renderSetup(user);
  }

  document.getElementById("setupForm").addEventListener("submit", function (event) {
    event.preventDefault();
    var error = document.getElementById("setupError");
    var note = document.getElementById("setupNote");
    var button = document.getElementById("setupSubmit");
    error.hidden = true;
    note.hidden = true;
    button.disabled = true;
    post("profile", {
      name: document.getElementById("setupName").value,
      phone: document.getElementById("setupPhone").value,
      email: document.getElementById("setupEmail").value,
      resend: true,
    }).then(function (res) {
      button.disabled = false;
      if (!res.ok) {
        error.hidden = false;
        error.textContent = res.data && res.data.error === "email_taken"
          ? t("acct.email_taken")
          : res.data && res.data.error === "invalid_email"
            ? t("acct.bad_email")
            : t("acct.check");
        return;
      }
      if (res.data.user && res.data.user.profileReady) {
        show(res.data.user);
        return;
      }
      note.hidden = false;
      note.textContent = res.data.devLink
        ? t("acct.dev_mail") + res.data.devLink
        : t("acct.sent");
    });
  });

  document.getElementById("accountSignOut").addEventListener("click", function (event) {
    event.preventDefault();
    window.YinscentAuth.signOutMember().then(function () {
      window.location.href = base + "login.html";
    });
  });

  window.YinscentAuth.whenReady().then(function () {
    var user = window.YinscentAuth.getMember();
    if (!user) {
      var next = "account.html" + window.location.search;
      window.location.replace(base + "login.html?next=" + encodeURIComponent(next));
      return;
    }
    var token = params.get("token");
    if (params.get("view") === "verify" && token) {
      post("verify-email", { token: token }).then(function () {
        return window.YinscentAuth.refresh();
      }).then(function () {
        var fresh = window.YinscentAuth.getMember();
        if (fresh) show(fresh);
      });
      return;
    }
    show(user);
  });
})();
