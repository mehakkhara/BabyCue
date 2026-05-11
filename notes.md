# BabyCue — Learning Notes

Plain English explanations of what we built, how, and why.

---

## The App So Far

We built a React app using Vite. React is a JavaScript library for building user interfaces — instead of writing one big HTML file, you write small reusable pieces called **components** (like a TipCard, a HomeScreen, an OnboardingScreen) and compose them together. Vite is the tool that runs a local server so you can see your app in the browser while you work on it, and also bundles everything into plain HTML/CSS/JS files when you're ready to deploy.

---

## How the App is Structured

```
baby_app/
  src/
    App.jsx              ← the root component, decides which screen to show
    screens/
      HomeScreen.jsx     ← the main screen with tips and filters
      OnboardingScreen.jsx ← the form where you enter baby info
    components/
      TipCard.jsx        ← a reusable card for displaying a single tip
    data/
      tips.js            ← all the tip content + helper functions
  index.html             ← the single HTML file the browser loads
  package.json           ← lists the project's dependencies and scripts
  vite.config.js         ← configuration for Vite
```

The app has only one HTML page (`index.html`). React takes over from there and swaps components in and out depending on what screen you're on. This is called a **Single Page Application (SPA)**.

---

## localStorage

Right now the baby's profile (name, date of birth, parenting style) is saved in `localStorage`. This is a small storage space built into every browser — it's like a tiny key-value notepad that persists between sessions. It's simple and requires no server, but it only exists on that specific browser on that specific device. Clear your browser data and it's gone.

---

## How Baby Age Is Calculated

We take today's date and subtract the baby's date of birth to get age in months. The tricky part: you can't just subtract the month numbers, because a baby born on the 20th isn't "one month old" until the 20th of the next month. So we check whether today's date is before or after the birth day of the month and adjust by one month if needed.

---

## GitHub & Git

**Git** is version control — it tracks every change you make to your code over time. Think of it like "track changes" in a Word document, but for an entire codebase. You save snapshots of your work called **commits**.

**GitHub** is a website that stores your git repository in the cloud. It's like Google Drive for code — your work is backed up, shareable, and has a full history of every change.

### Key git commands used:
- `git add .` — stage all changed files (tell git "I want to include these in the next snapshot")
- `git commit -m "message"` — save the snapshot with a description
- `git push` — send your local commits up to GitHub
- `git pull` — bring down changes from GitHub to your local machine

---

## SSH Keys

When you push code to GitHub, GitHub needs to verify it's really you. Instead of typing a password every time, SSH keys work like a lock and key:

- **Private key** (`~/.ssh/id_ed25519`) — lives only on your computer, never shared
- **Public key** (`~/.ssh/id_ed25519.pub`) — you give this to GitHub once

When you push, your computer uses the private key to prove it matches the public key GitHub has on file. If they match, you're authenticated. More secure than a password because the private key never travels over the internet.

---

## npm and package.json

**npm** (Node Package Manager) is the equivalent of Python's pip. It lets you install reusable code libraries (called packages) that other developers have published.

`package.json` is the file that tracks:
- Which packages your project depends on (like React, Vite)
- Scripts you can run (like `npm run dev` to start the local server, `npm run deploy` to publish to GitHub Pages)

When you run `npm install`, npm reads `package.json` and downloads everything your project needs into the `node_modules/` folder.

---

## GitHub Pages

GitHub Pages is a free hosting service built into GitHub. It takes the files in a specific branch of your repo and serves them as a live website.

Our deploy process:
1. `vite build` — compiles the React app into plain HTML/CSS/JS files in a `dist/` folder
2. `gh-pages -d dist` — pushes those files to a special `gh-pages` branch on GitHub
3. GitHub serves that branch at `mehakkhara.github.io/babycue`

**Limitation:** GitHub Pages only serves static files. It can't run a server or keep secrets. This is why we need a separate backend for the AI feature — the Claude API key has to be kept server-side.

---

## What's Coming: Level 1 — AI Assistant

### The Problem with Calling AI Directly from the Frontend
You might wonder: why not just call the Claude API directly from the React app? The answer is your **API key**. If you put the key in your frontend code, it gets bundled into the JavaScript that every visitor to your site can read. Anyone could steal it and rack up charges on your account. So we need a backend that sits between your app and Claude.

### How it Will Work
```
User types a question
       ↓
React frontend (browser)
       ↓  sends message + baby profile
Backend server (Node.js)
       ↓  adds API key, builds prompt, calls Claude
   Claude API
       ↓  returns response
Backend server
       ↓  sends response back
React frontend shows the answer
```

### The Backend
We'll create a small **Node.js + Express** server. Node.js lets you run JavaScript outside the browser (on a server). Express is a lightweight framework that makes it easy to create API endpoints — URLs your frontend can send requests to.

We'll have one endpoint: `POST /api/chat`
- It receives: the user's message + their baby's profile (age, parenting style, name)
- It builds a prompt that tells Claude to act as a knowledgeable mom assistant who knows this specific baby
- It calls the Claude API and sends the response back to the frontend

### The .env File
API keys are secrets. We store them in a `.env` file (environment variables file) that:
- Lives on your machine and on the server
- Is listed in `.gitignore` so it never gets pushed to GitHub
- Is read by the server as `process.env.ANTHROPIC_API_KEY`

The key never appears in your source code.

### Where the Backend Will Be Hosted
We'll deploy the backend to **Railway** — a free hosting platform. You'll paste your API key directly into their dashboard (their secure environment variables section), so it never touches a file on GitHub.

### The Chat UI
In the frontend, we'll add a new screen with:
- A text input where you type your question
- A thread of messages (yours and the assistant's)
- Some suggested questions to get started
- Context automatically included with every message (baby's age, name, parenting style) — you won't have to re-explain your situation every time

---

## What's Coming: Level 2 — Accounts & Database

Right now everything lives in `localStorage` on one browser. Level 2 means real accounts — sign up, log in, and access your profile from any device.

**Supabase** is what we'll use. It gives you a database and authentication (login/signup) with very little setup. Think of it as a backend-as-a-service — instead of building your own database from scratch, Supabase provides one you can connect to directly.

---

## What's Coming: Level 3 — External Data (Future)

This is about connecting to other apps — sleep trackers, growth charts, wearables — to make advice even more specific. This is the most complex layer and requires thinking carefully about data privacy since we'd be handling sensitive baby health information.
