import { auth } from "@clerk/nextjs/server";
import { getBillingStateForUser } from "@/lib/billing";
import { PaywallOverlay } from "@/components/billing/paywall-overlay";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  const billing = userId ? await getBillingStateForUser(userId) : null;

  if (billing?.state === "locked") {
    return <PaywallOverlay signupPlatform={billing.signupPlatform} />;
  }

  return <>{children}</>;
}
