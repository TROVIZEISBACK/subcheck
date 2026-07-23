"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "./Brand";
import { ThemeToggle } from "./ThemeToggle";
import { signOutAction } from "@/app/actions";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "grid" },
  { href: "/subscriptions", label: "Subscriptions", icon: "list" },
  { href: "/settings", label: "Settings", icon: "gear" },
];

function Icon({ name }: { name: string }) {
  const common = { width: 18, height: 18, fill: "none", stroke: "currentColor", strokeWidth: 1.8 } as const;
  if (name === "grid")
    return (
      <svg viewBox="0 0 24 24" {...common}>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    );
  if (name === "list")
    return (
      <svg viewBox="0 0 24 24" {...common}>
        <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" strokeLinecap="round" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" {...common}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export function Sidebar({ email }: { email: string | null }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-line/[0.08] bg-surface px-4 py-6">
      <div className="px-2">
        <Brand />
      </div>

      <nav className="mt-8 flex-1 space-y-1">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-accent/12 text-content ring-1 ring-accent/25"
                  : "text-muted hover:bg-line/[0.05] hover:text-content"
              }`}
            >
              <span className={active ? "text-accent-text" : "text-faint"}>
                <Icon name={item.icon} />
              </span>
              {item.label}
            </Link>
          );
        })}

        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-faint">
          <span className="text-faint">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="2" y="6" width="20" height="13" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </span>
          Connect bank
          <span className="ml-auto rounded-full bg-line/[0.06] px-2 py-0.5 text-[10px] uppercase tracking-wide">
            Soon
          </span>
        </div>
      </nav>

      <div className="mt-4 border-t border-line/[0.08] pt-4">
        <p className="truncate px-2 text-xs text-faint" title={email ?? ""}>
          {email}
        </p>
        <div className="mt-2 space-y-2">
          <ThemeToggle />
          <form action={signOutAction}>
            <button type="submit" className="btn-ghost w-full">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
