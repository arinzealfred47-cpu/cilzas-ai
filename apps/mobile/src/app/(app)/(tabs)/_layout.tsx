import { DarkTheme, DefaultTheme, ThemeProvider, type Theme } from 'expo-router';

import AppTabs from '@/components/app-tabs';
import { PaywallGate } from '@/components/billing/paywall-gate';
import { Colors } from '@/constants/theme';
import { useThemeMode } from '@/contexts/theme-context';

const navigationThemeLight: Theme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.text,
    background: Colors.light.bg,
    card: Colors.light.bgElevated,
    text: Colors.light.text,
    border: Colors.light.border,
  },
};

const navigationThemeDark: Theme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.dark.text,
    background: Colors.dark.bg,
    card: Colors.dark.bgElevated,
    text: Colors.dark.text,
    border: Colors.dark.border,
  },
};

export default function AppLayout() {
  const { resolvedMode } = useThemeMode();
  return (
    <ThemeProvider value={resolvedMode === 'dark' ? navigationThemeDark : navigationThemeLight}>
      <PaywallGate>
        <AppTabs />
      </PaywallGate>
    </ThemeProvider>
  );
}
