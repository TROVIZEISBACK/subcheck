// Environment checks for optional integrations. The database always works
// (real Postgres via DATABASE_URL, or the bundled PGlite preview otherwise —
// see lib/db.ts), so there is no "database not configured" state.

export function getPlaidEnv() {
  return {
    clientId: process.env.PLAID_CLIENT_ID,
    secret: process.env.PLAID_SECRET,
    env: process.env.PLAID_ENV || "sandbox",
  };
}

export function isPlaidConfigured(): boolean {
  const { clientId, secret } = getPlaidEnv();
  return Boolean(clientId && secret);
}
