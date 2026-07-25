import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/expo';
import * as StoreReview from 'expo-store-review';
import type { CustomModeInput, QuestionnaireModeInput } from '@repo/recipes';

import { Fonts, GradientColors } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/use-theme';
import { CustomForm } from '@/components/recipes/custom-form';
import { QuestionnaireWizard } from '@/components/recipes/questionnaire-wizard';
import { PhotoPicker } from '@/components/recipes/photo-picker';
import { RecipeCard, type SavedRecipe } from '@/components/recipes/recipe-card';
import { DeletionBanner } from '@/components/recipes/deletion-banner';
import { RatingPromptModal } from '@/components/rating-prompt-modal';
import { hasShownRatingPrompt, markRatingPromptShown, shouldTriggerRatingPrompt } from '@/lib/rating-prompt';

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? 'http://localhost:3000';
const DELETION_UNDO_MS = 5 * 60 * 1000;

type Mode = 'custom' | 'questionnaire' | 'photo';
type PendingDeletion = { title: string; expiresAt: number };

export default function RecipesScreen() {
  const { getToken } = useAuth();
  const theme = useTheme();
  const styles = getStyles(theme);
  const [mode, setMode] = useState<Mode>('custom');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SavedRecipe | null>(null);
  const [history, setHistory] = useState<SavedRecipe[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [showRatingPrompt, setShowRatingPrompt] = useState(false);
  const [pendingDeletions, setPendingDeletions] = useState<Record<string, PendingDeletion>>({});
  const timeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

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

  // Deletion is deferred: confirming starts a 5-minute undo window and only
  // performs the real DELETE call once the timer fires. Undo just clears
  // the timer — no network request is made in that case.
  function handleRequestDelete(recipeId: string) {
    const recipe = history.find((r) => r.id === recipeId) ?? (result?.id === recipeId ? result : null);
    if (!recipe) return;

    const expiresAt = Date.now() + DELETION_UNDO_MS;
    setPendingDeletions((prev) => ({ ...prev, [recipeId]: { title: recipe.title, expiresAt } }));

    timeoutsRef.current[recipeId] = setTimeout(() => {
      finalizeDeletion(recipeId);
    }, DELETION_UNDO_MS);
  }

  async function finalizeDeletion(recipeId: string) {
    delete timeoutsRef.current[recipeId];
    try {
      const token = await getToken();
      await fetch(`${WEB_URL}/api/recipes/${recipeId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } finally {
      setHistory((prev) => prev.filter((r) => r.id !== recipeId));
      setResult((prev) => (prev?.id === recipeId ? null : prev));
      setPendingDeletions((prev) => {
        const next = { ...prev };
        delete next[recipeId];
        return next;
      });
    }
  }

  function handleUndoDelete(recipeId: string) {
    const timeout = timeoutsRef.current[recipeId];
    if (timeout) {
      clearTimeout(timeout);
      delete timeoutsRef.current[recipeId];
    }
    setPendingDeletions((prev) => {
      const next = { ...prev };
      delete next[recipeId];
      return next;
    });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Recipe Generator</Text>

        <View style={styles.modeRow}>
          {(
            [
              { key: 'custom' as const, label: 'Custom' },
              { key: 'questionnaire' as const, label: 'Recommend for me' },
              { key: 'photo' as const, label: 'From Photo' },
            ]
          ).map((m) => {
            const active = mode === m.key;
            return (
              <Pressable
                key={m.key}
                onPress={() => setMode(m.key)}
                style={({ pressed }) => [pressed && styles.pressed]}
              >
                {active ? (
                  <LinearGradient
                    colors={GradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.modeButton}
                  >
                    <Text style={styles.modeTextActive}>{m.label}</Text>
                  </LinearGradient>
                ) : (
                  <View style={[styles.modeButton, styles.modeButtonInactive]}>
                    <Text style={styles.modeText}>{m.label}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
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

        {result && !pendingDeletions[result.id] && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Just generated</Text>
            <RecipeCard
              recipe={result}
              onHealthified={handleHealthified}
              onRequestDelete={handleRequestDelete}
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
            {history.map((r) => {
              const pending = pendingDeletions[r.id];
              if (pending) {
                return (
                  <DeletionBanner
                    key={r.id}
                    title={pending.title}
                    expiresAt={pending.expiresAt}
                    onUndo={() => handleUndoDelete(r.id)}
                  />
                );
              }
              return (
                <RecipeCard
                  key={r.id}
                  recipe={r}
                  onHealthified={handleHealthified}
                  onRequestDelete={handleRequestDelete}
                  collapsible
                />
              );
            })}
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

function getStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.bg },
    scroll: { padding: 16, gap: 16 },
    title: { fontFamily: Fonts.semiBold, fontSize: 20, color: theme.text },
    modeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    modeButton: {
      borderRadius: 999,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    modeButtonInactive: { backgroundColor: theme.bgSoft },
    pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
    modeText: { fontFamily: Fonts.sans, fontSize: 13, color: theme.textMuted },
    modeTextActive: { fontFamily: Fonts.semiBold, fontSize: 13, color: '#0C2119' },
    info: { fontFamily: Fonts.sans, fontSize: 13, color: theme.textMuted },
    error: {
      fontFamily: Fonts.sans,
      fontSize: 13,
      color: theme.danger,
      backgroundColor: theme.dangerBg,
      padding: 8,
      borderRadius: 14,
    },
    section: { gap: 8 },
    sectionLabel: {
      fontFamily: Fonts.semiBold,
      fontSize: 12,
      textTransform: 'uppercase',
      color: theme.textFaint,
    },
  });
}
