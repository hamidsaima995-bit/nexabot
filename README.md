# NexaBot

An embeddable, multi-tenant AI chatbot for customer support. Any business can create its own bot, give it a knowledge base, and drop it onto their website with a small snippet. The bot answers from that business's own content, handles FAQs and complaints, and can reply in the customer's language. An admin dashboard lets each business manage its bots and knowledge base.

## Tech

- Backend: Node.js with Express and Supabase, with rate limiting and CORS
- Frontend: a React admin dashboard built with Vite
- AI replies through an LLM API

## Project layout

- `backend/`, the Express API and the embeddable widget
- `frontend/`, the React admin dashboard
- `demo.html`, a sample page showing the widget embedded
- `SETUP.md`, the detailed setup guide

## Configuration

The backend needs its Supabase keys set as environment variables. The important one is the `service_role` key, which must stay on the backend only and never appears in frontend code or in this repository. See `SETUP.md` for the full list and the database schema.

## Running it locally

You need Node.js installed.

Backend:

```
cd backend
npm install
npm run dev
```

Frontend:

```
cd frontend
npm install
npm run dev
```

Full setup steps, including the Supabase schema, are in `SETUP.md`.

## Deployment

Deployed on Railway. The live widget is loaded on client sites from the backend URL.

## Author

Saima Hamid, Ninja Tech, Lahore. https://ninjatechdev.com
