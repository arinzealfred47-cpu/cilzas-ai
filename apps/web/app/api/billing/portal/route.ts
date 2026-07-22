import { auth } from "@clerk/nextjs/server";
import { prisma } from "@repo/db";
import { getDodo } from "@/lib/dodo";
import { corsJson, corsOptions } from "@/lib/cors";

export async function OPTIONS() {
  return corsOptions();
}

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return corsJson({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.profile.findUnique({ where: { clerkUserId: userId } });
  if (!profile) {
    return corsJson({ error: "Profile not found" }, { status: 404 });
  }

  if (profile.signupPlatform !== "WEB") {
    return corsJson({ error: "This account manages billing through its mobile app." }, { status: 403 });
  }

  if (!profile.dodoCustomerId) {
    return corsJson({ error: "No subscription to manage yet." }, { status: 400 });
  }

  const session = await getDodo().customers.customerPortal.create(profile.dodoCustomerId);

  if (!session.link) {
    return corsJson({ error: "Could not open the billing portal." }, { status: 502 });
  }

  return Response.redirect(session.link, 303);
}
