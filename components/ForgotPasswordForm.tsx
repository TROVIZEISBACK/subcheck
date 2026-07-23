"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordResetAction } from "@/app/actions";
import { Brand } from "./Brand";
import { ThemeToggle } from "./ThemeToggle";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, {
    error: null as string | null,
    resetUrl: null as string | null,
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
        <p className="label">Forgot password</p>
        <h1 className="mt-1 text-2xl font-semibold text-content">Reset your password</h1>
        <p className="mt-2 text-sm text-muted">
          Enter your account email and we&apos;ll create a reset link for you.
        </p>

        {state.resetUrl ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-accent/30 bg-accent/10 p-4">
              <p className="text-sm font-semibold text-content">Your reset link is ready</p>
              <p className="mt-1 text-xs text-muted">
                Demo mode: no email service is connected, so the link is shown here. In a real
                deployment it would be emailed to you.
              </p>
              <Link href={state.resetUrl} className="btn-primary mt-3 w-full">
                Set a new password
              </Link>
            </div>
            <p className="text-xs text-faint">The link works once and expires in 60 minutes.</p>
          </div>
        ) : (
          <form action={formAction} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="field mt-1.5"
                placeholder="you@example.com"
              />
            </div>

            {state.error && (
              <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                {state.error}
              </p>
            )}

            <button type="submit" disabled={pending} className="btn-primary w-full">
              {pending ? "Please wait…" : "Create reset link"}
            </button>
          </form>
        )}
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        Remembered it?{" "}
        <Link href="/sign-in" className="font-semibold text-accent-text">
          Back to sign in
        </Link>
      </p>
    </main>
  );
}
