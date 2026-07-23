"use client";

import { useEffect, useState } from "react";

// Bump this key when there's a new update worth re-announcing.
const NOTICE_KEY = "subcheck.updateNotice.v2";

export function UpdateNotice() {
  const [show, setShow] = useState(false);
  const [hadLegacyData, setHadLegacyData] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(NOTICE_KEY) === "dismissed") return;

      // Detect leftover data from the Phase 1 (localStorage) version of SubCheck.
      let legacy = false;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("subcheck.phase1.")) {
          legacy = true;
          break;
        }
      }
      setHadLegacyData(legacy);
      setShow(true);
    } catch {
      // localStorage unavailable (private mode etc.) — just don't show it.
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(NOTICE_KEY, "dismissed");
    } catch {
      // ignore
    }
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4">
      <div className="card flex w-full max-w-2xl items-start gap-3 p-4">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/15 ring-1 ring-accent/30">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" className="text-accent-text">
            <path d="M12 3v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="9" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-content">SubCheck has been updated</p>
          <p className="mt-1 text-sm text-muted">
            We&apos;ve rebuilt SubCheck with real accounts, a database, and a redesigned
            dashboard.
            {hadLegacyData
              ? " Your old browser-only data doesn't carry over — please create a fresh account to continue."
              : " Create an account to get started."}
          </p>
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted hover:bg-line/[0.06] hover:text-content"
          aria-label="Dismiss"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
