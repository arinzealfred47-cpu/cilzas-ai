import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  confirming = false,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirming?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const theme = useTheme();
  const styles = getStyles(theme);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <Animated.View entering={FadeIn.duration(200)} style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
              onPress={onCancel}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.confirmButton,
                confirming && styles.disabled,
                pressed && styles.pressed,
              ]}
              onPress={onConfirm}
              disabled={confirming}
            >
              <Text style={styles.confirmText}>
                {confirming ? 'Deleting...' : confirmLabel}
              </Text>
            </Pressable>
          </View>
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
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.2,
      shadowRadius: 24,
      elevation: 6,
    },
    title: { fontFamily: Fonts.semiBold, fontSize: 16, color: theme.text },
    message: { fontFamily: Fonts.sans, fontSize: 13, color: theme.textMuted, marginTop: 8 },
    actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 20 },
    cancelButton: {
      backgroundColor: theme.bgSoft,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    cancelText: { fontFamily: Fonts.sans, fontSize: 13, color: theme.text },
    confirmButton: { backgroundColor: theme.dangerFill, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8 },
    disabled: { opacity: 0.5 },
    pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
    confirmText: { fontFamily: Fonts.semiBold, fontSize: 13, color: theme.danger },
  });
}
