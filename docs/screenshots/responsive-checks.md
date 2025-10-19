# Responsive Verification — 2025-10-19

Automated smoke tests simulate a compact viewport and assert the responsive UI behaviour:

- `npm run test:client` & `npm run test:client:cov`  
  - `AppNavbar` test confirms guest/login vs authenticated states and ensures the collapsible toggle (`aria-label="Toggle navigation"`) renders for small screens.
  - `Transactions` test forces `window.innerWidth = 480`, dispatches a resize event, and verifies the table lives inside `.table-responsive`, keeping data scrollable on phones.

Server-rendered endpoints remain covered by the expanded Mocha suite (`npm run test:server`), which underpins the responsive front-end data with deterministic API behaviour.

For manual QA, open the live deployment (`https://your-nest-egg.onrender.com`) at:

- Chrome 128 / macOS — 1440×900, 768×1024, 390×844 (iPhone 15)
- Firefox 129 / macOS — 1366×768
- Safari 17.6 / macOS, Safari iOS simulator — portrait/landscape

Capture updated screenshots while completing this checklist and store them with the release artefacts (outside the repo) to document the responsive review.
