import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function RatingPromptModal({
  visible,
  onRate,
  onDismiss,
}: {
  visible: boolean;
  onRate: (stars: number) => void;
  onDismiss: () => void;
}) {
  const [hovered, setHovered] = useState(0);
  const theme = useTheme();
  const styles = getStyles(theme);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <Animated.View entering={FadeIn.duration(200)} style={styles.card}>
          <Pressable
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            onPress={onDismiss}
            hitSlop={10}
            accessibilityLabel="Dismiss"
          >
            <Text style={styles.closeText}>✕</Text>
          </Pressable>

          <Text style={styles.title}>Enjoying Ingredas?</Text>
          <Text style={styles.message}>
            You've generated 5 recipes — let us know what you think with a quick rating.
          </Text>

          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable
                key={n}
                onPress={() => onRate(n)}
                onPressIn={() => setHovered(n)}
                onPressOut={() => setHovered(0)}
                hitSlop={6}
                accessibilityLabel={`Rate ${n} star${n === 1 ? '' : 's'}`}
              >
                <Text style={[styles.star, n <= hovered && styles.starActive]}>★</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.footnote}>You're not obligated to rate — dismiss anytime.</Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

function getStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    card: {
      width: '100%',
      maxWidth: 360,
      borderRadius: 22,
      backgroundColor: theme.bgElevated,
      padding: 20,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.2,
      shadowRadius: 24,
      elevation: 6,
    },
    closeButton: {
      position: 'absolute',
      top: 12,
      right: 12,
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.bgSoft,
    },
    pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
    closeText: { fontFamily: Fonts.sans, fontSize: 14, color: theme.textMuted },
    title: {
      fontFamily: Fonts.semiBold,
      fontSize: 17,
      color: theme.text,
      textAlign: 'center',
      marginTop: 8,
    },
    message: {
      fontFamily: Fonts.sans,
      fontSize: 13,
      color: theme.textMuted,
      textAlign: 'center',
      marginTop: 8,
    },
    starsRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
    star: { fontSize: 34, color: theme.border },
    starActive: { color: theme.warn },
    footnote: {
      fontFamily: Fonts.sans,
      fontSize: 11,
      color: theme.textFaint,
      textAlign: 'center',
      marginTop: 18,
    },
  });
}
