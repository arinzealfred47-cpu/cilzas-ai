import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Colors, Fonts } from '@/constants/theme';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EmailModal({
  visible,
  onCancel,
  onSend,
}: {
  visible: boolean;
  onCancel: () => void;
  onSend: (email: string) => void;
}) {
  const [email, setEmail] = useState('');
  const valid = EMAIL_PATTERN.test(email);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <Animated.View entering={FadeIn.duration(200)} style={styles.card}>
          <Text style={styles.title}>Email this recipe</Text>
          <Text style={styles.message}>Opens your email app with the recipe pre-filled.</Text>
          <TextInput
            autoFocus
            style={styles.input}
            placeholder="recipient@example.com"
            placeholderTextColor={Colors.dark.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
              onPress={onCancel}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.sendButton, !valid && styles.disabled, pressed && styles.pressed]}
              disabled={!valid}
              onPress={() => onSend(email)}
            >
              <Text style={styles.sendText}>Send</Text>
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
  input: {
    fontFamily: Fonts.sans,
    color: Colors.dark.text,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 6,
    padding: 10,
    marginTop: 12,
    fontSize: 14,
  },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 20 },
  cancelButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  cancelText: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.dark.text },
  sendButton: { backgroundColor: '#00FF87', borderRadius: 6, paddingHorizontal: 14, paddingVertical: 8 },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  sendText: { fontFamily: Fonts.semiBold, fontSize: 13, color: '#000' },
});
