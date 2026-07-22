"use client";

import Link from "next/link";
import { useLanguage } from "./language-context";
import { LanguagePicker } from "./language-picker";
import { ReviewsSection } from "./reviews";

const GRADIENT = "linear-gradient(135deg, #00FF87 0%, #60EFFF 100%)";

export function LandingContent() {
  const { t, rtl } = useLanguage();

  return (
    <div
      dir={rtl ? "rtl" : "ltr"}
      className="flex min-h-screen flex-col items-center gap-16 bg-black px-4 py-16 text-white"
    >
      <div className="flex w-full max-w-4xl justify-end">
        <LanguagePicker />
      </div>

      <div className="flex max-w-xl flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          {t.heroTitle}
        </h1>
        <p className="text-base text-white/60">{t.heroSubtitle}</p>

        <div className="mt-4 flex flex-col items-center gap-2">
          <Link
            href="/sign-up"
            className="rounded-full px-8 py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.02]"
            style={{ backgroundImage: GRADIENT }}
          >
            {t.ctaButton}
          </Link>
          <p className="text-xs text-white/50">{t.ctaHelper}</p>
        </div>

        <p className="text-sm text-white/60">
          {t.loginPrompt}{" "}
          <Link href="/sign-in" className="text-white underline">
            {t.loginLink}
          </Link>
        </p>
      </div>

      <ReviewsSection title={t.reviewsTitle} />

      <footer className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/40">
        <Link href="/legal" className="hover:text-white">
          {t.legalPolicy}
        </Link>
        <Link href="/refund-policy" className="hover:text-white">
          {t.refundPolicy}
        </Link>
        <Link href="/terms" className="hover:text-white">
          {t.termsOfService}
        </Link>
        <Link href="/privacy" className="hover:text-white">
          {t.privacyPolicy}
        </Link>
      </footer>
    </div>
  );
}
