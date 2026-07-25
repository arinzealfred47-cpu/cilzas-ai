"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import type { SignupPlatform } from "@repo/db";
import { ConfirmModal } from "@/components/confirm-modal";

const APPLE_REFUND_URL = "https://reportaproblem.apple.com";
const GOOGLE_REFUND_URL = "https://play.google.com/store/account/orderhistory";

type PendingAction = "cancel" | "delete" | null;

export default function SettingsPage() {
  const { sessionId, signOut } = useAuth();
  const router = useRouter();
  const [signupPlatform, setSignupPlatform] = useState<SignupPlatform | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/billing/status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setSignupPlatform(data?.signupPlatform ?? null))
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
      const res = await fetch(
        pendingAction === "delete" ? "/api/account/delete" : "/api/account/cancel-subscription",
        { method: "POST" },
      );
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

  const wipeoutWarning = isMobileSignup
    ? `This permanently deletes your account and all of its data — this can't be undone. We can't process an automated refund for a subscription purchased through the app; to request one, visit ${refundUrl}.`
    : "This permanently deletes your account and all of its data — this can't be undone. If your most recent payment was within the last 28 days, it will be automatically refunded.";

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-10 sm:py-16">
      <h1 className="text-[1.25rem] font-bold tracking-[-0.01em]">Settings</h1>

      <section className="card flex flex-col gap-4 p-5">
        <p className="section-label">Account</p>
        <p className="text-[0.8125rem]" style={{ color: "var(--text-muted)" }}>
          Signing out here only ends this device&apos;s session. Any other
          devices you&apos;re signed in on stay signed in.
        </p>
        <button onClick={handleSignOut} className="gradient-button px-4 py-2.5">
          Sign out
        </button>
      </section>

      {signupPlatform === "WEB" && (
        <section className="card flex flex-col gap-3 p-5">
          <p className="section-label">Subscription</p>
          <form action="/api/billing/portal" method="POST">
            <button type="submit" className="button-soft w-full px-3 py-2.5">
              Manage Subscription
            </button>
          </form>
        </section>
      )}

      {isMobileSignup && (
        <section className="card flex flex-col gap-3 p-5">
          <p className="section-label">Subscription</p>
          <a
            href={signupPlatform === "IOS" ? process.env.NEXT_PUBLIC_APP_STORE_URL : process.env.NEXT_PUBLIC_PLAY_STORE_URL}
            className="button-soft px-3 py-2.5 text-center"
          >
            Open the app on your phone to manage your subscription
          </a>
        </section>
      )}

      <section className="card flex flex-col gap-2 p-5">
        <p className="section-label" style={{ color: "var(--danger)" }}>
          Danger Zone
        </p>
        <button
          type="button"
          onClick={() => setPendingAction("cancel")}
          className="button-soft px-3 py-2.5"
        >
          Cancel Subscription
        </button>
        <button
          type="button"
          onClick={() => setPendingAction("delete")}
          className="chip chip-danger justify-center px-3 py-2.5 text-sm"
        >
          Delete Account
        </button>
      </section>

      <ConfirmModal
        open={pendingAction !== null}
        title={pendingAction === "delete" ? "Delete your account?" : "Cancel your subscription?"}
        message={wipeoutWarning}
        confirmLabel={pendingAction === "delete" ? "Delete Account" : "Cancel Subscription"}
        confirming={submitting}
        onCancel={() => setPendingAction(null)}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}
