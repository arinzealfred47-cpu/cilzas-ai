import { useEffect, useState } from 'react';
import { Image, LayoutAnimation, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '@clerk/expo';
import {
  formatDualMeasurement,
  annotateMeasurementsInText,
  formatRecipeName,
  formatRecipeAsText,
} from '@repo/recipes';
import { ConfirmModal } from '@/components/confirm-modal';
import { EmailModal } from './email-modal';
import { Fonts, GradientColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? 'http://localhost:3000';

// Recipe History defaults to a short preview; a freshly generated recipe
// (collapsible=false) always renders in full — matches the web app and the
// mockup exactly, independent per-card expand state.
const PREVIEW_INGREDIENTS = 3;
const PREVIEW_STEPS = 2;

export type SavedRecipe = {
  id: string;
  mode: string;
  title: string;
  servings: number;
  ingredients: { name: string; quantity: number; unit: string }[];
  steps: string[];
  createdAt: string;
  healthFlags?: { ingredientName: string; vectors: string[] }[];
  basedOnRecipeId?: string | null;
  imageDataUrl?: string | null;
};

function HealthifyButton({
  recipeId,
  onHealthified,
}: {
  recipeId: string;
  onHealthified: (recipe: SavedRecipe) => void;
}) {
  const { getToken } = useAuth();
  const theme = useTheme();
  const styles = getStyles(theme);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(withTiming(1.05, { duration: 700 }), -1, true);
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  async function handlePress() {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(`${WEB_URL}/api/recipes/${recipeId}/healthify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.');
        return;
      }
      onHealthified(data.recipe);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ marginTop: 8 }}>
      <Animated.View style={loading ? undefined : animatedStyle}>
        <Pressable onPress={handlePress} disabled={loading}>
          <LinearGradient
            colors={GradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.healthifyButton, loading && styles.healthifyButtonDisabled]}
          >
            <Text style={styles.healthifyButtonText}>
              {loading ? 'Generating healthy version...' : 'Generate Healthy Version'}
            </Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

export function RecipeCard({
  recipe,
  onHealthified,
  onRequestDelete,
  collapsible = false,
}: {
  recipe: SavedRecipe;
  onHealthified?: (recipe: SavedRecipe) => void;
  onRequestDelete?: (recipeId: string) => void;
  collapsible?: boolean;
}) {
  const { getToken } = useAuth();
  const theme = useTheme();
  const styles = getStyles(theme);
  const [copied, setCopied] = useState(false);
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const flaggedNames = new Set(
    (recipe.healthFlags ?? []).map((f) => f.ingredientName),
  );
  const hasFlags = flaggedNames.size > 0;
  const displayName = formatRecipeName(recipe.title, recipe.mode);

  const isExpanded = !collapsible || expanded;
  const visibleIngredients = isExpanded
    ? recipe.ingredients
    : recipe.ingredients.slice(0, PREVIEW_INGREDIENTS);
  const visibleSteps = isExpanded
    ? recipe.steps
    : recipe.steps.slice(0, PREVIEW_STEPS);
  const hasMore =
    recipe.ingredients.length > PREVIEW_INGREDIENTS ||
    recipe.steps.length > PREVIEW_STEPS;

  function toggleExpanded() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((e) => !e);
  }

  async function handleCopy() {
    await Clipboard.setStringAsync(formatRecipeAsText(recipe));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSendEmail(recipientEmail: string) {
    setEmailModalVisible(false);
    try {
      const token = await getToken();
      const res = await fetch(`${WEB_URL}/api/recipes/${recipe.id}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ recipientEmail }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? 'Could not send the email.');
      }
    } catch {
      setError('Network error. Please try again.');
    }
  }

  function handleConfirmDelete() {
    setDeleteModalVisible(false);
    onRequestDelete?.(recipe.id);
  }

  return (
    <View style={styles.card}>
      {recipe.imageDataUrl && (
        <Image source={{ uri: recipe.imageDataUrl }} style={styles.dishImage} />
      )}

      <View style={styles.header}>
        <Text style={styles.title}>{displayName}</Text>
        <Text style={styles.servings}>Serves {recipe.servings}</Text>
      </View>

      <Text style={styles.sectionLabel}>Ingredients</Text>
      {visibleIngredients.map((ing, i) => (
        <Text key={i} style={styles.line}>
          • {formatDualMeasurement(ing.quantity, ing.unit)} {ing.name}
          {flaggedNames.has(ing.name) ? ' ⚠' : ''}
        </Text>
      ))}

      <Text style={styles.sectionLabel}>Directions</Text>
      {visibleSteps.map((step, i) => (
        <Text key={i} style={styles.line}>
          {i + 1}. {annotateMeasurementsInText(step)}
        </Text>
      ))}

      {collapsible && hasMore && (
        <Pressable onPress={toggleExpanded} style={styles.showMoreButton}>
          <Text style={styles.showMoreText}>{isExpanded ? 'Show Less' : 'Show More'}</Text>
        </Pressable>
      )}

      <View style={styles.actionsRow}>
        <Pressable
          style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
          onPress={handleCopy}
        >
          <Text style={styles.actionButtonText}>📋 {copied ? 'Copied!' : 'Copy'}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
          onPress={() => setEmailModalVisible(true)}
        >
          <Text style={styles.actionButtonText}>✉️ Email</Text>
        </Pressable>
        {onRequestDelete && (
          <Pressable
            style={({ pressed }) => [styles.actionButton, styles.deleteButton, pressed && styles.pressed]}
            onPress={() => setDeleteModalVisible(true)}
          >
            <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
          </Pressable>
        )}
      </View>

      {hasFlags && onHealthified && (
        <HealthifyButton recipeId={recipe.id} onHealthified={onHealthified} />
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <EmailModal
        visible={emailModalVisible}
        onCancel={() => setEmailModalVisible(false)}
        onSend={handleSendEmail}
      />

      <ConfirmModal
        visible={deleteModalVisible}
        title="Delete this recipe?"
        message={`"${displayName}" will be moved out for 5 minutes so you can undo, then permanently removed.`}
        confirmLabel="Delete"
        confirming={false}
        onCancel={() => setDeleteModalVisible(false)}
        onConfirm={handleConfirmDelete}
      />
    </View>
  );
}

function getStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    card: {
      borderRadius: 22,
      backgroundColor: theme.bgElevated,
      padding: 14,
      gap: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.18,
      shadowRadius: 24,
      elevation: 5,
    },
    dishImage: { width: '100%', aspectRatio: 1, borderRadius: 14, marginBottom: 6 },
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    title: { fontFamily: Fonts.semiBold, fontSize: 16, color: theme.text, flexShrink: 1 },
    servings: { fontFamily: Fonts.sans, fontSize: 12, color: theme.textFaint },
    sectionLabel: {
      fontFamily: Fonts.semiBold,
      fontSize: 11,
      textTransform: 'uppercase',
      color: theme.textFaint,
      marginTop: 8,
    },
    line: { fontFamily: Fonts.sans, fontSize: 13, color: theme.text, marginTop: 2 },
    showMoreButton: {
      alignSelf: 'flex-start',
      marginTop: 8,
      backgroundColor: theme.bgSoft,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 5,
    },
    showMoreText: { fontFamily: Fonts.sans, fontSize: 12, color: theme.textMuted },
    actionsRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    actionButton: {
      backgroundColor: theme.bgSoft,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
    actionButtonText: { fontFamily: Fonts.sans, fontSize: 12, color: theme.text },
    deleteButton: { backgroundColor: theme.dangerBg },
    deleteButtonText: { fontFamily: Fonts.sans, fontSize: 12, color: theme.danger },
    healthifyButton: {
      borderRadius: 999,
      paddingVertical: 10,
      alignItems: 'center',
    },
    healthifyButtonDisabled: { opacity: 0.6 },
    healthifyButtonText: { fontFamily: Fonts.bold, color: '#0C2119', fontSize: 13 },
    error: { fontFamily: Fonts.sans, fontSize: 12, color: theme.danger, marginTop: 6 },
  });
}
