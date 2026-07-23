/*!
 * NexaBot Widget v1.0
 * Usage: <script src="https://your-api.up.railway.app/widget.js"
 *                data-bot-id="BOT_UUID" data-api="https://your-api.up.railway.app" defer></script>
 */
(function () {
  "use strict";

  if (window.__NEXABOT_LOADED__) return;
  window.__NEXABOT_LOADED__ = true;

  var script =
    document.currentScript ||
    document.querySelector("script[data-bot-id]");
  if (!script) return console.error("[NexaBot] script tag not found");

  var BOT_ID = script.getAttribute("data-bot-id");
  var API = (script.getAttribute("data-api") || "").replace(/\/$/, "");
  var POSITION = script.getAttribute("data-position") || "right";

  if (!BOT_ID) return console.error("[NexaBot] data-bot-id is required");
  if (!API) {
    try {
      API = new URL(script.src).origin;
    } catch (e) {
      return console.error("[NexaBot] data-api is required");
    }
  }

  var SESSION_KEY = "nexabot_session_" + BOT_ID;
  var sessionId = null;
  try {
    sessionId = localStorage.getItem(SESSION_KEY);
  } catch (e) {
    /* private mode */
  }

  var config = {
    name: "Assistant",
    business_name: "Support",
    welcome_message: "Hi! How can I help you today?",
    theme_color: "#0d9488",
  };

  var isOpen = false;
  var isSending = false;

  // ---------- Shadow DOM (host page CSS se bachne ke liye) ----------
  var host = document.createElement("div");
  host.id = "nexabot-host";
  host.style.cssText =
    "position:fixed;bottom:0;" +
    (POSITION === "left" ? "left:0;" : "right:0;") +
    "z-index:2147483000;";
  var root = host.attachShadow({ mode: "open" });

  var style = document.createElement("style");
  style.textContent = [
    ":host,*{box-sizing:border-box}",
    ".wrap{font-family:'Inter',ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;font-size:14px;line-height:1.5}",
    ".launcher{position:fixed;bottom:20px;" +
      (POSITION === "left" ? "left:20px;" : "right:20px;") +
      "width:56px;height:56px;border-radius:50%;border:none;background:var(--c);color:#fff;cursor:pointer;box-shadow:0 6px 22px rgba(0,0,0,.28);display:flex;align-items:center;justify-content:center;transition:transform .18s ease}",
    ".launcher:hover{transform:scale(1.06)}",
    ".launcher:focus-visible{outline:3px solid #fff;outline-offset:2px}",
    ".launcher svg{width:26px;height:26px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}",
    ".panel{position:fixed;bottom:88px;" +
      (POSITION === "left" ? "left:20px;" : "right:20px;") +
      "width:370px;max-width:calc(100vw - 32px);height:min(560px,calc(100vh - 120px));background:#fff;border-radius:16px;box-shadow:0 18px 50px rgba(0,0,0,.24);display:none;flex-direction:column;overflow:hidden}",
    ".panel.open{display:flex}",
    ".head{background:var(--c);color:#fff;padding:15px 16px;display:flex;align-items:center;gap:11px;flex-shrink:0}",
    ".avatar{width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.22);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0}",
    ".head-txt{flex:1;min-width:0}",
    ".head-name{font-weight:600;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".head-sub{font-size:12px;opacity:.85;display:flex;align-items:center;gap:5px}",
    ".live{width:7px;height:7px;border-radius:50%;background:#4ade80;display:inline-block}",
    ".close{background:none;border:none;color:#fff;cursor:pointer;padding:4px;opacity:.85;font-size:22px;line-height:1}",
    ".close:hover{opacity:1}",
    ".body{flex:1;overflow-y:auto;padding:16px;background:#f7f9fb;display:flex;flex-direction:column;gap:10px}",
    ".msg{max-width:82%;padding:10px 13px;border-radius:14px;white-space:pre-wrap;word-wrap:break-word;overflow-wrap:anywhere}",
    ".msg.bot{background:#fff;color:#1a2233;border:1px solid #e3e9f0;align-self:flex-start;border-bottom-left-radius:4px}",
    ".msg.user{background:var(--c);color:#fff;align-self:flex-end;border-bottom-right-radius:4px}",
    ".msg.err{background:#fef2f2;color:#b91c1c;border:1px solid #fecaca;align-self:flex-start}",
    ".typing{display:flex;gap:4px;padding:12px 14px;background:#fff;border:1px solid #e3e9f0;border-radius:14px;border-bottom-left-radius:4px;align-self:flex-start}",
    ".typing i{width:7px;height:7px;border-radius:50%;background:#9aa8bd;animation:bob 1.3s infinite}",
    ".typing i:nth-child(2){animation-delay:.18s}",
    ".typing i:nth-child(3){animation-delay:.36s}",
    "@keyframes bob{0%,60%,100%{transform:translateY(0);opacity:.45}30%{transform:translateY(-5px);opacity:1}}",
    ".foot{padding:11px;background:#fff;border-top:1px solid #e8edf3;display:flex;gap:8px;flex-shrink:0}",
    ".in{flex:1;padding:10px 13px;border:1px solid #d9e1ea;border-radius:22px;font:inherit;color:#1a2233;outline:none;background:#fff;resize:none;max-height:96px;min-height:40px}",
    ".in:focus{border-color:var(--c)}",
    ".send{width:40px;height:40px;border-radius:50%;border:none;background:var(--c);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0}",
    ".send:disabled{opacity:.45;cursor:not-allowed}",
    ".send svg{width:17px;height:17px;fill:currentColor}",
    ".brand{text-align:center;font-size:11px;color:#9aa8bd;padding:0 0 8px;background:#fff}",
    "@media(max-width:480px){.panel{bottom:0;right:0;left:0;width:100%;max-width:100%;height:100%;border-radius:0}}",
    "@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}",
  ].join("");

  var wrap = document.createElement("div");
  wrap.className = "wrap";
  wrap.innerHTML =
    '<button class="launcher" part="launcher" aria-label="Open chat">' +
    '<svg viewBox="0 0 24 24"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z"/></svg>' +
    "</button>" +
    '<div class="panel" role="dialog" aria-label="Chat window">' +
    '<div class="head">' +
    '<div class="avatar" data-initial>A</div>' +
    '<div class="head-txt"><div class="head-name" data-name>Assistant</div>' +
    '<div class="head-sub"><span class="live"></span>Online</div></div>' +
    '<button class="close" aria-label="Close chat">&times;</button>' +
    "</div>" +
    '<div class="body" data-body role="log" aria-live="polite"></div>' +
    '<div class="foot">' +
    '<textarea class="in" data-input rows="1" placeholder="Type your message…" aria-label="Message"></textarea>' +
    '<button class="send" data-send aria-label="Send message">' +
    '<svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>' +
    "</button></div>" +
    '<div class="brand">Powered by NexaBot</div>' +
    "</div>";

  root.appendChild(style);
  root.appendChild(wrap);

  var launcher = wrap.querySelector(".launcher");
  var panel = wrap.querySelector(".panel");
  var closeBtn = wrap.querySelector(".close");
  var bodyEl = wrap.querySelector("[data-body]");
  var inputEl = wrap.querySelector("[data-input]");
  var sendBtn = wrap.querySelector("[data-send]");
  var nameEl = wrap.querySelector("[data-name]");
  var initialEl = wrap.querySelector("[data-initial]");

  // ---------- Rendering ----------
  function scrollDown() {
    bodyEl.scrollTop = bodyEl.scrollHeight;
  }

  function addMessage(text, kind) {
    var el = document.createElement("div");
    el.className = "msg " + kind;
    el.textContent = text; // textContent = XSS safe
    bodyEl.appendChild(el);
    scrollDown();
    return el;
  }

  function showTyping() {
    var el = document.createElement("div");
    el.className = "typing";
    el.innerHTML = "<i></i><i></i><i></i>";
    bodyEl.appendChild(el);
    scrollDown();
    return el;
  }

  function setBusy(busy) {
    isSending = busy;
    sendBtn.disabled = busy;
    inputEl.disabled = busy;
  }

  // ---------- Networking ----------
  function loadConfig() {
    fetch(API + "/api/bots/" + encodeURIComponent(BOT_ID) + "/public")
      .then(function (r) {
        if (!r.ok) throw new Error("config " + r.status);
        return r.json();
      })
      .then(function (data) {
        config = Object.assign(config, data);
        host.style.setProperty("--c", config.theme_color || "#0d9488");
        wrap.style.setProperty("--c", config.theme_color || "#0d9488");
        nameEl.textContent = config.name;
        initialEl.textContent = (config.business_name || "A")
          .charAt(0)
          .toUpperCase();
      })
      .catch(function (e) {
        console.error("[NexaBot]", e.message);
        wrap.style.setProperty("--c", "#0d9488");
      });
  }

  function send() {
    var text = inputEl.value.trim();
    if (!text || isSending) return;

    inputEl.value = "";
    inputEl.style.height = "auto";
    addMessage(text, "user");
    setBusy(true);
    var typing = showTyping();

    fetch(API + "/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ botId: BOT_ID, message: text, sessionId: sessionId }),
    })
      .then(function (r) {
        return r.json().then(function (d) {
          if (!r.ok) throw new Error(d.error || "Request failed");
          return d;
        });
      })
      .then(function (data) {
        typing.remove();
        if (data.sessionId && data.sessionId !== sessionId) {
          sessionId = data.sessionId;
          try {
            localStorage.setItem(SESSION_KEY, sessionId);
          } catch (e) {}
        }
        addMessage(data.reply, "bot");
      })
      .catch(function (e) {
        typing.remove();
        addMessage(e.message || "Connection failed. Try again.", "err");
      })
      .finally(function () {
        setBusy(false);
        inputEl.focus();
      });
  }

  // ---------- Events ----------
  function toggle() {
    isOpen = !isOpen;
    panel.classList.toggle("open", isOpen);
    launcher.setAttribute("aria-label", isOpen ? "Close chat" : "Open chat");
    if (isOpen) {
      if (bodyEl.children.length === 0) {
        addMessage(config.welcome_message, "bot");
      }
      setTimeout(function () {
        inputEl.focus();
      }, 60);
    }
  }

  launcher.addEventListener("click", toggle);
  closeBtn.addEventListener("click", toggle);
  sendBtn.addEventListener("click", send);

  inputEl.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });

  inputEl.addEventListener("input", function () {
    inputEl.style.height = "auto";
    inputEl.style.height = Math.min(inputEl.scrollHeight, 96) + "px";
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && isOpen) toggle();
  });

  // ---------- Boot ----------
  function boot() {
    document.body.appendChild(host);
    loadConfig();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
