"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPasswordAction } from "@/app/actions";
import { Brand } from "./Brand";
import { ThemeToggle } from "./ThemeToggle";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, {
    error: null as string | null,
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <div className="fixed right-4 top-4 z-50">
        <ThemeToggle compact />
      </div>
      <div className="mb-8 flex justify-center">
        <Brand size="lg" />
      </div>

      <div className="card p-7">
        <p className="label">Reset password</p>
        <h1 className="mt-1 text-2xl font-semibold text-content">Choose a new password</h1>

        {!token ? (
          <div className="mt-6 space-y-4">
            <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              This page needs a reset link. Request one first.
            </p>
            <Link href="/forgot-password" className="btn-primary w-full">
              Request a reset link
            </Link>
          </div>
        ) : (
          <form action={formAction} className="mt-6 space-y-4">
            <input type="hidden" name="token" value={token} />
            <div>
              <label className="label" htmlFor="password">
                New password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="field mt-1.5"
                placeholder="At least 8 characters"
              />
            </div>
            <div>
              <label className="label" htmlFor="confirm">
                Confirm new password
              </label>
              <input
                id="confirm"
                name="confirm"
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

            <button type="submit" disabled={pending} className="btn-primary w-full">
              {pending ? "Please wait…" : "Set new password"}
            </button>
          </form>
        )}
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        <Link href="/sign-in" className="font-semibold text-accent-text">
          Back to sign in
        </Link>
      </p>
    </main>
  );
}
