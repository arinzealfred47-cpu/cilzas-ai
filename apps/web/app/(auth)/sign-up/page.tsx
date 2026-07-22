"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSignUp } from "@clerk/nextjs";
import Turnstile from "react-turnstile";
import { CONSENTS, type ConsentKey } from "../consents";
import { clerkErrorCode, clerkErrorMessage } from "../clerk-error";

type Step = "details" | "otp" | "turnstile";

export default function SignUpPage() {
  const { signUp } = useSignUp();
  const router = useRouter();

  const [step, setStep] = useState<Step>("details");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [accepted, setAccepted] = useState<Record<ConsentKey, boolean>>({
    legal: false,
    refund: false,
    terms: false,
    privacy: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const allAccepted = CONSENTS.every((c) => accepted[c.key]);

  function consentTimestamps() {
    const now = new Date().toISOString();
    return {
      acceptedLegalAt: now,
      acceptedRefundAt: now,
      acceptedTermsAt: now,
      acceptedPrivacyAt: now,
      signupPlatform: "WEB" as const,
    };
  }

  async function handleDetailsSubmit(e: FormEvent) {
    e.preventDefault();
    if (!signUp || !allAccepted) return;

    setError(null);
    setSubmitting(true);

    const { error: createErr } = await signUp.password({
      emailAddress: email,
      password,
      legalAccepted: true,
      unsafeMetadata: consentTimestamps(),
    });

    if (createErr) {
      setSubmitting(false);
      if (clerkErrorCode(createErr) === "form_identifier_exists") {
        router.replace("/sign-in?notice=account_exists");
        return;
      }
      setError(clerkErrorMessage(createErr));
      return;
    }

    const { error: codeErr } = await signUp.verifications.sendEmailCode();
    setSubmitting(false);

    if (codeErr) {
      setError(clerkErrorMessage(codeErr));
      return;
    }

    setStep("otp");
  }

  async function handleOtpSubmit(e: FormEvent) {
    e.preventDefault();
    if (!signUp) return;

    setError(null);
    setSubmitting(true);

    const { error: verifyErr } = await signUp.verifications.verifyEmailCode({
      code,
    });

    setSubmitting(false);

    if (verifyErr) {
      setError(clerkErrorMessage(verifyErr));
      return;
    }

    setStep("turnstile");
  }

  async function handleTurnstileSuccess(token: string) {
    if (!signUp) return;
    setError(null);

    const verifyRes = await fetch("/api/verify-turnstile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    if (!verifyRes.ok) {
      setError("Bot verification failed. Please try again.");
      return;
    }

    const { error: finalizeErr } = await signUp.finalize({
      navigate: async ({ decorateUrl }) => {
        router.push(decorateUrl("/dashboard"));
      },
    });

    if (finalizeErr) {
      setError(clerkErrorMessage(finalizeErr));
    }
  }

  async function handleOAuth(strategy: "oauth_google" | "oauth_apple") {
    if (!signUp || !allAccepted) return;
    setError(null);

    const { error: err } = await signUp.sso({
      strategy,
      redirectUrl: `${window.location.origin}/sso-callback`,
      redirectCallbackUrl: `${window.location.origin}/sso-callback`,
      legalAccepted: true,
      unsafeMetadata: consentTimestamps(),
    });

    if (err) {
      setError(clerkErrorMessage(err));
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-16">
      <h1 className="text-xl font-semibold">Create your account</h1>

      {error && <p className="error-box">{error}</p>}

      {step === "details" && (
        <form onSubmit={handleDetailsSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-dark"
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-dark"
          />

          <fieldset className="flex flex-col gap-2">
            {CONSENTS.map((c) => (
              <label key={c.key} className="flex items-center gap-2 text-sm text-white/80">
                <input
                  type="checkbox"
                  checked={accepted[c.key]}
                  onChange={(e) =>
                    setAccepted((prev) => ({
                      ...prev,
                      [c.key]: e.target.checked,
                    }))
                  }
                />
                I agree to the {c.label}
              </label>
            ))}
          </fieldset>

          {/* Clerk's own bot-protection (Attack Protection > Bot sign-up protection)
              looks for this element in custom flows; without it, sign-up creation
              is rejected. This is separate from the Turnstile step below. */}
          <div id="clerk-captcha" />

          <button
            type="submit"
            disabled={!allAccepted || submitting}
            className="gradient-button px-3 py-2"
          >
            Sign up
          </button>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled={!allAccepted}
              onClick={() => handleOAuth("oauth_google")}
              className="button-outline disabled:opacity-40"
            >
              Continue with Google
            </button>
            <button
              type="button"
              disabled={!allAccepted}
              onClick={() => handleOAuth("oauth_apple")}
              className="button-outline disabled:opacity-40"
            >
              Continue with Apple
            </button>
          </div>

          <p className="text-sm text-white/60">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-white underline hover:text-white/70">
              Sign in
            </Link>
          </p>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={handleOtpSubmit} className="flex flex-col gap-4">
          <p className="text-sm text-white/60">
            Enter the 6-digit code we emailed to {email}.
          </p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            required
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="input-dark tracking-widest"
          />
          <button
            type="submit"
            disabled={submitting}
            className="gradient-button px-3 py-2"
          >
            Verify
          </button>
        </form>
      )}

      {step === "turnstile" && (
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-white/60">
            One last check before we finish creating your account.
          </p>
          <Turnstile
            sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
            theme="dark"
            onSuccess={handleTurnstileSuccess}
            onError={() => setError("Bot verification failed. Please try again.")}
          />
        </div>
      )}
    </div>
  );
}
