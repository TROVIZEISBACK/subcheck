"use client";

import { useActionState } from "react";
import { updatePreferencesAction } from "@/app/actions";
import type { Preferences } from "@/lib/types";

export function SettingsForm({ preferences }: { preferences: Preferences }) {
  const [state, formAction, pending] = useActionState(updatePreferencesAction, { error: null } as {
    error: string | null;
    ok?: boolean;
  });

  return (
    <form action={formAction} className="card max-w-xl space-y-5 p-6">
      <div>
        <label className="label" htmlFor="renewalWindowHours">Renewal alert window (hours)</label>
        <input id="renewalWindowHours" name="renewalWindowHours" type="number" min={1} max={336} defaultValue={preferences.renewalWindowHours} className="field mt-1.5" />
        <p className="mt-1 text-xs text-faint">How far ahead to warn about renewals and trials. Default 72.</p>
      </div>

      <div>
        <label className="label" htmlFor="annualWarningDays">Annual renewal warning (days)</label>
        <input id="annualWarningDays" name="annualWarningDays" type="number" min={1} max={90} defaultValue={preferences.annualWarningDays} className="field mt-1.5" />
      </div>

      <div>
        <label className="label" htmlFor="highCostThreshold">High-cost threshold</label>
        <input id="highCostThreshold" name="highCostThreshold" type="number" min={0} step="0.01" defaultValue={preferences.highCostThreshold} className="field mt-1.5" />
        <p className="mt-1 text-xs text-faint">Charges at or above this amount get flagged before billing.</p>
      </div>

      <div>
        <label className="label" htmlFor="currency">Currency</label>
        <input id="currency" name="currency" maxLength={3} defaultValue={preferences.currency} className="field mt-1.5 uppercase" />
      </div>

      {state?.error && (
        <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{state.error}</p>
      )}
      {state?.ok && (
        <p className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent-text">Settings saved.</p>
      )}

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
