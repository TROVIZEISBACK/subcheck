"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInAction, signUpAction } from "@/app/actions";
import { Brand } from "./Brand";
import { ThemeToggle } from "./ThemeToggle";

type Mode = "signin" | "signup";

export function AuthForm({ mode, notice }: { mode: Mode; notice?: string }) {
  const action = mode === "signup" ? signUpAction : signInAction;
  const [state, formAction, pending] = useActionState(action, {
    error: null as string | null,
  });

  const isSignup = mode === "signup";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <div className="fixed right-4 top-4 z-50">
        <ThemeToggle compact />
      </div>
      <div className="mb-8 flex justify-center">
        <Brand size="lg" />
      </div>

      <div className="card p-7">
        <p className="label">{isSignup ? "Create account" : "Welcome back"}</p>
        <h1 className="mt-1 text-2xl font-semibold text-content">
          {isSignup ? "Start tracking your subscriptions" : "Sign in to SubCheck"}
        </h1>

        {notice && (
          <p className="mt-4 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-content">
            {notice}
          </p>
        )}

        <form action={formAction} className="mt-6 space-y-4">
          {isSignup && (
            <div>
              <label className="label" htmlFor="displayName">
                Name
              </label>
              <input id="displayName" name="displayName" className="field mt-1.5" placeholder="Your name" />
            </div>
          )}
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
          <div>
            <div className="flex items-center justify-between">
              <label className="label" htmlFor="password">
                Password
              </label>
              {!isSignup && (
                <Link href="/forgot-password" className="text-xs font-medium text-accent-text">
                  Forgot password?
                </Link>
              )}
            </div>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete={isSignup ? "new-password" : "current-password"}
              className="field mt-1.5"
              placeholder="At least 8 characters"
            />
          </div>

          {state?.error && (
            <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {state.error}
            </p>
          )}

          <button type="submit" disabled={pending} className="btn-primary w-full">
            {pending ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link href="/sign-in" className="font-semibold text-accent-text hover:text-accent-text">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New to SubCheck?{" "}
            <Link href="/sign-up" className="font-semibold text-accent-text hover:text-accent-text">
              Create an account
            </Link>
          </>
        )}
      </p>
    </main>
  );
}
