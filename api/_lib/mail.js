/*
 * Plain-text mail. Uses SMTP when SMTP_HOST and SMTP_FROM are set.
 * Otherwise the caller can show a local-only link.
 */
const net = require("net");
const tls = require("tls");
const https = require("https");

function smtpConfig() {
  let saved = null;
  try {
    saved = require("./settings").read().smtp;
  } catch (e) {}
  if (saved && (saved.provider === "resend" || saved.provider === "sendgrid") && saved.apiKey && (saved.from || saved.user)) {
    return {
      host: "",
      port: 587,
      user: String(saved.user || ""),
      pass: "",
      from: String(saved.from || saved.user || ""),
      fromName: String(saved.fromName || ""),
      secure: saved.secure === "ssl" ? "ssl" : "tls",
      provider: saved.provider,
      apiKey: String(saved.apiKey),
    };
  }
  if (saved && saved.host && (saved.from || saved.user)) {
    return {
      host: String(saved.host),
      port: Number(saved.port) || 587,
      user: String(saved.user || ""),
      pass: String(saved.pass || ""),
      from: String(saved.from || saved.user || ""),
      fromName: String(saved.fromName || ""),
      secure: saved.secure === "ssl" ? "ssl" : "tls",
      provider: saved.provider === "resend" || saved.provider === "sendgrid" ? saved.provider : "smtp",
      apiKey: String(saved.apiKey || ""),
    };
  }
  const user = process.env.SMTP_USER || "";
  return {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT || 587),
    user: user,
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || user,
    fromName: "",
    secure: Number(process.env.SMTP_PORT || 587) === 465 ? "ssl" : "tls",
    provider: "smtp",
    apiKey: "",
  };
}

function formatFrom(name, email) {
  const clean = String(name || "").replace(/[\r\n<>"]/g, "").trim().slice(0, 60);
  if (!clean) return email;
  const encoded = /^[\x20-\x7e]*$/.test(clean)
    ? "\"" + clean.replace(/"/g, "") + "\""
    : "=?UTF-8?B?" + Buffer.from(clean, "utf8").toString("base64") + "?=";
  return encoded + " <" + email + ">";
}

function configured() {
  const smtp = smtpConfig();
  if (smtp.provider === "resend" || smtp.provider === "sendgrid") return !!(smtp.apiKey && smtp.from);
  return !!(smtp.host && smtp.from);
}

function postJson(url, headers, payload) {
  return new Promise(function (resolve) {
    const body = JSON.stringify(payload);
    const target = new URL(url);
    const req = https.request({
      hostname: target.hostname,
      path: target.pathname,
      method: "POST",
      headers: Object.assign({
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      }, headers),
    }, function (res) {
      res.resume();
      resolve({ sent: res.statusCode >= 200 && res.statusCode < 300, reason: res.statusCode >= 200 && res.statusCode < 300 ? "" : "failed" });
    });
    req.setTimeout(15000, function () {
      req.destroy();
      resolve({ sent: false, reason: "failed" });
    });
    req.on("error", function () { resolve({ sent: false, reason: "failed" }); });
    req.end(body);
  });
}

function sendMail(message) {
  const smtp = smtpConfig();
  if (smtp.provider === "resend" && smtp.apiKey && smtp.from) {
    return postJson("https://api.resend.com/emails", { Authorization: "Bearer " + smtp.apiKey }, {
      from: formatFrom(smtp.fromName, smtp.from),
      to: [message.to],
      subject: String(message.subject || ""),
      text: String(message.text || ""),
      html: message.html || undefined,
    });
  }
  if (smtp.provider === "sendgrid" && smtp.apiKey && smtp.from) {
    const content = [{ type: "text/plain", value: String(message.text || "") }];
    if (message.html) content.push({ type: "text/html", value: message.html });
    return postJson("https://api.sendgrid.com/v3/mail/send", { Authorization: "Bearer " + smtp.apiKey }, {
      personalizations: [{ to: [{ email: message.to }] }],
      from: { email: smtp.from, name: smtp.fromName || undefined },
      subject: String(message.subject || ""),
      content: content,
    });
  }
  if (!smtp.host || !smtp.from) return Promise.resolve({ sent: false, reason: "unconfigured" });
  const host = smtp.host;
  const port = smtp.port;
  const user = smtp.user;
  const pass = smtp.pass;
  const from = smtp.from;
  const fromHeader = formatFrom(smtp.fromName, from);
  const secure = smtp.secure === "ssl" || port === 465;
  const subject = String(message.subject || "");
  const encodedSubject = /^[\x20-\x7e]*$/.test(subject)
    ? subject
    : "=?UTF-8?B?" + Buffer.from(subject, "utf8").toString("base64") + "?=";
  const encodedBody = Buffer.from(String(message.text || ""), "utf8")
    .toString("base64")
    .replace(/(.{76})/g, "$1\r\n");
  const boundary = "yinscent_" + Date.now().toString(36);
  const htmlBody = message.html
    ? Buffer.from(String(message.html), "utf8").toString("base64").replace(/(.{76})/g, "$1\r\n")
    : "";
  const body = message.html
    ? [
      "From: " + fromHeader,
      "To: " + message.to,
      "Subject: " + encodedSubject,
      "MIME-Version: 1.0",
      "Content-Type: multipart/alternative; boundary=\"" + boundary + "\"",
      "",
      "--" + boundary,
      "Content-Type: text/plain; charset=utf-8",
      "Content-Transfer-Encoding: base64",
      "",
      encodedBody,
      "--" + boundary,
      "Content-Type: text/html; charset=utf-8",
      "Content-Transfer-Encoding: base64",
      "",
      htmlBody,
      "--" + boundary + "--",
      "",
    ].join("\r\n")
    : [
      "From: " + fromHeader,
      "To: " + message.to,
      "Subject: " + encodedSubject,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=utf-8",
      "Content-Transfer-Encoding: base64",
      "",
      encodedBody,
    ].join("\r\n");

  return new Promise(function (resolve) {
    let buffer = "";
    let stage = "greeting";
    let socket = secure
      ? tls.connect({ host: host, port: port, servername: host })
      : net.connect(port, host);

    function fail() {
      try {
        socket.destroy();
      } catch (e) {}
      resolve({ sent: false, reason: "failed" });
    }

    function command(line) {
      socket.write(line + "\r\n");
    }

    function onData(chunk) {
      buffer += chunk.toString("utf8");
      let lineEnd = buffer.indexOf("\r\n");
      while (lineEnd !== -1) {
        const line = buffer.slice(0, lineEnd);
        buffer = buffer.slice(lineEnd + 2);
        if (line.length < 4) {
          fail();
          return;
        }
        const code = Number(line.slice(0, 3));
        const more = line.charAt(3) === "-";
        if (!more) handle(code);
        if (stage === "done" || stage === "dead") return;
        lineEnd = buffer.indexOf("\r\n");
      }
    }

    function handle(code) {
      if (stage === "greeting" && code === 220) {
        stage = "ehlo";
        return command("EHLO yinscent");
      }
      if (stage === "ehlo" && code === 250) {
        if (!secure && port !== 465) {
          stage = "starttls";
          return command("STARTTLS");
        }
        return auth();
      }
      if (stage === "starttls" && code === 220) {
        stage = "upgrading";
        const plain = socket;
        plain.removeListener("data", onData);
        socket = tls.connect({ socket: plain, servername: host });
        socket.on("secure", function () {
          buffer = "";
          stage = "ehlo2";
          command("EHLO yinscent");
        });
        socket.on("data", onData);
        socket.on("error", fail);
        return;
      }
      if (stage === "ehlo2" && code === 250) return auth();
      if (stage === "auth" && code === 334) {
        stage = "auth-user";
        return command(Buffer.from(user).toString("base64"));
      }
      if (stage === "auth-user" && code === 334) {
        stage = "auth-pass";
        return command(Buffer.from(pass).toString("base64"));
      }
      if (stage === "auth-pass" && code === 235) return mailFrom();
      if (stage === "mail" && code === 250) {
        stage = "rcpt";
        return command("RCPT TO:<" + message.to + ">");
      }
      if (stage === "rcpt" && code === 250) {
        stage = "data";
        return command("DATA");
      }
      if (stage === "data" && code === 354) {
        stage = "body";
        return command(body.replace(/^\./gm, "..") + "\r\n.");
      }
      if (stage === "body" && code === 250) {
        stage = "done";
        command("QUIT");
        socket.end();
        return resolve({ sent: true });
      }
      if (stage === "ehlo2" && code === 220) return;
      stage = "dead";
      fail();
    }

    function auth() {
      if (!user) return mailFrom();
      stage = "auth";
      command("AUTH LOGIN");
    }

    function mailFrom() {
      stage = "mail";
      command("MAIL FROM:<" + from + ">");
    }

    socket.setTimeout(15000, fail);
    socket.on("data", onData);
    socket.on("error", fail);
  });
}

function origin(req) {
  const proto = req.headers["x-forwarded-proto"] || "http";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "127.0.0.1";
  return String(proto).split(",")[0].trim() + "://" + String(host).split(",")[0].trim();
}

function isLocal(req) {
  const host = String(req.headers.host || "").split(":")[0];
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

module.exports = { configured, sendMail, origin, isLocal };
