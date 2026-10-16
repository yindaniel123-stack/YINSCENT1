(function () {
  var base = window.YINSCENT_BASE || "/";

  function call(body) {
    return fetch(base + "api/admin/users", {
      method: body ? "POST" : "GET",
      credentials: "same-origin",
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
    }).then(function (res) {
      return res.json().then(function (data) {
        return { ok: res.ok, data: data };
      });
    });
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

  function render(data) {
    var list = document.getElementById("memberList");
    var queue = document.getElementById("memberResetQueue");
    var log = document.getElementById("memberLog");
    if (!list) return;
    list.innerHTML = "";
    queue.innerHTML = "";
    log.innerHTML = "";

    var notifyLine = document.getElementById("memberNotify");
    if (!notifyLine) {
      notifyLine = document.createElement("p");
      notifyLine.id = "memberNotify";
      notifyLine.className = "admin-member-note";
      var queueTitle = document.getElementById("memberQueueTitle");
      queue.parentNode.insertBefore(notifyLine, queueTitle || queue);
    }
    if (data.notify) {
      notifyLine.hidden = false;
      notifyLine.textContent = data.notify.configured
        ? "申请和用户动态会发送到 " + data.notify.to
        : "申请和用户动态的收件邮箱是 " + data.notify.to + "。当前还没有配置 SMTP，邮件暂时发不出去。";
    }

    var users = (data.users || []).slice().sort(function (a, b) {
      function rank(user) {
        if (user.status === "pending") return 0;
        if (user.resetRequest) return 1;
        if (user.status === "rejected") return 2;
        if (user.disabled || user.status === "disabled") return 3;
        return 4;
      }
      return rank(a) - rank(b);
    });
    var queued = false;

    users.forEach(function (user) {
      if (user.status === "pending") {
        var pending = document.createElement("div");
        pending.className = "admin-member-card";
        line(pending, "注册申请：" + (user.name || "—") + " · " + (user.phone || "—") + " · " + (user.email || ""));
        var nameInput = document.createElement("input");
        nameInput.placeholder = "通过后的登录账号";
        nameInput.maxLength = 32;
        pending.appendChild(nameInput);
        pending.appendChild(button("通过并生成密码", function () {
          act({ action: "approve", id: user.id, username: nameInput.value });
        }));
        pending.appendChild(button("拒绝", function () { act({ action: "reject", id: user.id }); }));
        queue.appendChild(pending);
        queued = true;
      }
      if (user.resetRequest) {
        var ask = document.createElement("div");
        ask.className = "admin-member-card";
        line(ask, "重置申请：" + user.username + " · " + (user.resetRequest.email || "") + " · " + user.resetRequest.at);
        ask.appendChild(button("生成新密码", function () { act({ action: "reset", id: user.id }); }));
        ask.appendChild(button("忽略", function () { act({ action: "dismiss", id: user.id }); }));
        queue.appendChild(ask);
        queued = true;
      }

      var card = document.createElement("article");
      card.className = "admin-member-card";
      var statusText = { pending: "待审核", rejected: "已拒绝", disabled: "已禁用", active: "可用" };
      line(card, (user.username || "未分配账号") + " · " + (statusText[user.status] || "可用"));
      line(card, "姓名 " + (user.name || "—") + " · 电话 " + (user.phone || "—"));
      line(card, "邮箱 " + (user.email || "—") + (user.emailVerified ? " · 已验证" : " · 未验证"));
      var orders = user.orders || [];
      line(card, orders.length ? "订单 " + orders.map(function (order) {
        return order.id + " " + (order.status || "已提交") + " " + order.total;
      }).join("；") : "订单 无");
      var history = document.createElement("ul");
      (user.passwords || []).forEach(function (item) {
        var li = document.createElement("li");
        li.textContent = (item.active ? "当前 " : "旧密码 ") + item.value + " · " + item.at;
        history.appendChild(li);
      });
      card.appendChild(history);
      var actions = document.createElement("div");
      actions.className = "admin-member-actions";
      if (user.status === "pending" || user.status === "rejected") {
        var approveName = document.createElement("input");
        approveName.placeholder = "登录账号";
        approveName.maxLength = 32;
        actions.appendChild(approveName);
        actions.appendChild(button("通过", function () {
          act({ action: "approve", id: user.id, username: approveName.value });
        }));
        if (user.status === "pending") {
          actions.appendChild(button("拒绝", function () { act({ action: "reject", id: user.id }); }));
        }
      } else if (!user.username) {
        var nameInput = document.createElement("input");
        nameInput.placeholder = "分配账号";
        nameInput.maxLength = 32;
        actions.appendChild(nameInput);
        actions.appendChild(button("分配账号", function () {
          act({ action: "assign", id: user.id, username: nameInput.value });
        }));
      }
      if (user.status !== "pending") {
        actions.appendChild(button(user.disabled ? "启用" : "禁用", function () {
          act({ action: user.disabled ? "enable" : "disable", id: user.id });
        }));
        actions.appendChild(button("重置密码", function () { act({ action: "reset", id: user.id }); }));
      }
      actions.appendChild(button("删除", function () {
        if (window.confirm("删除账号 " + user.username + "？")) act({ action: "delete", id: user.id });
      }));
      card.appendChild(actions);
      list.appendChild(card);
    });

    if (!queued) line(queue, "还没有待审核的注册申请");
    if (!users.length) line(list, "还没有会员账号");
    (data.logins || []).forEach(function (row) {
      line(log, row.at + " · " + (row.username || "—") + " · " + (row.ok ? "成功" : row.reason || "失败") + " · " + (row.ip || ""));
    });
    if (!(data.logins || []).length) line(log, "还没有登录记录");
  }

  function showPassword(prefix, password) {
    var note = document.getElementById("memberCreateNote");
    note.hidden = false;
    note.textContent = prefix + password + "。请交给用户。新密码生效后，旧密码和已登录会话立即失效。";
  }

  function act(body) {
    return call(body).then(function (res) {
      if (!res.ok) {
        var note = document.getElementById("memberCreateNote");
        note.hidden = false;
        note.textContent = "操作没有完成";
        return;
      }
      if (res.data.password) {
        var account = res.data.username ? "账号 " + res.data.username + "，密码 " : "新密码：";
        showPassword(account, res.data.password);
      }
      return load();
    });
  }

  function load() {
    if (!window.YinscentAuth || !window.YinscentAuth.isAdmin()) return;
    call(null).then(function (res) {
      if (res.ok) render(res.data);
    });
  }

  var form = document.getElementById("memberCreate");
  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      act({
        action: "create",
        username: document.getElementById("memberUsername").value,
        password: document.getElementById("memberPassword").value,
      });
    });
  }

  function boot() {
    load();
  }

  if (window.YinscentAuth && window.YinscentAuth.whenReady) {
    window.YinscentAuth.whenReady().then(boot);
  }
  document.addEventListener("yinscent:auth", boot);
})();
