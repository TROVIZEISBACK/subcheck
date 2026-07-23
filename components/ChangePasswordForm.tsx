"use client";

import { useActionState } from "react";
import { changePasswordAction } from "@/app/actions";

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, {
    error: null as string | null,
    ok: false as boolean | undefined,
  });

  return (
    <section className="card p-6">
      <h2 className="text-sm font-semibold text-content">Change password</h2>
      <p className="mt-1 text-sm text-faint">
        Use at least 8 characters. You&apos;ll stay signed in on this device.
      </p>

      <form action={formAction} className="mt-5 max-w-sm space-y-4">
        <div>
          <label className="label" htmlFor="currentPassword">
            Current password
          </label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
            className="field mt-1.5"
          />
        </div>
        <div>
          <label className="label" htmlFor="newPassword">
            New password
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="field mt-1.5"
            placeholder="At least 8 characters"
          />
        </div>
        <div>
          <label className="label" htmlFor="confirmPassword">
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="field mt-1.5"
            placeholder="Type it again"
          />
        </div>

        {state.error && (
          <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {state.error}
          </p>
        )}
        {state.ok && !state.error && (
          <p className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-content">
            Password updated.
          </p>
        )}

        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Please wait…" : "Update password"}
        </button>
      </form>
    </section>
  );
}
