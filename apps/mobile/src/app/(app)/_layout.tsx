import { Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { useTheme } from '@/hooks/use-theme';

function SettingsGearButton() {
  const router = useRouter();
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => router.push('/settings')}
      hitSlop={12}
      style={({ pressed }) => pressed && { opacity: 0.6 }}
    >
      <SymbolView
        name={{ ios: 'gearshape', android: 'settings', web: 'settings' }}
        tintColor={theme.text}
        size={22}
      />
    </Pressable>
  );
}

export default function AppLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.bgElevated },
        headerTintColor: theme.text,
      }}
    >
      <Stack.Screen
        name="(tabs)"
        options={{ headerShown: true, title: 'App', headerRight: SettingsGearButton }}
      />
      <Stack.Screen name="settings" options={{ headerShown: true, title: 'Settings' }} />
    </Stack>
  );
}
