# clerk-boilerplate

Turborepo monorepo: Next.js web app + Expo mobile app, both wired to Clerk auth, sharing a Prisma/Postgres `packages/db` package.

## Structure

- `apps/web` — Next.js (App Router). Public landing page at `/`, custom sign-up/sign-in flows, Cloudflare Turnstile bot gate, `/api/webhooks/clerk`, authenticated app lives under `/dashboard`.
- `apps/mobile` — Expo (expo-router). Mirrors the same auth rules using `@clerk/expo`; onboarding screen is the default `(auth)` group screen.
- `packages/db` — Prisma schema + client (`Profile`, `Recipe` models), Postgres via a driver adapter (Prisma 7 requirement).
- `packages/i18n` — shared language list (ISO 639-1, ~184 languages) and translation dictionary, used by both apps' onboarding/landing screens.
- `packages/recipes` — shared Zod request/response schemas for the AI recipe generator, used by the web API route and both apps' UI.
- `docker-compose.yml` — local Postgres so `DATABASE_URL` works out of the box.

## One-time setup

1. **Clerk Dashboard** (clerk.com) — create an app, then enable:
   - Email address + Password authentication, with email verification code (OTP) as the strategy.
   - Google and Apple as social connections.
   - Multi-session handling (Sessions settings) — required for the per-device sign-out behavior.
   - A webhook endpoint pointing at `/api/webhooks/clerk` subscribed to `user.created`, once you have a public URL (see below) — copy its **Signing Secret**.
   - Copy the Publishable Key and Secret Key.

2. **Cloudflare Turnstile** (dash.cloudflare.com) — create a widget and copy the site/secret key. The repo ships with Cloudflare's public *always-pass* test keys by default so the flow works in local dev without a Cloudflare account; swap them before production.

3. **OpenAI** (platform.openai.com/api-keys) — create a key, put it in `OPENAI_API_KEY`. Powers `/dashboard/recipes`. `OPENAI_MODEL` defaults to `gpt-5.6` if unset.

4. Fill in real values in `apps/web/.env.local` and `apps/mobile/.env.local` (both gitignored — never commit real keys). `.env.example` files document what's required.

5. Start local Postgres and generate the Prisma client:

   ```sh
   docker compose up -d
   pnpm --filter @repo/db db:push
   ```

6. Install and run:

   ```sh
   pnpm install
   pnpm dev
   ```

   Web runs at `http://localhost:3000`. Mobile: `pnpm --filter mobile start` and open in Expo Go / a simulator.

## Notes

- **Clerk has its own built-in bot protection** (Attack Protection > Bot sign-up protection), enabled by default on new instances, separate from the Turnstile step below. The sign-up page renders a `<div id="clerk-captcha">` so Clerk's own check doesn't reject sign-ups outright — confirmed by testing against a live Clerk dev instance, where sign-up creation returned a 422 without it. If you want Turnstile to be the *only* visible bot gate, turn Clerk's own bot protection off in the Dashboard; otherwise both run.
- **Turnstile is web-only.** There's no native Cloudflare Turnstile widget, so the bot-check step only applies to the web sign-up flow; mobile sign-up skips it.
- **Per-device sign-out** uses Clerk's built-in multi-session support (`signOut({ sessionId })`) — the Settings/Sign Out button only ends the current device's session; other devices stay signed in.
- **Webhook testing locally** needs a public URL forwarded to `localhost:3000` (e.g. `ngrok http 3000` or the Clerk CLI), since Clerk's servers can't reach `localhost` directly. Point the Clerk Dashboard webhook endpoint at that tunnel URL.
- Consent to the four documents (Legal, Refund, Terms, Privacy) is captured as timestamps in the sign-up's `unsafeMetadata` and copied onto the `Profile` row by the webhook.
- The route file is `apps/web/proxy.ts`, not `middleware.ts` — Next.js 16 renamed the convention; `clerkMiddleware`'s export still works fine under the new name (confirmed live, the deprecation warning disappears after the rename).
- `auth.protect()` is called with an explicit `unauthenticatedUrl` pointing at `/sign-in`. Without it, Clerk redirects unauthenticated visitors to its own hosted account portal instead of this app's sign-in page — caught by testing against a live instance.
- Clerk's Future-API `{ error }` return is typed as a flat `ClerkError`, but at runtime, API validation failures (like "identifier not found") come back as a `ClerkAPIResponseError` with the actual field code nested in `errors[0].code` — `error.code` alone is just the generic `"api_response_error"` wrapper. Both apps go through `clerkErrorCode()`/`clerkErrorMessage()` helpers (`app/(auth)/clerk-error.ts`) to handle this correctly; this was a real bug caught by testing against a live Clerk instance, not something the type definitions would have warned about.
- **Translation coverage**: `packages/i18n` lists all ~184 ISO 639-1 languages in the searchable picker, but only ~28 major languages (covering the large majority of global speakers) have real translations — the rest cleanly fall back to English rather than shipping guessed/incorrect translations. Add a language by adding its code to `packages/i18n/src/translations.ts`.
- RTL languages (Arabic, Hebrew, Persian, etc.) flip the web page to `dir="rtl"` automatically. Mobile does not mirror layout direction for RTL languages (React Native's `I18nManager.forceRTL` requires an app reload to take effect, which is disruptive) — text still renders correctly, just not the flex layout direction.
- **Prisma 7's `prisma-client` (ESM, ships as raw `.ts` with `.js`-suffixed import specifiers) doesn't bundle under Turbopack** — every route importing `@repo/db` 500'd with "Module not found: Can't resolve '../generated/prisma/client.js'" the moment it was actually hit by a live request (the webhook route from the Clerk feature had this same bug the whole time — it just was never exercised live until the recipe feature's API routes were). `serverExternalPackages` did not fix it. The working fix: `generator client { provider = "prisma-client-js" }` in `packages/db/prisma/schema.prisma` (traditional compiled output to `node_modules/.prisma/client`, imported as plain `@prisma/client`) instead of the newer `prisma-client` ESM provider. Confirmed live: both `/api/recipes` and `/api/webhooks/clerk` return clean JSON instead of a 500 after the switch.
- **Recipe generation is auth-gated and server-only** — the OpenAI key never reaches the client. Mobile calls `/api/recipes/generate` and `/api/recipes` on the web app with `Authorization: Bearer <clerk session token>` (from `useAuth().getToken()`); those two routes carry permissive CORS headers and do their own 401 JSON check instead of `proxy.ts`'s redirect-based protection, since a redirect response would be wrong for a JSON API consumer.
- Every generated recipe is persisted to the `Recipe` table and shown in the "Recipe History" list on the same screen as the generator (web: `/dashboard/recipes`; mobile: the new "Recipes" tab).
- **"From Photo" mode** (`/api/recipe/analyze-image`, note the singular `recipe` — matches the literal path given in the spec) sends a photo to OpenAI's vision model and reverse-engineers a recipe from it. Accepts either a JSON body `{ image, mimeType }` (base64) or a raw binary body with `Content-Type: image/*`. Rejects anything over 8MB before calling OpenAI. Web: gallery upload + camera-capture file inputs. Mobile: `expo-image-picker`'s gallery/camera pickers with `base64: true`, so no separate file-read step. Same auth-gated, server-only, CORS-enabled pattern as the rest of `/api/recipes/*` — confirmed live that unauthenticated requests get a clean 401 JSON rather than a redirect or crash.
- **Ingredient health cross-examiner**: every recipe generation (all three modes) is scanned server-side, before the response is ever sent, against a static keyword list in `packages/recipes/src/health-profile.ts` for three vectors — sugar, processed oil, trans fat. This is a simple substring heuristic, not nutritional or medical advice (e.g. "vegetable oil" always flags regardless of actual refinement level) — intentionally simple so detection is free and instant, with the AI reserved for the actual reformulation step. Flagged recipes get an animated "Generate Healthy Version" button (pulsing, using the app's established green gradient) that calls `POST /api/recipes/{id}/healthify`, which asks the model to swap only the flagged ingredients while explicitly preserving flavor, texture, and sensory character. The healthy version is saved as its own `Recipe` row (`mode: "healthified"`, `basedOnRecipeId` pointing back to the original) and re-scanned itself, so a partially-fixed result would still show flags rather than being assumed clean.
- **Imperial/metric dual measurement display** (`packages/recipes/src/measurement-converter.ts`) — pure client-side, runs at render time in `RecipeCard` on both platforms, never touches stored data. Every ingredient line renders as `"[Imperial (Metric)]"` (e.g. `10 oz (284g)`), and cooking-direction text gets scanned (narrowly, for temperature and inch/cm utensil-size mentions only — not attempting to detect weight/volume in prose, since that's already covered by the structured ingredients list and far more prone to false matches) so e.g. "Preheat oven to 350°F" becomes "Preheat oven to 350°F (177°C)" inline. Rounding rule: values >= 1 round to the nearest integer on both sides; values strictly between 0 and 1 (e.g. 0.5 cup) are shown at full precision, unrounded. The conversion factors use standard rounded "kitchen chart" values (28.35 g/oz, 240 mL/cup, etc.), not scientifically precise ones (28.3495, 236.588) — confirmed necessary by reproducing the prompt's own worked example exactly: 10 oz needed to land on 284g, which only the rounded factor produces (the precise one gives 283g). Count-based units with no defined conversion (e.g. "whole", "clove") fall back to the plain value with no parenthetical.
- **Recipe History actions** (`packages/recipes/src/recipe-text.ts` + `recipe-card.tsx` on both platforms): every recipe displays as `"[Dish - Generation Method]"` (e.g. "Spaghetti Carbonara - Custom Ingredients"), computed at render time from the stored `title` + `mode` rather than baked into the DB row, so the underlying data stays clean. **Copy to Clipboard** and **Email Recipe** share one `formatRecipeAsText()` builder — same layout, same dual-measurement formatting — so what you copy and what you email are identical. **Email is a `mailto:` link, not a real transactional email service** — the prompt's "no external connections needed" constraint rules out an actual email API (which would need its own credentials), so it opens the user's own email client pre-filled with recipient/subject/body instead; worth knowing `mailto:` bodies have practical length limits in some clients. **Delete** shows a Cancel/Confirm modal (plain overlay on web, React Native's built-in `Modal` on mobile) before calling `DELETE /api/recipes/{id}`, which uses `deleteMany` scoped to `clerkUserId` (not `delete`) so a missing/not-owned id returns a clean 404 instead of Prisma throwing — confirmed live that an unauthenticated delete attempt returns 401 JSON, matching every other route.
