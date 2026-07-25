"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV_ITEMS = [
  { href: "/dashboard/recipes", label: "Generator", icon: "🍳" },
  { href: "/dashboard/recipes#history", label: "Recipe History", icon: "📋" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
];

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href.split("#")[0];
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className="flex items-center gap-2 rounded-[var(--radius-btn)] px-3 py-2 text-[0.85rem] font-medium"
            style={{
              background: isActive ? "var(--bg-soft)" : "transparent",
              color: isActive ? "var(--text)" : "var(--text-muted)",
            }}
          >
            <span aria-hidden>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-full flex-1">
      {/* Desktop sidebar — real CSS breakpoint, not a device-simulation toggle */}
      <nav
        className="sticky top-0 hidden h-screen w-56 flex-col gap-1 border-r p-4 md:flex"
        style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}
      >
        <div className="mb-4 flex items-center gap-2 px-2 text-[1.0625rem] font-semibold">
          <span aria-hidden>🍳</span> Ingredas
        </div>
        <NavLinks pathname={pathname} />
        <div className="mt-auto pt-4">
          <ThemeToggle />
        </div>
      </nav>

      <div className="flex min-h-screen flex-1 flex-col">
        {/* Mobile topbar — shown below the md breakpoint only */}
        <header
          className="sticky top-0 z-20 flex items-center justify-between border-b px-4 py-3 md:hidden"
          style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}
        >
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
            className="text-xl"
          >
            ☰
          </button>
          <span className="text-[0.95rem] font-semibold">🍳 Ingredas</span>
          <ThemeToggle />
        </header>

        {/* Mobile drawer + backdrop */}
        {drawerOpen && (
          <div
            className="fixed inset-0 z-30 md:hidden"
            style={{ background: "var(--scrim)" }}
            onClick={() => setDrawerOpen(false)}
          >
            <nav
              className="flex h-full w-64 max-w-[76%] flex-col gap-1 p-4"
              style={{ background: "var(--bg-elevated)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center gap-2 px-2 text-[1.0625rem] font-semibold">
                <span aria-hidden>🍳</span> Ingredas
              </div>
              <NavLinks pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
            </nav>
          </div>
        )}

        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
