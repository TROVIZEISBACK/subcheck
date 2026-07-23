import Link from "next/link";
import { getSubscriptions, getPreferences, getSessionUser } from "@/lib/data";
import {
  dashboardStats,
  categoryTotals,
  buildAlerts,
  buildRecommendations,
  activeSubscriptions,
  daysUntil,
  monthlyCost,
  formatCurrency,
  prettyDate,
  relativeDays,
} from "@/lib/calc";

export default async function DashboardPage() {
  const [user, subscriptions, preferences] = await Promise.all([
    getSessionUser(),
    getSubscriptions(),
    getPreferences(),
  ]);

  const cur = preferences.currency;
  const stats = dashboardStats(subscriptions, preferences);
  const totals = categoryTotals(subscriptions);
  const alerts = buildAlerts(subscriptions, preferences);
  const recommendations = buildRecommendations(subscriptions);
  const maxCategory = totals.reduce((m, t) => Math.max(m, t.value), 0) || 1;

  const upcoming = activeSubscriptions(subscriptions)
    .filter((s) => {
      const d = daysUntil(s.nextBillDate);
      return d >= 0 && d <= 30;
    })
    .sort((a, b) => daysUntil(a.nextBillDate) - daysUntil(b.nextBillDate))
    .slice(0, 6);

  const firstName = (user?.displayName || user?.email?.split("@")[0] || "there").split(" ")[0];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Dashboard</p>
          <h1 className="mt-1 text-2xl font-semibold text-content">Welcome back, {firstName}</h1>
        </div>
        <Link href="/subscriptions" className="btn-primary">
          + Add subscription
        </Link>
      </header>

      {subscriptions.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Monthly spend" value={formatCurrency(stats.monthly, cur)} accent />
            <StatCard label="Annualized" value={formatCurrency(stats.annual, cur)} />
            <StatCard
              label="Due in 30 days"
              value={String(stats.upcomingCount)}
              sub={formatCurrency(stats.upcomingAmount, cur)}
            />
            <StatCard
              label="Est. monthly leak"
              value={formatCurrency(stats.leakageMonthly, cur)}
              sub={`${formatCurrency(stats.leakageAnnual, cur)}/yr`}
              warn={stats.leakageMonthly > 0}
            />
          </section>

          <div className="grid gap-6 lg:grid-cols-3">
            <section className="card p-6 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-content">Spending distribution</h2>
                <span className="text-xs text-faint">monthly, by category</span>
              </div>
              <div className="mt-5 space-y-4">
                {totals.map((t) => (
                  <div key={t.category}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                        {t.label}
                      </span>
                      <span className="font-medium text-content">{formatCurrency(t.value, cur)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-line/[0.06]">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(t.value / maxCategory) * 100}%`, backgroundColor: t.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="card p-6">
              <h2 className="text-sm font-semibold text-content">Upcoming renewals</h2>
              <div className="mt-4 space-y-3">
                {upcoming.length === 0 && (
                  <p className="text-sm text-faint">Nothing due in the next 30 days.</p>
                )}
                {upcoming.map((s) => {
                  const d = daysUntil(s.nextBillDate);
                  return (
                    <div key={s.id} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-content">{s.name}</p>
                        <p className="text-xs text-faint">{prettyDate(s.nextBillDate)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-content">
                          {formatCurrency(Number(s.price) || 0, cur)}
                        </p>
                        <p className={`text-xs ${d <= 3 ? "text-warn" : "text-faint"}`}>
                          {relativeDays(d)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="card p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-content">Alerts</h2>
                <span className="chip">{alerts.length}</span>
              </div>
              <div className="mt-4 space-y-3">
                {alerts.length === 0 && (
                  <p className="text-sm text-faint">No alerts right now. You&apos;re on top of it.</p>
                )}
                {alerts.slice(0, 6).map((a) => (
                  <div key={a.id} className="flex gap-3 rounded-xl border border-line/[0.07] bg-line/[0.03] p-3">
                    <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${severityDot(a.severity)}`} />
                    <div>
                      <p className="text-sm font-medium text-content">
                        {a.subscription.name} · <span className="text-muted">{a.type}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-faint">{a.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="card p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-content">Savings recommendations</h2>
                <span className="chip text-accent-text">
                  {formatCurrency(
                    recommendations.reduce((s, r) => s + r.estimatedMonthlySavings, 0),
                    cur
                  )}
                  /mo
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {recommendations.length === 0 && (
                  <p className="text-sm text-faint">No savings opportunities detected yet.</p>
                )}
                {recommendations.slice(0, 5).map((r) => (
                  <div key={r.id} className="rounded-xl border border-line/[0.07] bg-line/[0.03] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-content">{r.title}</p>
                      <span className="shrink-0 text-sm font-semibold text-accent-text">
                        {formatCurrency(r.estimatedMonthlySavings, cur)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-faint">{r.reason}</p>
                    <div className="mt-2 flex gap-2">
                      <span className="chip">{r.type}</span>
                      <span className="chip">{r.confidence} confidence</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
  warn,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <div className={`card p-5 ${accent ? "ring-1 ring-accent/20" : ""}`}>
      <p className="label">{label}</p>
      <p className={`stat-value mt-2 ${warn ? "text-warn" : ""}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-faint">{sub}</p>}
    </div>
  );
}

function severityDot(severity: string) {
  if (severity === "critical") return "bg-danger";
  if (severity === "warning") return "bg-warn";
  return "bg-info";
}

function EmptyState() {
  return (
    <div className="card flex flex-col items-center gap-4 p-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 ring-1 ring-accent/25">
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-accent-text">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
      </div>
      <div>
        <h2 className="text-lg font-semibold text-content">No subscriptions yet</h2>
        <p className="mt-1 text-sm text-muted">
          Add your first subscription to see spend, renewals, and savings.
        </p>
      </div>
      <Link href="/subscriptions" className="btn-primary">
        Add a subscription
      </Link>
    </div>
  );
}
