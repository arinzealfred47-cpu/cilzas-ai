"use client";

import { useTheme } from "@/app/theme-context";

// The initial theme value can legitimately differ between the server render
// (always "dark", since the server can't see localStorage) and the first
// client render (reads the real saved theme via the anti-FOUC script) —
// suppressHydrationWarning tells React that's expected for these two
// elements specifically, rather than a real bug to warn about.
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="pill-tabs" role="group" aria-label="Theme">
      <button
        type="button"
        className={`pill-tab ${theme === "light" ? "active" : ""}`}
        onClick={() => setTheme("light")}
        aria-pressed={theme === "light"}
        title="Light mode"
        suppressHydrationWarning
      >
        ☀️
      </button>
      <button
        type="button"
        className={`pill-tab ${theme === "dark" ? "active" : ""}`}
        onClick={() => setTheme("dark")}
        aria-pressed={theme === "dark"}
        title="Dark mode"
        suppressHydrationWarning
      >
        🌙
      </button>
    </div>
  );
}
