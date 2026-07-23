"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { query, queryOne } from "@/lib/db";
import {
  createPasswordResetToken,
  createSession,
  createUser,
  destroyCurrentSession,
  findUserByEmail,
  getSessionUser,
  hashPassword,
  resetPasswordWithToken,
  verifyPassword,
} from "@/lib/auth";
import { inputToRow } from "@/lib/mappers";
import { parseSubscriptionForm } from "@/lib/validation";

// ---------------- Auth ----------------

export async function signUpAction(
  _prev: unknown,
  formData: FormData
): Promise<{ error: string | null }> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim();

  if (!email || !password) return { error: "Email and password are required." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const existing = await findUserByEmail(email);
  if (existing) return { error: "An account with this email already exists." };

  const user = await createUser(email, password, displayName);
  await createSession(user.id);
  redirect("/dashboard");
}

export async function signInAction(
  _prev: unknown,
  formData: FormData
): Promise<{ error: string | null }> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email and password are required." };

  const user = await findUserByEmail(email);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return { error: "Invalid email or password." };
  }

  await createSession(user.id);
  redirect("/dashboard");
}

export async function signOutAction() {
  await destroyCurrentSession();
  redirect("/sign-in");
}

// ---------------- Password reset ----------------

// No email service is configured, so the reset link is returned to the page
// and shown on screen ("demo mode"). When an email provider is added later,
// send the link there instead of returning it.
export async function requestPasswordResetAction(
  _prev: unknown,
  formData: FormData
): Promise<{ error: string | null; resetUrl: string | null }> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter your account email.", resetUrl: null };

  const token = await createPasswordResetToken(email);
  if (!token) return { error: "No account found with this email.", resetUrl: null };

  return { error: null, resetUrl: `/reset-password?token=${token}` };
}

export async function resetPasswordAction(
  _prev: unknown,
  formData: FormData
): Promise<{ error: string | null }> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!token) return { error: "Missing reset token. Use the link you were given." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirm) return { error: "Passwords do not match." };

  const ok = await resetPasswordWithToken(token, password);
  if (!ok) return { error: "This reset link is invalid or has expired. Request a new one." };

  redirect("/sign-in?reset=1");
}

export async function changePasswordAction(
  _prev: unknown,
  formData: FormData
): Promise<{ error: string | null; ok?: boolean }> {
  const user = await getSessionUser();
  if (!user) return { error: "Not signed in." };

  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (next.length < 8) return { error: "New password must be at least 8 characters." };
  if (next !== confirm) return { error: "New passwords do not match." };

  const row = await queryOne<{ password_hash: string }>(
    "select password_hash from users where id = $1",
    [user.id]
  );
  if (!row || !verifyPassword(current, row.password_hash)) {
    return { error: "Current password is incorrect." };
  }

  await query("update users set password_hash = $1 where id = $2", [hashPassword(next), user.id]);
  return { error: null, ok: true };
}

// ---------------- Subscriptions ----------------

export async function createSubscriptionAction(_prev: unknown, formData: FormData) {
  const user = await getSessionUser();
  if (!user) return { error: "Not signed in." };

  const parsed = parseSubscriptionForm(formData);
  if (!parsed.ok) return { error: parsed.errors.join(" ") };

  const r = inputToRow(parsed.value, user.id);
  await query(
    `insert into subscriptions
       (user_id, name, merchant_name, category, price, billing_interval, next_bill_date,
        trial_ends_at, status, usage_status, is_essential, source, management_url, notes,
        access_notes, service_intelligence)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
    [
      r.user_id, r.name, r.merchant_name, r.category, r.price, r.billing_interval,
      r.next_bill_date, r.trial_ends_at, r.status, r.usage_status, r.is_essential,
      r.source, r.management_url, r.notes, r.access_notes, r.service_intelligence,
    ]
  );

  revalidatePath("/dashboard");
  revalidatePath("/subscriptions");
  return { error: null, ok: true };
}

export async function updateSubscriptionAction(_prev: unknown, formData: FormData) {
  const user = await getSessionUser();
  if (!user) return { error: "Not signed in." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing subscription id." };

  const parsed = parseSubscriptionForm(formData);
  if (!parsed.ok) return { error: parsed.errors.join(" ") };

  const r = inputToRow(parsed.value, user.id);
  // Scope by user_id so a user can never edit another user's row.
  await query(
    `update subscriptions set
       name=$1, merchant_name=$2, category=$3, price=$4, billing_interval=$5,
       next_bill_date=$6, trial_ends_at=$7, status=$8, usage_status=$9, is_essential=$10,
       management_url=$11, notes=$12, access_notes=$13, service_intelligence=$14
     where id=$15 and user_id=$16`,
    [
      r.name, r.merchant_name, r.category, r.price, r.billing_interval, r.next_bill_date,
      r.trial_ends_at, r.status, r.usage_status, r.is_essential, r.management_url, r.notes,
      r.access_notes, r.service_intelligence, id, user.id,
    ]
  );

  revalidatePath("/dashboard");
  revalidatePath("/subscriptions");
  return { error: null, ok: true };
}

export async function deleteSubscriptionAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await query("delete from subscriptions where id = $1 and user_id = $2", [id, user.id]);

  revalidatePath("/dashboard");
  revalidatePath("/subscriptions");
}

// ---------------- Preferences ----------------

export async function updatePreferencesAction(_prev: unknown, formData: FormData) {
  const user = await getSessionUser();
  if (!user) return { error: "Not signed in." };

  const renewal = Math.max(1, Math.min(336, Number(formData.get("renewalWindowHours")) || 72));
  const annual = Math.max(1, Math.min(90, Number(formData.get("annualWarningDays")) || 14));
  const highCost = Math.max(0, Math.min(100000, Number(formData.get("highCostThreshold")) || 25));
  const currency = String(formData.get("currency") ?? "USD").trim().slice(0, 3).toUpperCase() || "USD";

  await query(
    `update users set renewal_window_hours=$1, annual_warning_days=$2, high_cost_threshold=$3, currency=$4
     where id=$5`,
    [renewal, annual, highCost, currency, user.id]
  );

  revalidatePath("/dashboard");
  revalidatePath("/settings");
  return { error: null, ok: true };
}
