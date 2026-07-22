export { LANGUAGES, DEFAULT_LANGUAGE_CODE, findLanguage } from "./languages";
export type { Language } from "./languages";
export type { TranslationKeys } from "./types";
export { TRANSLATIONS } from "./translations";

import { DEFAULT_LANGUAGE_CODE, findLanguage } from "./languages";
import { TRANSLATIONS } from "./translations";
import type { TranslationKeys } from "./types";

// Falls back to English for any language code without a translation entry.
export function getTranslation(code: string): TranslationKeys {
  return TRANSLATIONS[code] ?? TRANSLATIONS[DEFAULT_LANGUAGE_CODE];
}

export function isRtl(code: string): boolean {
  return findLanguage(code)?.rtl === true;
}
