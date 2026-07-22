import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Colors, Fonts } from '@/constants/theme';

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

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: Colors.dark.background,
    padding: 20,
  },
  title: { fontFamily: Fonts.semiBold, fontSize: 16, color: Colors.dark.text },
  message: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.dark.textSecondary, marginTop: 8 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 20 },
  cancelButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  cancelText: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.dark.text },
  confirmButton: { backgroundColor: '#dc2626', borderRadius: 6, paddingHorizontal: 14, paddingVertical: 8 },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  confirmText: { fontFamily: Fonts.semiBold, fontSize: 13, color: '#fff' },
});
