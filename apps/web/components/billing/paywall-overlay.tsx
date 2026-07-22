import type { SignupPlatform } from "@repo/db";

export function PaywallOverlay({ signupPlatform }: { signupPlatform: SignupPlatform }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4">
      <div className="animate-fade-scale-in w-full max-w-sm rounded-lg border border-white/15 p-6 text-center">
        <h1 className="text-lg font-semibold">Your free trial has ended</h1>

        {signupPlatform === "WEB" ? (
          <form action="/api/billing/checkout" method="POST" className="mt-5 flex flex-col gap-4 text-left">
            <p className="text-sm text-white/60">
              Subscribe to keep using the app. Cancel anytime — auto-renews until you do.
            </p>

            <fieldset className="flex flex-col gap-2">
              <label className="flex items-center justify-between gap-3 rounded border border-white/15 px-3 py-2">
                <span className="flex items-center gap-2 text-sm">
                  <input type="radio" name="plan" value="MONTHLY" defaultChecked />
                  Monthly
                </span>
                <span className="text-sm text-white/60">$9.99/mo</span>
              </label>
              <label className="flex items-center justify-between gap-3 rounded border border-white/15 px-3 py-2">
                <span className="flex items-center gap-2 text-sm">
                  <input type="radio" name="plan" value="ANNUAL" />
                  Annual
                </span>
                <span className="text-sm text-white/60">$99.99/yr</span>
              </label>
            </fieldset>

            <button type="submit" className="gradient-button px-4 py-2">
              Subscribe
            </button>
          </form>
        ) : (
          <div className="mt-5 flex flex-col gap-4 text-left">
            <p className="text-sm text-white/60">
              This account subscribes through the mobile app. Open it on your phone to continue.
            </p>
            <a
              href={
                signupPlatform === "IOS"
                  ? process.env.NEXT_PUBLIC_APP_STORE_URL
                  : process.env.NEXT_PUBLIC_PLAY_STORE_URL
              }
              className="button-outline px-4 py-2 text-center"
            >
              Open the app on your phone to subscribe
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
