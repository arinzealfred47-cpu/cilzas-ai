import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAuth } from '@clerk/expo';
import RevenueCatUI from 'react-native-purchases-ui';

import { Colors } from '@/constants/theme';
import { platformMatchesDevice } from '@/lib/revenuecat';
import { WebOnlyNotice } from './web-only-notice';

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? 'http://localhost:3000';

type BillingStatus = {
  state: 'trial' | 'active' | 'locked';
  signupPlatform: 'WEB' | 'IOS' | 'ANDROID';
};

export function PaywallGate({ children }: { children: ReactNode }) {
  const { getToken } = useAuth();
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [presenting, setPresenting] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${WEB_URL}/api/billing/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setStatus(await res.json());
      }
    } catch {
      // Network hiccup — leave the previous status in place and try again
      // next time PaywallGate re-mounts or the user retries.
    }
  }, [getToken]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const locked = status?.state === 'locked';
  const matchesDevice = status ? platformMatchesDevice(status.signupPlatform) : false;

  useEffect(() => {
    if (!locked || !matchesDevice || presenting) return;

    let cancelled = false;
    setPresenting(true);

    (async () => {
      await RevenueCatUI.presentPaywall({ displayCloseButton: false });
      if (!cancelled) {
        setPresenting(false);
        refresh();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [locked, matchesDevice, presenting, refresh]);

  if (!status) {
    // Still resolving billing state — render nothing rather than flashing
    // gated content before we know whether this account is locked.
    return <View style={styles.blocked} />;
  }

  if (status.state !== 'locked') {
    return <>{children}</>;
  }

  if (!matchesDevice) {
    return <WebOnlyNotice />;
  }

  return <View style={styles.blocked} />;
}

const styles = StyleSheet.create({
  blocked: { flex: 1, backgroundColor: Colors.dark.background },
});
