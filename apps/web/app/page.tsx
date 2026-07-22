import { LanguageProvider } from "./language-context";
import { LandingContent } from "./landing-content";

export default function LandingPage() {
  return (
    <LanguageProvider>
      <LandingContent />
    </LanguageProvider>
  );
}
