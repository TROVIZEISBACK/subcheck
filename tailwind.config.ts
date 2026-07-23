import type { Config } from "tailwindcss";

// Colors are driven by CSS variables (see app/globals.css) so the whole UI
// re-themes between light and dark by toggling a class on <html>. Values are
// stored as "R G B" channels so Tailwind opacity modifiers (bg-accent/15) work.
function ch(name: string) {
  return `rgb(var(${name}) / <alpha-value>)`;
}

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        app: ch("--bg"),
        surface: ch("--surface"),
        elevated: ch("--surface-2"),
        field: ch("--field"),
        line: ch("--line"),
        content: ch("--text"),
        muted: ch("--text-muted"),
        faint: ch("--text-faint"),
        accent: {
          DEFAULT: ch("--accent"),
          hover: ch("--accent-hover"),
          strong: ch("--accent-strong"),
          on: ch("--accent-on"),
          text: ch("--accent-text"),
        },
        danger: ch("--danger"),
        warn: ch("--warn"),
        info: ch("--info"),
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
      },
      boxShadow: {
        card: "var(--shadow)",
      },
    },
  },
  plugins: [],
};

export default config;
