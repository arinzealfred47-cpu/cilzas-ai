import { PolicyPage, Section } from "../policy-page";

export default function LegalPolicyPage() {
  return (
    <PolicyPage title="Legal Policy" effectiveDate="July 26, 2026">
      <p>
        This Legal Policy sets out important disclaimers and notices about using Ingredas that
        sit alongside our{" "}
        <a href="/terms" style={{ color: "var(--text)" }}>
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="/privacy" style={{ color: "var(--text)" }}>
          Privacy Policy
        </a>
        .
      </p>

      <Section heading="1. Not Medical, Dietary, or Nutritional Advice">
        <p>
          Ingredas uses artificial intelligence to generate recipes and to flag ingredients that
          may not fit a stated health goal. This is provided for general informational and
          cooking purposes only and is not medical, dietary, nutritional, or allergy advice. AI
          output can be wrong or incomplete, including about which ingredients contain common
          allergens. Always read ingredient labels and use your own judgment before cooking or
          eating anything based on a recipe from the Service, and consult a qualified
          professional about any medical condition, allergy, or dietary restriction.
        </p>
      </Section>

      <Section heading="2. No Warranty on Generated Content">
        <p>
          Recipes, substitutions, ingredient quantities, and cooking instructions are generated
          automatically and are provided &quot;as is,&quot; without warranty of accuracy,
          safety, or fitness for any particular purpose. You are responsible for using safe food
          handling and cooking practices.
        </p>
      </Section>

      <Section heading="3. Photos You Upload">
        <p>
          When you use the &quot;From Photo&quot; feature, your photo is sent to our AI
          processor solely to identify ingredients and generate a recipe. Only upload photos you
          have the right to share, and avoid including other people&apos;s faces or personal
          information in the frame.
        </p>
      </Section>

      <Section heading="4. Third-Party Links and Services">
        <p>
          Ingredas integrates with third-party services, including Clerk, OpenAI, Dodo Payments,
          RevenueCat, Apple, Google, Resend, and Cloudflare. We are not responsible for the
          content, policies, or practices of these third parties, which are governed by their own
          terms.
        </p>
      </Section>

      <Section heading="5. Intellectual Property">
        <p>
          &quot;Ingredas&quot; and its logo are our trademarks. The software, design, and content
          of the Service (excluding Your Content, as defined in our Terms of Service, and
          recipes generated for you) are owned by Ingredas or our licensors and protected by
          copyright and other intellectual property laws.
        </p>
      </Section>

      <Section heading="6. Limitation of Liability">
        <p>
          To the fullest extent permitted by law, Ingredas disclaims liability for any harm
          arising from reliance on AI-generated recipes or health flags, including allergic
          reactions, foodborne illness, or dissatisfaction with a meal. See the Disclaimers and
          Limitation of Liability section of our Terms of Service for the full terms that apply.
        </p>
      </Section>

      <Section heading="7. Governing Law and Disputes">
        <p>
          This Legal Policy is governed by the same governing law set out in our Terms of
          Service. If any provision of this policy is found unenforceable, the remaining
          provisions remain in full effect.
        </p>
      </Section>

      <Section heading="8. Contact">
        <p>
          Legal notices and questions can be sent to{" "}
          <a href="mailto:legal@ingredas.com" style={{ color: "var(--text)" }}>
            legal@ingredas.com
          </a>
          .
        </p>
      </Section>
    </PolicyPage>
  );
}
