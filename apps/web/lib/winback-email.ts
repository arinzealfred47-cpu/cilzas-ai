// Email clients strip <style> blocks and JS unpredictably, so every rule
// here is inlined — this can't reuse the app's globals.css utility classes.
export function buildWinbackEmailHtml(checkoutUrl: string): string {
  return `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:#000000;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:480px;" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-bottom:24px;text-align:center;">
                <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">
                  Your trial has ended
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:32px;text-align:center;">
                <p style="margin:0;color:rgba(255,255,255,0.6);font-size:14px;line-height:1.5;">
                  Pick up right where you left off. Subscribe now to keep generating recipes.
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <a
                  href="${checkoutUrl}"
                  style="display:inline-block;padding:14px 32px;border-radius:999px;background-image:linear-gradient(135deg,#00FF87 0%,#60EFFF 100%);color:#000000;font-weight:700;font-size:14px;text-decoration:none;"
                >
                  Subscribe now
                </a>
              </td>
            </tr>
            <tr>
              <td style="text-align:center;">
                <p style="margin:0;color:rgba(255,255,255,0.4);font-size:12px;line-height:1.5;">
                  $9.99/mo or $99.99/yr, auto-renews until cancelled.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`.trim();
}
