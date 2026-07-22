import type { NextRequest } from "next/server";
import { detectDeviceLabel } from "@/lib/detect-device-label";

// Public, unauthenticated smart link: sends whoever clicks it to the right
// place for their current device — the App Store on iOS, the Play Store on
// Android, or the web landing page everywhere else (desktop, or a mobile
// device we can't map to a store). Used by the "Sign Up" button in emailed
// recipes, since the email's own device may differ from the recipient's.
export async function GET(req: NextRequest) {
  const userAgent = req.headers.get("user-agent") ?? "";
  const device = detectDeviceLabel(userAgent);

  const destination =
    device === "iOS"
      ? process.env.NEXT_PUBLIC_APP_STORE_URL
      : device === "Android"
        ? process.env.NEXT_PUBLIC_PLAY_STORE_URL
        : null;

  return Response.redirect(new URL(destination || "/", req.url), 307);
}
