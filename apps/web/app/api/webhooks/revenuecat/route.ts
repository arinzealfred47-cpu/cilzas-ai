import type { NextRequest } from "next/server";
import { prisma } from "@repo/db";

type RevenueCatEventType =
  | "INITIAL_PURCHASE"
  | "RENEWAL"
  | "UNCANCELLATION"
  | "CANCELLATION"
  | "EXPIRATION"
  | string;

type RevenueCatEvent = {
  type: RevenueCatEventType;
  app_user_id: string;
  product_id?: string;
  expiration_at_ms?: number | null;
};

// Small lookup so the RevenueCat webhook (which reports store-specific
// product identifiers, distinct per platform) can be mapped back to our own
// MONTHLY/ANNUAL plan enum. Filled in once the real App Store Connect/Play
// Console product IDs exist.
function planForRevenueCatProductId(productId: string | undefined): "MONTHLY" | "ANNUAL" | null {
  if (!productId) return null;
  if (
    productId === process.env.REVENUECAT_PRODUCT_ID_MONTHLY_IOS ||
    productId === process.env.REVENUECAT_PRODUCT_ID_MONTHLY_ANDROID
  ) {
    return "MONTHLY";
  }
  if (
    productId === process.env.REVENUECAT_PRODUCT_ID_ANNUAL_IOS ||
    productId === process.env.REVENUECAT_PRODUCT_ID_ANNUAL_ANDROID
  ) {
    return "ANNUAL";
  }
  return null;
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expected = process.env.REVENUECAT_WEBHOOK_AUTH_TOKEN;
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const event: RevenueCatEvent | undefined = body?.event;
  if (!event?.app_user_id) {
    return new Response("OK", { status: 200 });
  }

  const clerkUserId = event.app_user_id;

  try {
    if (
      event.type === "INITIAL_PURCHASE" ||
      event.type === "RENEWAL" ||
      event.type === "UNCANCELLATION"
    ) {
      await prisma.profile.update({
        where: { clerkUserId },
        data: {
          subscriptionStatus: "ACTIVE",
          subscriptionPlan: planForRevenueCatProductId(event.product_id) ?? undefined,
          subscriptionCurrentPeriodEnd: event.expiration_at_ms
            ? new Date(event.expiration_at_ms)
            : undefined,
        },
      });
    } else if (event.type === "CANCELLATION") {
      await prisma.profile.update({
        where: { clerkUserId },
        data: { subscriptionStatus: "CANCELED" },
      });
    } else if (event.type === "EXPIRATION") {
      await prisma.profile.update({
        where: { clerkUserId },
        data: { subscriptionStatus: "EXPIRED" },
      });
    }
  } catch (err) {
    // Same idempotency reasoning as the Dodo webhook: don't fail delivery on
    // an event we can't act on (unknown user, duplicate delivery, etc.).
    console.error("RevenueCat webhook processing failed:", err);
  }

  return new Response("OK", { status: 200 });
}
