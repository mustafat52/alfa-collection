# Alfa Collection — catalog demo

A clickable prototype of a catalog + cart system, split into two apps:

- **Customer app** — `/` — browse the collection, filter by theme/price/search, build a cart, get a cart ID, submit contact details.
- **Her dashboard** — `/admin` — login-gated. View every cart (submitted or still browsing), see customer details, copy a ready-made WhatsApp message, manage prices/sales, add new arrivals.

Demo login: **username** `amatullah`, **password** `rida2026` (see the note on security below).

## Run locally

```
npm install
npm run dev
```

Opens at `http://localhost:5173`. Visit `/admin` for the dashboard.

## Deploy to Vercel

**Option A — no terminal, using GitHub:**
1. Create a new GitHub repo and push this folder to it.
2. Go to vercel.com → "Add New Project" → import that repo.
3. Vercel auto-detects Vite. Click Deploy.
4. You'll get a URL like `your-project.vercel.app` — open it on your phone to test. The dashboard is at `your-project.vercel.app/admin`.

**Option B — using the Vercel CLI:**
```
npm install -g vercel
vercel
```
Follow the prompts; it deploys straight from this folder.

## Important — read before showing this around

This is a **frontend-only demo** built to test the flow and feel, not a production system:

- **Data is stored in the browser only** (`localStorage`), so it does not sync between devices. Testing the full loop (customer submits a cart → she sees it) needs to happen in the same browser, e.g. open the customer link and `/admin` in two tabs on the same phone/laptop. A customer on their own phone and Alfa Collection's owner on hers will **not** see each other's data yet — that requires a real backend and database, which is the natural next step once the flow itself is approved.
- **The admin login is a hardcoded demo check**, not real authentication. It's enough to gate the dashboard for a walkthrough, but a production version needs a proper backend with hashed passwords and server-side sessions before this goes live with real customer data.
- Product images are color swatches, not real photos — swap in her actual rida photography for the real build.

## Project structure

```
index.html          entry HTML, mobile viewport, fonts
src/main.jsx         React entry point
src/App.jsx           routes "/" -> CustomerApp, "/admin" -> AdminApp
src/CustomerApp.jsx    customer-facing catalog, cart, order form
src/AdminApp.jsx        login + her dashboard
src/lib.js               shared data, helpers, localStorage layer
vercel.json               rewrites so /admin works on refresh
```
