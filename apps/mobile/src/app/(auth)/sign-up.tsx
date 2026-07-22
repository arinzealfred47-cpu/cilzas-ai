import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Link, useRouter } from 'expo-router';
import { useSignUp, useSSO } from '@clerk/expo';

import { Colors, Fonts, GradientColors } from '@/constants/theme';
import { CONSENTS, type ConsentKey } from './consents';
import { clerkErrorCode, clerkErrorMessage } from './clerk-error';

type Step = 'details' | 'otp';

export default function SignUpScreen() {
  const { signUp } = useSignUp();
  const { startSSOFlow } = useSSO();
  const router = useRouter();

  const [step, setStep] = useState<Step>('details');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [accepted, setAccepted] = useState<Record<ConsentKey, boolean>>({
    legal: false,
    refund: false,
    terms: false,
    privacy: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const allAccepted = CONSENTS.every((c) => accepted[c.key]);

  function consentTimestamps() {
    const now = new Date().toISOString();
    return {
      acceptedLegalAt: now,
      acceptedRefundAt: now,
      acceptedTermsAt: now,
      acceptedPrivacyAt: now,
      // 'WEB' only fires if someone signs up via the Expo *web* export of
      // this app itself (a dev/testing edge case, not a production
      // distribution path) — real installs are always 'ios' or 'android'.
      signupPlatform:
        Platform.OS === 'ios' ? 'IOS' : Platform.OS === 'android' ? 'ANDROID' : 'WEB',
    };
  }

  async function handleDetailsSubmit() {
    if (!signUp || !allAccepted) return;
    setError(null);
    setSubmitting(true);

    const { error: createErr } = await signUp.password({
      emailAddress: email,
      password,
      legalAccepted: true,
      unsafeMetadata: consentTimestamps(),
    });

    if (createErr) {
      setSubmitting(false);
      if (clerkErrorCode(createErr) === 'form_identifier_exists') {
        router.replace('/(auth)/sign-in');
        return;
      }
      setError(clerkErrorMessage(createErr));
      return;
    }

    const { error: codeErr } = await signUp.verifications.sendEmailCode();
    setSubmitting(false);

    if (codeErr) {
      setError(clerkErrorMessage(codeErr));
      return;
    }

    setStep('otp');
  }

  async function handleOtpSubmit() {
    if (!signUp) return;
    setError(null);
    setSubmitting(true);

    const { error: verifyErr } = await signUp.verifications.verifyEmailCode({ code });

    if (verifyErr) {
      setSubmitting(false);
      setError(clerkErrorMessage(verifyErr));
      return;
    }

    const { error: finalizeErr } = await signUp.finalize();
    setSubmitting(false);

    if (finalizeErr) {
      setError(clerkErrorMessage(finalizeErr));
    }
  }

  async function handleOAuth(strategy: 'oauth_google' | 'oauth_apple') {
    if (!allAccepted) return;
    setError(null);

    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy,
        unsafeMetadata: consentTimestamps(),
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OAuth sign-up failed.');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Create your account</Text>

      {error && (
        <Animated.Text entering={FadeIn.duration(150)} style={styles.error}>
          {error}
        </Animated.Text>
      )}

      {step === 'details' && (
        <>
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

          {CONSENTS.map((c) => (
            <Pressable
              key={c.key}
              style={styles.checkboxRow}
              onPress={() =>
                setAccepted((prev) => ({ ...prev, [c.key]: !prev[c.key] }))
              }
            >
              <View style={[styles.checkbox, accepted[c.key] && styles.checkboxChecked]} />
              <Text style={styles.checkboxLabel}>I agree to the {c.label}</Text>
            </Pressable>
          ))}

          <Pressable
            style={({ pressed }) => [pressed && styles.pressed, (!allAccepted || submitting) && styles.buttonDisabled]}
            disabled={!allAccepted || submitting}
            onPress={handleDetailsSubmit}
          >
            <LinearGradient colors={GradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.button}>
              <Text style={styles.buttonText}>Sign up</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.buttonOutline, (pressed || !allAccepted) && styles.pressed]}
            disabled={!allAccepted}
            onPress={() => handleOAuth('oauth_google')}
          >
            <Text style={styles.buttonOutlineText}>Continue with Google</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.buttonOutline, (pressed || !allAccepted) && styles.pressed]}
            disabled={!allAccepted}
            onPress={() => handleOAuth('oauth_apple')}
          >
            <Text style={styles.buttonOutlineText}>Continue with Apple</Text>
          </Pressable>

          <Link href="/(auth)/sign-in" style={styles.link}>
            Already have an account? Sign in
          </Link>
        </>
      )}

      {step === 'otp' && (
        <>
          <Text style={styles.helperText}>Enter the 6-digit code we emailed to {email}.</Text>
          <TextInput
            style={styles.input}
            placeholder="123456"
            placeholderTextColor={Colors.dark.textSecondary}
            keyboardType="number-pad"
            maxLength={6}
            value={code}
            onChangeText={setCode}
          />
          <Pressable
            style={({ pressed }) => [pressed && styles.pressed, submitting && styles.buttonDisabled]}
            disabled={submitting}
            onPress={handleOtpSubmit}
          >
            <LinearGradient colors={GradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.button}>
              <Text style={styles.buttonText}>Verify</Text>
            </LinearGradient>
          </Pressable>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', gap: 12, padding: 24, backgroundColor: Colors.dark.background },
  title: { fontFamily: Fonts.semiBold, fontSize: 20, color: Colors.dark.text, marginBottom: 8 },
  helperText: { fontFamily: Fonts.sans, color: Colors.dark.textSecondary, fontSize: 14 },
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
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: { width: 18, height: 18, borderWidth: 1, borderColor: Colors.dark.textSecondary, borderRadius: 4 },
  checkboxChecked: { backgroundColor: '#00FF87', borderColor: '#00FF87' },
  checkboxLabel: { fontFamily: Fonts.sans, color: Colors.dark.text },
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
