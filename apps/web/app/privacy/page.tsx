import { PolicyPage, Section } from "../policy-page";

export default function PrivacyPolicyPage() {
  return (
    <PolicyPage title="Privacy Policy" effectiveDate="July 26, 2026">
      <p>
        This Privacy Policy explains what personal data Ingredas (&quot;we,&quot;
        &quot;us&quot;) collects, how we use it, and the choices you have, when you use the
        ingredas.com website or the Ingredas mobile applications (together, the
        &quot;Service&quot;).
      </p>

      <Section heading="1. Information We Collect">
        <p>We collect the following categories of information:</p>
        <ul className="ml-5 list-disc">
          <li>
            <span style={{ color: "var(--text)" }}>Account information</span> — your email
            address and authentication data, handled by our authentication provider, Clerk.
          </li>
          <li>
            <span style={{ color: "var(--text)" }}>Recipe data</span> — the ingredients,
            questionnaire answers, or photos you submit, and the recipes, ingredient
            substitutions, and health flags generated for you.
          </li>
          <li>
            <span style={{ color: "var(--text)" }}>Health-adjacent preferences</span> — dietary
            restrictions, allergies, or health goals you choose to enter through the
            questionnaire or custom recipe forms.
          </li>
          <li>
            <span style={{ color: "var(--text)" }}>Billing information</span> — your
            subscription plan and payment status. If you subscribe on the web, payment card
            details are collected and processed directly by Dodo Payments; we do not receive or
            store your full card number. If you subscribe through the iOS or Android app,
            payment is processed entirely by Apple or Google.
          </li>
          <li>
            <span style={{ color: "var(--text)" }}>Preferences</span> — your selected language
            and light/dark theme, stored locally on your device.
          </li>
          <li>
            <span style={{ color: "var(--text)" }}>Usage and device data</span> — standard
            technical data such as IP address, browser or device type, and basic diagnostic
            information collected automatically by our hosting and infrastructure providers.
          </li>
        </ul>
      </Section>

      <Section heading="2. How We Use Information">
        <ul className="ml-5 list-disc">
          <li>To create and secure your account, and to authenticate you when you sign in;</li>
          <li>
            To generate recipes, analyze photos of ingredients, and produce health-aware
            substitutions;
          </li>
          <li>To process your subscription, trial, and any refund you request;</li>
          <li>
            To send you transactional email — such as a recipe you asked us to email, or a
            notice about your trial or subscription;
          </li>
          <li>To detect and prevent fraud and automated abuse of the sign-up flow; and</li>
          <li>To comply with legal obligations and enforce our Terms of Service.</li>
        </ul>
        <p>
          We do not sell your personal data, and we do not use your recipe or photo submissions
          to train third-party AI models beyond what is necessary to generate your result in the
          moment.
        </p>
      </Section>

      <Section heading="3. Third-Party Service Providers">
        <p>
          We share the minimum data necessary with the following processors to operate the
          Service:
        </p>
        <ul className="ml-5 list-disc">
          <li>
            <span style={{ color: "var(--text)" }}>Clerk</span> — authentication and account
            management.
          </li>
          <li>
            <span style={{ color: "var(--text)" }}>OpenAI</span> — generates recipes and
            analyzes uploaded photos of ingredients.
          </li>
          <li>
            <span style={{ color: "var(--text)" }}>Dodo Payments</span> — processes web
            subscription payments.
          </li>
          <li>
            <span style={{ color: "var(--text)" }}>RevenueCat, Apple, and Google</span> — process
            mobile app subscription payments.
          </li>
          <li>
            <span style={{ color: "var(--text)" }}>Resend</span> — delivers transactional email,
            including recipes you choose to email and account notices.
          </li>
          <li>
            <span style={{ color: "var(--text)" }}>Cloudflare Turnstile</span> — verifies that
            sign-ups are made by humans, not bots.
          </li>
          <li>
            <span style={{ color: "var(--text)" }}>Vercel</span> — hosts the website and backend.
          </li>
        </ul>
        <p>
          Each of these providers processes data under their own privacy policy and only for the
          purpose of providing their service to us.
        </p>
      </Section>

      <Section heading="4. Data Retention and Deletion">
        <p>
          We retain your account and recipe data for as long as your account is active. You can
          permanently delete your account and all associated data at any time from Settings.
          Deletion removes your recipe history and profile from our database and deletes your
          Clerk identity; it cannot be undone. If you delete a single recipe from your history, it
          is held for five minutes with an &quot;Undo&quot; option before it is permanently
          removed.
        </p>
      </Section>

      <Section heading="5. Your Rights">
        <p>
          Depending on where you live, you may have rights to access, correct, export, or delete
          your personal data, and to object to or restrict certain processing. You can exercise
          most of these rights directly from Settings, or by contacting us at{" "}
          <a href="mailto:privacy@ingredas.com" style={{ color: "var(--text)" }}>
            privacy@ingredas.com
          </a>
          .
        </p>
      </Section>

      <Section heading="6. Children's Privacy">
        <p>
          Ingredas is not directed at children and is not intended for use by anyone under 16.
          We do not knowingly collect personal data from children. If you believe a child has
          provided us with personal data, contact us and we will delete it.
        </p>
      </Section>

      <Section heading="7. International Data Transfers">
        <p>
          Our service providers may process and store data in countries other than your own,
          including the United States. Where required, we rely on appropriate safeguards, such as
          standard contractual clauses, for these transfers.
        </p>
      </Section>

      <Section heading="8. Security">
        <p>
          We rely on industry-standard security practices from our infrastructure and processor
          partners to protect your data. No method of transmission or storage is completely
          secure, and we cannot guarantee absolute security.
        </p>
      </Section>

      <Section heading="9. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. If we make material changes, we
          will update the effective date above and, where appropriate, notify you.
        </p>
      </Section>

      <Section heading="10. Contact">
        <p>
          Questions about this Privacy Policy or your data can be sent to{" "}
          <a href="mailto:privacy@ingredas.com" style={{ color: "var(--text)" }}>
            privacy@ingredas.com
          </a>
          .
        </p>
      </Section>
    </PolicyPage>
  );
}
