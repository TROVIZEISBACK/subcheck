// Applies db/schema.sql to the database in DATABASE_URL.
// Usage: npm run db:setup
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

// Load .env.local / .env manually (no dependency).
function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    try {
      const text = readFileSync(file, "utf8");
      for (const line of text.split("\n")) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
        if (m && !process.env[m[1]]) {
          let v = m[2].trim();
          if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
            v = v.slice(1, -1);
          }
          process.env[m[1]] = v;
        }
      }
    } catch {
      // file not present — fine
    }
  }
}

async function main() {
  loadEnv();
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set. Add it to .env.local first.");
    process.exit(1);
  }

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const sql = readFileSync(join(__dirname, "..", "db", "schema.sql"), "utf8");

  const isLocal = /@(localhost|127\.0\.0\.1|::1)[:/]/.test(connectionString);
  const client = new pg.Client({
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    await client.query(sql);
    console.log("✓ Schema applied successfully.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Schema setup failed:", err.message);
  process.exit(1);
});
