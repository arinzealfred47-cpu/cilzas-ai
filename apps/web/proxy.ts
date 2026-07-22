import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sso-callback(.*)",
  "/legal",
  "/refund-policy",
  "/terms",
  "/privacy",
  "/api/webhooks/clerk",
  "/api/webhooks/dodo",
  "/api/webhooks/revenuecat",
  "/api/verify-turnstile",
  // /api/recipes/* and /api/billing/* do their own auth check (returns 401
  // JSON, or a 303 redirect for checkout/portal) instead of the
  // redirect-to-sign-in behavior below, since they're called by the mobile
  // app too and an HTML redirect response would be wrong for a JSON API
  // consumer.
  "/api/recipes(.*)",
  "/api/recipe/analyze-image",
  "/api/billing(.*)",
  // The win-back cron authenticates itself via CRON_SECRET, not Clerk.
  "/api/cron/win-back-emails",
  // Identified via a signed token in the URL (see winback-token.ts), not a
  // Clerk session — the recipient may be opening this link on a device
  // they've never signed in on.
  "/billing/resume",
  // Does its own auth() check (needed for mobile's Bearer-token calls); by
  // the time it responds, the Clerk identity it just deleted no longer
  // exists to be "protected" anyway.
  "/api/account(.*)",
  // Reached only after account deletion — the session is already dead.
  "/account-deleted",
  // Smart App Store / Play Store / landing-page redirect for the "Sign Up"
  // button in emailed recipes — the recipient has no session at all.
  "/get-app",
]);

const isSignUpRoute = createRouteMatcher(["/sign-up(.*)"]);
const isSignInRoute = createRouteMatcher(["/sign-in(.*)"]);
const isLandingRoute = createRouteMatcher(["/"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  if (userId && isSignUpRoute(req)) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  if (userId && isSignInRoute(req)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (userId && isLandingRoute(req)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (!isPublicRoute(req)) {
    await auth.protect({ unauthenticatedUrl: new URL("/sign-in", req.url).toString() });
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
