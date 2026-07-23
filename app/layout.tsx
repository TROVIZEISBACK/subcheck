import type { Metadata } from "next";
import "./globals.css";
import { UpdateNotice } from "@/components/UpdateNotice";

export const metadata: Metadata = {
  title: "SubCheck — Subscription Control",
  description:
    "SubCheck brings every recurring charge into one dashboard so you can catch renewals, trials, and wasted spend before your card is charged.",
};

// Runs before first paint to set the theme class, preventing a flash of the
// wrong theme. Uses the saved choice, else the OS preference.
const themeScript = `(function(){try{var t=localStorage.getItem('subcheck.theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}var r=document.documentElement;r.classList.remove('light','dark');r.classList.add(t);}catch(e){document.documentElement.classList.add('dark');}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {children}
        <UpdateNotice />
      </body>
    </html>
  );
}
