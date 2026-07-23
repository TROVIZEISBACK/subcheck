"use client";

import { useActionState, useEffect } from "react";
import { createSubscriptionAction, updateSubscriptionAction } from "@/app/actions";
import { CATEGORIES } from "@/lib/catalog";
import type { CategoryKey, Subscription } from "@/lib/types";

const CATEGORY_KEYS = Object.keys(CATEGORIES) as CategoryKey[];

export function SubscriptionForm({
  subscription,
  onDone,
}: {
  subscription?: Subscription;
  onDone: () => void;
}) {
  const editing = Boolean(subscription);
  const action = editing ? updateSubscriptionAction : createSubscriptionAction;
  const [state, formAction, pending] = useActionState(action, { error: null } as {
    error: string | null;
    ok?: boolean;
  });

  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);

  return (
    <form action={formAction} className="card space-y-4 p-6">
      {editing && <input type="hidden" name="id" value={subscription!.id} />}

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-content">
          {editing ? "Edit subscription" : "New subscription"}
        </h2>
        <button type="button" onClick={onDone} className="text-sm text-muted hover:text-content">
          Cancel
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="name">Name</label>
          <input id="name" name="name" required defaultValue={subscription?.name} className="field mt-1.5" placeholder="Netflix" />
        </div>

        <div>
          <label className="label" htmlFor="category">Category</label>
          <select id="category" name="category" defaultValue={subscription?.category ?? "streaming"} className="field mt-1.5">
            {CATEGORY_KEYS.map((k) => (
              <option key={k} value={k}>{CATEGORIES[k].label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="price">Price</label>
          <input id="price" name="price" type="number" step="0.01" min="0" required defaultValue={subscription?.price} className="field mt-1.5" placeholder="15.99" />
        </div>

        <div>
          <label className="label" htmlFor="interval">Billing</label>
          <select id="interval" name="interval" defaultValue={subscription?.interval ?? "monthly"} className="field mt-1.5">
            <option value="monthly">Monthly</option>
            <option value="annual">Annual</option>
          </select>
        </div>

        <div>
          <label className="label" htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={subscription?.status ?? "active"} className="field mt-1.5">
            <option value="active">Active</option>
            <option value="trial">Free trial</option>
            <option value="paused">Paused</option>
          </select>
        </div>

        <div>
          <label className="label" htmlFor="nextBillDate">Next bill date</label>
          <input id="nextBillDate" name="nextBillDate" type="date" defaultValue={subscription?.nextBillDate ?? ""} className="field mt-1.5" />
        </div>

        <div>
          <label className="label" htmlFor="trialEndsAt">Trial ends</label>
          <input id="trialEndsAt" name="trialEndsAt" type="date" defaultValue={subscription?.trialEndsAt ?? ""} className="field mt-1.5" />
        </div>

        <div>
          <label className="label" htmlFor="usageStatus">Usage</label>
          <select id="usageStatus" name="usageStatus" defaultValue={subscription?.usageStatus ?? "regular"} className="field mt-1.5">
            <option value="regular">Regular</option>
            <option value="occasional">Occasional</option>
            <option value="unused">Unused</option>
          </select>
        </div>

        <label className="flex items-center gap-2.5 self-end pb-1 text-sm text-muted">
          <input type="checkbox" name="isEssential" defaultChecked={subscription?.isEssential} className="h-4 w-4 rounded border-line/[0.2] bg-app accent-accent" />
          Essential (keep when resolving overlaps)
        </label>

        <div className="sm:col-span-2">
          <label className="label" htmlFor="accessNotes">Access / features</label>
          <input id="accessNotes" name="accessNotes" defaultValue={subscription?.accessNotes} className="field mt-1.5" placeholder="video streaming, movie library (improves overlap detection)" />
        </div>

        <div className="sm:col-span-2">
          <label className="label" htmlFor="notes">Notes</label>
          <input id="notes" name="notes" defaultValue={subscription?.notes} className="field mt-1.5" placeholder="Optional" />
        </div>
      </div>

      {state?.error && (
        <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Saving…" : editing ? "Save changes" : "Add subscription"}
        </button>
        <button type="button" onClick={onDone} className="btn-ghost">
          Cancel
        </button>
      </div>
    </form>
  );
}
