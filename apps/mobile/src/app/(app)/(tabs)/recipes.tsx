import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/expo';
import * as StoreReview from 'expo-store-review';
import type { CustomModeInput, QuestionnaireModeInput } from '@repo/recipes';

import { Colors, Fonts } from '@/constants/theme';
import { CustomForm } from '@/components/recipes/custom-form';
import { QuestionnaireWizard } from '@/components/recipes/questionnaire-wizard';
import { PhotoPicker } from '@/components/recipes/photo-picker';
import { RecipeCard, type SavedRecipe } from '@/components/recipes/recipe-card';
import { RatingPromptModal } from '@/components/rating-prompt-modal';
import { hasShownRatingPrompt, markRatingPromptShown, shouldTriggerRatingPrompt } from '@/lib/rating-prompt';

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? 'http://localhost:3000';

type Mode = 'custom' | 'questionnaire' | 'photo';

export default function RecipesScreen() {
  const { getToken } = useAuth();
  const [mode, setMode] = useState<Mode>('custom');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SavedRecipe | null>(null);
  const [history, setHistory] = useState<SavedRecipe[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [showRatingPrompt, setShowRatingPrompt] = useState(false);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${WEB_URL}/api/recipes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setHistory(data.recipes);
    } finally {
      setHistoryLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (!shouldTriggerRatingPrompt(history.map((r) => r.mode))) return;
    let cancelled = false;
    hasShownRatingPrompt().then((shown) => {
      if (!shown && !cancelled) setShowRatingPrompt(true);
    });
    return () => {
      cancelled = true;
    };
  }, [history]);

  async function handleRate(stars: number) {
    setShowRatingPrompt(false);
    await markRatingPromptShown();
    // The star count collected here is for our own UI only — neither Apple
    // nor Google exposes what rating a user actually gives inside their
    // native prompt, so any tap simply requests that system prompt. It
    // decides on its own whether to show anything (rate-limited by the OS).
    void stars;
    const available = await StoreReview.isAvailableAsync();
    if (available) {
      await StoreReview.requestReview();
    }
  }

  async function handleDismissRatingPrompt() {
    setShowRatingPrompt(false);
    await markRatingPromptShown();
  }

  async function handleSubmit(input: CustomModeInput | QuestionnaireModeInput) {
    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const token = await getToken();
      const res = await fetch(`${WEB_URL}/api/recipes/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(input),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.');
        return;
      }

      setResult(data.recipe);
      loadHistory();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handlePhotoSuccess(recipe: SavedRecipe) {
    setResult(recipe);
    setError(null);
    loadHistory();
  }

  function handlePhotoError(message: string) {
    setError(message || null);
  }

  function handleHealthified(recipe: SavedRecipe) {
    setResult(recipe);
    loadHistory();
  }

  function handleDeleted(recipeId: string) {
    setHistory((prev) => prev.filter((r) => r.id !== recipeId));
    setResult((prev) => (prev?.id === recipeId ? null : prev));
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Recipe Generator</Text>

        <View style={styles.modeRow}>
          <Pressable
            style={({ pressed }) => [styles.modeButton, mode === 'custom' && styles.modeButtonActive, pressed && styles.pressed]}
            onPress={() => setMode('custom')}
          >
            <Text style={mode === 'custom' ? styles.modeTextActive : styles.modeText}>Custom</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.modeButton,
              mode === 'questionnaire' && styles.modeButtonActive,
              pressed && styles.pressed,
            ]}
            onPress={() => setMode('questionnaire')}
          >
            <Text style={mode === 'questionnaire' ? styles.modeTextActive : styles.modeText}>
              Recommend for me
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.modeButton, mode === 'photo' && styles.modeButtonActive, pressed && styles.pressed]}
            onPress={() => setMode('photo')}
          >
            <Text style={mode === 'photo' ? styles.modeTextActive : styles.modeText}>From Photo</Text>
          </Pressable>
        </View>

        {mode === 'custom' && <CustomForm onSubmit={handleSubmit} submitting={submitting} />}
        {mode === 'questionnaire' && (
          <QuestionnaireWizard onSubmit={handleSubmit} submitting={submitting} />
        )}
        {mode === 'photo' && (
          <PhotoPicker onSuccess={handlePhotoSuccess} onError={handlePhotoError} />
        )}

        {submitting && <Text style={styles.info}>Generating your recipe...</Text>}
        {error && <Text style={styles.error}>{error}</Text>}

        {result && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Just generated</Text>
            <RecipeCard
              recipe={result}
              onHealthified={handleHealthified}
              onDeleted={handleDeleted}
            />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Recipe History</Text>
          {historyLoading && <Text style={styles.info}>Loading...</Text>}
          {!historyLoading && history.length === 0 && (
            <Text style={styles.info}>No recipes generated yet.</Text>
          )}
          <View style={{ gap: 12 }}>
            {history.map((r) => (
              <RecipeCard
                key={r.id}
                recipe={r}
                onHealthified={handleHealthified}
                onDeleted={handleDeleted}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      <RatingPromptModal
        visible={showRatingPrompt}
        onRate={handleRate}
        onDismiss={handleDismissRatingPrompt}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.dark.background },
  scroll: { padding: 16, gap: 16 },
  title: { fontFamily: Fonts.semiBold, fontSize: 20, color: Colors.dark.text },
  modeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  modeButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modeButtonActive: { backgroundColor: '#00FF87', borderColor: '#00FF87' },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  modeText: { fontFamily: Fonts.sans, fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  modeTextActive: { fontFamily: Fonts.semiBold, fontSize: 13, color: '#000' },
  info: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.dark.textSecondary },
  error: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: '#f87171',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 8,
    borderRadius: 6,
  },
  section: { gap: 8 },
  sectionLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    textTransform: 'uppercase',
    color: Colors.dark.textSecondary,
  },
});
