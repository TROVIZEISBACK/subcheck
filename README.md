# SubCheck

SubCheck is a subscription management and spend-optimization app. It brings every
recurring charge into one dashboard so you can catch renewals, trials, and wasted
spend before your card is charged.

**Phase 2** (this branch) is a full-stack rebuild on **Next.js, PostgreSQL, and Plaid**,
replacing the Phase 1 localStorage prototype. Accounts and data live in Postgres; Plaid
bank sync is the next step.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 15 (App Router), React 19, Tailwind CSS |
| Backend | Next.js server actions / route handlers (Node) |
| Database | PostgreSQL via `pg`; **zero-setup PGlite fallback** (WASM Postgres) when no `DATABASE_URL` |
| Auth | Built-in: `scrypt` password hashing + server-side sessions (httpOnly cookie) |
| Bank sync | Plaid API (sandbox) — *integration in progress* |

## Quick start (zero setup)

No database to install — the app bundles **PGlite** (real Postgres compiled to
WebAssembly) and uses it automatically when `DATABASE_URL` isn't set. Data persists to a
local `.pglite/` folder.

```bash
npm install
npm run dev
```

Open http://localhost:3000, create an account, and start adding subscriptions. That's it.

## Using a real Postgres (persistent / production)

For a shared or production database, point at any Postgres and the app uses it instead of
PGlite:

1. Copy the env template and set `DATABASE_URL`:

   ```bash
   cp .env.example .env.local
   ```

   ```
   # local example
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/subcheck
   # hosted example (Neon — free)
   DATABASE_URL=postgresql://user:pass@ep-xxx.aws.neon.tech/subcheck?sslmode=require
   ```

   (TLS is enabled automatically for non-localhost hosts.)

2. Create the tables (not needed for the PGlite fallback, which self-applies the schema):

   ```bash
   npm run db:setup
   ```

   This runs [`db/schema.sql`](db/schema.sql), creating `users`, `sessions`, `subscriptions`,
   `transactions`, `alerts`, `recommendations`, and `plaid_connections`.

3. Restart the dev server. Requires Postgres 13+ (for the built-in `gen_random_uuid()`).

## Scripts

```bash
npm run dev        # start the dev server
npm run build      # production build (also type-checks)
npm run start      # run the production build
npm run db:setup   # apply db/schema.sql to DATABASE_URL
npm run typecheck  # TypeScript only
npm run lint       # Next.js lint
```

## How it works

- **Auth** — email/password. Passwords are hashed with `scrypt` (Node's built-in crypto).
  A signed-in session is an opaque random token stored in the `sessions` table and sent as
  an httpOnly cookie. Sessions are validated (and revocable) on the server.
- **Access control** — there is no Supabase/RLS layer; every database query is scoped to the
  signed-in user's id in the application code (`... where user_id = $1`).
- **Business logic** — the dashboard math (monthly/annual spend, the leakage estimate,
  redundancy detection via access tags, alerts, and the savings recommendation engine) is
  ported verbatim from Phase 1 into `lib/calc.ts`. The service-recognition catalog is in
  `lib/catalog.ts`.

## Project structure

```
app/
  (app)/            # authenticated shell: dashboard, subscriptions, settings
  sign-in, sign-up  # auth pages
  actions.ts        # server actions (auth + CRUD + preferences)
components/          # UI (Sidebar, forms, auth)
lib/
  db.ts             # pg connection pool + typed query helpers
  auth.ts           # scrypt hashing, sessions, current-user lookup
  calc.ts           # ported business logic
  catalog.ts        # service recognition catalog + categories
  data.ts           # per-user data reads
  mappers.ts        # row <-> domain conversion
  types.ts          # domain + DB row types
  validation.ts     # form parsing/validation
db/schema.sql       # PostgreSQL schema
scripts/setup-db.mjs# applies the schema to DATABASE_URL
```

## Roadmap

- **Phase 2 (in progress):** ✅ Next.js + Postgres auth/data. ⏳ Plaid Link, bank sync,
  recurring-charge detection.
- **Phase 3:** smarter recommendations, feedback loop.
- **Phase 4:** guided cancellation, notifications, shared/household plans.

See [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md) for the full plan.
