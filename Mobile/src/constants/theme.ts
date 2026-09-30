import '@/global.css';
import { Platform } from 'react-native';

export const Colors = {
  surface: '#f8f9ff',
  surfaceDim: '#d0dbed',
  surfaceBright: '#f8f9ff',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#eff4ff',
  surfaceContainer: '#e6eeff',
  surfaceContainerHigh: '#dee9fc',
  surfaceContainerHighest: '#d9e3f6',
  onSurface: '#121c2a',
  onSurfaceVariant: '#3d4a3d',
  inverseSurface: '#27313f',
  inverseOnSurface: '#eaf1ff',
  outline: '#6d7b6c',
  outlineVariant: '#bccbb9',
  surfaceTint: '#006e2f',
  primary: '#006e2f',
  onPrimary: '#ffffff',
  primaryContainer: '#22c55e',
  onPrimaryContainer: '#004b1e',
  inversePrimary: '#4ae176',
  secondary: '#486554',
  onSecondary: '#ffffff',
  secondaryContainer: '#caead6',
  onSecondaryContainer: '#4e6b5a',
  tertiary: '#9e4036',
  onTertiary: '#ffffff',
  tertiaryContainer: '#ff8b7c',
  onTertiaryContainer: '#76231b',
  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',
  primaryFixed: '#6bff8f',
  primaryFixedDim: '#4ae176',
  onPrimaryFixed: '#002109',
  onPrimaryFixedVariant: '#005321',
  secondaryFixed: '#caead6',
  secondaryFixedDim: '#afceba',
  onSecondaryFixed: '#042014',
  onSecondaryFixedVariant: '#314d3e',
  tertiaryFixed: '#ffdad5',
  tertiaryFixedDim: '#ffb4a9',
  onTertiaryFixed: '#410001',
  onTertiaryFixedVariant: '#7f2a21',
  background: '#f8f9ff',
  onBackground: '#121c2a',
  surfaceVariant: '#d9e3f6',

  light: {
    text: '#121c2a',
    background: '#f8f9ff',
    backgroundElement: '#eff4ff',
    backgroundSelected: '#caead6',
    textSecondary: '#3d4a3d',
    primary: '#006e2f',
    primaryContainer: '#22c55e',
  },
  dark: {
    text: '#ffffff',
    background: '#121c2a',
    backgroundElement: '#27313f',
    backgroundSelected: '#314d3e',
    textSecondary: '#bccbb9',
    primary: '#4ae176',
    primaryContainer: '#22c55e',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Typography = {
  headlineLg: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '700' as const,
    letterSpacing: -0.52,
  },
  headlineMd: {
    fontSize: 21,
    lineHeight: 28,
    fontWeight: '600' as const,
    letterSpacing: -0.315,
  },
  titleSm: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600' as const,
    letterSpacing: -0.17,
  },
  bodyLg: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  bodyMd: {
    fontSize: 15,
    lineHeight: 22.5,
    fontWeight: '500' as const,
    letterSpacing: 0,
  },
  labelMd: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600' as const,
    letterSpacing: 0.14,
  },
  labelSm: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
    letterSpacing: 0.48,
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  margin: 20,
  gutter: 16,
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Rounded = {
  sm: 4,
  default: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 480;
