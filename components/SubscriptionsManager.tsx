"use client";

import { useState } from "react";
import { SubscriptionForm } from "./SubscriptionForm";
import { deleteSubscriptionAction } from "@/app/actions";
import { formatCurrency, monthlyCost, prettyDate } from "@/lib/calc";
import { CATEGORIES } from "@/lib/catalog";
import type { Subscription } from "@/lib/types";

type Editing = { kind: "none" } | { kind: "new" } | { kind: "edit"; sub: Subscription };

const STATUS_STYLE: Record<string, string> = {
  active: "text-accent-text bg-accent/10 border-accent/20",
  trial: "text-warn bg-warn/10 border-warn/30",
  paused: "text-muted bg-line/[0.05] border-line/[0.12]",
};

export function SubscriptionsManager({
  subscriptions,
  currency,
}: {
  subscriptions: Subscription[];
  currency: string;
}) {
  const [editing, setEditing] = useState<Editing>({ kind: "none" });
  const close = () => setEditing({ kind: "none" });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Subscriptions</p>
          <h1 className="mt-1 text-2xl font-semibold text-content">
            {subscriptions.length} tracked
          </h1>
        </div>
        {editing.kind === "none" && (
          <button onClick={() => setEditing({ kind: "new" })} className="btn-primary">
            + Add subscription
          </button>
        )}
      </header>

      {editing.kind === "new" && <SubscriptionForm onDone={close} />}
      {editing.kind === "edit" && (
        <SubscriptionForm subscription={editing.sub} onDone={close} />
      )}

      {subscriptions.length === 0 && editing.kind === "none" ? (
        <div className="card p-10 text-center text-sm text-muted">
          No subscriptions yet. Add your first one to get started.
        </div>
      ) : (
        <div className="card divide-y divide-line/[0.08]">
          {subscriptions.map((s) => {
            const recognized = s.serviceIntelligence?.status === "recognized";
            return (
              <div key={s.id} className="flex flex-wrap items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-content">{s.name}</p>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${
                        STATUS_STYLE[s.status] ?? STATUS_STYLE.paused
                      }`}
                    >
                      {s.status}
                    </span>
                    {recognized && (
                      <span className="chip text-accent-text" title="Recognized in the service catalog">
                        verified
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-faint">
                    {CATEGORIES[s.category]?.label ?? s.category}
                    {s.nextBillDate ? ` · next ${prettyDate(s.nextBillDate)}` : ""}
                    {s.usageStatus !== "regular" ? ` · ${s.usageStatus}` : ""}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-semibold text-content">
                    {formatCurrency(Number(s.price) || 0, currency)}
                    <span className="text-xs font-normal text-faint">
                      /{s.interval === "annual" ? "yr" : "mo"}
                    </span>
                  </p>
                  <p className="text-xs text-faint">
                    {formatCurrency(monthlyCost(s), currency)}/mo
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setEditing({ kind: "edit", sub: s })}
                    className="btn-ghost px-3 py-2 text-xs"
                  >
                    Edit
                  </button>
                  <form action={deleteSubscriptionAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <button type="submit" className="btn-danger px-3 py-2 text-xs">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
