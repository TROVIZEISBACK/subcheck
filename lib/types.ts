// Domain types shared by client and server. These mirror the Postgres schema
// (snake_case columns) while the app layer works in camelCase via mappers.

export type CategoryKey =
  | "streaming"
  | "productivity"
  | "wellness"
  | "storage"
  | "utilities"
  | "shopping"
  | "unused";

export type BillingInterval = "monthly" | "annual";

// active = paying now, trial = in a free trial, paused = not billing.
export type SubscriptionStatus = "active" | "trial" | "paused";

export type UsageStatus = "regular" | "occasional" | "unused";

export interface CategoryMeta {
  label: string;
  shortLabel: string;
  color: string;
  softColor: string;
}

export interface CatalogService {
  id: string;
  canonicalName: string;
  aliases: string[];
  merchantName: string;
  category: CategoryKey;
  homepage: string;
  accessSummary: string;
  accessTags: string[];
}

export interface Preferences {
  renewalWindowHours: number;
  annualWarningDays: number;
  highCostThreshold: number;
  currency: string;
}

export interface ServiceIntelligence {
  status: "recognized" | "unverified";
  serviceId: string;
  canonicalName: string;
  confidence: "High" | "Medium" | "Low";
  source: string;
  checkedAt: string;
  homepage: string;
  merchantName: string;
  accessSummary: string;
  accessTags: string[];
}

// App-layer subscription (camelCase). `id` is a uuid from Postgres.
export interface Subscription {
  id: string;
  name: string;
  merchantName?: string;
  category: CategoryKey;
  price: number;
  currency: string;
  interval: BillingInterval;
  nextBillDate: string | null; // YYYY-MM-DD
  trialEndsAt: string | null; // YYYY-MM-DD
  status: SubscriptionStatus;
  usageStatus: UsageStatus;
  isEssential: boolean;
  source: "manual" | "plaid";
  managementUrl?: string;
  notes?: string;
  accessNotes?: string;
  serviceIntelligence?: ServiceIntelligence;
}

// The shape a form / API accepts when creating or updating a subscription.
export interface SubscriptionInput {
  name: string;
  category: CategoryKey;
  price: number;
  interval: BillingInterval;
  nextBillDate: string | null;
  trialEndsAt: string | null;
  status: SubscriptionStatus;
  usageStatus: UsageStatus;
  isEssential: boolean;
  accessNotes?: string;
  notes?: string;
}

// ---- Database row shapes (snake_case, as stored in Postgres) ----

export interface SubscriptionRow {
  id: string;
  user_id: string;
  name: string;
  merchant_name: string | null;
  category: CategoryKey;
  price: number | string;
  currency: string;
  billing_interval: BillingInterval;
  next_bill_date: string | null;
  trial_ends_at: string | null;
  status: SubscriptionStatus;
  usage_status: UsageStatus;
  is_essential: boolean;
  source: "manual" | "plaid";
  management_url: string | null;
  notes: string | null;
  access_notes: string | null;
  service_intelligence: ServiceIntelligence | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileRow {
  id: string;
  email: string | null;
  display_name: string | null;
  timezone: string | null;
  renewal_window_hours: number;
  annual_warning_days: number;
  high_cost_threshold: number;
  currency: string;
  created_at: string;
  updated_at: string;
}
