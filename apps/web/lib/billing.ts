import { prisma, type SignupPlatform, type SubscriptionPlan } from "@repo/db";

const TRIAL_DAYS = 3;

export type BillingState = "trial" | "active" | "locked";

export type BillingSummary = {
  state: BillingState;
  trialEndsAt: Date;
  signupPlatform: SignupPlatform;
  subscriptionPlan: SubscriptionPlan | null;
};

function computeBillingState(
  profile: {
    trialStartDate: Date;
    subscriptionStatus: "NONE" | "ACTIVE" | "CANCELED" | "EXPIRED";
    subscriptionCurrentPeriodEnd: Date | null;
  },
  now: Date,
): { state: BillingState; trialEndsAt: Date } {
  const trialEndsAt = new Date(
    profile.trialStartDate.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000,
  );

  const hasPaidAccess =
    profile.subscriptionStatus === "ACTIVE" ||
    (profile.subscriptionStatus === "CANCELED" &&
      profile.subscriptionCurrentPeriodEnd !== null &&
      profile.subscriptionCurrentPeriodEnd > now);

  if (hasPaidAccess) return { state: "active", trialEndsAt };
  if (now < trialEndsAt) return { state: "trial", trialEndsAt };
  return { state: "locked", trialEndsAt };
}

export async function getBillingStateForUser(
  clerkUserId: string,
): Promise<BillingSummary | null> {
  const profile = await prisma.profile.findUnique({ where: { clerkUserId } });
  if (!profile) return null;

  const { state, trialEndsAt } = computeBillingState(profile, new Date());

  return {
    state,
    trialEndsAt,
    signupPlatform: profile.signupPlatform,
    subscriptionPlan: profile.subscriptionPlan,
  };
}
