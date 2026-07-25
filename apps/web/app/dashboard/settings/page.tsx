"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import type { SignupPlatform, SubscriptionPlan } from "@repo/db";
import { ConfirmModal } from "@/components/confirm-modal";
import { LanguagePicker } from "@/app/language-picker";
import { ThemeToggle } from "@/components/theme-toggle";

const APPLE_REFUND_URL = "https://reportaproblem.apple.com";
const GOOGLE_REFUND_URL = "https://play.google.com/store/account/orderhistory";

const PLAN_FEATURES = [
  "Unlimited recipe generations",
  "Photo-to-recipe analysis",
  "Health-aware ingredient rewrites",
];

const PLAN_PRICE: Record<"MONTHLY" | "ANNUAL", { amount: string; suffix: string }> = {
  MONTHLY: { amount: "$9.99", suffix: "/month" },
  ANNUAL: { amount: "$99.99", suffix: "/year" },
};

type PendingAction = "cancel" | "delete" | "refund" | null;

export default function SettingsPage() {
  const { sessionId, signOut } = useAuth();
  const router = useRouter();
  const [signupPlatform, setSignupPlatform] = useState<SignupPlatform | null>(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/billing/status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setSignupPlatform(data?.signupPlatform ?? null);
        setSubscriptionPlan(data?.subscriptionPlan ?? null);
      })
      .catch(() => {});
  }, []);

  async function handleSignOut() {
    await signOut({ sessionId: sessionId ?? undefined });
    router.push("/sign-in");
  }

  async function handleConfirmAction() {
    if (!pendingAction) return;
    setSubmitting(true);
    try {
      // A refund and an outright deletion both run the identical wipeout
      // protocol server-side — refunding a web payment always cancels the
      // account, it just skips straight to that step from a different entry
      // point in the UI.
      const endpoint =
        pendingAction === "cancel" ? "/api/account/cancel-subscription" : "/api/account/delete";
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json().catch(() => ({ refund: null }));
      // Hard navigation, not router.push — the Clerk session this page was
      // rendered with no longer exists after the API call above.
      window.location.href = `/account-deleted?refund=${data.refund ?? ""}`;
    } catch {
      setSubmitting(false);
    }
  }

  const isMobileSignup = signupPlatform === "IOS" || signupPlatform === "ANDROID";
  const refundUrl = signupPlatform === "IOS" ? APPLE_REFUND_URL : GOOGLE_REFUND_URL;
  const price = PLAN_PRICE[subscriptionPlan === "ANNUAL" ? "ANNUAL" : "MONTHLY"];

  const modalCopy: Record<Exclude<PendingAction, null>, { title: string; message: string }> = {
    cancel: {
      title: "Cancel your subscription?",
      message: isMobileSignup
        ? `This permanently deletes your account and all of its data — this can't be undone. We can't process an automated refund for a subscription purchased through the app; to request one, visit ${refundUrl}.`
        : "This permanently deletes your account and all of its data — this can't be undone. If your most recent payment was within the last 28 days, it will be automatically refunded.",
    },
    delete: {
      title: "Delete your account?",
      message: isMobileSignup
        ? `This permanently deletes your account and all of its data — this can't be undone. We can't process an automated refund for a subscription purchased through the app; to request one, visit ${refundUrl}.`
        : "This permanently deletes your account and all of its data — this can't be undone. If your most recent payment was within the last 28 days, it will be automatically refunded.",
    },
    refund: {
      title: "Request a refund?",
      message: isMobileSignup
        ? `We can't process an automated refund for a subscription purchased through the app; you'll be sent to ${refundUrl} to request one.`
        : "If your most recent payment was within the last 28 days, it will be automatically refunded. This also permanently deletes your account and all of its data — this can't be undone.",
    },
  };

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-10 sm:py-16">
      <h1 className="text-[1.25rem] font-bold tracking-[-0.01em]">Settings</h1>

      <section className="card flex flex-col gap-4 p-5">
        <p className="section-label">Preferences</p>
        <LanguagePicker variant="settings" />
      </section>

      <section className="card flex flex-col gap-4 p-5">
        <p className="section-label">Appearance</p>
        <ThemeToggle />
      </section>

      <section className="card flex flex-col gap-3 p-5">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.04em]" style={{ color: "var(--text-faint)" }}>
          Subscription — ALL-ACCESS
        </p>
        <div className="flex flex-col items-center gap-2 rounded-[var(--radius-btn)] border-2 p-4" style={{ borderColor: "var(--accent-a)", background: "var(--bg-soft-hover)" }}>
          <div className="text-[1.9rem] font-bold">
            {price.amount}
            <span className="text-[0.8125rem] font-medium" style={{ color: "var(--text-muted)" }}>
              {price.suffix}
            </span>
          </div>
          <ul className="list-disc pl-5 text-[0.8125rem]" style={{ color: "var(--text-muted)" }}>
            {PLAN_FEATURES.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="card flex flex-col items-start gap-2 p-5">
        {signupPlatform === "WEB" && (
          <form action="/api/billing/portal" method="POST">
            <button type="submit" className="button-soft px-4 py-2 text-[0.8125rem] font-medium">
              Manage Subscription
            </button>
          </form>
        )}
        {isMobileSignup && (
          <a
            href={signupPlatform === "IOS" ? process.env.NEXT_PUBLIC_APP_STORE_URL : process.env.NEXT_PUBLIC_PLAY_STORE_URL}
            className="button-soft px-4 py-2 text-[0.8125rem] font-medium"
          >
            Manage Subscription
          </a>
        )}
        <button
          type="button"
          onClick={handleSignOut}
          className="button-soft px-4 py-2 text-[0.8125rem] font-medium"
        >
          Sign Out
        </button>
        <button
          type="button"
          onClick={() => setPendingAction("refund")}
          className="button-soft px-4 py-2 text-[0.8125rem] font-medium"
        >
          Refund
        </button>
        <button
          type="button"
          onClick={() => setPendingAction("cancel")}
          className="button-soft px-4 py-2 text-[0.8125rem] font-medium"
        >
          Cancel Subscription
        </button>
        <button
          type="button"
          onClick={() => setPendingAction("delete")}
          className="chip chip-danger px-4 py-2 text-[0.8125rem] font-semibold"
        >
          Delete Account
        </button>
      </section>

      <ConfirmModal
        open={pendingAction !== null}
        title={pendingAction ? modalCopy[pendingAction].title : ""}
        message={pendingAction ? modalCopy[pendingAction].message : ""}
        confirmLabel={
          pendingAction === "delete"
            ? "Delete Account"
            : pendingAction === "cancel"
              ? "Cancel Subscription"
              : "Request Refund"
        }
        confirming={submitting}
        onCancel={() => setPendingAction(null)}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}
