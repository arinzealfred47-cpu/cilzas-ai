"use client";

import { useEffect, useState } from "react";
import { detectMobilePlatform } from "@/lib/detect-mobile-ua";

const DISMISS_KEY = "installBannerDismissed";

export function InstallAppBanner() {
  const [platform, setPlatform] = useState<"ios" | "android" | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setPlatform(detectMobilePlatform(navigator.userAgent));
    setDismissed(localStorage.getItem(DISMISS_KEY) === "true");
  }, []);

  if (!platform || dismissed) return null;

  const storeUrl =
    platform === "ios" ? process.env.NEXT_PUBLIC_APP_STORE_URL : process.env.NEXT_PUBLIC_PLAY_STORE_URL;

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "true");
    setDismissed(true);
  }

  return (
    <div
      className="animate-fade-scale-in fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t px-4 py-3"
      style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}
    >
      <p className="text-sm text-[color:var(--text)]">Get a better experience in our app.</p>
      <div className="flex items-center gap-3">
        <a href={storeUrl} target="_blank" rel="noopener noreferrer" className="gradient-button px-3 py-1.5 text-sm">
          Install App
        </a>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="text-lg leading-none text-[color:var(--text-faint)] hover:text-[color:var(--text)]"
        >
          ×
        </button>
      </div>
    </div>
  );
}
