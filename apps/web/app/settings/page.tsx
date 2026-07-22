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
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-16">
      <h1 className="text-xl font-semibold">Settings</h1>
      <p className="text-sm text-white/60">
        Signing out here only ends this device&apos;s session. Any other
        devices you&apos;re signed in on stay signed in.
      </p>
      <button onClick={handleSignOut} className="gradient-button px-3 py-2">
        Sign out
      </button>

      {signupPlatform === "WEB" && (
        <form action="/api/billing/portal" method="POST">
          <button type="submit" className="button-outline w-full px-3 py-2">
            Manage Subscription
          </button>
        </form>
      )}

      {isMobileSignup && (
        <a
          href={signupPlatform === "IOS" ? process.env.NEXT_PUBLIC_APP_STORE_URL : process.env.NEXT_PUBLIC_PLAY_STORE_URL}
          className="button-outline px-3 py-2 text-center"
        >
          Open the app on your phone to manage your subscription
        </a>
      )}

      <div className="flex flex-col gap-2 border-t border-white/15 pt-6">
        <button
          type="button"
          onClick={() => setPendingAction("cancel")}
          className="button-outline px-3 py-2"
        >
          Cancel Subscription
        </button>
        <button
          type="button"
          onClick={() => setPendingAction("delete")}
          className="rounded border border-red-400/40 px-3 py-2 text-sm text-red-400 transition-transform hover:scale-[1.02] hover:bg-red-400/10"
        >
          Delete Account
        </button>
      </div>

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
