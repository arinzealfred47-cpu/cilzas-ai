import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

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
  const theme = useTheme();
  const styles = getStyles(theme);

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
            placeholderTextColor={theme.textFaint}
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
    input: {
      fontFamily: Fonts.sans,
      color: theme.text,
      backgroundColor: theme.bgSoft,
      borderRadius: 10,
      padding: 10,
      marginTop: 12,
      fontSize: 14,
    },
    actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 20 },
    cancelButton: {
      backgroundColor: theme.bgSoft,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    cancelText: { fontFamily: Fonts.sans, fontSize: 13, color: theme.text },
    sendButton: { backgroundColor: '#86F0C6', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8 },
    disabled: { opacity: 0.4 },
    pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
    sendText: { fontFamily: Fonts.semiBold, fontSize: 13, color: '#0C2119' },
  });
}
