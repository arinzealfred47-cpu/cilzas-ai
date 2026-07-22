import DodoPayments from "dodopayments";

declare global {
  var __dodo: DodoPayments | undefined;
}

// Lazy on purpose: like Resend's client, DodoPayments's constructor throws
// synchronously if the API key is missing/empty. A top-level singleton
// would crash this module at import time whenever DODO_PAYMENTS_API_KEY
// isn't configured yet — taking down every route that imports it, including
// ones that should just 401 before ever needing to call Dodo.
export function getDodo(): DodoPayments {
  if (!global.__dodo) {
    global.__dodo = new DodoPayments({
      bearerToken: process.env.DODO_PAYMENTS_API_KEY,
      environment:
        (process.env.DODO_PAYMENTS_ENVIRONMENT as "test_mode" | "live_mode" | undefined) ??
        "test_mode",
    });
  }
  return global.__dodo;
}

export function productIdForPlan(plan: "MONTHLY" | "ANNUAL"): string | undefined {
  return plan === "MONTHLY"
    ? process.env.DODO_PRODUCT_ID_MONTHLY
    : process.env.DODO_PRODUCT_ID_ANNUAL;
}

export function planForProductId(productId: string): "MONTHLY" | "ANNUAL" | null {
  if (productId === process.env.DODO_PRODUCT_ID_MONTHLY) return "MONTHLY";
  if (productId === process.env.DODO_PRODUCT_ID_ANNUAL) return "ANNUAL";
  return null;
}
