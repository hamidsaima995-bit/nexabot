# NexaBot

An embeddable AI customer support chatbot. A business pastes its own information into an admin panel, copies one script tag, and its website gets a chat widget that answers visitor questions — and refuses to invent anything it wasn't told.

---

## The problem

Most website chatbots fail in one of two ways. Either they are decision trees that break the moment someone phrases a question differently, or they are language models wired straight to a website with no grounding, confidently making up prices and opening hours that do not exist.

NexaBot is built around the second problem. The bot answers strictly from a knowledge base the business controls, and when the answer is not there it says so instead of guessing. A chatbot that invents a price is worse than no chatbot at all.

## How it works

```
Business owner                        Website visitor
      │                                     │
      │ pastes FAQs, prices, hours          │ asks a question
      ▼                                     ▼
  Admin panel ──▶ Supabase ◀── Express API ◀── Chat widget
                                    │              (one script tag)
                                    ▼
                              DeepSeek API
                         (grounded in that business
                          only — nothing else)
```

1. The owner writes a knowledge base in the admin panel — opening hours, prices, policies, anything
2. NexaBot generates an embed snippet with that bot's ID
3. The snippet goes on the business's site before `</body>`
4. Visitors chat; every reply is generated from that knowledge base and nothing else
5. Conversations are logged so the owner can see what people actually ask

## Features

**For the business owner**
- Knowledge base editor — plain text, no training, no formatting rules
- Multiple bots from one deployment, each with its own knowledge and branding
- Custom accent colour, bot name, welcome message, and tone per bot
- Conversation history showing what visitors asked and how the bot answered
- Copy-paste embed snippet, no technical setup required

**For the visitor**
- Answers grounded in real business information, not generated guesses
- Conversation context — follow-up questions work without repeating yourself
- Replies in the language the visitor writes in
- Works on mobile as a full-screen chat, on desktop as a corner widget

**Engineering**
- Widget lives in a Shadow DOM, so the host site's CSS cannot break it and its CSS cannot leak out
- Zero dependencies in the widget — plain JavaScript, roughly 9KB
- Knowledge base is filtered server-side and never reaches the browser
- Rate limiting on the chat endpoint
- Admin routes behind a shared secret
- Messages rendered with `textContent`, so a visitor cannot inject markup
- Prompt-injection instruction in the system prompt: attempts to override the bot's role are ignored
- Graceful degradation — localStorage failures in private browsing don't break the widget

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express |
| Database | Supabase (PostgreSQL) |
| AI | DeepSeek (`deepseek-chat`), switchable to Anthropic |
| Admin panel | React, Vite |
| Widget | Vanilla JavaScript, Shadow DOM |
| Hosting | Railway |

## Project structure

```
backend/
  server.js          API — chat, admin CRUD, widget serving
  schema.sql         Database tables, RLS setup, demo bot
  public/
    widget.js        The embeddable widget

frontend/
  src/App.jsx        Admin panel
  src/index.css      Styling

demo.html            Example client site with the widget installed
SETUP.md             Step-by-step deployment guide
```

## API

| Method | Route | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/health` | — | Health check |
| `GET` | `/api/bots/:id/public` | — | Widget config (no knowledge base) |
| `POST` | `/api/chat` | — | Send a message, get a reply |
| `GET` | `/api/admin/bots` | secret | List all bots |
| `POST` | `/api/admin/bots` | secret | Create a bot |
| `PUT` | `/api/admin/bots/:id` | secret | Update a bot |
| `DELETE` | `/api/admin/bots/:id` | secret | Delete a bot |
| `GET` | `/api/admin/bots/:id/messages` | secret | Conversation log |

Admin routes require an `x-admin-secret` header.

## Installing on a website

```html
<script
  src="https://your-deployment.up.railway.app/widget.js"
  data-bot-id="YOUR_BOT_ID"
  defer></script>
```

Optional attributes:

| Attribute | Default | Purpose |
|---|---|---|
| `data-api` | script origin | Override the API host |
| `data-position` | `right` | `left` or `right` |

## Running locally

```bash
# backend
cd backend
npm install
cp .env.example .env    # fill in your values
npm start

# admin panel, in a second terminal
cd frontend
npm install
cp .env.example .env
npm run dev
```

Full deployment instructions, including Supabase setup and Railway configuration, are in [SETUP.md](SETUP.md).

## Environment variables

**Backend**

| Variable | Purpose |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Service role key — server-side only |
| `DEEPSEEK_API_KEY` | DeepSeek API key |
| `ADMIN_SECRET` | Password for the admin panel |
| `AI_PROVIDER` | `deepseek` or `anthropic` |
| `PORT` | Set automatically by Railway |

**Frontend**

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend URL |

## Design notes

**Why the knowledge base is filtered server-side rather than by the query.** The public config endpoint selects only safe columns, which should be enough — but a client's FAQs, pricing, and internal policies are exactly the data that must never reach a browser. The endpoint constructs its response from an explicit whitelist, so a change to the query or a database default cannot leak anything. Getting this wrong once is worse than the cost of the extra six lines.

**Why the widget uses Shadow DOM.** An embeddable widget lands on sites whose CSS is unknown and often aggressive — global resets, `!important` everywhere, `div { box-sizing: content-box }`. A Shadow root makes the widget immune to all of it, and equally guarantees the widget cannot break the host site's layout.

**Why the widget has no dependencies.** It loads on someone else's website. Every kilobyte is a cost paid by a business that did not choose it, and every dependency is a supply-chain risk transferred to them. Plain JavaScript keeps it around 9KB and keeps the trust boundary simple.

**Why replies are capped and grounded.** The system prompt instructs the model to answer only from the knowledge base and to return a fixed fallback message otherwise. This is the product. A support bot that invents a price creates a commitment the business has to honour or explain away — which is a worse outcome than not having answered.

**Why the AI provider is swappable.** The model call is isolated behind one function with a provider switch. DeepSeek is roughly twenty times cheaper than the alternatives and good enough for grounded question-answering, but a client with different requirements can change one environment variable.

## Roadmap

- [ ] Document upload — build a knowledge base from a PDF or website crawl
- [ ] Lead capture — collect name and email mid-conversation
- [ ] Analytics — most-asked questions, unanswered queries
- [ ] Human handoff via email or WhatsApp
- [ ] Per-client billing and usage limits

---

Built by [Saima](https://github.com/hamidsaima995-bit) — Ninja Tech
