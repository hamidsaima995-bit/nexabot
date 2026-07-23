import { useState, useEffect, useCallback } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

const EMPTY_BOT = {
  name: "Support Bot",
  business_name: "",
  knowledge_base: "",
  welcome_message: "Hi! How can I help you today?",
  fallback_message:
    "I don't have that information. Please contact our team directly.",
  tone: "friendly and professional",
  theme_color: "#0d9488",
};

export default function App() {
  const [secret, setSecret] = useState(
    () => sessionStorage.getItem("nb_secret") || ""
  );
  const [authed, setAuthed] = useState(false);
  const [bots, setBots] = useState([]);
  const [selected, setSelected] = useState(null);
  const [draft, setDraft] = useState(EMPTY_BOT);
  const [messages, setMessages] = useState([]);
  const [tab, setTab] = useState("config");
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const api = useCallback(
    async (path, options = {}) => {
      const res = await fetch(`${API}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": secret,
          ...(options.headers || {}),
        },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }
      return res.json();
    },
    [secret]
  );

  const loadBots = useCallback(async () => {
    const data = await api("/api/admin/bots");
    setBots(data);
    return data;
  }, [api]);

  async function signIn() {
    setBusy(true);
    setStatus(null);
    try {
      await loadBots();
      sessionStorage.setItem("nb_secret", secret);
      setAuthed(true);
    } catch (e) {
      setStatus({ type: "error", text: e.message });
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (secret && !authed) {
      loadBots()
        .then(() => setAuthed(true))
        .catch(() => sessionStorage.removeItem("nb_secret"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectBot(bot) {
    setSelected(bot);
    setDraft(bot);
    setTab("config");
    setStatus(null);
    setMessages([]);
  }

  function newBot() {
    setSelected(null);
    setDraft(EMPTY_BOT);
    setTab("config");
    setStatus(null);
  }

  async function saveBot() {
    if (!draft.business_name.trim()) {
      setStatus({ type: "error", text: "Business name is required." });
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const saved = selected
        ? await api(`/api/admin/bots/${selected.id}`, {
            method: "PUT",
            body: JSON.stringify(draft),
          })
        : await api("/api/admin/bots", {
            method: "POST",
            body: JSON.stringify(draft),
          });
      await loadBots();
      setSelected(saved);
      setDraft(saved);
      setStatus({ type: "success", text: "Saved." });
    } catch (e) {
      setStatus({ type: "error", text: e.message });
    } finally {
      setBusy(false);
    }
  }

  async function deleteBot() {
    if (!selected) return;
    if (!confirm(`Delete "${selected.business_name}"? This can't be undone.`))
      return;
    setBusy(true);
    try {
      await api(`/api/admin/bots/${selected.id}`, { method: "DELETE" });
      await loadBots();
      newBot();
      setStatus({ type: "success", text: "Bot deleted." });
    } catch (e) {
      setStatus({ type: "error", text: e.message });
    } finally {
      setBusy(false);
    }
  }

  async function loadMessages() {
    if (!selected) return;
    setBusy(true);
    try {
      const data = await api(`/api/admin/bots/${selected.id}/messages`);
      setMessages(data);
    } catch (e) {
      setStatus({ type: "error", text: e.message });
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (tab === "chats" && selected) loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, selected]);

  const set = (key) => (e) => setDraft((d) => ({ ...d, [key]: e.target.value }));

  const embedCode = selected
    ? `<script src="${API}/widget.js" data-bot-id="${selected.id}" data-api="${API}" defer><\/script>`
    : "";

  // ---------- Login ----------
  if (!authed) {
    return (
      <div className="shell center">
        <div className="card login">
          <h1 className="logo">
            Nexa<span>Bot</span>
          </h1>
          <p className="muted">Sign in to manage your chatbots.</p>
          <input
            type="password"
            className="input"
            placeholder="Admin secret"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && signIn()}
          />
          <button className="btn primary full" onClick={signIn} disabled={busy}>
            {busy ? "Checking…" : "Sign in"}
          </button>
          {status && <div className={`alert ${status.type}`}>{status.text}</div>}
        </div>
      </div>
    );
  }

  // ---------- Dashboard ----------
  return (
    <div className="shell">
      <aside className="sidebar">
        <h1 className="logo">
          Nexa<span>Bot</span>
        </h1>
        <button className="btn primary full" onClick={newBot}>
          + New bot
        </button>
        <div className="bot-list">
          {bots.length === 0 && (
            <p className="muted small">No bots yet. Create your first one.</p>
          )}
          {bots.map((b) => (
            <button
              key={b.id}
              className={`bot-item ${selected?.id === b.id ? "active" : ""}`}
              onClick={() => selectBot(b)}
            >
              <span className="dot" style={{ background: b.theme_color }} />
              <span className="bot-name">{b.business_name}</span>
            </button>
          ))}
        </div>
      </aside>

      <main className="main">
        <div className="tabs">
          <button
            className={tab === "config" ? "tab active" : "tab"}
            onClick={() => setTab("config")}
          >
            Configure
          </button>
          <button
            className={tab === "embed" ? "tab active" : "tab"}
            onClick={() => setTab("embed")}
            disabled={!selected}
          >
            Install
          </button>
          <button
            className={tab === "chats" ? "tab active" : "tab"}
            onClick={() => setTab("chats")}
            disabled={!selected}
          >
            Conversations
          </button>
        </div>

        {status && <div className={`alert ${status.type}`}>{status.text}</div>}

        {tab === "config" && (
          <div className="card">
            <div className="grid-2">
              <label className="field">
                <span>Business name</span>
                <input
                  className="input"
                  value={draft.business_name}
                  onChange={set("business_name")}
                  placeholder="Lahore Dental Clinic"
                />
              </label>
              <label className="field">
                <span>Bot name</span>
                <input
                  className="input"
                  value={draft.name}
                  onChange={set("name")}
                  placeholder="Dr. Assist"
                />
              </label>
            </div>

            <label className="field">
              <span>Knowledge base</span>
              <textarea
                className="input textarea"
                rows={14}
                value={draft.knowledge_base}
                onChange={set("knowledge_base")}
                placeholder={
                  "Paste everything the bot should know:\n\nTIMINGS: Mon–Sat, 10am–8pm\nPRICES: Consultation PKR 1,500\nCONTACT: 042-3577-1234"
                }
              />
              <small className="muted">
                The bot answers only from this text. Anything missing here gets
                the fallback reply.
              </small>
            </label>

            <div className="grid-2">
              <label className="field">
                <span>Welcome message</span>
                <input
                  className="input"
                  value={draft.welcome_message}
                  onChange={set("welcome_message")}
                />
              </label>
              <label className="field">
                <span>Tone</span>
                <input
                  className="input"
                  value={draft.tone}
                  onChange={set("tone")}
                  placeholder="friendly and professional"
                />
              </label>
            </div>

            <label className="field">
              <span>Fallback reply</span>
              <input
                className="input"
                value={draft.fallback_message}
                onChange={set("fallback_message")}
              />
            </label>

            <label className="field">
              <span>Accent color</span>
              <input
                type="color"
                className="color"
                value={draft.theme_color}
                onChange={set("theme_color")}
              />
            </label>

            <div className="actions">
              <button className="btn primary" onClick={saveBot} disabled={busy}>
                {busy ? "Saving…" : selected ? "Save changes" : "Create bot"}
              </button>
              {selected && (
                <button className="btn danger" onClick={deleteBot} disabled={busy}>
                  Delete
                </button>
              )}
            </div>
          </div>
        )}

        {tab === "embed" && selected && (
          <div className="card">
            <h2 className="h2">Add the bot to a website</h2>
            <p className="muted">
              Paste this before the closing <code>&lt;/body&gt;</code> tag.
            </p>
            <pre className="code">{embedCode}</pre>
            <button
              className="btn"
              onClick={() => {
                navigator.clipboard.writeText(embedCode);
                setStatus({ type: "success", text: "Copied to clipboard." });
              }}
            >
              Copy code
            </button>
            <p className="muted small">
              Bot ID: <code>{selected.id}</code>
            </p>
          </div>
        )}

        {tab === "chats" && selected && (
          <div className="card">
            <div className="row-between">
              <h2 className="h2">Recent conversations</h2>
              <button className="btn" onClick={loadMessages} disabled={busy}>
                Refresh
              </button>
            </div>
            {messages.length === 0 ? (
              <p className="muted">
                No conversations yet. They appear here once visitors start
                chatting.
              </p>
            ) : (
              <div className="log">
                {messages.map((m) => (
                  <div key={m.id} className={`log-row ${m.role}`}>
                    <span className="log-role">{m.role}</span>
                    <span className="log-text">{m.content}</span>
                    <span className="log-time">
                      {new Date(m.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
