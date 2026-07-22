import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
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
import { Colors, Fonts, GradientColors } from '@/constants/theme';

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? 'http://localhost:3000';

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
  onDeleted,
}: {
  recipe: SavedRecipe;
  onHealthified?: (recipe: SavedRecipe) => void;
  onDeleted?: (recipeId: string) => void;
}) {
  const { getToken } = useAuth();
  const [copied, setCopied] = useState(false);
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const flaggedNames = new Set(
    (recipe.healthFlags ?? []).map((f) => f.ingredientName),
  );
  const hasFlags = flaggedNames.size > 0;
  const displayName = formatRecipeName(recipe.title, recipe.mode);

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

  async function handleConfirmDelete() {
    setDeleting(true);
    try {
      const token = await getToken();
      const res = await fetch(`${WEB_URL}/api/recipes/${recipe.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        onDeleted?.(recipe.id);
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? 'Could not delete this recipe.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setDeleting(false);
      setDeleteModalVisible(false);
    }
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
      {recipe.ingredients.map((ing, i) => (
        <Text key={i} style={styles.line}>
          • {formatDualMeasurement(ing.quantity, ing.unit)} {ing.name}
          {flaggedNames.has(ing.name) ? ' ⚠' : ''}
        </Text>
      ))}

      <Text style={styles.sectionLabel}>Directions</Text>
      {recipe.steps.map((step, i) => (
        <Text key={i} style={styles.line}>
          {i + 1}. {annotateMeasurementsInText(step)}
        </Text>
      ))}

      <View style={styles.actionsRow}>
        <Pressable
          style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
          onPress={handleCopy}
        >
          <Text style={styles.actionButtonText}>{copied ? 'Copied!' : 'Copy'}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
          onPress={() => setEmailModalVisible(true)}
        >
          <Text style={styles.actionButtonText}>Email</Text>
        </Pressable>
        {onDeleted && (
          <Pressable
            style={({ pressed }) => [styles.actionButton, styles.deleteButton, pressed && styles.pressed]}
            onPress={() => setDeleteModalVisible(true)}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
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
        message={`"${displayName}" will be permanently removed from your Recipe History. This can't be undone.`}
        confirmLabel="Delete"
        confirming={deleting}
        onCancel={() => setDeleteModalVisible(false)}
        onConfirm={handleConfirmDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  dishImage: { width: '100%', aspectRatio: 1, borderRadius: 8, marginBottom: 6 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  title: { fontFamily: Fonts.semiBold, fontSize: 16, color: Colors.dark.text, flexShrink: 1 },
  servings: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.dark.textSecondary },
  sectionLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 11,
    textTransform: 'uppercase',
    color: Colors.dark.textSecondary,
    marginTop: 8,
  },
  line: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.dark.text, marginTop: 2 },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  actionButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  actionButtonText: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.dark.text },
  deleteButton: { borderColor: 'rgba(248, 113, 113, 0.4)' },
  deleteButtonText: { fontFamily: Fonts.sans, fontSize: 12, color: '#f87171' },
  healthifyButton: {
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
  },
  healthifyButtonDisabled: { opacity: 0.6 },
  healthifyButtonText: { fontFamily: Fonts.bold, color: '#000', fontSize: 13 },
  error: { fontFamily: Fonts.sans, fontSize: 12, color: '#f87171', marginTop: 6 },
});
