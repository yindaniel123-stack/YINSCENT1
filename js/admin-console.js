(function () {
  var base = window.YINSCENT_BASE || "/";
  var NAV = [
    ["dashboard", "数据仪表盘"],
    ["users", "用户管理"],
    ["review", "注册审核"],
    ["password", "固定密码重置"],
    ["status", "账号状态"],
    ["membership", "会员有效期"],
    ["access", "产品访问权限"],
    ["logins", "登录记录"],
    ["mail", "邮件记录"],
    ["smtp", "SMTP配置"],
    ["admins", "管理员权限"],
    ["settings", "系统设置"],
  ];
  var state = { admin: null, tab: "dashboard", notice: "" };

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

  function can(name) {
    if (!state.admin) return false;
    if (state.admin.super) return true;
    return (state.admin.permissions || []).indexOf(name) !== -1;
  }

  function panel() {
    return document.getElementById("consolePanel");
  }

  function clear(node) {
    node.innerHTML = "";
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function askConfirm() {
    return Promise.resolve("确认");
  }

  function note(parent, text) {
    var node = el("p", "admin-member-note", text);
    parent.appendChild(node);
    return node;
  }

  function showPassword(parent, username, password) {
    var text = "账号 " + (username || "—") + "，密码 " + password + "。已显示在用户资料中。";
    state.notice = text;
    note(parent, text);
  }

  function takeNotice(parent) {
    if (!state.notice) return;
    note(parent, state.notice);
    state.notice = "";
  }

  function act(body, message) {
    return askConfirm(message).then(function (confirmText) {
      if (confirmText !== "确认") return { ok: false, data: { error: "confirm_required" } };
      body.confirm = confirmText;
      return api("users", body);
    });
  }

  function fieldRow(list, label, value) {
    var row = el("div");
    row.appendChild(el("dt", "", label));
    row.appendChild(el("dd", "", value || "—"));
    list.appendChild(row);
  }

  function card(parent, user) {
    var box = el("article", "admin-member-card");
    var list = el("dl", "member-fields");
    var orders = user.orders || [];
    fieldRow(list, "姓名", user.name || "—");
    fieldRow(list, "账号", user.username || "未分配");
    fieldRow(list, "电话", user.phone || "—");
    fieldRow(list, "邮箱", user.email || "—");
    fieldRow(list, "国家", user.country || "—");
    fieldRow(list, "密码", user.password || "需重置后显示");
    fieldRow(list, "会员期限", user.membershipExpiresAt ? user.membershipExpiresAt.slice(0, 10) : "未设置");
    fieldRow(list, "订单", orders.length ? orders.map(function (order) {
      return order.id + " " + (order.status || "已提交");
    }).join("；") : "无");
    box.appendChild(list);
    parent.appendChild(box);
    return box;
  }

  function button(label, onClick) {
    var btn = el("button", "btn", label);
    btn.type = "button";
    btn.addEventListener("click", onClick);
    return btn;
  }

  function renderNav() {
    var nav = document.getElementById("consoleNav");
    if (!nav) return;
    clear(nav);
    NAV.forEach(function (item) {
      if (!can(item[0])) return;
      var btn = el("button", "member-console__tab" + (state.tab === item[0] ? " is-active" : ""), item[1]);
      btn.type = "button";
      btn.addEventListener("click", function () {
        state.tab = item[0];
        renderNav();
        renderTab();
      });
      nav.appendChild(btn);
    });
    if (!can(state.tab)) {
      var first = NAV.filter(function (item) { return can(item[0]); })[0];
      state.tab = first ? first[0] : "";
    }
  }

  function renderTab() {
    var root = panel();
    if (!root) return;
    clear(root);
    var tab = state.tab;
    if (tab === "dashboard") return renderDashboard(root);
    if (tab === "users") return renderUsers(root);
    if (tab === "review") return renderReview(root);
    if (tab === "password") return renderPassword(root);
    if (tab === "status") return renderStatus(root);
    if (tab === "membership") return renderMembership(root);
    if (tab === "access") return renderAccess(root);
    if (tab === "logins") return renderLogins(root);
    if (tab === "mail") return renderMail(root);
    if (tab === "smtp") return renderSmtp(root);
    if (tab === "admins") return renderAdmins(root);
    if (tab === "settings") return renderSettings(root);
  }

  function renderDashboard(root) {
    api("dashboard").then(function (res) {
      if (!res.ok) return note(root, "仪表盘暂时打不开");
      var counts = res.data.counts || {};
      var grid = el("div", "member-console__stats");
      [
        ["会员总数", counts.total],
        ["待审核", counts.pending],
        ["可用", counts.active],
        ["已禁用", counts.disabled],
        ["已拒绝", counts.rejected],
        ["30天内到期", counts.expiringSoon],
        ["已过期", counts.expired],
        ["重置申请", counts.resetPending],
        ["无产品权限", counts.noAccess],
      ].forEach(function (item) {
        var stat = el("article", "admin-stat");
        stat.appendChild(el("span", "admin-stat__label", item[0]));
        stat.appendChild(el("strong", "admin-stat__value", String(item[1] || 0)));
        grid.appendChild(stat);
      });
      root.appendChild(grid);
    });
  }

  function loadUsers() {
    return api("users").then(function (res) {
      return res.ok ? res.data : { users: [], logins: [] };
    });
  }

  function renderUsers(root) {
    var users = [];
    var viewId = "";
    var wrap = el("div", "user-list");
    var head = el("div", "user-list__head");
    head.appendChild(el("h3", "", "用户列表"));
    var add = el("button", "user-list__add", "+ 新增用户");
    add.type = "button";
    head.appendChild(add);
    wrap.appendChild(head);

    var search = el("form", "user-list__search");
    var query = el("input");
    query.type = "search";
    query.placeholder = "搜索账号 / 姓名";
    query.setAttribute("aria-label", "搜索账号 / 姓名");
    var searchBtn = el("button", "user-list__find");
    searchBtn.type = "submit";
    searchBtn.setAttribute("aria-label", "搜索");
    searchBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.6"></circle><path d="M16 16.5L20 20.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path></svg>';
    search.appendChild(query);
    search.appendChild(searchBtn);
    wrap.appendChild(search);

    var message = el("div");
    var list = el("div");
    wrap.appendChild(message);
    wrap.appendChild(list);

    var createPage = el("div", "user-create");
    createPage.hidden = true;
    var back = el("button", "user-create__back", "返回");
    back.type = "button";
    createPage.appendChild(back);
    createPage.appendChild(el("h3", "", "新用户"));
    var form = el("form", "user-create__form");
    function field(label, input) {
      var box = el("label", "user-create__field");
      box.appendChild(el("span", "", label));
      box.appendChild(input);
      form.appendChild(box);
      return input;
    }
    var person = field("姓名", el("input"));
    person.required = true;
    person.maxLength = 40;
    person.placeholder = "请输入姓名";
    var phone = field("电话", el("input"));
    phone.required = true;
    phone.maxLength = 20;
    phone.placeholder = "请输入电话";
    var email = field("邮箱", el("input"));
    email.type = "email";
    email.required = true;
    email.maxLength = 80;
    email.placeholder = "支持网易、QQ、Gmail、Outlook及企业邮箱";
    var country = el("select");
    [
      ["CN", "中国大陆"], ["HK", "中国香港"], ["MO", "中国澳门"], ["TW", "中国台湾"],
      ["US", "美国"], ["CA", "加拿大"], ["GB", "英国"], ["AU", "澳大利亚"], ["NZ", "新西兰"],
      ["JP", "日本"], ["KR", "韩国"], ["SG", "新加坡"], ["MY", "马来西亚"], ["TH", "泰国"],
      ["VN", "越南"], ["ID", "印度尼西亚"], ["PH", "菲律宾"], ["IN", "印度"], ["AE", "阿联酋"],
      ["SA", "沙特阿拉伯"], ["DE", "德国"], ["FR", "法国"], ["IT", "意大利"], ["ES", "西班牙"],
      ["PT", "葡萄牙"], ["NL", "荷兰"], ["BE", "比利时"], ["CH", "瑞士"], ["SE", "瑞典"],
      ["NO", "挪威"], ["DK", "丹麦"], ["FI", "芬兰"], ["IE", "爱尔兰"], ["RU", "俄罗斯"],
      ["BR", "巴西"], ["MX", "墨西哥"], ["AR", "阿根廷"], ["ZA", "南非"], ["TR", "土耳其"], ["EG", "埃及"],
    ].forEach(function (item) {
      var option = el("option", "", item[1]);
      option.value = item[0];
      country.appendChild(option);
    });
    country.value = "CN";
    field("国家", country);
    var account = field("账号", el("input"));
    account.required = true;
    account.maxLength = 32;
    account.placeholder = "字母、数字或下划线";
    var pass = field("密码", el("input"));
    pass.maxLength = 64;
    pass.placeholder = "留空则自动生成";
    var submit = el("button", "user-list__add user-create__save", "保存");
    submit.type = "submit";
    form.appendChild(submit);
    var createMessage = el("div");
    createPage.appendChild(form);
    createPage.appendChild(createMessage);
    root.appendChild(wrap);
    root.appendChild(createPage);

    function showList() {
      createPage.hidden = true;
      wrap.hidden = false;
    }
    function showCreate() {
      wrap.hidden = true;
      createPage.hidden = false;
      person.focus();
    }
    function createError(code) {
      if (code === "confirm_required") return "已取消";
      if (code === "invalid_application") return "请填写姓名和电话";
      if (code === "invalid_email") return "邮箱格式不正确";
      if (code === "email_taken") return "这个邮箱已被使用";
      if (code === "invalid_country") return "请选择国家";
      if (code === "invalid_username") return "账号需为 3–32 位字母、数字或下划线";
      if (code === "username_taken") return "这个账号已被使用";
      if (code === "invalid_password") return "密码需为 8–64 位";
      return "操作没有完成";
    }
    add.addEventListener("click", showCreate);
    back.addEventListener("click", showList);
    search.addEventListener("submit", function (event) {
      event.preventDefault();
      draw();
    });
    query.addEventListener("input", draw);
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      act({
        action: "create",
        name: person.value,
        phone: phone.value,
        email: email.value,
        country: country.value,
        username: account.value,
        password: pass.value,
      }, "创建这个新用户并生成固定密码。").then(function (res) {
        clear(createMessage);
        if (!res.ok) return note(createMessage, createError(res.data && res.data.error));
        person.value = "";
        phone.value = "";
        email.value = "";
        country.value = "CN";
        account.value = "";
        pass.value = "";
        showList();
        clear(message);
        showPassword(message, res.data.username, res.data.password);
        reload();
      });
    });

    function roleLabel(user) {
      return user.role === "admin" ? "管理员" : "会员";
    }

    function statusLabel(user) {
      if (user.disabled) return { text: "禁用", cls: "user-status user-status--off" };
      if (user.status === "pending") return { text: "待审核", cls: "user-status user-status--wait" };
      if (user.status === "rejected") return { text: "已拒绝", cls: "user-status user-status--off" };
      return { text: "启用", cls: "user-status user-status--on" };
    }

    var openToken = 0;

    function rowById(id) {
      return list.querySelector("tr[data-id='" + String(id).replace(/'/g, "") + "']");
    }

    function markView(id, open) {
      var row = rowById(id);
      var view = row && row.querySelector(".user-view");
      if (!view) return;
      view.classList.toggle("is-open", open);
      view.setAttribute("aria-expanded", open ? "true" : "false");
    }

    function removePanel(panel) {
      var row = panel && panel.closest("tr");
      if (row) row.remove();
    }

    function closeOpenPanel(done) {
      openToken += 1;
      var panel = list.querySelector(".user-detail");
      if (panel) {
        var dataRow = panel.closest("tr").previousElementSibling;
        var view = dataRow && dataRow.querySelector(".user-view");
        if (view) {
          view.classList.remove("is-open");
          view.setAttribute("aria-expanded", "false");
        }
      }
      if (!panel) {
        if (done) done();
        return;
      }
      if (!panel.classList.contains("is-open")) {
        removePanel(panel);
        if (done) done();
        return;
      }
      panel.classList.remove("is-open");
      var finished = false;
      function finish() {
        if (finished) return;
        finished = true;
        removePanel(panel);
        if (done) done();
      }
      panel.addEventListener("transitionend", function (event) {
        if (event.target !== panel || event.propertyName !== "grid-template-rows") return;
        finish();
      });
      window.setTimeout(finish, 340);
    }

    function mountDetail(user, animate) {
      var token = ++openToken;
      var tr = rowById(user.id);
      if (!tr) return;
      markView(user.id, true);
      var row = el("tr", "user-detail-row");
      var cell = el("td");
      cell.colSpan = 4;
      var panel = el("div", "user-detail");
      var clip = el("div", "user-detail__clip");
      var body = el("div", "user-detail__body");
      var box = card(body, user);
      var actions = el("div", "admin-member-actions");
      if (!user.username) {
        var input = el("input");
        input.placeholder = "分配账号";
        input.maxLength = 32;
        actions.appendChild(input);
        actions.appendChild(button("分配账号", function () {
          act({ action: "assign", id: user.id, username: input.value }, "分配账号并生成固定密码。").then(function (res) {
            clear(message);
            if (!res.ok) return note(message, "操作没有完成");
            showPassword(message, res.data.username, res.data.password);
            reload();
          });
        }));
      }
      actions.appendChild(button("删除", function () {
        act({ action: "delete", id: user.id }, "删除账号 " + (user.username || user.name || "") + " 后无法恢复。").then(function (res) {
          clear(message);
          if (!res.ok) return note(message, res.data.error === "confirm_required" ? "已取消" : "操作没有完成");
          viewId = "";
          reload();
        });
      }));
      var disable = button("禁用", function () {
        act({ action: "disable", id: user.id }, "禁用账号 " + (user.username || user.name || "") + "。").then(function (res) {
          clear(message);
          if (!res.ok) return note(message, res.data.error === "confirm_required" ? "已取消" : "操作没有完成");
          reload();
        });
      });
      disable.classList.add("user-action--disable");
      var enable = button("启用", function () {
        act({ action: "enable", id: user.id }, "启用账号 " + (user.username || user.name || "") + "。").then(function (res) {
          clear(message);
          if (!res.ok) return note(message, res.data.error === "confirm_required" ? "已取消" : "操作没有完成");
          reload();
        });
      });
      enable.classList.add("user-action--enable");
      actions.appendChild(disable);
      actions.appendChild(enable);
      box.appendChild(actions);
      clip.appendChild(body);
      panel.appendChild(clip);
      cell.appendChild(panel);
      row.appendChild(cell);
      tr.parentNode.insertBefore(row, tr.nextSibling);
      if (!animate) {
        panel.classList.add("is-open");
        return;
      }
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          if (token !== openToken || viewId !== user.id) return;
          panel.classList.add("is-open");
        });
      });
    }

    function toggleView(user) {
      if (viewId === user.id) {
        viewId = "";
        closeOpenPanel();
        return;
      }
      var nextId = user.id;
      viewId = nextId;
      closeOpenPanel(function () {
        if (viewId !== nextId) return;
        mountDetail(user, true);
      });
    }

    function draw() {
      var q = query.value.trim().toLowerCase();
      clear(list);
      var rows = users.filter(function (user) {
        if (!q) return true;
        return (user.username || "").toLowerCase().indexOf(q) !== -1 || (user.name || "").toLowerCase().indexOf(q) !== -1;
      });
      if (!rows.length) {
        list.appendChild(el("p", "user-list__empty", users.length ? "没有匹配的用户" : "还没有会员账号"));
        if (!users.some(function (user) { return user.id === viewId; })) viewId = "";
        return;
      }
      var table = el("table", "user-table");
      var thead = el("thead");
      var hr = el("tr");
      ["账号", "角色", "状态", "操作"].forEach(function (label) {
        hr.appendChild(el("th", "", label));
      });
      thead.appendChild(hr);
      table.appendChild(thead);
      var tbody = el("tbody");
      rows.forEach(function (user) {
        var tr = el("tr");
        tr.setAttribute("data-id", user.id);
        tr.appendChild(el("td", "user-table__account", user.username || "未分配"));
        tr.appendChild(el("td", "user-table__role", roleLabel(user)));
        var status = statusLabel(user);
        tr.appendChild(el("td", status.cls, status.text));
        var op = el("td");
        var view = el("button", "user-view", "查看");
        view.type = "button";
        view.setAttribute("aria-expanded", "false");
        view.addEventListener("click", function () { toggleView(user); });
        op.appendChild(view);
        tr.appendChild(op);
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      list.appendChild(table);
      var current = users.filter(function (user) { return user.id === viewId; })[0];
      if (current && rows.indexOf(current) !== -1) mountDetail(current, false);
      else viewId = "";
    }

    function reload() {
      loadUsers().then(function (data) {
        users = data.users || [];
        draw();
      });
    }
    reload();
  }

  function applyError(code) {
    if (code === "confirm_required") return "已取消";
    if (code === "invalid_application") return "请填写姓名和电话";
    if (code === "invalid_email") return "邮箱格式不正确";
    if (code === "application_pending") return "这个邮箱已有待审核申请";
    if (code === "email_taken") return "这个邮箱已被使用";
    return "操作没有完成";
  }

  function renderReview(root) {
    var form = el("form", "admin-member-create");
    var name = el("input");
    name.placeholder = "姓名";
    name.required = true;
    name.maxLength = 40;
    var phone = el("input");
    phone.placeholder = "电话";
    phone.required = true;
    phone.maxLength = 20;
    var email = el("input");
    email.type = "email";
    email.placeholder = "邮箱";
    email.required = true;
    email.maxLength = 80;
    var submit = el("button", "btn btn--gold", "添加注册");
    submit.type = "submit";
    form.appendChild(name);
    form.appendChild(phone);
    form.appendChild(email);
    form.appendChild(submit);
    root.appendChild(form);
    var message = el("div");
    var list = el("div");
    root.appendChild(message);
    root.appendChild(list);
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      act({
        action: "apply",
        name: name.value,
        phone: phone.value,
        email: email.value,
      }, "添加这条注册申请，状态为待审核。").then(function (res) {
        clear(message);
        if (!res.ok) return note(message, applyError(res.data && res.data.error));
        name.value = "";
        phone.value = "";
        email.value = "";
        note(message, "注册申请已添加，等待审核。");
        draw();
      });
    });
    function draw() {
      loadUsers().then(function (data) {
        clear(list);
        var pending = (data.users || []).filter(function (user) { return user.status === "pending"; });
        if (!pending.length) return list.appendChild(el("p", "", "还没有待审核的注册申请"));
        pending.forEach(function (user) {
          var box = card(list, user);
          var input = el("input");
          input.placeholder = "通过后的登录账号";
          input.maxLength = 32;
          var actions = el("div", "admin-member-actions");
          actions.appendChild(input);
          actions.appendChild(button("通过并生成密码", function () {
            act({ action: "approve", id: user.id, username: input.value }, "通过后会生成固定密码，并开通会员期限和产品权限。").then(function (res) {
              clear(message);
              if (!res.ok) return note(message, "操作没有完成");
              showPassword(message, res.data.username, res.data.password);
              draw();
            });
          }));
          actions.appendChild(button("拒绝", function () {
            act({ action: "reject", id: user.id }, "拒绝后该申请不能登录。").then(function (res) {
              if (res.ok) draw();
            });
          }));
          box.appendChild(actions);
        });
      });
    }
    draw();
  }

  function renderPassword(root) {
    var message = el("div");
    var list = el("div");
    root.appendChild(el("p", "account-lead", "重置后旧密码不再显示。新密码会留在用户资料里，旧的登录也会立即失效。"));
    root.appendChild(message);
    root.appendChild(list);
    function draw() {
    loadUsers().then(function (data) {
      clear(list);
      var rows = (data.users || []).filter(function (user) {
        return user.resetRequest || (user.username && user.status !== "pending");
      });
      if (!rows.length) return list.appendChild(el("p", "", "没有可重置的账号"));
      rows.forEach(function (user) {
        var box = card(list, user);
        if (user.resetRequest) box.appendChild(el("p", "", "重置申请 " + user.resetRequest.email + " · " + user.resetRequest.at));
        var actions = el("div", "admin-member-actions");
        actions.appendChild(button("生成新密码", function () {
          act({ action: "reset", id: user.id }, "重置后旧密码不再显示，新密码会留在用户资料里。").then(function (res) {
            clear(message);
            if (!res.ok) return note(message, "操作没有完成");
            showPassword(message, res.data.username, res.data.password);
            draw();
          });
        }));
        if (user.resetRequest) {
          actions.appendChild(button("忽略", function () {
            act({ action: "dismiss", id: user.id }, "忽略这条重置申请。").then(function (res) {
              if (res.ok) draw();
            });
          }));
        }
        box.appendChild(actions);
      });
    });
    }
    draw();
  }

  function renderStatus(root) {
    var list = el("div");
    root.appendChild(list);
    function draw() {
      loadUsers().then(function (data) {
        clear(list);
        (data.users || []).filter(function (user) { return user.status !== "pending"; }).forEach(function (user) {
          var box = card(list, user);
          var actions = el("div", "admin-member-actions");
          actions.appendChild(button(user.disabled ? "启用" : "禁用", function () {
            var next = user.disabled ? "enable" : "disable";
            act({ action: next, id: user.id }, (user.disabled ? "启用" : "禁用") + "账号 " + (user.username || user.name || "") + "。").then(function (res) {
              if (res.ok) draw();
            });
          }));
          box.appendChild(actions);
        });
      });
    }
    draw();
  }

  function renderMembership(root) {
    var list = el("div");
    root.appendChild(el("p", "account-lead", "到期后用户不能查看产品。未设置到期日的旧账号仍可访问，直到这里写入日期。"));
    root.appendChild(list);
    loadUsers().then(function (data) {
      (data.users || []).forEach(function (user) {
        var box = card(list, user);
        var input = el("input");
        input.type = "date";
        if (user.membershipExpiresAt) input.value = user.membershipExpiresAt.slice(0, 10);
        var actions = el("div", "admin-member-actions");
        actions.appendChild(input);
        actions.appendChild(button("保存有效期", function () {
          act({ action: "membership", id: user.id, expiresAt: input.value }, "把会员有效期改为 " + (input.value || "空") + "。").then(function (res) {
            if (res.ok) input.value = (res.data.membershipExpiresAt || "").slice(0, 10);
          });
        }));
        box.appendChild(actions);
      });
    });
  }

  function renderAccess(root) {
    var list = el("div");
    root.appendChild(el("p", "account-lead", "关闭后，即使用户已登录，产品页面和产品接口也会拒绝访问。"));
    root.appendChild(list);
    function draw() {
      loadUsers().then(function (data) {
        clear(list);
        (data.users || []).forEach(function (user) {
          var box = card(list, user);
          var actions = el("div", "admin-member-actions");
          actions.appendChild(button(user.productAccess ? "关闭产品权限" : "开启产品权限", function () {
            act({
              action: "access",
              id: user.id,
              productAccess: !user.productAccess,
            }, (user.productAccess ? "关闭" : "开启") + " " + (user.username || user.name || "该用户") + " 的产品访问权限。").then(function (res) {
              if (res.ok) draw();
            });
          }));
          box.appendChild(actions);
        });
      });
    }
    draw();
  }

  function renderLogins(root) {
    loadUsers().then(function (data) {
      var rows = data.logins || [];
      if (!rows.length) return root.appendChild(el("p", "", "还没有登录记录"));
      rows.forEach(function (row) {
        root.appendChild(el("p", "", row.at + " · " + (row.username || "—") + " · " + (row.ok ? "成功" : row.reason || "失败") + " · " + (row.ip || "")));
      });
    });
  }

  function renderMail(root) {
    api("mail-log").then(function (res) {
      if (!res.ok) return note(root, "邮件记录暂时打不开");
      root.appendChild(el("p", "account-lead", "收件邮箱 " + (res.data.to || "—") + (res.data.configured ? " · SMTP 已配置" : " · SMTP 未配置，邮件只记在这里")));
      var rows = res.data.records || [];
      if (!rows.length) return root.appendChild(el("p", "", "还没有邮件记录"));
      rows.forEach(function (row) {
        var box = el("article", "admin-member-card");
        box.appendChild(el("p", "", row.at + " · " + row.event + " · " + (row.sent ? "已发送" : "未发出") + " · " + row.to));
        box.appendChild(el("p", "", row.text || ""));
        root.appendChild(box);
      });
    });
  }

  function renderSmtp(root) {
    api("settings").then(function (res) {
      if (!res.ok) return note(root, "SMTP 配置暂时打不开");
      var smtp = res.data.smtp || {};
      var form = el("form", "admin-member-create");
      function field(placeholder, value, type) {
        var input = el("input");
        input.placeholder = placeholder;
        input.value = value || "";
        if (type) input.type = type;
        form.appendChild(input);
        return input;
      }
      var host = field("SMTP 主机", smtp.host);
      var port = field("端口", smtp.port || 587);
      var user = field("账号", smtp.user);
      var pass = field(smtp.hasPassword ? "密码留空表示不修改" : "密码或授权码", "", "password");
      var from = field("发件人", smtp.from);
      var submit = el("button", "btn btn--gold", "保存 SMTP");
      submit.type = "submit";
      form.appendChild(submit);
      root.appendChild(form);
      var message = el("div");
      root.appendChild(message);
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        askConfirm("保存 SMTP 配置。密码不会显示在页面上。").then(function (confirmText) {
          if (confirmText !== "确认") return;
          api("settings", {
            action: "smtp",
            confirm: confirmText,
            host: host.value,
            port: port.value,
            user: user.value,
            pass: pass.value,
            from: from.value,
          }).then(function (saved) {
            clear(message);
            note(message, saved.ok ? "SMTP 已保存" : "操作没有完成");
          });
        });
      });
    });
  }

  function renderAdmins(root) {
    clear(root);
    var message = el("div");
    takeNotice(message);
    root.appendChild(message);
    root.appendChild(el("p", "account-lead", "超级管理员拥有全部权限。这里创建的管理员只能使用被勾选的权限，密码同样只以哈希保存。"));
    root.appendChild(message);
    api("staff").then(function (res) {
      if (!res.ok) return note(message, "管理员列表暂时打不开");
      var perms = res.data.permissions || [];
      var labels = {};
      NAV.forEach(function (item) { labels[item[0]] = item[1]; });
      var form = el("form", "admin-member-create");
      var username = el("input");
      username.placeholder = "管理员账号";
      var person = el("input");
      person.placeholder = "姓名";
      form.appendChild(username);
      form.appendChild(person);
      var checks = el("div", "member-console__checks");
      var boxes = {};
      perms.forEach(function (key) {
        var label = el("label", "", labels[key] || key);
        var box = el("input");
        box.type = "checkbox";
        box.value = key;
        label.prepend(box);
        checks.appendChild(label);
        boxes[key] = box;
      });
      form.appendChild(checks);
      var submit = el("button", "btn btn--gold", "创建管理员");
      submit.type = "submit";
      form.appendChild(submit);
      root.appendChild(form);
      var list = el("div");
      root.appendChild(list);
      function selected() {
        return perms.filter(function (key) { return boxes[key] && boxes[key].checked; });
      }
      function draw(rows) {
        clear(list);
        (rows || []).forEach(function (admin) {
          var box = el("article", "admin-member-card");
          box.appendChild(el("p", "", admin.username + " · " + (admin.name || "—") + (admin.disabled ? " · 已禁用" : " · 可用")));
          box.appendChild(el("p", "", "权限 " + (admin.permissions || []).map(function (key) { return labels[key] || key; }).join("、")));
          var actions = el("div", "admin-member-actions");
          actions.appendChild(button("保存权限", function () {
            var chosen = Array.prototype.map.call(box.querySelectorAll("input:checked"), function (input) { return input.value; });
            askConfirm("修改管理员 " + admin.username + " 的权限。保存后该管理员需要重新登录。").then(function (confirmText) {
              if (confirmText !== "确认") return;
              api("staff", { action: "permissions", id: admin.id, permissions: chosen, confirm: confirmText }).then(function () {
                renderAdmins(root);
              });
            });
          }));
          actions.appendChild(button(admin.disabled ? "启用" : "禁用", function () {
            askConfirm((admin.disabled ? "启用" : "禁用") + "管理员 " + admin.username + "。").then(function (confirmText) {
              if (confirmText !== "确认") return;
              api("staff", { action: admin.disabled ? "enable" : "disable", id: admin.id, confirm: confirmText }).then(function () {
                renderAdmins(root);
              });
            });
          }));
          actions.appendChild(button("重置密码", function () {
            askConfirm("重置管理员 " + admin.username + " 的密码。新密码只显示一次。").then(function (confirmText) {
              if (confirmText !== "确认") return;
              api("staff", { action: "reset", id: admin.id, confirm: confirmText }).then(function (saved) {
                clear(message);
                if (saved.ok) showPassword(message, saved.data.username, saved.data.password);
              });
            });
          }));
          actions.appendChild(button("删除", function () {
            askConfirm("删除管理员 " + admin.username + "。").then(function (confirmText) {
              if (confirmText !== "确认") return;
              api("staff", { action: "delete", id: admin.id, confirm: confirmText }).then(function () {
                renderAdmins(root);
              });
            });
          }));
          var edit = el("div", "member-console__checks");
          perms.forEach(function (key) {
            var label = el("label", "", labels[key] || key);
            var input = el("input");
            input.type = "checkbox";
            input.value = key;
            input.checked = (admin.permissions || []).indexOf(key) !== -1;
            label.prepend(input);
            edit.appendChild(label);
          });
          box.appendChild(edit);
          box.appendChild(actions);
          list.appendChild(box);
        });
      }
      draw(res.data.admins || []);
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        askConfirm("创建管理员 " + username.value + "。").then(function (confirmText) {
          if (confirmText !== "确认") return;
          api("staff", {
            action: "create",
            confirm: confirmText,
            username: username.value,
            name: person.value,
            permissions: selected(),
          }).then(function (saved) {
            clear(message);
            if (!saved.ok) return note(message, "操作没有完成");
            showPassword(message, saved.data.username, saved.data.password);
            renderAdmins(root);
          });
        });
      });
    });
  }

  function renderSettings(root) {
    api("settings").then(function (res) {
      if (!res.ok) return note(root, "系统设置暂时打不开");
      var form = el("form", "admin-member-create");
      var months = el("input");
      months.type = "number";
      months.min = "1";
      months.max = "36";
      months.value = res.data.membershipMonths || 12;
      months.placeholder = "默认会员月数";
      var email = el("input");
      email.value = res.data.notifyEmail || "";
      email.placeholder = "通知邮箱，留空使用环境变量";
      var submit = el("button", "btn btn--gold", "保存设置");
      submit.type = "submit";
      form.appendChild(months);
      form.appendChild(email);
      form.appendChild(submit);
      root.appendChild(form);
      var message = el("div");
      root.appendChild(message);
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        askConfirm("保存默认会员月数和通知邮箱。").then(function (confirmText) {
          if (confirmText !== "确认") return;
          api("settings", {
            action: "system",
            confirm: confirmText,
            membershipMonths: months.value,
            notifyEmail: email.value,
          }).then(function (saved) {
            clear(message);
            note(message, saved.ok ? "系统设置已保存" : "操作没有完成");
          });
        });
      });
    });
  }

  var bootEpoch = 0;

  function boot() {
    if (!window.YinscentAuth || !window.YinscentAuth.isAdmin()) return;
    var epoch = ++bootEpoch;
    api("me").then(function (res) {
      if (epoch !== bootEpoch || !res.ok || !res.data.admin) return;
      state.admin = res.data.admin;
      renderNav();
      renderTab();
    });
  }

  window.YinscentConsole = {
    open: function (tab) {
      state.tab = tab;
      if (!state.admin) return;
      renderNav();
      renderTab();
    },
  };

  if (window.YinscentAuth && window.YinscentAuth.whenReady) {
    window.YinscentAuth.whenReady().then(boot);
  }
  document.addEventListener("yinscent:auth", boot);
})();
