import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Link, useRouter } from 'expo-router';
import { useSignIn, useSSO } from '@clerk/expo';
import { Colors, Fonts, GradientColors } from '@/constants/theme';
import { clerkErrorCode, clerkErrorMessage } from './clerk-error';

export default function SignInScreen() {
  const { signIn } = useSignIn();
  const { startSSOFlow } = useSSO();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!signIn) return;
    setError(null);
    setSubmitting(true);

    const { error: passwordErr } = await signIn.password({
      identifier: email,
      password,
    });

    if (passwordErr) {
      setSubmitting(false);
      if (clerkErrorCode(passwordErr) === 'form_identifier_not_found') {
        router.replace('/(auth)/sign-up');
        return;
      }
      setError(clerkErrorMessage(passwordErr));
      return;
    }

    const { error: finalizeErr } = await signIn.finalize();
    setSubmitting(false);

    if (finalizeErr) {
      setError(clerkErrorMessage(finalizeErr));
    }
  }

  async function handleOAuth(strategy: 'oauth_google' | 'oauth_apple') {
    setError(null);
    try {
      const { createdSessionId, setActive } = await startSSOFlow({ strategy });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OAuth sign-in failed.');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Sign in</Text>

      {error && (
        <Animated.Text entering={FadeIn.duration(150)} style={styles.error}>
          {error}
        </Animated.Text>
      )}

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={Colors.dark.textSecondary}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={Colors.dark.textSecondary}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Pressable
        style={({ pressed }) => [pressed && styles.pressed, submitting && styles.buttonDisabled]}
        disabled={submitting}
        onPress={handleSubmit}
      >
        <LinearGradient colors={GradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.button}>
          <Text style={styles.buttonText}>Sign in</Text>
        </LinearGradient>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.buttonOutline, pressed && styles.pressed]}
        onPress={() => handleOAuth('oauth_google')}
      >
        <Text style={styles.buttonOutlineText}>Continue with Google</Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.buttonOutline, pressed && styles.pressed]}
        onPress={() => handleOAuth('oauth_apple')}
      >
        <Text style={styles.buttonOutlineText}>Continue with Apple</Text>
      </Pressable>

      <Link href="/(auth)/sign-up" style={styles.link}>
        Don&apos;t have an account? Sign up
      </Link>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', gap: 12, padding: 24, backgroundColor: Colors.dark.background },
  title: { fontFamily: Fonts.semiBold, fontSize: 20, color: Colors.dark.text, marginBottom: 8 },
  error: {
    fontFamily: Fonts.sans,
    color: '#f87171',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 8,
    borderRadius: 6,
  },
  input: {
    fontFamily: Fonts.sans,
    color: Colors.dark.text,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 6,
    padding: 10,
  },
  button: { padding: 12, borderRadius: 6, alignItems: 'center' },
  buttonOutline: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { fontFamily: Fonts.semiBold, color: '#000' },
  buttonOutlineText: { fontFamily: Fonts.sans, color: Colors.dark.text },
  link: {
    fontFamily: Fonts.sans,
    marginTop: 8,
    textAlign: 'center',
    textDecorationLine: 'underline',
    color: Colors.dark.textSecondary,
  },
});
