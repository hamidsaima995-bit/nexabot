# NexaBot — Setup Guide

Zero to deployed. Work through these in order; each step depends on the one before it.

Total time: roughly 45 minutes.

---

## Step 1 — Create the Supabase project (10 min)

1. Go to [supabase.com](https://supabase.com) and click **New project**
2. Name it `nexabot`
3. Set a database password and **save it somewhere** — you cannot see it again
4. Region: pick the one closest to your users
5. Create, and wait about two minutes

Once it's ready:

6. Left menu → **SQL Editor** → **New query**
7. Paste the entire contents of `backend/schema.sql`
8. Click **Run**
9. The result panel shows one row — copy that bot `id`, you'll need it shortly

Now collect your credentials:

10. Left menu → **Project Settings** → **API**
11. Copy two values:
    - **Project URL** — looks like `https://abcdefgh.supabase.co`
    - **service_role** key — the long secret one, *not* `anon`

> The `service_role` key bypasses row-level security. It belongs in the backend only, never in frontend code or a public repository.

---

## Step 2 — Get a DeepSeek API key (2 min)

Sign up at [platform.deepseek.com](https://platform.deepseek.com) and create a key under **API keys**.

DeepSeek is pay-as-you-go and inexpensive — a demo costs cents, not dollars. If you already have a key from another project, reuse it.

---

## Step 3 — Run the backend locally (10 min)

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
DEEPSEEK_API_KEY=your_deepseek_key
ADMIN_SECRET=choose_a_long_password
AI_PROVIDER=deepseek
PORT=3001
```

`ADMIN_SECRET` is the password for your admin panel. Make it long — anyone with it can read and edit every bot.

Start it:

```bash
npm start
```

Open `http://localhost:3001/api/health`. You should see:

```json
{"ok":true,"provider":"deepseek","ts":"..."}
```

If you get a crash about missing Supabase variables, the `.env` file is in the wrong folder or has a typo.

---

## Step 4 — Run the admin panel (5 min)

Open a second terminal, leaving the backend running:

```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/`:

```
VITE_API_URL=http://localhost:3001
```

Start it:

```bash
npm run dev
```

Open `http://localhost:5173`. Sign in with the same `ADMIN_SECRET` you set in the backend `.env`.

You should see the demo bot from the schema — Lahore Dental Clinic. Click it, then open the **Install** tab to find its embed snippet and bot ID.

---

## Step 5 — Test the widget (5 min)

1. Open `demo.html` in a text editor
2. Near the bottom, replace `REPLACE_WITH_BOT_ID` with the demo bot's ID
3. Open the file in a browser

A chat button appears in the bottom-right corner. Open it and try:

| Ask this | Expect |
|---|---|
| What are your opening hours? | Monday–Saturday, 10am–8pm |
| How much is a root canal? | PKR 15,000–25,000 |
| Do you sell laptops? | A polite refusal — it isn't in the knowledge base |

**The third one matters most.** Any chatbot can answer questions it was given. The one that admits it doesn't know is the one worth selling.

---

## Step 6 — Deploy to Railway (10 min)

### Backend

1. Push the code to GitHub
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
3. Select the repository
4. Settings → **Root Directory** → `backend`
5. **Variables** tab → add:

```
SUPABASE_URL         = https://your-project.supabase.co
SUPABASE_SERVICE_KEY = your_service_role_key
DEEPSEEK_API_KEY     = your_deepseek_key
ADMIN_SECRET         = the same password
AI_PROVIDER          = deepseek
```

Do not set `PORT` — Railway assigns it.

6. Settings → **Networking** → **Generate Domain**

You'll get a URL like `https://nexabot-production.up.railway.app`.

Verify: open `https://your-url/api/health` and confirm you see `{"ok":true,...}`.

### Admin panel

1. In the same Railway project → **New Service** → same repository
2. Root Directory → `frontend`
3. Variables:

```
VITE_API_URL = https://your-backend-url.up.railway.app
```

4. Generate a domain for this service too

---

## Step 7 — Verify the live deployment

1. Open the admin panel URL and sign in
2. Select a bot → **Install** tab → copy the embed snippet
3. In `demo.html`, replace the old `<script>` tag with the new one
4. Reload and chat

If the widget answers, you're live.

---

## Onboarding a client

1. Admin panel → **+ New bot**
2. Fill in the business name, knowledge base, welcome message, and accent colour
3. **Create**
4. **Install** tab → copy the snippet → send it to the client
5. They paste it before `</body>` on their site

That's the entire client-side setup. They never touch a config file.

### Writing a good knowledge base

The bot is only as good as what it's given. What works:

- Plain statements, one fact per line
- Actual numbers — prices, hours, phone numbers
- The questions customers already ask, answered
- Anything the business does *not* do, stated explicitly

What doesn't:

- Marketing copy — "we pride ourselves on excellence" answers no question
- Vague ranges where a real number exists
- Assuming the bot knows industry norms; it only knows what's written

---

## Troubleshooting

**Can't sign in to the admin panel**
The `ADMIN_SECRET` in the backend `.env` and what you're typing must match exactly. Check for a trailing space.

**Widget doesn't appear**
Open the browser console (F12). If `widget.js` returns 404, the `data-api` attribute points at the wrong host.

**"Failed to load bot"**
The `data-bot-id` is wrong. Copy it again from the Install tab.

**Bot returns an error message instead of an answer**
Check the Railway logs. Usually `DEEPSEEK_API_KEY` is missing, or the DeepSeek account is out of credit.

**CORS errors**
The backend allows all origins, so this normally means `data-api` is missing the `https://` prefix.

**Bot invents information**
Its knowledge base is too thin. The fallback only triggers when the model has nothing to work with; vague source material invites vague answers. Add the missing facts.

---

## What's handled already

- The knowledge base is filtered server-side and never reaches the browser
- Admin routes return 401 without the correct secret
- Chat is rate-limited to 15 messages per minute per IP
- The bot answers only from its knowledge base and refuses otherwise
- Prompt-injection attempts are explicitly rejected in the system prompt
- The widget runs in a Shadow DOM — host CSS can't break it, its CSS can't leak
- Messages render via `textContent`, so visitor input cannot inject markup
- Full-screen on mobile, corner widget on desktop
- Works in private browsing where localStorage throws
