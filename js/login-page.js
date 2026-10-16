(function () {
  var base = window.YINSCENT_BASE || "/";
  var params = new URLSearchParams(window.location.search);
  var COPY = {
    zh: {
      title: "登录",
      idLabel: "账号",
      idPh: "请输入账号",
      password: "密码",
      passwordPh: "请输入密码",
      submit: "登录",
      forgot: "忘记密码？",
      forgotTitle: "重置密码申请",
      emailLabel: "绑定邮箱",
      emailPh: "请输入绑定邮箱",
      forgotSubmit: "提交重置申请",
      backLogin: "返回登录",
      forgotOk: "申请已提交。管理员设置新密码后，请使用新密码登录。",
      apply: "新客户注册",
      applyTitle: "新客户注册",
      accountLabel: "账号",
      accountPh: "请输入账号（4-20位，字母或数字）",
      contactLabel: "联系人",
      contactPh: "请输入联系人姓名",
      phoneLabel: "联系电话",
      phonePh: "请输入联系电话",
      applyEmailLabel: "邮箱",
      applyEmailPh: "请输入邮箱地址",
      companyLabel: "公司名称（选填）",
      companyPh: "请输入公司名称",
      countryLabel: "国家/地区",
      addressLabel: "详细地址（选填）",
      addressPh: "请输入详细地址",
      cityLabel: "城市",
      cityPh: "请输入城市",
      noteLabel: "备注（选填）",
      notePh: "请输入备注信息，如业务类型、合作需求等",
      agree: "我已阅读并同意",
      terms: "《网站使用条款》",
      andWord: "和",
      privacy: "《隐私政策》",
      pointGuard: "正品保障\n品质香氛",
      pointShip: "稳定供货\n快速发货",
      pointCare: "专属服务\n长期合作",
      emailHint: "支持网易、QQ、Gmail、Outlook及企业邮箱",
      badEmail: "请输入有效邮箱。支持网易、QQ、Gmail、Outlook及企业邮箱。",
      badUser: "账号需为 4-20 位字母或数字",
      badCountry: "请选择国家/地区",
      needAgree: "请先阅读并同意《网站使用条款》和《隐私政策》",
      usernameTaken: "这个账号已被使用",
      codeLabel: "邮箱验证码",
      codePh: "6 位验证码",
      sendCode: "获取验证码",
      applySubmit: "提交注册申请",
      submitted: "已提交",
      applyOk: "已提交",
      applyReady: "注册已完成，可以使用下方密码登录。",
      closed: "当前未开放新客户注册。",
      applyPass: "登录密码：",
      sent: "验证码已发送到邮箱。",
      devCode: "本地未配置发信，验证码是 ",
      invalid: "账号或密码不正确",
      pending: "申请正在审核，暂时不能登录",
      rejected: "申请未通过，暂时不能登录",
      disabled: "账号已停用",
      badCode: "验证码不正确或已过期",
      taken: "这个邮箱已有账号或正在审核",
      rate: "尝试次数过多，请稍后再试",
      show: "显示密码",
      hide: "隐藏密码",
      countryEmpty: "请选择国家/地区",
    },
    en: {
      title: "Sign in",
      idLabel: "Account",
      idPh: "Account",
      password: "Password",
      passwordPh: "Password",
      submit: "Sign in",
      forgot: "Forgot password?",
      forgotTitle: "Reset request",
      emailLabel: "Bound email",
      emailPh: "Bound email",
      forgotSubmit: "Request reset",
      backLogin: "Back to sign in",
      forgotOk: "Request sent. Sign in with the new password after an administrator issues it.",
      apply: "New customer",
      applyTitle: "New customer",
      accountLabel: "Account",
      accountPh: "4-20 letters or numbers",
      contactLabel: "Contact",
      contactPh: "Contact name",
      phoneLabel: "Phone",
      phonePh: "Phone number",
      applyEmailLabel: "Email",
      applyEmailPh: "Email address",
      companyLabel: "Company (optional)",
      companyPh: "Company name",
      countryLabel: "Country / region",
      addressLabel: "Address (optional)",
      addressPh: "Street address",
      cityLabel: "City",
      cityPh: "City",
      noteLabel: "Note (optional)",
      notePh: "Business type or cooperation needs",
      agree: "I have read and agree to the",
      terms: "Terms of use",
      andWord: "and",
      privacy: "Privacy policy",
      pointGuard: "Authentic\nFragrance",
      pointShip: "Steady supply\nFast shipping",
      pointCare: "Dedicated care\nLong-term",
      emailHint: "NetEase, QQ, Gmail, Outlook, and company mail all work.",
      badEmail: "Enter a valid email. NetEase, QQ, Gmail, Outlook, and company mail all work.",
      badUser: "Use 4-20 letters or numbers.",
      badCountry: "Choose a country or region.",
      needAgree: "Please agree to the terms and privacy policy.",
      usernameTaken: "This account is already in use.",
      codeLabel: "Email code",
      codePh: "6-digit code",
      sendCode: "Send code",
      applySubmit: "Submit application",
      submitted: "Submitted",
      applyOk: "Application sent. You can sign in after it is approved.",
      applyReady: "Registration is complete. Sign in with the password below.",
      closed: "New registration is closed.",
      applyPass: "Password: ",
      sent: "The code was sent to your email.",
      devCode: "Mail is not configured locally. Code: ",
      invalid: "Incorrect account or password",
      pending: "This application is still waiting for review.",
      rejected: "This application was not approved.",
      disabled: "This account is disabled",
      badCode: "The code is incorrect or expired.",
      taken: "This email already has an account or a pending application.",
      rate: "Too many attempts. Try again later.",
      show: "Show password",
      hide: "Hide password",
      countryEmpty: "Choose a country or region",
    },
    es: {
      title: "Iniciar sesión",
      idLabel: "Cuenta",
      idPh: "Introduce la cuenta",
      password: "Contraseña",
      passwordPh: "Introduce la contraseña",
      submit: "Iniciar sesión",
      forgot: "¿Olvidaste la contraseña?",
      forgotTitle: "Solicitar restablecimiento",
      emailLabel: "Correo vinculado",
      emailPh: "Introduce el correo vinculado",
      forgotSubmit: "Enviar solicitud",
      backLogin: "Volver a iniciar sesión",
      forgotOk: "Solicitud enviada. Inicia sesión con la nueva contraseña cuando el administrador la asigne.",
      apply: "Nuevo cliente",
      applyTitle: "Registro de cliente",
      accountLabel: "Cuenta",
      accountPh: "4-20 letras o números",
      contactLabel: "Contacto",
      contactPh: "Nombre del contacto",
      phoneLabel: "Teléfono",
      phonePh: "Número de teléfono",
      applyEmailLabel: "Correo",
      applyEmailPh: "Dirección de correo",
      companyLabel: "Empresa (opcional)",
      companyPh: "Nombre de la empresa",
      countryLabel: "País / región",
      addressLabel: "Dirección (opcional)",
      addressPh: "Dirección detallada",
      cityLabel: "Ciudad",
      cityPh: "Ciudad",
      noteLabel: "Nota (opcional)",
      notePh: "Tipo de negocio o necesidades de cooperación",
      agree: "He leído y acepto",
      terms: "los términos de uso",
      andWord: "y",
      privacy: "la política de privacidad",
      pointGuard: "Auténtico\nFragancias",
      pointShip: "Suministro estable\nEnvío rápido",
      pointCare: "Atención propia\nLargo plazo",
      emailHint: "Sirven NetEase, QQ, Gmail, Outlook y el correo de empresa.",
      badEmail: "Introduce un correo válido. Sirven NetEase, QQ, Gmail, Outlook y el correo de empresa.",
      badUser: "La cuenta debe tener de 4 a 20 letras o números.",
      badCountry: "Elige un país o región.",
      needAgree: "Lee y acepta los términos de uso y la política de privacidad.",
      usernameTaken: "Esta cuenta ya está en uso.",
      codeLabel: "Código de correo",
      codePh: "Código de 6 dígitos",
      sendCode: "Enviar código",
      applySubmit: "Enviar solicitud",
      submitted: "Enviado",
      applyOk: "Solicitud enviada. No podrás iniciar sesión hasta que sea aprobada.",
      applyReady: "El registro está completo. Inicia sesión con la contraseña de abajo.",
      closed: "El registro de nuevos clientes está cerrado.",
      applyPass: "Contraseña: ",
      sent: "El código se envió al correo.",
      devCode: "El correo no está configurado en local. Código: ",
      invalid: "Cuenta o contraseña incorrecta",
      pending: "La solicitud está en revisión y todavía no permite iniciar sesión.",
      rejected: "La solicitud no fue aprobada y no permite iniciar sesión.",
      disabled: "La cuenta está desactivada",
      badCode: "El código es incorrecto o ha caducado.",
      taken: "Este correo ya tiene una cuenta o una solicitud en revisión.",
      rate: "Demasiados intentos. Prueba más tarde.",
      show: "Mostrar contraseña",
      hide: "Ocultar contraseña",
      countryEmpty: "Elige un país o región",
    },
    pt: {
      title: "Entrar",
      idLabel: "Conta",
      idPh: "Introduza a conta",
      password: "Palavra-passe",
      passwordPh: "Introduza a palavra-passe",
      submit: "Entrar",
      forgot: "Esqueceu a palavra-passe?",
      forgotTitle: "Pedido de reposição",
      emailLabel: "E-mail associado",
      emailPh: "Introduza o e-mail associado",
      forgotSubmit: "Enviar pedido",
      backLogin: "Voltar a entrar",
      forgotOk: "Pedido enviado. Entre com a nova palavra-passe depois de o administrador a definir.",
      apply: "Novo cliente",
      applyTitle: "Registo de cliente",
      accountLabel: "Conta",
      accountPh: "4-20 letras ou números",
      contactLabel: "Contacto",
      contactPh: "Nome do contacto",
      phoneLabel: "Telefone",
      phonePh: "Número de telefone",
      applyEmailLabel: "E-mail",
      applyEmailPh: "Endereço de e-mail",
      companyLabel: "Empresa (opcional)",
      companyPh: "Nome da empresa",
      countryLabel: "País / região",
      addressLabel: "Morada (opcional)",
      addressPh: "Morada completa",
      cityLabel: "Cidade",
      cityPh: "Cidade",
      noteLabel: "Nota (opcional)",
      notePh: "Tipo de negócio ou necessidades de cooperação",
      agree: "Li e aceito",
      terms: "os termos de utilização",
      andWord: "e",
      privacy: "a política de privacidade",
      pointGuard: "Autêntico\nFragrâncias",
      pointShip: "Fornecimento estável\nEnvio rápido",
      pointCare: "Apoio dedicado\nLongo prazo",
      emailHint: "NetEase, QQ, Gmail, Outlook e e-mail de empresa são aceites.",
      badEmail: "Introduza um e-mail válido. NetEase, QQ, Gmail, Outlook e e-mail de empresa são aceites.",
      badUser: "A conta deve ter 4 a 20 letras ou números.",
      badCountry: "Escolha um país ou região.",
      needAgree: "Leia e aceite os termos de utilização e a política de privacidade.",
      usernameTaken: "Esta conta já está a ser usada.",
      codeLabel: "Código de e-mail",
      codePh: "Código de 6 dígitos",
      sendCode: "Enviar código",
      applySubmit: "Enviar pedido",
      submitted: "Enviado",
      applyOk: "Pedido enviado. Não é possível entrar até a aprovação.",
      applyReady: "O registo está concluído. Entre com a palavra-passe abaixo.",
      closed: "O registo de novos clientes está fechado.",
      applyPass: "Palavra-passe: ",
      sent: "O código foi enviado para o e-mail.",
      devCode: "O e-mail não está configurado localmente. Código: ",
      invalid: "Conta ou palavra-passe incorreta",
      pending: "O pedido está em análise e ainda não permite entrar.",
      rejected: "O pedido não foi aprovado e não permite entrar.",
      disabled: "A conta está desativada",
      badCode: "O código está incorreto ou expirou.",
      taken: "Este e-mail já tem uma conta ou um pedido em análise.",
      rate: "Demasiadas tentativas. Tente mais tarde.",
      show: "Mostrar palavra-passe",
      hide: "Ocultar palavra-passe",
      countryEmpty: "Escolha um país ou região",
    },
  };
  var COUNTRY_NAMES = {
    zh: { CN: "中国大陆", HK: "中国香港", MO: "中国澳门", TW: "中国台湾", US: "美国", CA: "加拿大", GB: "英国", AU: "澳大利亚", NZ: "新西兰", JP: "日本", KR: "韩国", SG: "新加坡", MY: "马来西亚", TH: "泰国", VN: "越南", ID: "印度尼西亚", PH: "菲律宾", IN: "印度", AE: "阿联酋", SA: "沙特阿拉伯", DE: "德国", FR: "法国", IT: "意大利", ES: "西班牙", PT: "葡萄牙", NL: "荷兰", BE: "比利时", CH: "瑞士", SE: "瑞典", NO: "挪威", DK: "丹麦", FI: "芬兰", IE: "爱尔兰", RU: "俄罗斯", BR: "巴西", MX: "墨西哥", AR: "阿根廷", ZA: "南非", TR: "土耳其", EG: "埃及" },
    en: { CN: "Mainland China", HK: "Hong Kong", MO: "Macao", TW: "Taiwan", US: "United States", CA: "Canada", GB: "United Kingdom", AU: "Australia", NZ: "New Zealand", JP: "Japan", KR: "South Korea", SG: "Singapore", MY: "Malaysia", TH: "Thailand", VN: "Vietnam", ID: "Indonesia", PH: "Philippines", IN: "India", AE: "United Arab Emirates", SA: "Saudi Arabia", DE: "Germany", FR: "France", IT: "Italy", ES: "Spain", PT: "Portugal", NL: "Netherlands", BE: "Belgium", CH: "Switzerland", SE: "Sweden", NO: "Norway", DK: "Denmark", FI: "Finland", IE: "Ireland", RU: "Russia", BR: "Brazil", MX: "Mexico", AR: "Argentina", ZA: "South Africa", TR: "Turkey", EG: "Egypt" },
    es: { CN: "China continental", HK: "Hong Kong", MO: "Macao", TW: "Taiwán", US: "Estados Unidos", CA: "Canadá", GB: "Reino Unido", AU: "Australia", NZ: "Nueva Zelanda", JP: "Japón", KR: "Corea del Sur", SG: "Singapur", MY: "Malasia", TH: "Tailandia", VN: "Vietnam", ID: "Indonesia", PH: "Filipinas", IN: "India", AE: "Emiratos Árabes Unidos", SA: "Arabia Saudí", DE: "Alemania", FR: "Francia", IT: "Italia", ES: "España", PT: "Portugal", NL: "Países Bajos", BE: "Bélgica", CH: "Suiza", SE: "Suecia", NO: "Noruega", DK: "Dinamarca", FI: "Finlandia", IE: "Irlanda", RU: "Rusia", BR: "Brasil", MX: "México", AR: "Argentina", ZA: "Sudáfrica", TR: "Turquía", EG: "Egipto" },
    pt: { CN: "China continental", HK: "Hong Kong", MO: "Macau", TW: "Taiwan", US: "Estados Unidos", CA: "Canadá", GB: "Reino Unido", AU: "Austrália", NZ: "Nova Zelândia", JP: "Japão", KR: "Coreia do Sul", SG: "Singapura", MY: "Malásia", TH: "Tailândia", VN: "Vietname", ID: "Indonésia", PH: "Filipinas", IN: "Índia", AE: "Emirados Árabes Unidos", SA: "Arábia Saudita", DE: "Alemanha", FR: "França", IT: "Itália", ES: "Espanha", PT: "Portugal", NL: "Países Baixos", BE: "Bélgica", CH: "Suíça", SE: "Suécia", NO: "Noruega", DK: "Dinamarca", FI: "Finlândia", IE: "Irlanda", RU: "Rússia", BR: "Brasil", MX: "México", AR: "Argentina", ZA: "África do Sul", TR: "Turquia", EG: "Egito" },
  };

  function lang() {
    var stored = localStorage.getItem("yinscent-lang");
    if (stored === "zh-Hant") return "zh";
    return COPY[stored] ? stored : "zh";
  }

  function localize(text) {
    try {
      if (localStorage.getItem("yinscent-lang") === "zh-Hant" && window.YINSCENT_I18N && window.YINSCENT_I18N.toTraditional) {
        return window.YINSCENT_I18N.toTraditional(text);
      }
    } catch (e) {}
    return text;
  }

  function safeNext(value) {
    var next = String(value || "");
    if (!next || next.charAt(0) === "/" || next.indexOf("\\") !== -1) return "";
    if (/^[a-z]+:/i.test(next)) return "";
    if (next.indexOf("login.html") === 0) return "";
    return next;
  }

  function destination() {
    var next = safeNext(params.get("next"));
    if (next && (next === "index.html" || next.indexOf("index.html?") === 0 || next.indexOf("index.html#") === 0)) {
      return base + next;
    }
    return base + "index.html";
  }

  var submitted = false;

  function applyCopy() {
    var copy = COPY[lang()] || COPY.zh;
    document.querySelectorAll("[data-copy]").forEach(function (node) {
      var key = node.getAttribute("data-copy");
      if (copy[key]) node.textContent = localize(copy[key]);
    });
    document.querySelectorAll("[data-copy-ph]").forEach(function (node) {
      var key = node.getAttribute("data-copy-ph");
      if (copy[key]) node.placeholder = localize(copy[key]);
    });
    var heading = document.querySelector(".login-panel h1");
    if (heading && forgotForm && !forgotForm.hidden) heading.textContent = localize(copy.forgotTitle);
    else if (heading) heading.textContent = localize(copy.title);
    var names = COUNTRY_NAMES[lang()] || COUNTRY_NAMES.zh;
    document.querySelectorAll("#applyCountry option").forEach(function (opt) {
      if (!opt.value) opt.textContent = localize(copy.countryEmpty || "请选择国家/地区");
      else if (names[opt.value]) opt.textContent = localize(names[opt.value]);
    });
    if (copy.title) document.title = localize(copy.title) + " — YINSCENT";
    var submitBtn = document.getElementById("applySubmit");
    if (submitBtn && submitted) submitBtn.textContent = localize((COPY[lang()] || COPY.zh).submitted || "已提交");
  }

  function setPasswordVisible(visible) {
    var input = document.getElementById("loginPassword");
    var button = document.getElementById("togglePassword");
    if (!input || !button) return;
    input.type = visible ? "text" : "password";
    button.classList.toggle("is-visible", visible);
    var copy = COPY[lang()] || COPY.zh;
    button.setAttribute("aria-label", localize(visible ? copy.hide : copy.show));
  }

  function showError(id, message) {
    var node = document.getElementById(id);
    if (!node) return;
    node.hidden = !message;
    node.textContent = message || "";
  }

  var loginForm = document.getElementById("memberLogin");
  var forgotForm = document.getElementById("forgotForm");
  var applyForm = document.getElementById("applyForm");
  var extra = document.querySelector(".login-extra");

  function showForm(name) {
    var card = document.getElementById("loginCard");
    var applyCard = document.getElementById("applyCard");
    if (card) card.hidden = name === "apply";
    if (applyCard) applyCard.hidden = name !== "apply";
    loginForm.hidden = name !== "login";
    forgotForm.hidden = name !== "forgot";
    extra.hidden = name !== "login" && name !== "forgot";
    document.getElementById("showForgot").hidden = name === "forgot";
    var copy = COPY[lang()] || COPY.zh;
    document.querySelector(".login-panel h1").textContent = localize(name === "forgot" ? copy.forgotTitle : copy.title);
  }

  document.getElementById("showForgot").addEventListener("click", function (event) {
    event.preventDefault();
    showForm("forgot");
  });
  document.getElementById("showApply").addEventListener("click", function (event) {
    event.preventDefault();
    showForm("apply");
  });
  document.getElementById("showLogin").addEventListener("click", function () {
    showForm("login");
  });
  document.getElementById("applyBack").addEventListener("click", function () {
    showForm("login");
  });

  function post(path, body) {
    return window.YinscentAuth.memberApi(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  function errorText(copy, code) {
    if (code === "disabled") return copy.disabled;
    if (code === "pending") return copy.pending;
    if (code === "rejected") return copy.rejected;
    if (code === "rate_limited" || code === "cooldown") return copy.rate;
    if (code === "email_taken" || code === "application_pending") return copy.taken;
    if (code === "invalid_email") return copy.badEmail;
    if (code === "invalid_username") return copy.badUser;
    if (code === "invalid_country") return copy.badCountry;
    if (code === "username_taken") return copy.usernameTaken;
    if (code === "register_closed") return copy.closed;
    return copy.invalid;
  }

  document.getElementById("togglePassword").addEventListener("click", function () {
    var input = document.getElementById("loginPassword");
    setPasswordVisible(input.type === "password");
  });

  loginForm.addEventListener("submit", function (event) {
    event.preventDefault();
    showError("loginError", "");
    var copy = COPY[lang()] || COPY.zh;
    var button = document.getElementById("loginSubmit");
    button.disabled = true;
    window.YinscentAuth.memberApi("login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: document.getElementById("loginId").value,
        password: document.getElementById("loginPassword").value,
      }),
    })
      .then(function (res) {
        if (!res.ok) {
          showError("loginError", errorText(copy, res.data && res.data.error));
          button.disabled = false;
          return;
        }
        window.location.replace(destination());
      })
      .catch(function () {
        showError("loginError", copy.invalid);
        button.disabled = false;
      });
  });

  forgotForm.addEventListener("submit", function (event) {
    event.preventDefault();
    showError("forgotError", "");
    var copy = COPY[lang()] || COPY.zh;
    var button = document.getElementById("forgotSubmit");
    button.disabled = true;
    window.YinscentAuth.memberApi("forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: document.getElementById("forgotUser").value,
        email: document.getElementById("forgotEmail").value,
      }),
    })
      .then(function (res) {
        button.disabled = false;
        if (!res.ok) {
          showError("forgotError", errorText(copy, res.data && res.data.error));
          return;
        }
        var note = document.getElementById("forgotNote");
        note.hidden = false;
        note.textContent = copy.forgotOk;
      })
      .catch(function () {
        button.disabled = false;
        showError("forgotError", copy.invalid);
      });
  });

  applyForm.addEventListener("submit", function (event) {
    event.preventDefault();
    showError("applyError", "");
    var copy = COPY[lang()] || COPY.zh;
    var username = document.getElementById("applyUser").value.trim().toLowerCase();
    if (!/^[a-z0-9]{4,20}$/.test(username)) {
      showError("applyError", copy.badUser);
      return;
    }
    if (!document.getElementById("applyCountry").value) {
      showError("applyError", copy.badCountry);
      return;
    }
    if (!document.getElementById("applyAgree").checked) {
      showError("applyError", copy.needAgree);
      return;
    }
    var button = document.getElementById("applySubmit");
    button.disabled = true;
    post("register", {
      username: username,
      name: document.getElementById("applyName").value,
      phone: document.getElementById("applyPhone").value,
      email: document.getElementById("applyEmail").value,
      company: document.getElementById("applyCompany").value,
      country: document.getElementById("applyCountry").value,
      address: document.getElementById("applyAddress").value,
      city: document.getElementById("applyCity").value,
      note: document.getElementById("applyNoteInput").value,
    }).then(function (res) {
      button.disabled = false;
      if (!res.ok) {
        showError("applyError", errorText(copy, res.data && res.data.error));
        return;
      }
      var note = document.getElementById("applyNote");
      submitted = true;
      button.disabled = true;
      button.textContent = localize(copy.submitted || "已提交");
      note.hidden = false;
      note.classList.add("is-submitted");
      note.textContent = localize(copy.submitted || "已提交");
      if (res.data && res.data.status === "active" && res.data.password) note.textContent += " " + copy.applyPass + res.data.password;
    }).catch(function () {
      button.disabled = false;
      showError("applyError", copy.invalid);
    });
  });

  ["applyTerms", "applyPrivacy"].forEach(function (id) {
    var link = document.getElementById(id);
    if (!link) return;
    link.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
    });
  });

  applyCopy();
  fetch((window.YINSCENT_BASE || "/") + "api/site").then(function (res) { return res.json(); }).then(function (data) {
    var site = data && data.site;
    var link = document.getElementById("showApply");
    if (site && site.allowRegister === false && link) link.hidden = true;
  }).catch(function () {});
  setPasswordVisible(false);
  window.addEventListener("yinscent:langchange", function () {
    applyCopy();
    setPasswordVisible(document.getElementById("loginPassword").type === "text");
  });

  if (window.YinscentAuth && window.YinscentAuth.whenReady) {
    window.YinscentAuth.whenReady().then(function () {
      var user = window.YinscentAuth.getMember();
      var admin = window.YinscentAuth.isAdmin && window.YinscentAuth.isAdmin();
      if (user || admin) window.location.replace(destination());
    });
  }
})();
