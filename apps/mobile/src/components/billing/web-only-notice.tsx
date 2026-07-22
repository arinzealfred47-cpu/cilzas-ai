import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

// Deliberately plain, non-interactive text — no Pressable/Linking.openURL.
// This account subscribes through the website, and an app linking out to an
// external purchase flow risks violating Apple/Google anti-steering rules.
export function WebOnlyNotice() {
  const webUrl = process.env.EXPO_PUBLIC_WEB_URL ?? 'our website';

  return (
    <View style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        Manage your subscription on the web
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.body}>
        This account subscribes through {webUrl}. Please visit it in a browser to subscribe or manage your
        plan.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
  },
  title: { textAlign: 'center' },
  body: { textAlign: 'center' },
});
