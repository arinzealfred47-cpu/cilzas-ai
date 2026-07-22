import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@repo/db";
import { getDodo } from "@/lib/dodo";

const REFUND_WINDOW_DAYS = 28;

export type RefundOutcome = "approved" | "denied_window_expired" | "failed" | null;

// The "Total Wipeout Protocol": runs identically whether triggered by
// confirming Delete Account, confirming Cancel Subscription, or a refund
// being approved — per the product decision that all three permanently
// delete the account. Refund evaluation never blocks the wipeout: once the
// user has confirmed, deletion proceeds regardless of the refund outcome.
export async function runTotalWipeoutProtocol(
  clerkUserId: string,
  { attemptRefund }: { attemptRefund: boolean },
): Promise<{ refund: RefundOutcome }> {
  const profile = await prisma.profile.findUnique({ where: { clerkUserId } });
  if (!profile) {
    return { refund: null };
  }

  let refund: RefundOutcome = null;

  if (attemptRefund && profile.signupPlatform === "WEB" && profile.lastPaymentId && profile.lastPaymentAt) {
    const daysSincePayment = (Date.now() - profile.lastPaymentAt.getTime()) / (24 * 60 * 60 * 1000);
    if (daysSincePayment <= REFUND_WINDOW_DAYS) {
      try {
        await getDodo().refunds.create({ payment_id: profile.lastPaymentId });
        refund = "approved";
      } catch (err) {
        console.error("Dodo refund failed:", err);
        refund = "failed";
      }
    } else {
      refund = "denied_window_expired";
    }
  }

  if (profile.signupPlatform === "WEB" && profile.dodoSubscriptionId) {
    try {
      await getDodo().subscriptions.update(profile.dodoSubscriptionId, { status: "cancelled" });
    } catch (err) {
      console.error("Dodo subscription cancellation failed:", err);
    }
  }

  // DB first, Clerk last: if the DB step fails, nothing external has
  // happened yet and it's safe to retry. If Clerk deletion fails after the
  // DB step succeeds, the data is already correctly wiped — only a manual
  // Clerk-dashboard cleanup is needed, which beats an orphaned Profile row
  // the user could never log back in to retry.
  await prisma.$transaction([
    prisma.recipe.deleteMany({ where: { clerkUserId } }),
    prisma.profile.delete({ where: { clerkUserId } }),
  ]);

  const client = await clerkClient();
  await client.users.deleteUser(clerkUserId);

  return { refund };
}
