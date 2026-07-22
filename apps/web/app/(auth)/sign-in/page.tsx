"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSignIn } from "@clerk/nextjs";
import { clerkErrorCode, clerkErrorMessage } from "../clerk-error";

export default function SignInPage() {
  const { signIn } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!signIn) return;

    setError(null);
    setSubmitting(true);

    const { error: passwordErr } = await signIn.password({
      identifier: email,
      password,
    });

    if (passwordErr) {
      setSubmitting(false);
      if (clerkErrorCode(passwordErr) === "form_identifier_not_found") {
        router.replace("/sign-up?notice=need_signup");
        return;
      }
      setError(clerkErrorMessage(passwordErr));
      return;
    }

    const { error: finalizeErr } = await signIn.finalize({
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
    if (!signIn) return;
    setError(null);

    const { error: err } = await signIn.sso({
      strategy,
      redirectUrl: `${window.location.origin}/sso-callback`,
      redirectCallbackUrl: `${window.location.origin}/sso-callback`,
    });

    if (err) {
      setError(clerkErrorMessage(err));
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-16">
      <h1 className="text-xl font-semibold">Sign in</h1>

      {error && <p className="error-box">{error}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
        <button
          type="submit"
          disabled={submitting}
          className="gradient-button px-3 py-2"
        >
          Sign in
        </button>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => handleOAuth("oauth_google")}
            className="button-outline"
          >
            Continue with Google
          </button>
          <button
            type="button"
            onClick={() => handleOAuth("oauth_apple")}
            className="button-outline"
          >
            Continue with Apple
          </button>
        </div>

        <p className="text-sm text-white/60">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="text-white underline hover:text-white/70">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}
