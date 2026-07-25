/**
 * Design tokens shared with the web app and the Ingredas mockup. Both
 * light and dark palettes are real (not just a forced-dark placeholder) —
 * see contexts/theme-context.tsx for how the active mode is chosen.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    bg: '#F2F0EA',
    bgElevated: '#FFFFFF',
    bgSoft: 'rgba(35,30,20,0.05)',
    bgSoftHover: 'rgba(35,30,20,0.09)',
    text: '#26262E',
    textMuted: '#63636E',
    textFaint: '#95959E',
    border: 'rgba(20,20,30,0.09)',
    danger: '#C13B2E',
    dangerBg: 'rgba(193,59,46,0.08)',
    dangerFill: 'rgba(193,59,46,0.14)',
    warn: '#8A5A00',
    ring: 'rgba(34,150,190,0.22)',
    // Legacy aliases — kept so any not-yet-converted call site still compiles;
    // new code should prefer the tokens above.
    background: '#F2F0EA',
    backgroundElement: '#FFFFFF',
    backgroundSelected: 'rgba(35,30,20,0.09)',
    textSecondary: '#63636E',
  },
  dark: {
    bg: '#131318',
    bgElevated: '#1b1c22',
    bgSoft: 'rgba(255,255,255,0.05)',
    bgSoftHover: 'rgba(255,255,255,0.09)',
    text: '#EDEDF3',
    textMuted: '#A3A3B2',
    textFaint: '#6F6F80',
    border: 'rgba(255,255,255,0.08)',
    danger: '#FFA8A0',
    dangerBg: 'rgba(255,138,128,0.12)',
    dangerFill: 'rgba(255,138,128,0.16)',
    warn: '#FFD9A0',
    ring: 'rgba(143,219,255,0.3)',
    background: '#131318',
    backgroundElement: '#1b1c22',
    backgroundSelected: 'rgba(255,255,255,0.09)',
    textSecondary: '#A3A3B2',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const AccentA = '#86F0C6';
export const AccentB = '#8FDBFF';
export const AccentInk = '#0C2119';
export const GradientColors = [AccentA, AccentB] as const;

export const RadiusBtn = 14;
export const RadiusPill = 999;
export const RadiusCard = 22;

export const ShadowCard = {
  light: {
    shadowColor: '#1E1A14',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 4,
  },
  dark: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.32,
    shadowRadius: 34,
    elevation: 8,
  },
} as const;

export const Fonts = Platform.select({
  web: {
    sans: 'var(--font-display)',
    medium: 'var(--font-display)',
    semiBold: 'var(--font-display)',
    bold: 'var(--font-display)',
    mono: 'var(--font-mono)',
  },
  default: {
    sans: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semiBold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
    mono: 'Inter_400Regular',
  },
})!;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
