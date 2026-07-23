import type {
  BillingInterval,
  CategoryKey,
  SubscriptionInput,
  SubscriptionStatus,
  UsageStatus,
} from "./types";

const CATEGORIES: CategoryKey[] = [
  "streaming",
  "productivity",
  "wellness",
  "storage",
  "utilities",
  "shopping",
  "unused",
];
const INTERVALS: BillingInterval[] = ["monthly", "annual"];
const STATUSES: SubscriptionStatus[] = ["active", "trial", "paused"];
const USAGE: UsageStatus[] = ["regular", "occasional", "unused"];

function oneOf<T extends string>(value: FormDataEntryValue | null, allowed: T[], fallback: T): T {
  const v = String(value ?? "");
  return (allowed as string[]).includes(v) ? (v as T) : fallback;
}

function cleanDate(value: FormDataEntryValue | null): string | null {
  const v = String(value ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
}

// Parses and validates a subscription form submission. Returns either the clean
// input or a list of human-readable errors.
export function parseSubscriptionForm(
  form: FormData
): { ok: true; value: SubscriptionInput } | { ok: false; errors: string[] } {
  const errors: string[] = [];

  const name = String(form.get("name") ?? "").trim();
  if (name.length < 1) errors.push("Name is required.");
  if (name.length > 80) errors.push("Name must be 80 characters or fewer.");

  const priceRaw = String(form.get("price") ?? "").trim();
  const price = Number(priceRaw);
  if (!Number.isFinite(price) || price < 0) errors.push("Price must be a non-negative number.");
  if (price > 100000) errors.push("Price is unrealistically high.");

  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    value: {
      name,
      category: oneOf(form.get("category"), CATEGORIES, "streaming"),
      price: Math.round(price * 100) / 100,
      interval: oneOf(form.get("interval"), INTERVALS, "monthly"),
      nextBillDate: cleanDate(form.get("nextBillDate")),
      trialEndsAt: cleanDate(form.get("trialEndsAt")),
      status: oneOf(form.get("status"), STATUSES, "active"),
      usageStatus: oneOf(form.get("usageStatus"), USAGE, "regular"),
      isEssential: form.get("isEssential") === "on" || form.get("isEssential") === "true",
      accessNotes: String(form.get("accessNotes") ?? "").trim() || undefined,
      notes: String(form.get("notes") ?? "").trim() || undefined,
    },
  };
}
