# SubCheck

SubCheck is a Phase 1 implementation of a subscription management dashboard. It helps users track recurring charges, spot upcoming renewals, estimate wasted spend, and review savings recommendations before a card is charged.

This version is intentionally dependency-free so the MVP can run immediately from the repository. It uses browser `localStorage` for data persistence and is structured so later phases can replace local data with Supabase, Plaid transaction sync, and notification services.

## Phase 1 Features

- Manual subscription add, edit, and delete flows.
- Dashboard with monthly spend, annualized spend, upcoming charges, and leakage estimates.
- Category spending distribution chart.
- Renewal and trial alert detection using configurable thresholds.
- Savings recommendations for unused, duplicated, high-cost, and trial subscriptions.
- Local settings for reminder windows, annual renewal warnings, and high-cost thresholds.
- JSON export for demo data handoff.
- Seeded demo data matching the presentation categories: streaming, SaaS/productivity, health/wellness, cloud storage, and forgotten/unused services.

## Run Locally

Open `index.html` in a browser.

For a local server:

```bash
npm run start
```

Then visit `http://localhost:4173`.

## Validation

```bash
npm run check
```

## Repository Structure

```text
.
├── IMPLEMENTATION_PLAN.md
├── README.md
├── index.html
├── package.json
├── src
│   ├── app.js
│   └── data.js
└── styles.css
```

## Next Phase

Phase 2 should introduce Supabase Auth/Postgres and Plaid sandbox syncing while preserving the same dashboard and recommendation contracts.

