-- SubCheck Phase 2 schema for plain PostgreSQL.
-- Apply with:  npm run db:setup   (or psql "$DATABASE_URL" -f db/schema.sql)
--
-- Authorization is enforced in the application layer: every query is scoped to
-- the signed-in user's id. There is no Supabase / RLS dependency.
--
-- Requires PostgreSQL 13+ (for the built-in gen_random_uuid()). Works with the
-- bundled PGlite preview database and any hosted Postgres.

-- ---------------------------------------------------------------------------
-- users: account + alert preferences (replaces Supabase auth.users + profiles)
-- ---------------------------------------------------------------------------
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  password_hash text not null,
  display_name text,
  timezone text default 'UTC',
  renewal_window_hours integer not null default 72,
  annual_warning_days integer not null default 14,
  high_cost_threshold numeric not null default 25,
  currency text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Case-insensitive unique email.
create unique index if not exists users_email_lower_idx on users (lower(email));

-- ---------------------------------------------------------------------------
-- sessions: opaque token -> user, for the login cookie
-- ---------------------------------------------------------------------------
create table if not exists sessions (
  token text primary key,
  user_id uuid not null references users (id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists sessions_user_id_idx on sessions (user_id);
create index if not exists sessions_expires_at_idx on sessions (expires_at);

-- ---------------------------------------------------------------------------
-- password_reset_tokens: single-use, short-lived. Only a sha256 hash of the
-- token is stored, so a database leak can't be used to take over accounts.
-- ---------------------------------------------------------------------------
create table if not exists password_reset_tokens (
  token_hash text primary key,
  user_id uuid not null references users (id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists password_reset_tokens_user_id_idx on password_reset_tokens (user_id);

-- ---------------------------------------------------------------------------
-- subscriptions
-- ---------------------------------------------------------------------------
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  name text not null,
  merchant_name text,
  category text not null default 'streaming',
  price numeric not null default 0,
  currency text not null default 'USD',
  billing_interval text not null default 'monthly' check (billing_interval in ('monthly','annual')),
  next_bill_date date,
  trial_ends_at date,
  status text not null default 'active' check (status in ('active','trial','paused')),
  usage_status text not null default 'regular' check (usage_status in ('regular','occasional','unused')),
  is_essential boolean not null default false,
  source text not null default 'manual' check (source in ('manual','plaid')),
  management_url text,
  notes text,
  access_notes text,
  service_intelligence jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists subscriptions_user_id_idx on subscriptions (user_id);

-- ---------------------------------------------------------------------------
-- transactions (Plaid-imported; populated in the Plaid step)
-- ---------------------------------------------------------------------------
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  plaid_transaction_id text,
  merchant_name text,
  amount numeric not null default 0,
  date date,
  category text,
  account_id text,
  subscription_id uuid references subscriptions (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists transactions_user_id_idx on transactions (user_id);
create unique index if not exists transactions_plaid_id_uidx
  on transactions (user_id, plaid_transaction_id)
  where plaid_transaction_id is not null;

-- ---------------------------------------------------------------------------
-- alerts
-- ---------------------------------------------------------------------------
create table if not exists alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  subscription_id uuid references subscriptions (id) on delete cascade,
  alert_type text not null,
  scheduled_for timestamptz,
  sent_at timestamptz,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
create index if not exists alerts_user_id_idx on alerts (user_id);

-- ---------------------------------------------------------------------------
-- recommendations
-- ---------------------------------------------------------------------------
create table if not exists recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  subscription_id uuid references subscriptions (id) on delete cascade,
  recommendation_type text not null,
  estimated_savings numeric not null default 0,
  reason text,
  confidence text,
  status text not null default 'open',
  created_at timestamptz not null default now()
);
create index if not exists recommendations_user_id_idx on recommendations (user_id);

-- ---------------------------------------------------------------------------
-- plaid_connections (access tokens stored server-side, encrypted)
-- ---------------------------------------------------------------------------
create table if not exists plaid_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  institution_name text,
  access_token_encrypted text,
  item_id text,
  status text not null default 'active',
  last_synced_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists plaid_connections_user_id_idx on plaid_connections (user_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on users;
create trigger users_set_updated_at before update on users
  for each row execute function set_updated_at();

drop trigger if exists subscriptions_set_updated_at on subscriptions;
create trigger subscriptions_set_updated_at before update on subscriptions
  for each row execute function set_updated_at();
