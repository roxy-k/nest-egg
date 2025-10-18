# NestEgg Devlog

A running log of the NestEgg capstone project: weekly updates, challenges, solutions, key learnings, and milestone screenshots/code snippets.

> **Scope:** Full‑stack budget tracker (React + Vite, Node/Express, MongoDB), i18n (EN/FR), theming, auth (email + Google OAuth), reports, budgets, and Excel export.  
> **Owner:** Oksana  Katysheva
> **Repo:** https://github.com/your-user/nestegg  
> **Live:** Frontend — https://your-nest-egg
onrender.com
• API — https://nest-egg-tuwf.onrender.com

---

## Week 1 — Planning & Setup


### Goals
- Draft the project proposal (idea, audience, features, tech stack).
- Initialize mono‑repo (or two folders: `/frontend` and `/backend`).
- Bootstrap **Vite + React** app and **Express** API.
- Add base **Contexts**: `AuthContext`, `SettingsContext`.
- Configure ESLint, basic Git hooks, `.gitignore`, environment variables.

### What I did
- Finalized proposal and folder structure.
- Set up Vite template, React Router, Bootstrap.
- Implemented `SettingsContext` with theme & i18n provider (`t()` helper).
- Created `AuthContext` skeleton (login/register/logout stubs).
- Configured Express app with `/api` prefix and CORS for frontend origin.
- Prepared `.env` samples (`.env.example`).

### Challenges & How I solved them
- **CORS with cookies:** Needed `credentials: true` on fetch + explicit `origin` on server.  
  **Solution:** Set `res.header('Access-Control-Allow-Credentials', 'true')` and `cors({ origin: CLIENT_URL, credentials: true })`. Frontend fetch uses `credentials: 'include'`.
- **Folder boundaries:** Kept front/back separate to simplify deploy & CI.

### Key Learnings
- Keep i18n dictionaries small at first; evolve as strings appear.
- Theme swapping via `data-bs-theme` is a clean approach with Bootstrap 5.

### Screenshots / Snippets
- `/docs/screenshots/w1-shell.png` — base app shell  
- `/docs/snippets/w1-settings-context.js` — initial provider

---

## Week 2 — Core Features (Categories & Transactions)


### Goals
- CRUD for **Categories** (income/expense, slug/id).
- CRUD for **Transactions** with filters, search, sorting.
- Basic validation and **sanitizeAmount** logic.
- Move user‑facing error messages to i18n (`errors.*`).

### What I did
- Categories page: form + table; duplicate slug protection.
- Transactions page: add/edit/delete; filters by month, category, type; search; sort; table view.
- Introduced `sanitizeAmount` and onBeforeInput/onPaste handlers for better UX.
- Consolidated mixed IDs using `(doc._id || doc.id)` everywhere.

### Challenges & How I solved them
- **Mixed IDs (`_id` vs `id`):** Inconsistent data across test/mock vs DB.  
  **Solution:** All comparisons/keys use `(doc._id || doc.id)`.
- **Amount input UX:** User could paste commas/spaces.  
  **Solution:** Sanitize on change; block invalid chars with `onBeforeInput`; normalize decimal.

### Key Learnings
- Centralized validation + i18n improves consistency and reduces duplication.
- Sorting needs stable comparisons (date, number, locale‑aware category name).

### Screenshots / Snippets
- `/docs/screenshots/w2-transactions.png` — transactions list and add/edit modal
- `/docs/snippets/w2-sanitize-amount.js` — amount input sanitizer

---

## Week 3 — Budgets & Reports



### Goals
- Monthly **Budgets** per category with progress bars.
- **Reports**: Pie chart (expenses by category), Bar chart (income by month).
- Excel export of transactions.

### What I did
- Budgets page: add/edit/delete budget entries; per‑month, per‑category.  
- Spent aggregation keyed by `${categoryId}:${YYYY-MM}`.  
- Reports page: Recharts (Pie/Bar), empty states for months w/o data.
- Excel export: `xlsx` + `file-saver`, localized headers (uses `t()`), filename stamp.

### Challenges & How I solved them
- **Export i18n keys:** Missing translation keys for column headers.  
  **Solution:** Added `common.date/category/type/amount` and `reports.transactions` keys; provided fallbacks.

### Key Learnings
- Memoize aggregations and month keys to avoid unnecessary rerenders.
- Keep empty state messages localized.

**Screenshots / Snippets**
- `/docs/screenshots/w3-budgets.png` — budgets table with progress
- `/docs/screenshots/w3-reports.png` — reports (pie + bar)
- `/docs/snippets/w3-spend-key.js` — expenses aggregation key
- `/docs/snippets/w3-budget-progress.jsx` — budget progress component
- `/docs/snippets/w3-reports-pie.jsx` — pie chart for expenses
- `/docs/snippets/w3-reports-bar.jsx` — income trend bar chart

---

## Week 4 — Auth, Polish & i18n



### Goals
- Email/password + Google OAuth login.
- Localize small auth strings: “Continue with Google”, “or”, “Signing you in…”, “Creating…”, etc.
- A11y tweaks; navbar auth state; logout flow.
- README v1 + initial Devlog content.

### What I did
- Hooked up Passport (JWT + Google OAuth); refresh/session flow.
- Localized `Login`, `Register`, and `OAuth` page strings via `auth.*` keys.
- Polished Navbar (hello, user; login/signup vs logout states).

### Challenges & How I solved them
- **Cookie attributes in prod:** Secure/SameSite behavior differed from dev.  
  **Solution:** Conditionally set cookie flags in prod; enforce HTTPS; verify domain alignment.
- **OAuth redirect:** Ensured `/oauth` route refreshes session then navigates to `/dashboard` on success.

### Key Learnings
- Small UX details (loading labels, “or” separators) matter for polish and a11y.
- Centralized logout/refresh logic in `AuthContext` simplifies pages.

### Screenshots / Snippets
- `/docs/screenshots/w4-login-google.png` — login with Google button
- `/docs/snippets/w4-oauth-redirect.js` — OAuth redirect handler

---

## Week 5 — Testing, Deployment & Final Polish



### Goals
- Unit tests for categories/budgets (Mocha/Chai/Jest — pick one).
- Production deployment (Frontend + API) with environment variables.
- Final pass on i18n, error messages, and ID consistency.
- Add screenshots and improve README.

### What I did
- Wrote tests for category slug uniqueness and monthly budget validation.
- Deployed backend to Render/Railway and frontend to Netlify/Vercel.
- Verified CORS + credentials; set `VITE_API_URL` on frontend; updated README with live links.

### Challenges & How I solved them
- **CORS + cookies in prod:** Had to match exact frontend origin and enable `credentials`.  
  **Solution:** `cors({ origin: FRONTEND_URL, credentials: true })` and `fetch(..., { credentials: 'include' })`.
- **Env mismatch:** Ensured consistent `.env` values across CI and hosting providers.

### Key Learnings
- Always test cookie‑based flows on real HTTPS origins.
- Make a deployment checklist (see below).

### Screenshots / Snippets
- `/docs/screenshots/w5-deploy.png` — production deploy (frontend + API requests)
- `/docs/snippets/w5-test-budgets.js` — unit tests for budgets validation and monthly expense aggregation

---

## Milestones Checklist

- [x] Proposal approved (idea, audience, stack).  
- [x] Frontend scaffolded (Vite, Router, Bootstrap).  
- [x] Backend scaffolded (Express, MongoDB, Passport).  
- [x] Contexts implemented (Auth/Settings/Categories/Transactions/Budgets).  
- [x] Transactions CRUD with filters/search/sorting.  
- [x] Categories CRUD with slug validation.  
- [x] Budgets with monthly progress & over‑limit highlight.  
- [x] Reports (Pie/Bar) + empty states.  
- [x] Excel Export of transactions.  
- [x] i18n (EN/FR) with error messages.  
- [x] Auth (email + Google OAuth).  
- [x] README + Devlog.  
- [x] Deployment (Frontend + API).

---

## Deployment Notes

- **Frontend (Netlify/Vercel):**  
  `VITE_API_URL=https://your-backend.example.com/api`  
- **Backend (Render/Railway/Fly):**  
  `CLIENT_URL=https://your-frontend.example.com`  
  `MONGO_URL=...`, `SESSION_SECRET=...`, `JWT_SECRET=...`  
- **Cookies in prod:** set `Secure`, `SameSite=Lax` (or `Strict` if suitable), HTTPS only.

---

## Appendix — Code & Config Snippets

- `onBeforeInput` + paste sanitization for numeric fields (amount, limits).  
- Unified ID handling: `(doc._id || doc.id)` for comparisons/keys.  
- Example CORS + credentials config.
- ESLint rules and `.gitignore` (exclude `.env`, `cookies.txt`, logs, build).


