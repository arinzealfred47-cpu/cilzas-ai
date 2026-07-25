"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LANGUAGES, findLanguage } from "@repo/i18n";
import { useLanguage } from "./language-context";

export function LanguagePicker({ variant = "header" }: { variant?: "header" | "settings" }) {
  const { locale, setLocale, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const current = findLanguage(locale);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LANGUAGES;
    return LANGUAGES.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q),
    );
  }, [query]);

  function selectLanguage(code: string) {
    setLocale(code);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className="relative w-full max-w-xs" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="button-soft flex w-full items-center justify-between px-4 py-2 text-sm"
      >
        {variant === "settings" ? (
          <>
            <span>🌐 Language *</span>
            <span>
              {current?.name ?? "English"} <span style={{ color: "var(--text-faint)" }}>▾</span>
            </span>
          </>
        ) : (
          <span>
            🌐 {current?.name ?? "English"} <span style={{ color: "var(--text-faint)" }}>▾</span>
          </span>
        )}
      </button>

      {open && (
        <div className="card absolute z-20 mt-2 w-full overflow-hidden">
          <input
            autoFocus
            type="text"
            placeholder={t.languageSearchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full border-b bg-transparent px-4 py-2 text-sm outline-none"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          />
          <ul className="max-h-64 overflow-y-auto">
            {filtered.map((l) => (
              <li key={l.code}>
                <button
                  type="button"
                  onClick={() => selectLanguage(l.code)}
                  className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-[color:var(--bg-soft-hover)]"
                  style={{ color: l.code === locale ? "var(--accent-b)" : "var(--text)" }}
                >
                  <span>{l.name}</span>
                  <span style={{ color: "var(--text-faint)" }}>{l.nativeName}</span>
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-4 py-3 text-sm" style={{ color: "var(--text-faint)" }}>
                No matches
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
