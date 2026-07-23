// Core SubCheck business logic, ported from the Phase 1 src/app.js so the same
// deterministic math powers both the client and server. All functions are pure:
// they take the subscription list (and preferences where relevant) as arguments.

import { CATEGORIES, SERVICE_CATALOG } from "./catalog";
import type {
  CategoryKey,
  CategoryMeta,
  Preferences,
  ServiceIntelligence,
  Subscription,
} from "./types";

// ---------- formatting & dates ----------

export function formatCurrency(value: number, currencyCode = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode || "USD",
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value || 0);
}

export function parseLocalDate(value: string): Date {
  const parts = String(value).split("-").map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0, 0);
}

export function todayDate(): Date {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  return date;
}

export function prettyDate(value: string | null): string {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parseLocalDate(value));
}

export function daysUntil(value: string | null): number {
  if (!value) return Infinity;
  const diff = parseLocalDate(value).getTime() - todayDate().getTime();
  return Math.ceil(diff / 86400000);
}

export function relativeDays(days: number): string {
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  return "in " + days + " days";
}

export function billingCadence(subscription: Subscription): string {
  return subscription.interval === "annual" ? "annually" : "monthly";
}

// ---------- cost ----------

export function monthlyCost(subscription: Subscription): number {
  const price = Number(subscription.price) || 0;
  return subscription.interval === "annual" ? price / 12 : price;
}

export function annualCost(subscription: Subscription): number {
  const price = Number(subscription.price) || 0;
  return subscription.interval === "annual" ? price : price * 12;
}

export function categoryMeta(category: CategoryKey): CategoryMeta {
  return (
    CATEGORIES[category] || {
      label: "Other",
      shortLabel: "Other",
      color: "#64748b",
      softColor: "#e2e8f0",
    }
  );
}

// ---------- service intelligence & recognition ----------

export function labelize(value: string): string {
  return String(value || "")
    .replace(/([A-Z])/g, " $1")
    .replace(/[-_]/g, " ")
    .replace(/^./, (match) => match.toUpperCase())
    .trim();
}

export function normalizeServiceKey(value: string): string {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\+/g, " plus ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(inc|llc|ltd|subscription|premium|plus|pro|plan|app)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function unique(values: string[]): string[] {
  const seen: Record<string, boolean> = {};
  return values.filter((value) => {
    if (!value || seen[value]) return false;
    seen[value] = true;
    return true;
  });
}

function serviceSearchTerms(service: (typeof SERVICE_CATALOG)[number]): string[] {
  return [service.canonicalName]
    .concat(service.aliases || [])
    .map(normalizeServiceKey)
    .filter(Boolean);
}

function serviceMatchScore(nameKey: string, service: (typeof SERVICE_CATALOG)[number]): number {
  const terms = serviceSearchTerms(service);
  const nameTokens = nameKey.split(" ").filter(Boolean);
  let best = 0;

  terms.forEach((term) => {
    if (term === nameKey) {
      best = Math.max(best, 100);
      return;
    }
    if (term && nameKey && (term.indexOf(nameKey) >= 0 || nameKey.indexOf(term) >= 0)) {
      best = Math.max(best, 82);
      return;
    }
    const termTokens = term.split(" ").filter(Boolean);
    const overlap = nameTokens.filter((token) => termTokens.indexOf(token) >= 0).length;
    const score = termTokens.length ? Math.round((overlap / termTokens.length) * 72) : 0;
    best = Math.max(best, score);
  });

  return best;
}

function matchServiceCatalog(name: string) {
  const nameKey = normalizeServiceKey(name);
  if (!nameKey) return null;

  return (
    SERVICE_CATALOG.map((service) => ({ service, score: serviceMatchScore(nameKey, service) }))
      .filter((candidate) => candidate.score >= 70)
      .sort((a, b) => b.score - a.score)[0] || null
  );
}

function parseAccessTags(value: string): string[] {
  return unique(
    String(value || "")
      .split(/[,;\n]+/)
      .map((part) => normalizeServiceKey(part).replace(/\s+/g, "-"))
      .filter((tag) => tag.length > 1)
  );
}

export function buildServiceIntelligence(
  name: string,
  category: CategoryKey,
  accessNotes: string
): ServiceIntelligence {
  const match = matchServiceCatalog(name);

  if (match) {
    const service = match.service;
    return {
      status: "recognized",
      serviceId: service.id,
      canonicalName: service.canonicalName,
      confidence: match.score >= 95 ? "High" : "Medium",
      source: "Local service catalog",
      checkedAt: new Date().toISOString(),
      homepage: service.homepage,
      merchantName: service.merchantName || service.canonicalName,
      accessSummary: String(accessNotes || service.accessSummary || "").trim(),
      accessTags: unique(service.accessTags || []),
    };
  }

  const manualTags = parseAccessTags(accessNotes);
  return {
    status: "unverified",
    serviceId: "",
    canonicalName: "",
    confidence: "Low",
    source: "Manual entry",
    checkedAt: new Date().toISOString(),
    homepage: "",
    merchantName: "",
    accessSummary: String(accessNotes || "").trim(),
    accessTags: manualTags.length ? manualTags : ["category-" + category],
  };
}

export function ensureServiceIntelligence(subscription: Subscription): Subscription {
  if (subscription.serviceIntelligence && Array.isArray(subscription.serviceIntelligence.accessTags)) {
    return subscription;
  }
  return {
    ...subscription,
    serviceIntelligence: buildServiceIntelligence(
      subscription.name,
      subscription.category,
      subscription.accessNotes || subscription.notes || ""
    ),
  };
}

function serviceAccessTags(subscription: Subscription): string[] {
  const intelligence = subscription.serviceIntelligence;
  if (intelligence && Array.isArray(intelligence.accessTags) && intelligence.accessTags.length) {
    return intelligence.accessTags;
  }
  return ["category-" + subscription.category];
}

function sharedAccessTags(first: Subscription, second: Subscription): string[] {
  const secondTags = serviceAccessTags(second);
  return serviceAccessTags(first).filter((tag) => secondTags.indexOf(tag) >= 0);
}

export function formatAccessTag(tag: string): string {
  return labelize(String(tag || "").replace(/^category-/, ""));
}

export function accessSummaryText(subscription: Subscription): string {
  const intelligence = subscription.serviceIntelligence;
  if (intelligence && intelligence.accessSummary) return intelligence.accessSummary;
  if (intelligence && intelligence.status === "unverified") {
    return "Access not verified. Add access/features in the subscription form to improve overlap checks.";
  }
  return "No access details yet.";
}

function serviceIsRecognized(subscription: Subscription): boolean {
  return Boolean(
    subscription.serviceIntelligence && subscription.serviceIntelligence.status === "recognized"
  );
}

// ---------- aggregates ----------

export function activeSubscriptions(subscriptions: Subscription[]): Subscription[] {
  return subscriptions.filter((subscription) => subscription.status !== "paused");
}

export interface DashboardStats {
  monthly: number;
  annual: number;
  upcomingCount: number;
  upcomingAmount: number;
  alertCount: number;
  leakageMonthly: number;
  leakageAnnual: number;
}

export function dashboardStats(subscriptions: Subscription[], preferences: Preferences): DashboardStats {
  const billable = activeSubscriptions(subscriptions);
  const monthly = billable.reduce((total, subscription) => total + monthlyCost(subscription), 0);
  const upcoming = billable.filter((subscription) => {
    const days = daysUntil(subscription.nextBillDate);
    return days >= 0 && days <= 30;
  });
  const alerts = buildAlerts(subscriptions, preferences);
  const leakage = leakageSummary(subscriptions);

  return {
    monthly,
    annual: monthly * 12,
    upcomingCount: upcoming.length,
    upcomingAmount: upcoming.reduce((total, s) => total + (Number(s.price) || 0), 0),
    alertCount: alerts.length,
    leakageMonthly: leakage.totalMonthly,
    leakageAnnual: leakage.totalMonthly * 12,
  };
}

export interface CategoryTotal {
  category: CategoryKey;
  label: string;
  shortLabel: string;
  color: string;
  value: number;
}

export function categoryTotals(subscriptions: Subscription[]): CategoryTotal[] {
  const totals: Partial<Record<CategoryKey, number>> = {};
  activeSubscriptions(subscriptions).forEach((subscription) => {
    totals[subscription.category] = (totals[subscription.category] || 0) + monthlyCost(subscription);
  });
  return (Object.keys(totals) as CategoryKey[])
    .map((category) => ({
      category,
      label: categoryMeta(category).label,
      shortLabel: categoryMeta(category).shortLabel,
      color: categoryMeta(category).color,
      value: totals[category] || 0,
    }))
    .sort((a, b) => b.value - a.value);
}

export interface LeakageSummary {
  unusedMonthly: number;
  occasionalMonthly: number;
  redundancyMonthly: number;
  totalMonthly: number;
}

export function leakageSummary(subscriptions: Subscription[]): LeakageSummary {
  let unused = 0;
  let occasional = 0;

  activeSubscriptions(subscriptions).forEach((subscription) => {
    if (subscription.usageStatus === "unused") unused += monthlyCost(subscription);
    if (subscription.usageStatus === "occasional") occasional += monthlyCost(subscription) * 0.35;
  });

  const redundancy = redundantGroups(subscriptions).reduce(
    (total, group) => total + group.estimatedMonthlySavings,
    0
  );

  return {
    unusedMonthly: unused,
    occasionalMonthly: occasional,
    redundancyMonthly: redundancy,
    totalMonthly: unused + occasional + redundancy,
  };
}

export interface RedundantGroup {
  id: string;
  label: string;
  accessTags: string[];
  keep: Subscription;
  review: Subscription[];
  estimatedMonthlySavings: number;
}

export function redundantGroups(subscriptions: Subscription[]): RedundantGroup[] {
  const subs = activeSubscriptions(subscriptions);
  const parent: Record<string, string> = {};
  const overlapByPair: Record<string, string[]> = {};

  subs.forEach((subscription) => {
    parent[subscription.id] = subscription.id;
  });

  function find(id: string): string {
    if (parent[id] !== id) parent[id] = find(parent[id]);
    return parent[id];
  }

  function connect(firstId: string, secondId: string) {
    const firstRoot = find(firstId);
    const secondRoot = find(secondId);
    if (firstRoot !== secondRoot) parent[secondRoot] = firstRoot;
  }

  subs.forEach((first, firstIndex) => {
    subs.slice(firstIndex + 1).forEach((second) => {
      const overlap = sharedAccessTags(first, second);
      if (!overlap.length) return;
      connect(first.id, second.id);
      overlapByPair[[first.id, second.id].sort().join("|")] = overlap;
    });
  });

  const grouped: Record<string, Subscription[]> = {};
  subs.forEach((subscription) => {
    const root = find(subscription.id);
    if (!grouped[root]) grouped[root] = [];
    grouped[root].push(subscription);
  });

  return Object.keys(grouped)
    .map((root): RedundantGroup | null => {
      const groupSubscriptions = grouped[root];
      if (groupSubscriptions.length < 2) return null;

      const overlapCounts: Record<string, number> = {};
      groupSubscriptions.forEach((first, firstIndex) => {
        groupSubscriptions.slice(firstIndex + 1).forEach((second) => {
          const pairKey = [first.id, second.id].sort().join("|");
          (overlapByPair[pairKey] || []).forEach((tag) => {
            overlapCounts[tag] = (overlapCounts[tag] || 0) + 1;
          });
        });
      });

      const overlapTags = Object.keys(overlapCounts).sort(
        (a, b) => overlapCounts[b] - overlapCounts[a]
      );
      const sorted = groupSubscriptions.slice().sort((a, b) => {
        if (a.isEssential !== b.isEssential) return a.isEssential ? -1 : 1;
        if (serviceIsRecognized(a) !== serviceIsRecognized(b)) {
          return serviceIsRecognized(a) ? -1 : 1;
        }
        return monthlyCost(b) - monthlyCost(a);
      });
      const keep = sorted[0];
      const review = sorted.slice(1);
      const savings = review.reduce((total, subscription) => {
        const factor =
          subscription.usageStatus === "unused"
            ? 1
            : Math.min(0.65, 0.35 + overlapTags.length * 0.08);
        return total + monthlyCost(subscription) * factor;
      }, 0);

      return {
        id: "overlap-" + overlapTags.join("-"),
        label: overlapTags.slice(0, 3).map(formatAccessTag).join(", "),
        accessTags: overlapTags,
        keep,
        review,
        estimatedMonthlySavings: savings,
      };
    })
    .filter((group): group is RedundantGroup => group !== null);
}

// ---------- alerts ----------

export type AlertSeverity = "critical" | "warning" | "notice";

export interface Alert {
  id: string;
  subscription: Subscription;
  type: string;
  severity: AlertSeverity;
  message: string;
}

export function buildAlerts(subscriptions: Subscription[], preferences: Preferences): Alert[] {
  const alerts: Alert[] = [];
  const renewalWindowDays = Math.ceil((Number(preferences.renewalWindowHours) || 72) / 24);
  const annualWindowDays = Number(preferences.annualWarningDays) || 14;
  const highCostThreshold = Number(preferences.highCostThreshold) || 25;
  const currencyCode = preferences.currency || "USD";

  activeSubscriptions(subscriptions).forEach((subscription) => {
    const billDays = daysUntil(subscription.nextBillDate);
    const trialDays = daysUntil(subscription.trialEndsAt);
    const price = Number(subscription.price) || 0;

    if (subscription.status === "trial" && trialDays >= 0 && trialDays <= renewalWindowDays) {
      alerts.push({
        id: subscription.id + "-trial",
        subscription,
        type: "Trial ending",
        severity: "critical",
        message: "Trial converts " + relativeDays(trialDays) + ". Review before it becomes paid.",
      });
    }

    if (billDays >= 0 && billDays <= renewalWindowDays) {
      alerts.push({
        id: subscription.id + "-renewal",
        subscription,
        type: "Renewal due",
        severity: billDays <= 1 ? "critical" : "warning",
        message: "Next bill is " + relativeDays(billDays) + " for " + formatCurrency(price, currencyCode) + ".",
      });
    }

    if (subscription.interval === "annual" && billDays >= 0 && billDays <= annualWindowDays) {
      alerts.push({
        id: subscription.id + "-annual",
        subscription,
        type: "Annual renewal",
        severity: "warning",
        message: "Annual plan renews on " + prettyDate(subscription.nextBillDate) + ".",
      });
    }

    if (price >= highCostThreshold && billDays >= 0 && billDays <= 7) {
      alerts.push({
        id: subscription.id + "-threshold",
        subscription,
        type: "High-cost charge",
        severity: "notice",
        message: "Charge is above your " + formatCurrency(highCostThreshold, currencyCode) + " review threshold.",
      });
    }
  });

  return alerts.sort(
    (a, b) => daysUntil(a.subscription.nextBillDate) - daysUntil(b.subscription.nextBillDate)
  );
}

// ---------- recommendations ----------

export interface Recommendation {
  id: string;
  title: string;
  type: string;
  estimatedMonthlySavings: number;
  confidence: "High" | "Medium" | "Low";
  subscriptionIds: string[];
  reason: string;
}

export function buildRecommendations(subscriptions: Subscription[]): Recommendation[] {
  const recommendations: Recommendation[] = [];

  activeSubscriptions(subscriptions).forEach((subscription) => {
    if (subscription.usageStatus === "unused") {
      recommendations.push({
        id: subscription.id + "-unused",
        title: "Cancel or pause " + subscription.name,
        type: "Unused subscription",
        estimatedMonthlySavings: monthlyCost(subscription),
        confidence: "High",
        subscriptionIds: [subscription.id],
        reason: "Marked unused and still billing " + billingCadence(subscription) + ".",
      });
    }

    if (subscription.usageStatus === "occasional" && monthlyCost(subscription) >= 10) {
      recommendations.push({
        id: subscription.id + "-downgrade",
        title: "Review " + subscription.name + " usage",
        type: "Usage mismatch",
        estimatedMonthlySavings: monthlyCost(subscription) * 0.35,
        confidence: "Medium",
        subscriptionIds: [subscription.id],
        reason: "Occasional usage suggests a lower tier or temporary pause may be enough.",
      });
    }

    if (subscription.status === "trial" && daysUntil(subscription.trialEndsAt) <= 3) {
      recommendations.push({
        id: subscription.id + "-trial-review",
        title: "Decide on " + subscription.name + " before trial conversion",
        type: "Trial protection",
        estimatedMonthlySavings: monthlyCost(subscription),
        confidence: "High",
        subscriptionIds: [subscription.id],
        reason: "Trial mode is active and the conversion window is inside your alert threshold.",
      });
    }
  });

  redundantGroups(subscriptions).forEach((group) => {
    recommendations.push({
      id: group.id + "-redundancy",
      title: "Resolve access overlap in " + group.label,
      type: "Redundant overlap",
      estimatedMonthlySavings: group.estimatedMonthlySavings,
      confidence: group.accessTags.some((tag) => tag.indexOf("category-") !== 0) ? "High" : "Medium",
      subscriptionIds: group.review.map((subscription) => subscription.id),
      reason:
        "These subscriptions overlap on " +
        group.accessTags.slice(0, 4).map(formatAccessTag).join(", ") +
        ". Keep " +
        group.keep.name +
        " as the primary option and review " +
        group.review.map((subscription) => subscription.name).join(", ") +
        ".",
    });
  });

  return recommendations.sort((a, b) => b.estimatedMonthlySavings - a.estimatedMonthlySavings);
}
