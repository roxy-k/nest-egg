# NestEgg — Personal Budget Tracker with Analytics

A modern web app for tracking personal finances: transactions, categories, monthly budgets, reports/charts, Excel export, localization (EN/FR), theming (light/dark), and authentication (email + Google OAuth). Built with **React + Vite** on the frontend and **Node.js + Express + MongoDB** on the backend.

> **Live demo:**
>
> - Frontend: https://your-nest-egg.onrender.com
> - API: https://nest-egg-tuwf.onrender.com/api
>
> **Repository:** https://github.com/roxy-k/nest-egg

---

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Repository Layout](#repository-layout)
- [Getting Started](#getting-started)
  - [Requirements](#requirements)
  - [Environment Variables](#environment-variables)
  - [Frontend (React + Vite)](#frontend-react--vite)
  - [Backend (Nodejs--express--mongodb)](#backend-nodejs--express--mongodb)
- [Usage Guide](#usage-guide)
- [Password Reset](#password-reset)
- [Testing](#testing)
- [Tooling & Automation](#tooling--automation)
- [Deployment](#deployment)
- [Devlog](#devlog)
- [Future Improvements](#future-improvements)
- [Screenshots](#screenshots)
- [Security & Privacy](#security--privacy)

---

## Project Overview

**NestEgg** helps users record **income and expenses**, organize **categories**, set **monthly budgets** per category, and analyze trends via **Reports** (pie/bar charts). It supports **Excel export** of transactions, **English/French** localization, and **light/dark** themes. Authentication includes **email/password** and **Google OAuth**.

**Target audience:** people who want a simple and insightful budgeting tool—households, students, freelancers, and self‑employed users.

---

## Features

- 🧾 **Transactions**: Create, edit, delete; filter by month/category/type; search; sort by date/category/type/amount.
- 🏷️ **Categories**: Income/expense types with IDs (slugs) for consistent usage.
- 💰 **Budgets**: Monthly budget limits per category with progress bars and over‑limit highlighting.
- 📊 **Reports**:  
  - Pie chart: expenses by category for the selected month.  
  - Bar chart: income trends by month.
- 🌐 **Localization (EN/FR)**: Easy to extend using JSON dictionaries.
- 🎨 **Themes**: Light/dark theme via `data-bs-theme` (Bootstrap 5 compatible).
- 📤 **Export**: Download transactions as **Excel (.xlsx)**.
- 🔐 **Auth**: Email/password + Google OAuth (**session cookies + Bearer JWT fallback for Safari**).
- ⚙️ **Settings**: Language, theme, currency; a “Reset demo data” action for quick cleanup.
- 🔑 **Password Reset**: Secure token-based password reset via email link (implemented on backend & frontend).

---

## Architecture

### Frontend
- **React + Vite**, **React Router**, **Context API** for domain state:
  - `AuthContext` — authentication & session
  - `SettingsContext` — theme/language/currency & i18n
  - `CategoriesContext`, `TransactionsContext`, `BudgetsContext` — CRUD + local state
- **UI**: React‑Bootstrap, **Recharts** for charts, **FileSaver** + **XLSX** for export.
- **I18n**: JSON dictionaries (`en.json`, `fr.json`) + a `t()` helper from `SettingsContext`.

### Backend
- **Express** (REST API), **MongoDB/Mongoose** (models: `User`, `Category`, `Transaction`, `Budget`).
- **Passport** (JWT + Google OAuth), CORS.
- API namespaces: `/auth`, `/categories`, `/transactions`, `/budgets`, `/reset`.

---

## Tech Stack

- **Frontend:** React 19, Vite, React Router, React‑Bootstrap, Recharts, FileSaver, XLSX.
- **Backend:** Node.js, Express 5, MongoDB/Mongoose, Passport (JWT + Google OAuth), Brevo SDK, Zod.
- **Testing:** Mocha, Chai, Supertest for API suites; Vitest + Testing Library for client; c8/nyc for coverage.
- **Tooling:** ESLint 9, Husky + lint-staged pre-commit, GitHub Actions CI, npm workspaces.
- **Deployment targets:** Netlify/Vercel (frontend) and Render/Railway/Fly.io (backend).

## Repository Layout

```
nest-egg/
├── src/                 # React app (pages, contexts, components, i18n)
├── server/              # Express API, Mongoose models, Passport auth, tests
├── docs/                # Screenshots and snippet archives
├── .github/workflows/   # GitHub Actions CI configuration
├── .husky/              # Husky hook & lint-staged integration
├── package.json         # Root workspace (client scripts, lint-staged config)
└── devlog.md            # Development journal
```

---

## Getting Started

### Requirements
- Node.js **>= 18**
- npm **>= 9**
- MongoDB (local instance or Atlas)

### Environment Variables

Create `.env` files as needed.

**Frontend (`.env` in the frontend root):**
```bash
# Development
VITE_API_URL=http://localhost:4000/api
# Production
# VITE_API_URL=https://nest-egg-tuwf.onrender.com/api
```

**Backend (`.env` in the backend root):**
```bash
NODE_ENV=production
PORT=4000

CLIENT_URL=https://your-nest-egg.onrender.com

MONGO_URI=<your_mongodb_uri>
DB_NAME=nestegg

JWT_SECRET=<your_long_random_secret>

# Google OAuth
GOOGLE_CLIENT_ID=<your_google_client_id>
GOOGLE_CLIENT_SECRET=<your_google_client_secret>
GOOGLE_CALLBACK_URL=https://nest-egg-tuwf.onrender.com/api/auth/google/callback

# Email (Password Reset)
BREVO_API_KEY=<your_brevo_api_key>
RESET_EMAIL_FROM="NestEgg <no-reply@example.com>"
RESET_EMAIL_URL=https://your-frontend/reset
RESET_TOKEN_EXPIRES_MIN=60
APP_BASE_URL=https://your-nest-egg.onrender.com
```

### Frontend (React + Vite)

```bash
# Install dependencies (root + server workspace)
npm install

# Start the client dev server (http://localhost:5173)
npm run dev
```

- Uses Vite for fast HMR.
- Reads `VITE_API_URL` to communicate with the API.
- Client tests: `npm run test:client` (Vitest).

### Backend (Nodejs + Express + MongoDB)

```bash
# Run from repository root via npm workspaces
npm run dev --workspace server

# or inside the folder
cd server && npm run dev
```

- REST API on `http://localhost:4000/api`.
- Requires MongoDB credentials configured in `server/.env`.
- Server tests: `npm run test:server`.


---

## Usage Guide

1. **Register / Log in** (email/password or Google).  
2. **Categories**: create a few income/expense categories.  
3. **Transactions**: add transactions and try filters/search/sort.  
4. **Budgets**: set monthly limits per category; monitor progress bars.  
5. **Reports**: review expenses by category and income trends.  
6. **Export**: use the “Export Excel” button on the Transactions page.  
7. **Settings**: switch theme/language/currency; optionally “Reset demo data”.

---

## Password Reset

NestEgg supports **secure password recovery** via email link.  
This feature uses **one-time tokens** stored as a hashed value in the database (expires after 60 minutes by default).

### API Endpoints

**Request reset email:**
```bash
POST /api/auth/request-reset
Body: { "email": "user@example.com" }
```

**Reset password using token:**
```bash
POST /api/auth/reset-password
Body: { "email": "user@example.com", "token": "string", "newPassword": "secret123" }
```

### Frontend Pages
- `/forgot` — user enters email to request link  
- `/reset?token=...&email=...` — form to set a new password

### Security Notes
- Tokens are hashed before storage using SHA‑256.
- Tokens expire after `RESET_TOKEN_EXPIRES_MIN` minutes.
- After reset, token fields are cleared.
- Rate limiting and identical responses prevent email enumeration.
- Set the following environment variables to enable reset emails:
  - `BREVO_API_KEY`
  - `RESET_EMAIL_FROM` (e.g. `NestEgg <no-reply@example.com>`)
  - `RESET_EMAIL_URL` (e.g. `https://your-frontend/reset`)
- Uses the Brevo transactional email API (via `sib-api-v3-sdk`).

---

## Testing

- `npm run test:server` — Mocha + Supertest suites for API routes (categories, budgets, auth).
- `npm run test:client` — Vitest + Testing Library components/interactions.
- `npm run test` — convenience command that runs both server and client suites.
- `npm run lint` — ESLint 9 with React, hooks, and refresh plugins.

---

## Tooling & Automation

- **GitHub Actions** workflow (`.github/workflows/ci.yml`) runs on every push/PR:
  - `npm ci`
  - `npm run test:server`
  - `npm run test:client` (auto-skipped if the script is removed)
  - `npm run lint`
- **Husky pre-commit** executes `lint-staged` to auto-fix staged `*.{js,jsx,json,css}` files with ESLint.
- **npm scripts** expose shared tasks (`npm run dev`, `npm run dev --workspace server`, `npm run test`, etc.).
- **ESLint config** lives at the repo root (`eslint.config.js`) and is shared by the hook and CI.

---

## Deployment

### Frontend
- Deploy the Vite build (`dist/`) to **Netlify**, **Vercel**, or **Render**.
- Set `VITE_API_URL` to your deployed backend API.

### Backend
- Deploy to **Render** / **Railway** / **Fly.io**.  
- Configure `.env` with your production credentials.  
- Use HTTPS, secure cookies, and proper CORS settings.

---

## Devlog

A detailed development log is available in the file  
[devlog.md](./devlog.md)

---

## Future Improvements

- Multi‑currency wallets and per‑transaction currency conversion.  
- Bank CSV importers; Plaid integrations.  
- Shared budgets and family collaboration.  
- PWA support for offline usage.  
- E2E tests with Playwright/Cypress.

---

## Screenshots

All weekly screenshots and visual progress reports are available in the folder  
[`/docs/screenshots/`](./docs/screenshots) — code snippets live alongside in [`/docs/snippets/`](./docs/snippets)

## Demo Video

🎥 Watch a short walkthrough of NestEgg in action:

- [▶️ View Demo Video (MP4, 90 sec)](./docs/demo.mov)

*(If your browser doesn’t play .mov directly, download the file or open in QuickTime.)*

## Security & Privacy

- Secrets stored in `.env` files only.  
- Secure HTTPS and cookie handling in production.  
- Tokens hashed and short-lived.  
- All user inputs validated and sanitized both client & server side.
