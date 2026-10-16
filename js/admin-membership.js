(function () {
  var base = window.YINSCENT_BASE || "/";
  var state = { admin: null, view: "dashboard", users: [], logins: [], settings: null, mail: null, audit: null, staff: null };
  var NAV = [
    ["dashboard", "数据仪表盘", "dashboard"],
    ["users", "用户管理", "users"],
    ["review", "注册审核", "review"],
    ["resets", "固定密码重置", "password"],
    ["mail", "邮件记录", "mail"],
    ["templates", "邮件模板", "templates"],
    ["smtp", "SMTP配置", "smtp"],
    ["staff", "管理员权限", "admins"],
    ["settings", "系统设置", "settings"],
    ["audit", "操作日志", "logs"],
  ];

  function api(path, body) {
    return fetch(base + "api/admin/" + path, {
      method: body ? "POST" : "GET",
      credentials: "same-origin",
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
    }).then(function (res) {
      return res.json().then(function (data) {
        return { ok: res.ok, data: data || {} };
      });
    });
  }

  function can(permission) {
    if (!state.admin) return false;
    if (state.admin.super) return true;
    return (state.admin.permissions || []).indexOf(permission) !== -1;
  }

  function note(text) {
    var el = document.getElementById("memberCreateNote");
    if (!el) return;
    el.hidden = !text;
    el.textContent = text || "";
  }

  function line(parent, text) {
    var p = document.createElement("p");
    p.textContent = text;
    parent.appendChild(p);
    return p;
  }

  function button(label, onClick) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn";
    btn.textContent = label;
    btn.addEventListener("click", onClick);
    return btn;
  }

  function field(parent, placeholder, max) {
    var input = document.createElement("input");
    input.placeholder = placeholder;
    input.maxLength = max || 64;
    parent.appendChild(input);
    return input;
  }

  function askConfirm() {
    return Promise.resolve(true);
  }

  function act(path, body, success) {
    return askConfirm("这是高风险操作。确认后会记录操作者、时间、IP 和变更内容。").then(function (ok) {
      if (!ok) return;
      body.confirm = "确认";
      return api(path, body).then(function (res) {
        if (!res.ok) {
          note(res.data.error === "confirm_required" ? "需要二次确认" : "操作没有完成");
          return;
        }
        if (res.data.password) {
          note("账号 " + (res.data.username || "") + "，密码 " + res.data.password + "。请交给用户。新密码生效后，旧密码和已登录会话立即失效。账号信息已发送到通知邮箱。");
        } else if (success) note(success);
        else note("");
        return load();
      });
    });
  }

  function statusText(user) {
    var map = { pending: "待审核", rejected: "已拒绝", disabled: "已禁用", active: "可用" };
    var text = map[user.status] || "可用";
    if (user.status === "active" && user.membershipValid === false) text += " · 会员已到期";
    return text;
  }

  function userCard(user, mode) {
    var card = document.createElement("article");
    card.className = "admin-member-card";
    line(card, (user.username || "未分配账号") + " · " + statusText(user));
    line(card, "编号 " + user.id);
    line(card, "姓名 " + (user.name || "—") + " · 电话 " + (user.phone || "—"));
    line(card, "邮箱 " + (user.email || "—") + (user.emailVerified ? " · 已验证" : " · 未验证"));
    line(card, "注册时间 " + (user.createdAt || "—"));
    line(card, "会员到期 " + (user.membershipExpiresAt || "未开通") + (user.membershipValid ? " · 有效" : ""));
    line(card, "最近登录 " + (user.lastLoginAt || "—") + " · " + (user.lastLoginIp || "—"));
    var orders = user.orders || [];
    line(card, orders.length ? "订单 " + orders.map(function (order) {
      return order.id + " " + (order.status || "已提交") + " " + order.total;
    }).join("；") : "订单 无");
    if (user.resetRequest) {
      line(card, "重置申请 " + user.resetRequest.email + " · " + user.resetRequest.at);
    }
    var history = document.createElement("ul");
    (user.passwords || []).forEach(function (item) {
      var li = document.createElement("li");
      li.textContent = (item.active ? "当前密码 " : "旧密码 ") + item.value + " · " + item.at;
      history.appendChild(li);
    });
    if (!(user.passwords || []).length) line(card, "密码 尚未发放");
    card.appendChild(history);
    var actions = document.createElement("div");
    actions.className = "admin-member-actions";
    if (mode === "review" && (user.status === "pending" || user.status === "rejected")) {
      var nameInput = field(actions, "通过后的登录账号", 32);
      actions.appendChild(button("通过并生成密码", function () {
        act("users", { action: "approve", id: user.id, username: nameInput.value });
      }));
      if (user.status === "pending") {
        actions.appendChild(button("拒绝", function () {
          act("users", { action: "reject", id: user.id });
        }));
      }
    }
    if (mode === "users" && !user.username && user.status !== "pending" && user.status !== "rejected") {
      var assignName = field(actions, "分配账号", 32);
      actions.appendChild(button("分配账号", function () {
        act("users", { action: "assign", id: user.id, username: assignName.value });
      }));
    }
    if (mode === "users" && user.status !== "pending") {
      actions.appendChild(button(user.disabled ? "启用" : "禁用", function () {
        act("users", { action: user.disabled ? "enable" : "disable", id: user.id });
      }));
      actions.appendChild(button("续期 12 个月", function () {
        act("users", { action: "renew", id: user.id }, "会员已续期");
      }));
      actions.appendChild(button("删除", function () {
        act("users", { action: "delete", id: user.id }, "账号已删除");
      }));
    }
    if (mode === "resets") {
      actions.appendChild(button("生成新密码", function () {
        act("users", { action: "reset", id: user.id });
      }));
      if (user.resetRequest) {
        actions.appendChild(button("忽略", function () {
          api("users", { action: "dismiss", id: user.id }).then(load);
        }));
      }
    }
    if (mode === "review" && user.status === "pending") {
      actions.appendChild(button("删除", function () {
        act("users", { action: "delete", id: user.id }, "申请已删除");
      }));
    }
    card.appendChild(actions);
    return card;
  }

  function renderNav() {
    var nav = document.getElementById("memberAdminNav");
    if (!nav) return;
    nav.innerHTML = "";
    NAV.forEach(function (item) {
      if (!can(item[2])) return;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = item[1];
      btn.className = state.view === item[0] ? "is-active" : "";
      btn.addEventListener("click", function () {
        state.view = item[0];
        note("");
        render();
      });
      nav.appendChild(btn);
    });
  }

  function renderDashboard(root) {
    var stats = document.createElement("div");
    stats.className = "member-stats";
    root.appendChild(stats);
    api("dashboard").then(function (res) {
      if (!res.ok) {
        line(root, "仪表盘暂时打不开");
        return;
      }
      var counts = res.data.counts || {};
      [
        ["会员总数", counts.total],
        ["待审核", counts.pending],
        ["可用", counts.active],
        ["已禁用", counts.disabled],
        ["已拒绝", counts.rejected],
        ["30 天内到期", counts.expiringSoon],
        ["已过期", counts.expired],
      ].forEach(function (item) {
        var article = document.createElement("article");
        var span = document.createElement("span");
        var strong = document.createElement("strong");
        span.textContent = item[0];
        strong.textContent = String(item[1] || 0);
        article.appendChild(span);
        article.appendChild(strong);
        stats.appendChild(article);
      });
      line(root, "会员有效期按系统设置计算，默认 12 个月。到期后产品接口会拒绝访问。");
      (res.data.recentLogins || []).forEach(function (row) {
        line(root, row.at + " · " + (row.username || "—") + " · " + (row.ok ? "成功" : row.reason || "失败") + " · " + (row.ip || ""));
      });
    });
  }

  function renderUsers(root, mode) {
    var list = state.users.filter(function (user) {
      if (mode === "review") return user.status === "pending" || user.status === "rejected";
      if (mode === "resets") return true;
      return true;
    });
    if (mode === "resets") {
      var queued = state.users.filter(function (user) { return user.resetRequest; });
      if (!queued.length) line(root, "还没有重置密码申请");
      queued.forEach(function (user) { root.appendChild(userCard(user, "resets")); });
      line(root, "也可以为下面任一账号直接生成新的固定密码。");
      list.forEach(function (user) {
        if (!user.resetRequest && user.username) root.appendChild(userCard(user, "resets"));
      });
      return;
    }
    if (mode === "users") {
      var form = document.createElement("form");
      form.className = "admin-member-create";
      var username = field(form, "账号（字母数字下划线）", 32);
      var password = field(form, "留空则自动生成密码", 64);
      var submit = document.createElement("button");
      submit.type = "submit";
      submit.className = "btn btn--gold";
      submit.textContent = "创建账号";
      form.appendChild(submit);
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        act("users", { action: "create", username: username.value, password: password.value });
      });
      root.appendChild(form);
    }
    if (!list.length) line(root, mode === "review" ? "还没有待审核的注册申请" : "还没有会员账号");
    list.forEach(function (user) {
      if (mode === "resets") return;
      root.appendChild(userCard(user, mode));
    });
  }

  function renderMail(root) {
    api("mail-log").then(function (res) {
      if (!res.ok) return line(root, "邮件记录暂时打不开");
      line(root, (res.data.configured ? "SMTP 已配置，收件邮箱 " : "SMTP 未配置，邮件暂未发出。记录仍保存在后台。收件邮箱 ") + (res.data.to || ""));
      var records = res.data.records || [];
      if (!records.length) line(root, "还没有邮件记录");
      records.forEach(function (row) {
        var card = document.createElement("article");
        card.className = "admin-member-card";
        line(card, row.at + " · " + row.event + " · " + (row.sent ? "已发送" : "未发送"));
        line(card, "收件人 " + (row.to || ""));
        var body = document.createElement("pre");
        body.textContent = row.text || "";
        card.appendChild(body);
        root.appendChild(card);
      });
    });
  }

  function renderTemplates(root) {
    api("settings").then(function (res) {
      if (!res.ok) return line(root, "模板暂时打不开");
      var templates = res.data.templates || {};
      var form = document.createElement("form");
      Object.keys(templates).forEach(function (name) {
        var label = document.createElement("label");
        label.className = "login-field";
        var span = document.createElement("span");
        span.textContent = name;
        var area = document.createElement("textarea");
        area.name = name;
        area.rows = 5;
        area.value = templates[name];
        label.appendChild(span);
        label.appendChild(area);
        form.appendChild(label);
      });
      var saveTemplates = document.createElement("button");
      saveTemplates.type = "submit";
      saveTemplates.className = "btn btn--gold";
      saveTemplates.textContent = "保存模板";
      form.appendChild(saveTemplates);
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var next = {};
        form.querySelectorAll("textarea").forEach(function (area) { next[area.name] = area.value; });
        act("settings", { action: "templates", templates: next }, "邮件模板已保存");
      });
      root.appendChild(form);
    });
  }

  function renderSmtp(root) {
    api("settings").then(function (res) {
      if (!res.ok) return line(root, "SMTP 配置暂时打不开");
      var smtp = res.data.smtp || {};
      line(root, smtp.hasPassword ? "已保存邮箱密码。留空则不修改。" : "还没有保存邮箱密码。");
      var form = document.createElement("form");
      form.className = "admin-member-create";
      var host = field(form, "SMTP 主机，如 smtp.qq.com", 120);
      var port = field(form, "端口，常用 587 或 465", 6);
      var user = field(form, "邮箱账号", 120);
      var pass = field(form, "邮箱密码或授权码", 120);
      var from = field(form, "发件人", 120);
      host.value = smtp.host || "";
      port.value = smtp.port || 587;
      user.value = smtp.user || "";
      from.value = smtp.from || "";
      pass.type = "password";
      var saveSmtp = document.createElement("button");
      saveSmtp.type = "submit";
      saveSmtp.className = "btn btn--gold";
      saveSmtp.textContent = "保存 SMTP";
      form.appendChild(saveSmtp);
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        act("settings", {
          action: "smtp",
          host: host.value,
          port: port.value,
          user: user.value,
          pass: pass.value,
          from: from.value,
        }, "SMTP 已保存，之后发信会使用这份配置");
      });
      root.appendChild(form);
    });
  }

  function renderSettings(root) {
    api("settings").then(function (res) {
      if (!res.ok) return line(root, "系统设置暂时打不开");
      var form = document.createElement("form");
      form.className = "admin-member-create";
      var months = field(form, "会员有效期（月）", 2);
      var email = field(form, "通知邮箱", 120);
      months.value = res.data.membershipMonths || 12;
      email.value = res.data.notifyEmail || "";
      var saveSettings = document.createElement("button");
      saveSettings.type = "submit";
      saveSettings.className = "btn btn--gold";
      saveSettings.textContent = "保存设置";
      form.appendChild(saveSettings);
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        act("settings", {
          action: "system",
          membershipMonths: months.value,
          notifyEmail: email.value,
        }, "系统设置已保存");
      });
      root.appendChild(form);
      line(root, "通知邮箱留空时，使用服务器上的 NOTIFY_EMAIL，默认 yindaniel123@gmail.com。用户资料和发放的密码会发到这个邮箱保存。");
    });
  }

  function renderStaff(root) {
    api("staff").then(function (res) {
      if (!res.ok) return line(root, "管理员列表暂时打不开");
      var form = document.createElement("form");
      form.className = "admin-member-create";
      var username = field(form, "管理员账号", 32);
      var name = field(form, "姓名", 40);
      var checks = document.createElement("div");
      (res.data.permissions || []).forEach(function (key) {
        var label = document.createElement("label");
        var box = document.createElement("input");
        box.type = "checkbox";
        box.value = key;
        label.appendChild(box);
        label.appendChild(document.createTextNode(" " + (NAV.filter(function (item) { return item[2] === key; })[0] || [key, key])[1]));
        checks.appendChild(label);
      });
      form.appendChild(username);
      form.appendChild(name);
      form.appendChild(checks);
      var saveStaff = document.createElement("button");
      saveStaff.type = "submit";
      saveStaff.className = "btn btn--gold";
      saveStaff.textContent = "创建管理员";
      form.appendChild(saveStaff);
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var selected = [];
        checks.querySelectorAll("input:checked").forEach(function (box) { selected.push(box.value); });
        act("staff", { action: "create", username: username.value, name: name.value, permissions: selected });
      });
      root.appendChild(form);
      line(root, "主管理员使用服务器上的管理员密码登录，账号可留空。下面是额外管理员。");
      (res.data.admins || []).forEach(function (admin) {
        var card = document.createElement("article");
        card.className = "admin-member-card";
        line(card, admin.username + " · " + (admin.name || "") + (admin.disabled ? " · 已禁用" : " · 可用"));
        line(card, "权限 " + (admin.permissions || []).join(", "));
        (admin.passwords || []).forEach(function (item) {
          line(card, (item.active ? "当前密码 " : "旧密码 ") + item.value);
        });
        var actions = document.createElement("div");
        actions.className = "admin-member-actions";
        actions.appendChild(button(admin.disabled ? "启用" : "禁用", function () {
          act("staff", { action: admin.disabled ? "enable" : "disable", id: admin.id });
        }));
        actions.appendChild(button("重置密码", function () {
          act("staff", { action: "reset", id: admin.id });
        }));
        actions.appendChild(button("删除", function () {
          act("staff", { action: "delete", id: admin.id }, "管理员已删除");
        }));
        card.appendChild(actions);
        root.appendChild(card);
      });
    });
  }

  function renderAudit(root) {
    api("audit").then(function (res) {
      if (!res.ok) return line(root, "操作日志暂时打不开");
      var records = res.data.records || [];
      if (!records.length) line(root, "还没有操作日志");
      records.forEach(function (row) {
        var card = document.createElement("article");
        card.className = "admin-member-card";
        line(card, row.at + " · " + row.action + " · " + (row.actorName || row.actorId || "—"));
        line(card, "IP " + (row.ip || "—") + " · 对象 " + (row.target || "—"));
        var body = document.createElement("pre");
        body.textContent = JSON.stringify(row.changes || {}, null, 2);
        card.appendChild(body);
        root.appendChild(card);
      });
    });
  }

  function render() {
    var root = document.getElementById("memberAdminMain");
    if (!root || !state.admin) return;
    var current = NAV.filter(function (item) { return item[0] === state.view; })[0];
    if (!current || !can(current[2])) state.view = "dashboard";
    renderNav();
    root.innerHTML = "";
    if (state.view === "dashboard") renderDashboard(root);
    else if (state.view === "users") renderUsers(root, "users");
    else if (state.view === "review") renderUsers(root, "review");
    else if (state.view === "resets") renderUsers(root, "resets");
    else if (state.view === "mail") renderMail(root);
    else if (state.view === "templates") renderTemplates(root);
    else if (state.view === "smtp") renderSmtp(root);
    else if (state.view === "settings") renderSettings(root);
    else if (state.view === "staff") renderStaff(root);
    else if (state.view === "audit") renderAudit(root);
  }

  function load() {
    if (!window.YinscentAuth || !window.YinscentAuth.isAdmin()) return Promise.resolve();
    return api("me").then(function (me) {
      if (!me.ok) return;
      state.admin = me.data.admin;
      var jobs = [];
      if (can("users") || can("review") || can("password")) {
        jobs.push(api("users").then(function (res) {
          if (res.ok) {
            state.users = res.data.users || [];
            state.logins = res.data.logins || [];
          }
        }));
      }
      return Promise.all(jobs).then(render);
    });
  }

  if (window.YinscentAuth && window.YinscentAuth.whenReady) {
    window.YinscentAuth.whenReady().then(load);
  }
  document.addEventListener("yinscent:auth", load);
})();
