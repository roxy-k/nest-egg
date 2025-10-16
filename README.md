# NestEgg — Personal Budget Tracker with Analytics

A modern web app for tracking personal finances: transactions, categories, monthly budgets, reports/charts, Excel export, localization (EN/FR), theming (light/dark), and authentication (email + Google OAuth). Built with **React + Vite** on the frontend and **Node.js + Express + MongoDB** on the backend.

> **Live demo:** _Add your links here_
>
> - Frontend: https://your-frontend.example.com  
> - API: https://your-backend.example.com/api  
>
> **Repository:** https://github.com/your-user/nestegg

---

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Requirements](#requirements)
  - [Environment Variables](#environment-variables)
  - [Frontend (React + Vite)](#frontend-react--vite)
  - [Backend (Nodejs--express--mongodb)](#backend-nodejs--express--mongodb)
- [Usage Guide](#usage-guide)
- [Testing](#testing)
- [Deployment](#deployment)
- [Devlog](#devlog)
- [Future Improvements](#future-improvements)
- [Screenshots](#screenshots)
- [Security & Privacy](#security--privacy)
- [License](#license)

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
- 🔐 **Auth**: Email/password + Google OAuth with session cookies.
- ⚙️ **Settings**: Language, theme, currency; a “Reset demo data” action for quick cleanup.

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
- **Passport** (JWT + Google OAuth), session cookies, CORS.
- API namespaces: `/auth`, `/categories`, `/transactions`, `/budgets`, `/reset`.

**Design principles:** separation of concerns (contexts/pages/services), normalized inputs (sanitize), and unified identifiers using `(doc._id || doc.id)` where relevant.

---

## Tech Stack

- **Frontend:** React, Vite, React Router, React‑Bootstrap, Recharts, FileSaver, XLSX, ESLint.
- **Backend:** Node.js, Express, MongoDB/Mongoose, Passport (JWT, Google OAuth), dotenv, CORS.
- **Testing:** (example) Mocha/Chai for unit tests (categories/budgets).
- **Deployment:** Netlify/Vercel (frontend) + Render/Railway/Fly.io (backend).

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
VITE_API_URL=http://localhost:4000/api
```

**Backend (`.env` in the backend root):**
```bash
PORT=4000
MONGO_URL=mongodb://localhost:27017/nestegg
SESSION_SECRET=replace_me_with_a_long_random_string
JWT_SECRET=replace_me_with_a_long_random_string
CLIENT_URL=http://localhost:5173

# Google OAuth (optional, if used)
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback
```

> Ensure CORS is configured so that the backend accepts requests from your frontend origin and uses `credentials: true` where necessary.

### Frontend (React + Vite)

```bash
# from the frontend folder
npm install
npm run dev       # dev server -> http://localhost:5173
npm run build     # build to dist/
npm run preview   # preview build locally
```

### Backend (Node.js + Express + MongoDB)

```bash
# from the backend folder
npm install
npm run dev       # e.g., nodemon src/index.js
# or
npm start
```

---

## Usage Guide

1. **Register / Log in** (email/password or Google).  
2. **Categories**: create a few income/expense categories.  
3. **Transactions**: add transactions and try filters/search/sort.  
4. **Budgets**: set monthly limits per category; monitor progress bars.  
5. **Reports**: review expenses by category and income trends.  
6. **Export**: use the “Export Excel” button on the Transactions page.  
7. **Settings**: switch theme/language/currency; optionally “Reset demo data”.

> Tip: Inputs sanitize numeric fields (e.g., amount/budget limits) and provide basic validation—clear error messages via i18n.

---

## Testing

(If you include unit tests)
```bash
npm run test
```
- Include tests for at least categories/budgets logic (models/controllers/services).
- Consider adding frontend tests (component rendering, context actions) if time permits.

---

## Deployment

### Frontend
- Deploy the Vite build (`dist/`) to **Netlify** / **Vercel**.
- Set `VITE_API_URL` to your deployed backend API (e.g., `https://your-backend.example.com/api`).

### Backend
- Deploy to **Render** / **Railway** / **Fly.io** (or a VPS).  
- Set environment variables (`MONGO_URL`, `SESSION_SECRET`, `JWT_SECRET`, `CLIENT_URL`, OAuth keys).  
- Enable HTTPS, configure CORS to allow the frontend origin, and use secure cookies in production (e.g., `SameSite=Lax/Strict`, `Secure` where appropriate).

> **Deliverables**: provide both live links (Frontend + API) in the top of this README when you deploy.

---

## Devlog

Keep a running development log (update weekly). You can place it here or in `docs/devlog.md`.

**Week 1 — Planning & Setup**  
- Proposal drafted & approved; tech stack chosen.  
- Repo initialized, Vite app scaffolded, Express API bootstrapped.  
- Initial contexts (Auth/Settings) and basic routes.

**Week 2 — Core Features**  
- Categories & Transactions CRUD.  
- Filters/sorting/search; amount sanitization; i18n keys for errors.

**Week 3 — Budgets & Reports**  
- Monthly budgets; progress bars; over‑limit handling.  
- Pie/Bar charts; Excel export.

**Week 4 — Auth & Polish**  
- Email/password + Google OAuth; session cookies.  
- Light/dark theme; a11y tweaks; README & screenshots.  
- Final testing and deployment.

**Challenges & Solutions:**  
- CORS with credentials — configured on both sides, set correct origins and cookie attributes.  
- Mixed IDs (`_id` vs `id`) — unified comparisons using `(doc._id || doc.id)`.  
- i18n coverage — moved alerts/validation to `errors.*` keys.

**Key Learnings:**  
- Context API for domain state is lightweight and maintainable for this scope.  
- Input sanitation UX (onBeforeInput/onPaste) improves data quality.  
- Deployment environment variable management for multi-service apps.

---

## Future Improvements

- Multi‑currency wallets and per‑transaction currency conversion.  
- Bank CSV/OFX importers; Plaid integrations.  
- Shared budgets, roles, and household collaboration.  
- PWA + offline caching.  
- E2E tests (Playwright/Cypress).  
- Analytics dashboards with more dimensions (merchant, tags).

---

## Screenshots

> Add images or GIFs of Dashboard, Transactions, Budgets, Reports, Settings.
>
> Example:
>
> - `/docs/screenshots/dashboard.png`
> - `/docs/screenshots/transactions.png`
> - `/docs/screenshots/reports.png`

---

## Security & Privacy

- Do not commit secrets or session files (e.g., `.env`, ).  
- Use secure cookies in production and HTTPS everywhere.  
- Validate & sanitize user inputs on both frontend and backend.  
- Apply MongoDB indexes for unique constraints where needed.

---

##  Testing Summary

Automated tests implemented for all core API routes using:

- **Mocha** – test runner  
- **Chai** – assertions  
- **Supertest** – HTTP endpoint testing  
- **NYC** – code coverage with ESM loader support  
- **Mocked Mongoose models** – no real DB connection required  

### Run all tests
```bash
npm test

