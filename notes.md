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
- `git add <filename>` — stage a specific changed file (tell git "I want to include this in the next snapshot"). Prefer naming files explicitly over `git add .`, which can sweep up unrelated files like `.Rhistory`.
- `git commit -m "message"` — save the snapshot with a description
- `git push` — send your local commits up to GitHub
- `git pull` — bring down changes from GitHub to your local machine

---

## Branches and Pull Requests

When you build a new feature, you don't edit `main` directly. You create a **branch** — a temporary, parallel line of work — make your changes there, and then merge it back into `main` when it's ready. This way `main` always reflects working, shipped code, while messy in-progress work happens off to the side.

### The full lifecycle of a feature

**1. Create a branch when you start the feature**
```
git checkout -b show-different-tips-button
```
`-b` means "create and switch to." The branch name should describe the feature. From this point, every edit lives on this branch, not on `main`.

**2. Work and commit as you go**
```
git add src/screens/HomeScreen.jsx
git commit -m "Add 'Show me different tips' button on Home"
```

**3. Push the branch to GitHub when ready**
```
git push -u origin show-different-tips-button
```
`-u` sets the "upstream" link between your local branch and the GitHub branch — after the first push, future `git push` / `git pull` know which remote branch to use without arguments.

**4. Open a pull request (PR) on GitHub**
A PR is the formal request: "I'd like to merge this branch into `main`, please review the diff." For solo projects, this is a checkpoint where you can eyeball what you're about to ship. You can create one by visiting the URL GitHub prints after the push, or via `gh pr create` if the GitHub CLI is set up.

**5. Merge the PR (also on GitHub)**
Click the green Merge button. GitHub combines your branch into `main` on its servers. Your local laptop doesn't know about this yet.

**6. Sync your local main + clean up the now-stale branch**
```
git checkout main                                # switch back to main locally
git pull origin main                             # download the merge into local main
git branch -d show-different-tips-button         # delete the local branch
git push origin --delete show-different-tips-button   # delete the branch on GitHub
```

That last `git branch -d` (lowercase d) is safe — git refuses if the branch has unmerged work. Use `-D` (uppercase) only when you're sure you want to throw away unmerged work.

### Why bother with branches at all?

Three reasons, in order of how often they matter:

1. **Safety net for `main`.** If a branch turns out to be a bad idea, you just delete it — `main` is untouched. No "oh no, I broke the live site" moments.
2. **Permanent record of intent.** A PR ties a set of changes to a description, a review, and a date. Six months from now, when you're wondering "why did I write this weird code?", you can find the PR and read your past self's reasoning.
3. **Trigger for deploys / CI / other automation.** Many setups deploy automatically when something merges into `main`. Working on a branch lets you fully finish + test before that automation fires.

### When you don't need a branch

For tiny single-line fixes to docs or comments on a solo project, committing directly to `main` is fine. The branching workflow is overhead — worth it when the change is meaningful enough that you might want to see it as a discrete unit later, overkill for a typo fix.

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
3. GitHub serves that branch at `mehakkhara.github.io/BabyCue`

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
