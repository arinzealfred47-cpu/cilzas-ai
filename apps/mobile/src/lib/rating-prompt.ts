import * as SecureStore from 'expo-secure-store';

const RATING_PROMPT_SHOWN_KEY = 'rating_prompt_shown';
const GENERATION_THRESHOLD = 5;

export async function hasShownRatingPrompt(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(RATING_PROMPT_SHOWN_KEY);
  return value === 'true';
}

export async function markRatingPromptShown(): Promise<void> {
  await SecureStore.setItemAsync(RATING_PROMPT_SHOWN_KEY, 'true');
}

// Only the three actual generation methods count — a healthified rewrite of
// an existing recipe isn't a new generation.
export function countsAsGeneration(mode: string): boolean {
  return mode === 'custom' || mode === 'questionnaire' || mode === 'image';
}

export function shouldTriggerRatingPrompt(recipeModes: string[]): boolean {
  return recipeModes.filter(countsAsGeneration).length === GENERATION_THRESHOLD;
}
