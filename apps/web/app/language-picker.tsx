"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LANGUAGES, findLanguage } from "@repo/i18n";
import { useLanguage } from "./language-context";

export function LanguagePicker() {
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
        className="flex w-full items-center justify-between rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm text-white"
      >
        <span>
          {current?.name ?? "English"}{" "}
          <span className="text-white/50">({current?.nativeName})</span>
        </span>
        <span className="text-white/50">▾</span>
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-lg border border-white/15 bg-black shadow-xl">
          <input
            autoFocus
            type="text"
            placeholder={t.languageSearchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full border-b border-white/15 bg-transparent px-4 py-2 text-sm text-white outline-none placeholder:text-white/40"
          />
          <ul className="max-h-64 overflow-y-auto">
            {filtered.map((l) => (
              <li key={l.code}>
                <button
                  type="button"
                  onClick={() => selectLanguage(l.code)}
                  className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-white/10 ${
                    l.code === locale ? "text-[#60EFFF]" : "text-white"
                  }`}
                >
                  <span>{l.name}</span>
                  <span className="text-white/40">{l.nativeName}</span>
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-4 py-3 text-sm text-white/40">No matches</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
