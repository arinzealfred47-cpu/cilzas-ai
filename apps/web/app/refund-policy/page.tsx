import { PolicyPage, Section } from "../policy-page";

export default function RefundPolicyPage() {
  return (
    <PolicyPage title="Refund Policy" effectiveDate="July 26, 2026">
      <p>
        This policy explains how free trials, cancellations, and refunds work for Ingredas
        subscriptions, and what happens to your account when you request one.
      </p>

      <Section heading="1. Free Trial">
        <p>
          Every new account starts with a 3-day free trial. You will not be charged during the
          trial. If you cancel before the trial ends, you will not be charged at all. If you do
          nothing, your subscription begins automatically at the end of the trial at the price
          shown at sign-up ($9.99/month or $99.99/year).
        </p>
      </Section>

      <Section heading="2. Important: cancelling or requesting a refund deletes your account">
        <p>
          Unlike many subscription services, Ingredas does not offer a &quot;cancel but keep my
          account&quot; option. Choosing <strong>Cancel Subscription</strong>,{" "}
          <strong>Delete Account</strong>, or <strong>Refund</strong> from Settings all trigger
          the same outcome: your subscription is cancelled, your recipe history and profile are
          permanently deleted, and your account is closed. This is irreversible. If you only want
          to stop future billing but are not sure you want to lose your data, export or note down
          anything you want to keep before proceeding.
        </p>
      </Section>

      <Section heading="3. Refunds for web subscriptions">
        <p>
          If you subscribed on ingredas.com, your payment is processed by Dodo Payments. When you
          request a refund from Settings:
        </p>
        <ul className="ml-5 list-disc">
          <li>
            If your most recent payment was made within the last 28 days, it is automatically
            refunded in full through Dodo Payments.
          </li>
          <li>
            If your most recent payment was made more than 28 days ago, it is not eligible for an
            automatic refund. Your account is still cancelled and deleted as described above.
          </li>
        </ul>
        <p>Refunds are issued to the original payment method and may take several business days to appear.</p>
      </Section>

      <Section heading="4. Refunds for iOS and Android subscriptions">
        <p>
          If you subscribed through the Ingredas app on iOS or Android, your payment was
          processed entirely by Apple or Google, and Ingredas cannot issue or view refunds for
          those purchases directly. Choosing <strong>Cancel Subscription</strong>,{" "}
          <strong>Delete Account</strong>, or <strong>Refund</strong> in the app will still
          cancel your subscription and permanently delete your Ingredas account and data — but to
          request money back, you need to contact the store you paid through:
        </p>
        <ul className="ml-5 list-disc">
          <li>
            iOS: submit a request at{" "}
            <a href="https://reportaproblem.apple.com" style={{ color: "var(--text)" }}>
              reportaproblem.apple.com
            </a>
            .
          </li>
          <li>
            Android: review your order history and request a refund at{" "}
            <a
              href="https://play.google.com/store/account/orderhistory"
              style={{ color: "var(--text)" }}
            >
              play.google.com/store/account/orderhistory
            </a>
            .
          </li>
        </ul>
        <p>Apple and Google decide these requests under their own refund policies, not ours.</p>
      </Section>

      <Section heading="5. How to cancel or request a refund">
        <p>
          Go to Settings in the app or on the web and choose the option that matches what you
          want: <strong>Cancel Subscription</strong> to stop billing, <strong>Refund</strong> to
          additionally request money back for a recent web payment, or{" "}
          <strong>Delete Account</strong> if you simply want everything gone. All three end with
          the same account closure described in Section 2.
        </p>
      </Section>

      <Section heading="6. Contact">
        <p>
          Questions about billing or this policy can be sent to{" "}
          <a href="mailto:support@ingredas.com" style={{ color: "var(--text)" }}>
            support@ingredas.com
          </a>
          .
        </p>
      </Section>
    </PolicyPage>
  );
}
