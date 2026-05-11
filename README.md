# BabyCue

A personalized assistant for new moms. Answers questions about your baby with advice tailored to their exact age and your parenting style — instead of generic Google searches.

**Live app:** https://mehakkhara.github.io/babycue/

---

## What it does

- **Daily tips** curated for the baby's age (0–24 months) and the mom's chosen parenting style (gentle or schedule-based)
- **Ask Anything** — a chat interface that asks Claude for personalized, evidence-based answers, with the baby's name, age, and parenting style passed as context on every message
- **Growth tracking** — log weight and view percentile context against WHO standards
- **Onboarding** — one-time form for baby name, date of birth, and parenting style; saved to the browser

---

## Architecture

```
┌────────────────────────────────────┐         ┌──────────────────────────────────────┐
│  Frontend (React + Vite)           │  HTTPS  │  Backend (Node.js + Express)         │
│  GitHub Pages                      │ ──────► │  Railway                             │
│  mehakkhara.github.io/babycue     │         │  baby-app-production.up.railway.app  │
│                                    │         │                                      │
│  Static bundle, no secrets         │         │  Holds ANTHROPIC_API_KEY              │
└────────────────────────────────────┘         └──────────────────────────────────────┘
```

The frontend never sees the Claude API key. It calls `POST /api/chat` on the backend, which adds the key server-side and proxies the request to Anthropic.

---

## Tech stack

| Layer | Tool |
|---|---|
| Frontend framework | [React 18](https://react.dev) |
| Frontend bundler | [Vite 6](https://vitejs.dev) |
| Backend | [Node.js + Express](https://expressjs.com) |
| AI | [Anthropic Claude API](https://docs.anthropic.com) (model: `claude-sonnet-4-6`) |
| Frontend hosting | [GitHub Pages](https://pages.github.com) |
| Backend hosting | [Railway](https://railway.com) |
| Storage | `localStorage` (Level 2 will move this to Supabase) |

---

## Project structure

```
baby_app/
├── src/                      # Frontend React source
│   ├── App.jsx               # Root component, bottom-nav routing
│   ├── main.jsx              # Vite entry point
│   ├── screens/
│   │   ├── HomeScreen.jsx        # Today's tips
│   │   ├── ChatScreen.jsx        # Ask anything chat UI
│   │   ├── StatsScreen.jsx       # Growth charts
│   │   └── OnboardingScreen.jsx  # Profile setup
│   ├── components/
│   │   └── TipCard.jsx
│   └── data/
│       ├── tips.js               # 100+ hardcoded tips, age-gated
│       └── whoStandards.js       # WHO growth percentile tables
├── server/                   # Backend Express source
│   ├── index.js              # /api/chat and /health endpoints
│   ├── package.json
│   └── .env.example          # Template for ANTHROPIC_API_KEY
├── .env.production           # VITE_SERVER_URL for prod builds
├── package.json              # Frontend deps + deploy script
├── vite.config.js
├── plan.md                   # Build plan: levels 1–3
├── notes.md                  # Plain-English learning notes
└── CLAUDE.md                 # Product context for Claude Code
```

---

## Local development

### 1. Install dependencies

```bash
# Frontend (from project root)
npm install

# Backend
cd server
npm install
```

### 2. Set up the backend environment

```bash
cd server
cp .env.example .env
# Edit .env and paste your Anthropic API key
# Get one at: https://console.anthropic.com/settings/keys
```

### 3. Run both servers

In one terminal:
```bash
cd server
npm run dev    # Backend on http://localhost:3001
```

In another:
```bash
npm run dev    # Frontend on http://localhost:5173
```

The frontend reads `VITE_SERVER_URL` and falls back to `http://localhost:3001` for local dev, so no extra config is needed.

---

## Deployment

### Frontend → GitHub Pages

```bash
npm run deploy
```

This runs `vite build` then publishes the `dist/` folder to the `gh-pages` branch. GitHub Pages serves it at https://mehakkhara.github.io/babycue/.

### Backend → Railway

The backend redeploys automatically whenever code is pushed to `main`. Railway is configured with:

- **Source:** `mehakkhara/babycue` repo, `main` branch
- **Root Directory:** `server`
- **Variables:**
  - `ANTHROPIC_API_KEY` — Anthropic API key
  - `ALLOWED_ORIGINS` — `https://mehakkhara.github.io` (CORS allowlist)

To check backend health: https://baby-app-production.up.railway.app/health (returns `{"ok":true}`).

---

## Roadmap

See [`plan.md`](./plan.md) for the full plan. High level:

- **Level 1 — AI Assistant** ✅ shipped
- **Level 2 — Accounts & Persistence** — move profile off localStorage, add Supabase auth, store chat history
- **Level 3 — External Data** — sleep tracking, growth integrations, push notifications

---

## Useful links

- **Live app:** https://mehakkhara.github.io/babycue/
- **Repo:** https://github.com/mehakkhara/babycue
- **Backend:** https://baby-app-production.up.railway.app
- **Anthropic console:** https://console.anthropic.com (manage API keys, usage)
- **Railway dashboard:** https://railway.com/dashboard (manage backend deploys, env vars)
- **Anthropic Claude API docs:** https://docs.anthropic.com
- **Vite docs:** https://vitejs.dev
- **React docs:** https://react.dev
