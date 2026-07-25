"use client";

import Link from "next/link";
import { useLanguage } from "./language-context";
import { LanguagePicker } from "./language-picker";
import { ReviewsSection } from "./reviews";
import { ThemeToggle } from "@/components/theme-toggle";

export function LandingContent() {
  const { t, rtl } = useLanguage();

  return (
    <div
      dir={rtl ? "rtl" : "ltr"}
      className="relative flex min-h-screen flex-col items-center gap-16 overflow-hidden px-4 py-16"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      <div className="bg-blob bg-blob-a" style={{ top: "-6rem", left: "-6rem" }} />
      <div className="bg-blob bg-blob-b" style={{ bottom: "-4rem", right: "-4rem" }} />

      <div className="relative z-10 flex w-full max-w-4xl items-center justify-between">
        <span className="flex items-center gap-2 text-[1.0625rem] font-semibold">
          <span aria-hidden>🍳</span> Ingredas
        </span>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <LanguagePicker />
        </div>
      </div>

      <div className="relative z-10 flex max-w-xl flex-col items-center gap-6 text-center">
        <h1
          className="animate-in-up text-[1.9rem] font-extrabold tracking-[-0.02em] sm:text-[2.5rem]"
        >
          {t.heroTitle}
        </h1>
        <p className="animate-in-up text-base" style={{ color: "var(--text-muted)" }}>
          {t.heroSubtitle}
        </p>

        <div className="mt-4 flex flex-col items-center gap-2">
          <Link href="/sign-up" className="gradient-button px-8 py-3 text-sm">
            {t.ctaButton}
          </Link>
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>
            {t.ctaHelper}
          </p>
        </div>

        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {t.loginPrompt}{" "}
          <Link href="/sign-in" className="font-medium" style={{ color: "var(--text)" }}>
            {t.loginLink}
          </Link>
        </p>
      </div>

      <div className="relative z-10 w-full">
        <ReviewsSection title={t.reviewsTitle} />
      </div>

      <footer
        className="relative z-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs"
        style={{ color: "var(--text-faint)" }}
      >
        <Link href="/legal">{t.legalPolicy}</Link>
        <Link href="/refund-policy">{t.refundPolicy}</Link>
        <Link href="/terms">{t.termsOfService}</Link>
        <Link href="/privacy">{t.privacyPolicy}</Link>
      </footer>
    </div>
  );
}
