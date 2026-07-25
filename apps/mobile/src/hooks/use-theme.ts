import { Colors } from '@/constants/theme';
import { useThemeMode } from '@/contexts/theme-context';

export function useTheme() {
  const { resolvedMode } = useThemeMode();
  return Colors[resolvedMode];
}
