"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSignUp } from "@clerk/nextjs";
import Turnstile from "react-turnstile";
import { CONSENTS, type ConsentKey } from "../consents";
import { clerkErrorCode, clerkErrorMessage } from "../clerk-error";
import { useTheme } from "@/app/theme-context";
import { GoogleIcon, AppleIcon } from "../oauth-icons";

type Step = "details" | "turnstile" | "otp";

function isPasswordValid(value: string): boolean {
  return (
    value.length >= 8 &&
    /[A-Z]/.test(value) &&
    /[0-9]/.test(value) &&
    /[^A-Za-z0-9]/.test(value)
  );
}

export default function SignUpPage() {
  const { signUp } = useSignUp();
  const router = useRouter();
  const { theme } = useTheme();

  const [step, setStep] = useState<Step>("details");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
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
  const passwordValid = isPasswordValid(password);

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

  function handleDetailsSubmit(e: FormEvent) {
    e.preventDefault();
    if (!allAccepted || !passwordValid) return;
    setError(null);
    setStep("turnstile");
  }

  async function handleTurnstileSuccess(token: string) {
    if (!signUp) return;
    setError(null);
    setSubmitting(true);

    const verifyRes = await fetch("/api/verify-turnstile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    if (!verifyRes.ok) {
      setSubmitting(false);
      setError("Bot verification failed. Please try again.");
      setStep("details");
      return;
    }

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
      setStep("details");
      return;
    }

    const { error: codeErr } = await signUp.verifications.sendEmailCode();
    setSubmitting(false);

    if (codeErr) {
      setError(clerkErrorMessage(codeErr));
      setStep("details");
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

    if (verifyErr) {
      setSubmitting(false);
      setError(clerkErrorMessage(verifyErr));
      return;
    }

    const { error: finalizeErr } = await signUp.finalize({
      navigate: async ({ decorateUrl }) => {
        router.push(decorateUrl("/dashboard"));
      },
    });

    setSubmitting(false);

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
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-4 px-4 py-16">
      <h1 className="text-[1.25rem] font-bold tracking-[-0.01em]">Create your account</h1>

      <div className="card flex flex-col gap-6 p-6">
      {error && <p className="error-box">{error}</p>}

      {step === "details" && (
        <form onSubmit={handleDetailsSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onFocus={() => setPasswordTouched(true)}
            onChange={(e) => {
              setPasswordTouched(true);
              setPassword(e.target.value);
            }}
            className="input-field"
          />

          {passwordTouched && (
            <div className={`password-hint ${passwordValid ? "password-hint-valid" : "password-hint-invalid"}`}>
              {passwordValid ? (
                <p className="password-hint-label">✓ Looks good.</p>
              ) : (
                <>
                  <p className="password-hint-label">Password must include:</p>
                  <ul className="password-hint-list">
                    <li>At least 8 characters</li>
                    <li>1 capital letter</li>
                    <li>1 number</li>
                    <li>1 symbol (e.g. !, @, #)</li>
                  </ul>
                </>
              )}
            </div>
          )}

          <fieldset className="flex flex-col gap-2">
            {CONSENTS.map((c) => (
              <label key={c.key} className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
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
            disabled={!allAccepted || !passwordValid}
            className="gradient-button w-full px-3 py-2"
          >
            Sign up
          </button>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled={!allAccepted}
              onClick={() => handleOAuth("oauth_google")}
              className="button-outline flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <GoogleIcon /> Continue with Google
            </button>
            <button
              type="button"
              disabled={!allAccepted}
              onClick={() => handleOAuth("oauth_apple")}
              className="button-outline flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <AppleIcon /> Continue with Apple
            </button>
          </div>

          <p className="text-center text-sm text-[color:var(--text-muted)]">
            Already have an account?{" "}
            <Link href="/sign-in" className="font-medium" style={{ color: "var(--text)" }}>
              Sign in
            </Link>
          </p>
        </form>
      )}

      {step === "turnstile" && (
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-[color:var(--text-muted)]">
            One quick check before we email you a verification code.
          </p>
          {submitting ? (
            <p className="text-sm text-[color:var(--text-muted)]">Creating your account...</p>
          ) : (
            <Turnstile
              sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
              theme={theme}
              onSuccess={handleTurnstileSuccess}
              onError={() => setError("Bot verification failed. Please try again.")}
            />
          )}
        </div>
      )}

      {step === "otp" && (
        <form onSubmit={handleOtpSubmit} className="flex flex-col gap-4">
          <p className="text-sm text-[color:var(--text-muted)]">
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
            className="input-field tracking-widest"
          />
          <button
            type="submit"
            disabled={submitting}
            className="gradient-button w-full px-3 py-2"
          >
            Verify
          </button>
        </form>
      )}
      </div>
    </div>
  );
}
