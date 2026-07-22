import type { SignupPlatform } from "@repo/db";
import { detectMobilePlatform } from "./detect-mobile-ua";

export type DeviceLabel = "web" | "iOS" | "Android";

// Classifies the current click's device into the same 3-way space as
// SignupPlatform, from the request's User-Agent.
export function detectDeviceLabel(userAgent: string): DeviceLabel {
  const platform = detectMobilePlatform(userAgent);
  return platform === "ios" ? "iOS" : platform === "android" ? "Android" : "web";
}

export function platformLabel(signupPlatform: SignupPlatform): DeviceLabel {
  return signupPlatform === "IOS" ? "iOS" : signupPlatform === "ANDROID" ? "Android" : "web";
}
