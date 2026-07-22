import { Resend } from "resend";

declare global {
  var __resend: Resend | undefined;
}

// Lazy on purpose: unlike DodoPayments, the Resend constructor throws
// synchronously if the API key is missing/empty. A top-level singleton would
// crash this module at import time whenever RESEND_API_KEY isn't configured
// yet — taking down every route that imports it, including ones that should
// just 401 before ever needing to send an email.
export function getResend(): Resend {
  if (!global.__resend) {
    global.__resend = new Resend(process.env.RESEND_API_KEY);
  }
  return global.__resend;
}
