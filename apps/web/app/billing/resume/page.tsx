import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@repo/db";
import { verifyWinbackToken } from "@/lib/winback-token";
import { detectDeviceLabel, platformLabel } from "@/lib/detect-device-label";

export default async function BillingResumePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const clerkUserId = token ? verifyWinbackToken(token) : null;

  if (!clerkUserId) {
    redirect("/");
  }

  const profile = await prisma.profile.findUnique({ where: { clerkUserId } });
  if (!profile) {
    redirect("/");
  }

  const requestHeaders = await headers();
  const currentDevice = detectDeviceLabel(requestHeaders.get("user-agent") ?? "");
  const requiredDevice = platformLabel(profile.signupPlatform);

  if (currentDevice !== requiredDevice) {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <p className="error-box">Please click the button on your {requiredDevice} device.</p>
      </div>
    );
  }

  redirect("/dashboard");
}
