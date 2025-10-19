# NestEgg Devlog

A running log of the NestEgg capstone project: weekly updates, challenges, solutions, key learnings, and milestone screenshots/code snippets.

> **Scope:** Full‑stack budget tracker (React + Vite, Node/Express, MongoDB), i18n (EN/FR), theming, auth (email + Google OAuth), reports, budgets, and Excel export.  
> **Owner:** Oksana Katysheva  
> **Repo:** https://github.com/roxy-k/nest-egg  
> **Live:** Frontend — https://your-nest-egg.onrender.com  
> API — https://nest-egg-tuwf.onrender.com

---

## Week 1 — Planning & Setup

### Goals
- Draft the project proposal (idea, audience, features, tech stack).
- Initialize mono‑repo (or two folders: `/frontend` and `/backend`).
- Bootstrap **Vite + React** app and **Express** API.
- Add base **Contexts**: `AuthContext`, `SettingsContext`.
- Configure ESLint, Git hooks, `.gitignore`, environment variables.

### What I did
- Finalized proposal and folder structure.
- Set up Vite, React Router, Bootstrap.
- Implemented `SettingsContext` with theme & i18n provider (`t()` helper).
- Created `AuthContext` skeleton (login/register/logout stubs).
- Configured Express with `/api` prefix and CORS for frontend origin.
- Prepared `.env.example`.

### Challenges & Solutions
- **CORS with cookies:** Needed `credentials: true` and explicit `origin` on server.  
  ✅ **Solution:** Configured CORS with `credentials: true`, `origin: CLIENT_URL`; frontend uses `credentials: 'include'`.
- **Folder boundaries:** Kept frontend and backend separate to simplify deploy & CI.

### Key Learnings
- Keep i18n minimal early; grow gradually.
- Theme switching with `data-bs-theme` is clean and scalable.

---

## Week 2 — Core Features (Categories & Transactions)

### Goals
- CRUD for **Categories** (income/expense, slug/id).
- CRUD for **Transactions** with filters, search, sorting.
- Validation and `sanitizeAmount` logic.
- Move user-facing messages to i18n.

### What I did
- Categories: form + table; slug validation.
- Transactions: add/edit/delete; filtering and sorting.
- Introduced `sanitizeAmount` + paste handling.
- Unified mixed IDs using `(doc._id || doc.id)`.

### Challenges & Solutions
- **Mixed IDs:** inconsistent between mock and DB.  
  ✅ **Solution:** always use `(doc._id || doc.id)`.
- **Input UX:** commas/spaces allowed.  
  ✅ **Solution:** sanitize on change and prevent invalid input.

### Key Learnings
- Centralized validation with i18n improves consistency.
- Sorting must use locale-aware comparison for names.

---

## Week 3 — Budgets & Reports

### Goals
- Monthly budgets per category.
- Reports (Pie/Bar charts).
- Excel export of transactions.

### What I did
- Implemented budgets page with progress bars.
- Added Recharts (Pie/Bar) to Reports.
- Excel export using `xlsx` + `file-saver` with localized headers.

### Challenges & Solutions
- **Missing i18n keys** for headers.  
  ✅ **Solution:** added `common.date/category/type/amount` keys.

### Key Learnings
- Memoize aggregates to avoid rerenders.
- Localize all empty states and labels.

---

## Week 4 — Auth, Polish & i18n

### Goals
- Email/password + Google OAuth login.
- Localize auth strings (“Continue with Google”, etc.).
- Navbar states, logout, and minor accessibility tweaks.

### What I did
- Integrated Passport (JWT + Google OAuth).
- Localized `Login`, `Register`, and `OAuth` pages.
- Improved Navbar state (auth vs guest).

### Challenges & Solutions
- **Cookies in prod:** Secure/SameSite inconsistencies.  
  ✅ **Solution:** applied conditional cookie flags and HTTPS.
- **OAuth redirect:** ensured `/oauth` route refreshes token and navigates properly.

### Key Learnings
- Small UX details improve perceived quality.
- Centralized refresh logic in `AuthContext` simplifies flow.

---

## Week 5 — Testing, Deployment & Final Polish

### Goals
- Unit tests for categories/budgets.
- Production deployment (Frontend + API).
- Verify i18n coverage and consistency.
- Add password reset and finalize README/Devlog.

### What I did
- Added unit tests (category slug, budget validation).
- Deployed backend (Render) and frontend (Netlify).
- Verified HTTPS, CORS, and cookie policies.
- Implemented **Password Reset via email link** using Nodemailer + tokens.

### Challenges & Solutions
- **CORS in prod:** mismatched origins blocked cookies.  
  ✅ **Solution:** matched origins exactly and enabled credentials.
- **Safari OAuth:** cookies blocked in some cases.  
  ✅ **Solution:** switched to hash-token redirect (`/#token=`) and Bearer `/auth/me` flow.

### Key Learnings
- Test full auth flow on real HTTPS domains.
- Deployment checklists prevent missed config errors.

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
[`/docs/screenshots/`](./docs/screenshots)

---

## Appendix

- Input sanitization (`sanitizeAmount`, `onBeforeInput`, paste filtering).  
- Unified ID handling (`doc._id || doc.id`).  
- Example CORS config with credentials.  
- ESLint and `.gitignore` setup.

---

## Devlog: Last Update — “Deployment & Lessons Learned”

In the final stage, the project was successfully deployed on Render (backend) and Render(frontend).  
Key lessons learned include: the importance of testing OAuth and cookie flows under real HTTPS conditions, maintaining strict environment variable consistency between services, and documenting every setup step for easier debugging.  
The overall result is a stable, production-ready budgeting app with clear structure, localization, and secure authentication.
