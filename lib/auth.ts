import "server-only";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { query, queryOne } from "./db";
import type { ProfileRow } from "./types";

const SESSION_COOKIE = "subcheck_session";
const SESSION_TTL_DAYS = 30;

// ---------- password hashing (scrypt, built into Node) ----------

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = String(stored).split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, hash] = parts;
  const derived = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

export function normalizeEmail(email: string): string {
  return String(email || "").trim().toLowerCase();
}

// ---------- user records ----------

export interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
  display_name: string | null;
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  return queryOne<UserRecord>(
    "select id, email, password_hash, display_name from users where lower(email) = lower($1)",
    [normalizeEmail(email)]
  );
}

export async function createUser(
  email: string,
  password: string,
  displayName: string
): Promise<UserRecord> {
  const row = await queryOne<UserRecord>(
    `insert into users (email, password_hash, display_name)
     values ($1, $2, $3)
     returning id, email, password_hash, display_name`,
    [normalizeEmail(email), hashPassword(password), displayName || normalizeEmail(email).split("@")[0]]
  );
  if (!row) throw new Error("Failed to create user.");
  return row;
}

// ---------- sessions ----------

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  await query("insert into sessions (token, user_id, expires_at) values ($1, $2, $3)", [
    token,
    userId,
    expiresAt.toISOString(),
  ]);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroyCurrentSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await query("delete from sessions where token = $1", [token]);
    store.delete(SESSION_COOKIE);
  }
}

// ---------- password reset ----------

const RESET_TTL_MINUTES = 60;

// Creates a single-use reset token for the account, replacing any earlier one.
// Returns the raw token (only its sha256 hash is stored), or null if no
// account matches the email.
export async function createPasswordResetToken(email: string): Promise<string | null> {
  const user = await findUserByEmail(email);
  if (!user) return null;

  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000);

  await query("delete from password_reset_tokens where user_id = $1", [user.id]);
  await query(
    "insert into password_reset_tokens (token_hash, user_id, expires_at) values ($1, $2, $3)",
    [tokenHash, user.id, expiresAt.toISOString()]
  );
  return token;
}

// Consumes a reset token and sets the new password. Also signs the user out of
// every device, since a reset implies the old password may be compromised.
export async function resetPasswordWithToken(token: string, newPassword: string): Promise<boolean> {
  const tokenHash = createHash("sha256").update(String(token)).digest("hex");
  const row = await queryOne<{ user_id: string }>(
    `select user_id from password_reset_tokens
      where token_hash = $1 and used_at is null and expires_at > now()`,
    [tokenHash]
  );
  if (!row) return false;

  await query("update users set password_hash = $1 where id = $2", [
    hashPassword(newPassword),
    row.user_id,
  ]);
  await query("update password_reset_tokens set used_at = now() where token_hash = $1", [tokenHash]);
  await query("delete from sessions where user_id = $1", [row.user_id]);
  return true;
}

export interface SessionUser {
  id: string;
  email: string | null;
  displayName: string | null;
}

// Reads the session cookie and returns the signed-in user, or null. Safe to call
// from Server Components and Server Actions.
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const row = await queryOne<{
    id: string;
    email: string | null;
    display_name: string | null;
  }>(
    `select u.id, u.email, u.display_name
       from sessions s
       join users u on u.id = s.user_id
      where s.token = $1 and s.expires_at > now()`,
    [token]
  );
  if (!row) return null;
  return { id: row.id, email: row.email, displayName: row.display_name };
}

// Full profile row (includes preferences) for the signed-in user.
export async function getCurrentProfile(): Promise<ProfileRow | null> {
  const user = await getSessionUser();
  if (!user) return null;
  return queryOne<ProfileRow>(
    `select id, email, display_name,
            renewal_window_hours, annual_warning_days, high_cost_threshold, currency,
            created_at, updated_at
       from users where id = $1`,
    [user.id]
  );
}
