import type {
  Preferences,
  ProfileRow,
  Subscription,
  SubscriptionInput,
  SubscriptionRow,
} from "./types";
import { buildServiceIntelligence } from "./calc";

export function rowToSubscription(row: SubscriptionRow): Subscription {
  return {
    id: row.id,
    name: row.name,
    merchantName: row.merchant_name || undefined,
    category: row.category,
    price: Number(row.price) || 0,
    currency: row.currency || "USD",
    interval: row.billing_interval,
    nextBillDate: row.next_bill_date,
    trialEndsAt: row.trial_ends_at,
    status: row.status,
    usageStatus: row.usage_status,
    isEssential: row.is_essential,
    source: row.source,
    managementUrl: row.management_url || undefined,
    notes: row.notes || undefined,
    accessNotes: row.access_notes || undefined,
    serviceIntelligence: row.service_intelligence || undefined,
  };
}

export function profileToPreferences(row: ProfileRow): Preferences {
  return {
    renewalWindowHours: Number(row.renewal_window_hours) || 72,
    annualWarningDays: Number(row.annual_warning_days) || 14,
    highCostThreshold: Number(row.high_cost_threshold) || 25,
    currency: row.currency || "USD",
  };
}

// Turns validated form input into a DB row payload, recomputing the service
// intelligence (catalog recognition + access tags) on every write.
export function inputToRow(input: SubscriptionInput, userId: string) {
  const intelligence = buildServiceIntelligence(
    input.name,
    input.category,
    input.accessNotes || input.notes || ""
  );

  return {
    user_id: userId,
    name: input.name,
    merchant_name: intelligence.merchantName || null,
    category: input.category,
    price: input.price,
    billing_interval: input.interval,
    next_bill_date: input.nextBillDate,
    trial_ends_at: input.trialEndsAt,
    status: input.status,
    usage_status: input.usageStatus,
    is_essential: input.isEssential,
    source: "manual" as const,
    management_url: intelligence.homepage || null,
    notes: input.notes || null,
    access_notes: input.accessNotes || null,
    service_intelligence: intelligence,
  };
}
