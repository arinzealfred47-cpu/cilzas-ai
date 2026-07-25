import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

function formatCountdown(msRemaining: number): string {
  const totalSeconds = Math.max(0, Math.ceil(msRemaining / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function DeletionBanner({
  title,
  expiresAt,
  onUndo,
}: {
  title: string;
  expiresAt: number;
  onUndo: () => void;
}) {
  const theme = useTheme();
  const styles = getStyles(theme);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>
        <Text style={styles.bold}>{title}</Text> will be deleted in {formatCountdown(expiresAt - now)}.
      </Text>
      <Pressable onPress={onUndo} style={styles.undoButton}>
        <Text style={styles.undoText}>Undo</Text>
      </Pressable>
    </View>
  );
}

function getStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      borderRadius: 22,
      backgroundColor: theme.dangerBg,
      padding: 14,
    },
    text: { flex: 1, fontFamily: Fonts.sans, fontSize: 13, color: theme.danger },
    bold: { fontFamily: Fonts.semiBold },
    undoButton: {
      backgroundColor: theme.bgElevated,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    undoText: { fontFamily: Fonts.semiBold, fontSize: 12, color: theme.text },
  });
}
