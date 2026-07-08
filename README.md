# SubCheck

SubCheck is a Phase 1 implementation of a subscription management dashboard. It helps users track recurring charges, spot upcoming renewals, estimate wasted spend, and review savings recommendations before a card is charged.

This version is intentionally dependency-free so the MVP can run immediately from the repository. It uses browser `localStorage` for data persistence and is structured so later phases can replace local data with Supabase, Plaid transaction sync, and notification services.

## Phase 1 Features

- Manual subscription add, edit, and delete flows.
- Browser-local sign up, sign in, session, and sign out flows.
- User-scoped subscriptions and settings for each local account.
- Dashboard with monthly spend, annualized spend, upcoming charges, and leakage estimates.
- Category spending distribution chart.
- Renewal and trial alert detection using configurable thresholds.
- Savings recommendations for unused, duplicated, high-cost, and trial subscriptions.
- Local settings for reminder windows, annual renewal warnings, and high-cost thresholds.
- JSON export for demo data handoff.
- Seeded demo data matching the presentation categories: streaming, SaaS/productivity, health/wellness, cloud storage, and forgotten/unused services.

## Requirements

SubCheck Phase 1 does not require a package install step. The app is plain HTML, CSS, and JavaScript, and it stores local demo accounts and dashboard data in browser `localStorage`.

Install these tools if you want to use the included scripts:

- Git, for cloning the repository.
- Python 3, for the local static server used by `npm run start`.
- Node.js, only for `npm run check` and convenient script execution.

## Installation

Clone the repository:

```bash
git clone https://github.com/TROVIZEISBACK/subcheck.git
cd subcheck
```

No `npm install` is required because there are no runtime dependencies.

## Local Startup

The fastest option is to open `index.html` directly in a browser.

For a local server, run:

```bash
npm run start
```

Then open:

```text
http://127.0.0.1:4173
```

You can also start the same server without npm:

```bash
python -m http.server 4173
```

If port `4173` is already in use, start Python on another port:

```bash
python -m http.server 5173
```

Then open:

```text
http://127.0.0.1:5173
```

## Account Setup

On first load, create a local SubCheck account with your name, email, and a password of at least 8 characters. The app hashes the password with a per-user salt before saving it in browser `localStorage`.

Use the **Sign out** button in the dashboard header to return to the sign-in screen. Each local account has its own subscriptions and alert settings on the same browser profile.

## Local Data

The MVP saves accounts, active session, subscriptions, and settings in browser `localStorage`. To reset subscriptions for the signed-in account, use the in-app **Reset demo data** button on the Subscriptions or Settings screen.

To remove all local accounts and sessions, clear site data for the local URL in your browser, or clear `localStorage` for `http://127.0.0.1:4173`.

This is a Phase 1 demo auth system. Production sign up, sign in, password recovery, and account security should move to Supabase Auth in Phase 2.

## Validation

Run the syntax checks:

```bash
npm run check
```

This validates `src/data.js` and `src/app.js` with Node's parser.

## Troubleshooting

- If `npm run start` fails because Python is missing, install Python 3 or run the app by opening `index.html` directly.
- If the browser shows old data, reset demo data inside the app or clear `localStorage` for the local site.
- If port `4173` is busy, use a different port with `python -m http.server`.

## Repository Structure

```text
.
|-- IMPLEMENTATION_PLAN.md
|-- README.md
|-- index.html
|-- package.json
|-- src
|   |-- app.js
|   `-- data.js
`-- styles.css
```

## Next Phase

Phase 2 should introduce Supabase Auth/Postgres and Plaid sandbox syncing while preserving the same dashboard and recommendation contracts.
