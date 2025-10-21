# NestEgg Devlog

A running log of the NestEgg capstone project: weekly updates, challenges, solutions, key learnings, and milestone screenshots/code snippets.

> **Scope:** Full-stack budget tracker (React + Vite, Node/Express, MongoDB), i18n (EN/FR), theming, auth (email + Google OAuth), reports, budgets, and Excel export.  
> **Owner:** Oksana Katysheva  
> **Repo:** https://github.com/roxy-k/nest-egg  
> **Live:** Frontend — https://your-nest-egg.onrender.com  
> API — https://nest-egg-tuwf.onrender.com

---

## Week 1 — Planning & Foundations

### Goals
- Finalize project scope (audience, features, tech stack).
- Bootstrap the workspace (Vite + React client, Express API).
- Lay down global contexts for settings and auth.
- Establish tooling: ESLint, Git hooks, environment files.

### What I did
- Created the mono-repo structure with shared `package.json` and workspaces.
- Scaffolded the Vite app with React Router, Bootstrap, and baseline pages.
- Implemented `SettingsContext` with theme + i18n support, and a stubbed `AuthContext`.
- Brought up Express with `/api` prefix, CORS, and placeholder routes.
- Documented required environment variables (`.env.example`).

### Challenges & Solutions
- **CORS with cookies:** initial requests dropped cookies.  
  ✅ Configured CORS with `credentials: true`, explicit `origin`, and matching client fetch options.
- **Structure decisions:** keeping client/server manageable.  
  ✅ Adopted a single repo with workspaces to ease CI and deployments.

### Key Learnings
- Start with minimal i18n hooks and grow dictionaries gradually.
- Theme switching via `data-bs-theme` scales cleanly with Bootstrap.

---

## Week 2 — Categories & Transactions

### Goals
- Build CRUD flows for categories (income/expense, slug/ID).
- Add transaction management with filters, sorting, and search.
- Harden amount inputs and validation logic.
- Move all user-facing strings into translation dictionaries.

### What I did
- Completed categories UI + validation, including unique slug enforcement.
- Delivered transaction add/edit/delete plus filters (month/category/type) and search.
- Added `sanitizeAmount`, paste guards, and numeric input blocking to keep values clean.
- Normalized IDs across mock data and Mongo (`doc._id || doc.id`).
- Localized newly exposed strings inside `en.json`/`fr.json`.

### Challenges & Solutions
- **Mixed identifiers:** mocks vs. DB returned different keys.  
  ✅ Always rely on `(doc._id || doc.id)` when mapping objects.
- **Flexible amounts:** users pasted text with commas/spaces.  
  ✅ Sanitized inputs on every change and prevented invalid keystrokes.

### Key Learnings
- Centralizing validation keeps UI consistent and reduces regressions.
- Locale-aware string comparisons are important when sorting category names.

---

## Week 3 — Budgets, Reports & Auth

### Goals
- Introduce monthly budgets per category with progress indicators.
- Visualize trends with Reports (Pie/Bar charts) and Excel export.
- Ship authentication flows (email/password + Google OAuth).
- Polish navigation, theming, and localization coverage.

### What I did
- Built the Budgets page: CRUD, progress bars, and over-limit cues.
- Added Recharts-based visualizations (expenses by category, income trends).
- Implemented Excel export using `xlsx` + `file-saver`.
- Integrated Passport for JWT + Google OAuth, refreshed navbar states, and completed localized auth pages.
- Tweaked layout accessibility and ensured theme/i18n toggles work end-to-end.

### Challenges & Solutions
- **Missing i18n keys:** new UI strings slipped through.  
  ✅ Audited and expanded translation dictionaries before shipping.
- **Prod cookie behavior:** SameSite/Secure mismatches broke login.  
  ✅ Applied conditional cookie options (Secure + `SameSite=None` in production, lax locally).
- **OAuth redirect flow:** inconsistent token refresh on callback.  
  ✅ Added `/oauth` handling to store tokens and trigger `refresh()` reliably.

### Key Learnings
- Memoizing aggregated data keeps charts and tables snappy.
- Precise auth UX (navbar, redirects) dramatically improves perceived quality.

---

## Week 4 — Testing, Deployment & Automation

### Goals
- Add test suites for critical backend and frontend flows.
- Deploy production instances and verify HTTPS/cookie/i18n scenarios.
- Implement password reset, better error messaging, and localization QA.
- Automate quality gates with CI and pre-commit hooks.

### What I did
- Wrote Mocha/Chai/Supertest tests for categories and budgets; added Vitest component tests.
- Deployed backend (Render) and frontend (Render), validating CORS + HTTPS behavior.
- Implemented password reset via email with hashed tokens (Brevo API integration).
- Refined alerts to map backend errors to translation keys in Budgets/Login; updated dictionaries accordingly.
- Introduced GitHub Actions workflow (`npm ci`, server tests, optional client tests, lint) and Husky + lint-staged pre-commit hook.
- 90-second walkthrough video showing login, transactions, budgets, and reports.  
File: `docs/demo.mov`


### Challenges & Solutions
- **Prod CORS issues:** mismatched origins blocked credentials.  
  ✅ Matched exact domains and enabled credentials in both client and server configs.
- **Safari OAuth edge cases:** cookies sometimes blocked after Google redirect.  
  ✅ Added hash-token redirect fallback and `Authorization` header refresh.
- **Conditional CI steps:** client tests/lint should skip if scripts absent.  
  ✅ Detected scripts via Node helper and exported flags for workflow conditions.

### Key Learnings
- Testing full auth and reset flows on real domains catches cookie/security surprises early.
- Automated lint/tests (CI + pre-commit) keep the repo clean without extra ceremony.
- Translation-first error handling prevents last-minute copy mismatches.

---

## Milestones Checklist

- [x] Proposal approved (idea, audience, stack).  
- [x] Frontend scaffolded (Vite, Router, Bootstrap).  
- [x] Backend scaffolded (Express, MongoDB, Passport).  
- [x] Contexts implemented (Auth/Settings/Categories/Transactions/Budgets).  
- [x] Transactions CRUD with filters/search/sorting.  
- [x] Categories CRUD with slug validation.  
- [x] Budgets with progress tracking.  
- [x] Reports (Pie/Bar) + Excel export.  
- [x] i18n (EN/FR).  
- [x] Auth (email + Google OAuth).  
- [x] Password Reset via email link.  
- [x] README + Devlog.  
- [x] Deployment (Frontend + API).

---

## Deployment Notes

- **Frontend (Netlify/Vercel):**  
  `VITE_API_URL=https://nest-egg-tuwf.onrender.com/api`  
- **Backend (Render):**  
  `CLIENT_URL=https://your-nest-egg.onrender.com`  
  `MONGO_URI=...`, `JWT_SECRET=...`  
- **Cookies in production:** use `Secure`, `SameSite=None`, HTTPS only.

---

## Screenshots

All milestone and weekly screenshots are available in the folder  
[`/docs/screenshots/`](./docs/screenshots) — related code snippets live in [`/docs/snippets/`](./docs/snippets)

---

## Appendix

- Input sanitization (`sanitizeAmount`, `onBeforeInput`, paste filtering).  
- Unified ID handling (`doc._id || doc.id`).  
- Example CORS config with credentials.  
- ESLint and `.gitignore` setup.

---

## Devlog: Last Update — “Shipping with Confidence”

The latest pass focused on production hardening—wrapping up localization gaps, strengthening authentication flows, and wiring automated checks so regressions surface quickly. With deployments running, Husky + lint-staged guarding commits, and GitHub Actions mirroring local tests, the project now has a tight build–verify–ship loop. Future features can land faster without sacrificing stability.
