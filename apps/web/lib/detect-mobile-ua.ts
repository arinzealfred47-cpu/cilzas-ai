export function detectMobilePlatform(userAgent: string): "ios" | "android" | null {
  if (/iphone|ipad|ipod/i.test(userAgent)) return "ios";
  if (/android/i.test(userAgent)) return "android";
  return null;
}
