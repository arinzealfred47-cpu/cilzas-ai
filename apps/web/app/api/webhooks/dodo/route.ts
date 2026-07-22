import type { NextRequest } from "next/server";
import type DodoPayments from "dodopayments";
import { prisma } from "@repo/db";
import { getDodo, planForProductId } from "@/lib/dodo";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headers = Object.fromEntries(req.headers.entries());

  let event: DodoPayments.UnwrapWebhookEvent;
  try {
    event = getDodo().webhooks.unwrap(body, { headers });
  } catch {
    return new Response("Webhook verification failed", { status: 400 });
  }

  try {
    if (event.type === "subscription.active" || event.type === "subscription.renewed") {
      const subscription = event.data;
      const clerkUserId = subscription.metadata?.["clerkUserId"];
      if (typeof clerkUserId === "string") {
        await prisma.profile.update({
          where: { clerkUserId },
          data: {
            subscriptionStatus: "ACTIVE",
            subscriptionPlan: planForProductId(subscription.product_id) ?? undefined,
            subscriptionCurrentPeriodEnd: new Date(subscription.next_billing_date),
            dodoCustomerId: subscription.customer.customer_id,
            dodoSubscriptionId: subscription.subscription_id,
          },
        });
      }
    } else if (event.type === "subscription.cancelled" || event.type === "subscription.expired") {
      const subscription = event.data;
      const clerkUserId = subscription.metadata?.["clerkUserId"];
      if (typeof clerkUserId === "string") {
        await prisma.profile.update({
          where: { clerkUserId },
          data: {
            subscriptionStatus: event.type === "subscription.expired" ? "EXPIRED" : "CANCELED",
          },
        });
      }
    } else if (event.type === "payment.succeeded") {
      const payment = event.data;
      const clerkUserId = payment.metadata?.["clerkUserId"];
      if (typeof clerkUserId === "string") {
        await prisma.profile.update({
          where: { clerkUserId },
          data: {
            lastPaymentId: payment.payment_id,
            lastPaymentAt: new Date(payment.created_at),
          },
        });
      }
    }
  } catch (err) {
    // Unrecognized/duplicate events or a profile row that no longer exists
    // shouldn't fail delivery — log and acknowledge so Dodo doesn't retry
    // forever on something we can't act on.
    console.error("Dodo webhook processing failed:", err);
  }

  return new Response("OK", { status: 200 });
}
