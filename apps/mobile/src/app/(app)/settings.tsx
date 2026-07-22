import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import RevenueCatUI from 'react-native-purchases-ui';

import { ThemedText } from '@/components/themed-text';
import { WebOnlyNotice } from '@/components/billing/web-only-notice';
import { ConfirmModal } from '@/components/confirm-modal';
import { Colors, Spacing } from '@/constants/theme';
import { platformMatchesDevice } from '@/lib/revenuecat';

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? 'http://localhost:3000';
const APPLE_REFUND_URL = 'https://reportaproblem.apple.com';
const GOOGLE_REFUND_URL = 'https://play.google.com/store/account/orderhistory';

type SignupPlatform = 'WEB' | 'IOS' | 'ANDROID';
type PendingAction = 'cancel' | 'delete' | null;

export default function SettingsScreen() {
  const { sessionId, signOut, getToken } = useAuth();
  const router = useRouter();
  const [signupPlatform, setSignupPlatform] = useState<SignupPlatform | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${WEB_URL}/api/billing/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setSignupPlatform(data.signupPlatform ?? null);
        }
      } catch {
        // Leave the Manage Subscription section hidden on failure — sign-out
        // above still works regardless.
      }
    })();
  }, [getToken]);

  async function handleSignOut() {
    await signOut({ sessionId: sessionId ?? undefined });
    router.replace('/(auth)/sign-in');
  }

  async function handleConfirmAction() {
    if (!pendingAction) return;
    setSubmitting(true);
    try {
      const token = await getToken();
      await fetch(
        `${WEB_URL}/api/account/${pendingAction === 'delete' ? 'delete' : 'cancel-subscription'}`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` } },
      );
    } catch {
      // The account may still have been deleted server-side even if this
      // request's response never made it back — falling through to
      // sign-in either way is the safe default (the session is dead or
      // about to be).
    } finally {
      setSubmitting(false);
      setPendingAction(null);
      router.replace('/(auth)/sign-in');
    }
  }

  const isMobileSignup = signupPlatform === 'IOS' || signupPlatform === 'ANDROID';
  const refundUrl = signupPlatform === 'IOS' ? APPLE_REFUND_URL : GOOGLE_REFUND_URL;

  const wipeoutWarning = isMobileSignup
    ? `This permanently deletes your account and all of its data — this can't be undone. We can't process an automated refund for a subscription purchased through the app; to request one, visit ${refundUrl}.`
    : "This permanently deletes your account and all of its data — this can't be undone. If your most recent payment was within the last 28 days, it will be automatically refunded.";

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.section}>
        <ThemedText type="small">
          Signing out here only ends this device&apos;s session. Other devices
          you&apos;re signed in on stay signed in.
        </ThemedText>
        <Pressable
          style={({ pressed }) => [styles.signOutButton, pressed && styles.pressed]}
          onPress={handleSignOut}
        >
          <ThemedText style={styles.signOutButtonText}>Sign out</ThemedText>
        </Pressable>
      </View>

      {signupPlatform && (
        <View style={styles.section}>
          {platformMatchesDevice(signupPlatform) ? (
            <Pressable
              style={({ pressed }) => [styles.signOutButton, pressed && styles.pressed]}
              onPress={() => RevenueCatUI.presentCustomerCenter()}
            >
              <ThemedText style={styles.signOutButtonText}>Manage Subscription</ThemedText>
            </Pressable>
          ) : (
            <WebOnlyNotice />
          )}
        </View>
      )}

      <View style={styles.section}>
        <Pressable
          style={({ pressed }) => [styles.signOutButton, pressed && styles.pressed]}
          onPress={() => setPendingAction('cancel')}
        >
          <ThemedText style={styles.signOutButtonText}>Cancel Subscription</ThemedText>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
          onPress={() => setPendingAction('delete')}
        >
          <ThemedText style={styles.deleteButtonText}>Delete Account</ThemedText>
        </Pressable>
        {isMobileSignup && (
          <Pressable onPress={() => Linking.openURL(refundUrl).catch(() => {})}>
            <ThemedText type="link" themeColor="textSecondary">
              Request a refund from {signupPlatform === 'IOS' ? 'Apple' : 'Google'}
            </ThemedText>
          </Pressable>
        )}
      </View>

      <ConfirmModal
        visible={pendingAction !== null}
        title={pendingAction === 'delete' ? 'Delete your account?' : 'Cancel your subscription?'}
        message={wipeoutWarning}
        confirmLabel={pendingAction === 'delete' ? 'Delete Account' : 'Cancel Subscription'}
        confirming={submitting}
        onCancel={() => setPendingAction(null)}
        onConfirm={handleConfirmAction}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.dark.background, padding: Spacing.four, gap: Spacing.five },
  section: { gap: Spacing.three },
  signOutButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.4)',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#f87171',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  signOutButtonText: {
    color: '#fff',
  },
});
