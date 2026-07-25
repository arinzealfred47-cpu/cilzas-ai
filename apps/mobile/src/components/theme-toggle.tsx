import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useThemeMode, type ThemeMode } from '@/contexts/theme-context';

const OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: 'light', label: '☀️ Light' },
  { mode: 'dark', label: '🌙 Dark' },
  { mode: 'system', label: 'Auto' },
];

export function ThemeToggle() {
  const { mode, setMode } = useThemeMode();
  const theme = useTheme();
  const styles = getStyles(theme);

  return (
    <View style={styles.row}>
      {OPTIONS.map((option) => {
        const active = mode === option.mode;
        return (
          <Pressable
            key={option.mode}
            onPress={() => setMode(option.mode)}
            style={[styles.pill, active && styles.pillActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function getStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: 4,
      backgroundColor: theme.bgSoft,
      borderRadius: 999,
      padding: 4,
      alignSelf: 'flex-start',
    },
    pill: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
    },
    pillActive: {
      backgroundColor: theme.bgElevated,
    },
    label: {
      fontFamily: Fonts.sans,
      fontSize: 13,
      color: theme.textMuted,
    },
    labelActive: {
      color: theme.text,
      fontFamily: Fonts.semiBold,
    },
  });
}
