import type { NextRequest } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { prisma } from "@repo/db";

function readTimestamp(
  metadata: Record<string, unknown>,
  key: string,
): Date | null {
  const value = metadata[key];
  return typeof value === "string" ? new Date(value) : null;
}

// Defaults to "WEB" on anything missing/malformed. This is the fail-safe
// direction: a mis-tagged mobile signup only ever sees the static
// "manage on the website" notice in-app (never a live purchase flow),
// whereas the reverse default risks silently blocking a legitimate web
// Dodo checkout.
function readSignupPlatform(
  metadata: Record<string, unknown>,
): "WEB" | "IOS" | "ANDROID" {
  const value = metadata["signupPlatform"];
  return value === "IOS" || value === "ANDROID" ? value : "WEB";
}

export async function POST(req: NextRequest) {
  let evt;

  try {
    evt = await verifyWebhook(req);
  } catch {
    return new Response("Webhook verification failed", { status: 400 });
  }

  if (evt.type === "user.created") {
    const { id, email_addresses, unsafe_metadata } = evt.data;
    const primaryEmail = email_addresses?.[0]?.email_address ?? "";
    const metadata = (unsafe_metadata ?? {}) as Record<string, unknown>;

    await prisma.profile.upsert({
      where: { clerkUserId: id },
      create: {
        clerkUserId: id,
        email: primaryEmail,
        trialStartDate: new Date(),
        signupPlatform: readSignupPlatform(metadata),
        acceptedLegalAt: readTimestamp(metadata, "acceptedLegalAt"),
        acceptedRefundAt: readTimestamp(metadata, "acceptedRefundAt"),
        acceptedTermsAt: readTimestamp(metadata, "acceptedTermsAt"),
        acceptedPrivacyAt: readTimestamp(metadata, "acceptedPrivacyAt"),
      },
      update: {},
    });
  }

  return new Response("OK", { status: 200 });
}
