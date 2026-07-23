import { Pool, type QueryResultRow } from "pg";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// SubCheck runs against a real Postgres when DATABASE_URL is set. Otherwise it
// falls back to PGlite — a full Postgres compiled to WebAssembly that runs
// in-process and persists to a local .pglite/ folder — so the app works with
// zero setup for local previews and demos.

const usePglite = !process.env.DATABASE_URL;

export function isPreviewDatabase(): boolean {
  return usePglite;
}

const globalForDb = globalThis as unknown as {
  subcheckPool?: Pool;
  subcheckPglite?: Promise<PgliteLike>;
};

// ---- real Postgres (pg) ----

function getPool(): Pool {
  if (!globalForDb.subcheckPool) {
    const connectionString = process.env.DATABASE_URL!;
    const isLocal = /@(localhost|127\.0\.0\.1|::1)[:/]/.test(connectionString);
    globalForDb.subcheckPool = new Pool({
      connectionString,
      ssl: isLocal ? false : { rejectUnauthorized: false },
      max: 10,
    });
  }
  return globalForDb.subcheckPool;
}

// ---- PGlite (zero-setup preview) ----

interface PgliteLike {
  query: <T>(text: string, params?: unknown[]) => Promise<{ rows: T[] }>;
  exec: (sql: string) => Promise<unknown>;
}

function getPglite(): Promise<PgliteLike> {
  if (!globalForDb.subcheckPglite) {
    globalForDb.subcheckPglite = (async () => {
      const { PGlite } = await import("@electric-sql/pglite");
      const dir = join(process.cwd(), ".pglite");
      const db = new PGlite(dir) as unknown as PgliteLike;
      // Schema is fully idempotent (create ... if not exists / or replace), so
      // running it on every cold start is safe and self-healing.
      const schema = readFileSync(join(process.cwd(), "db", "schema.sql"), "utf8");
      await db.exec(schema);
      return db;
    })();
  }
  return globalForDb.subcheckPglite;
}

// ---- unified query interface ----

// Typed parameterized query. ALWAYS pass user-supplied values as params
// ($1, $2, …), never string-concatenated, to avoid SQL injection.
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  if (usePglite) {
    const db = await getPglite();
    const result = await db.query<T>(text, params);
    return result.rows;
  }
  const result = await getPool().query<T>(text, params as never[]);
  return result.rows;
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
