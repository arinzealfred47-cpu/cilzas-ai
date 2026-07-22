import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';

export function configureRevenueCat(clerkUserId: string) {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return;

  Purchases.configure({
    apiKey:
      Platform.OS === 'ios'
        ? process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY!
        : process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY!,
  });
  Purchases.logIn(clerkUserId);
}

// The billing rule: the payment processor is fixed by the platform an
// account first signed up on. A signup platform of 'WEB' never "matches"
// a native app runtime — those users are never routed into a RevenueCat
// purchase flow.
export function platformMatchesDevice(signupPlatform: 'WEB' | 'IOS' | 'ANDROID'): boolean {
  if (signupPlatform === 'WEB') return false;
  return (
    (signupPlatform === 'IOS' && Platform.OS === 'ios') ||
    (signupPlatform === 'ANDROID' && Platform.OS === 'android')
  );
}
