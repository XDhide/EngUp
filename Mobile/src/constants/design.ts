// EngUp Design System — mirror của DESIGN.md
export const Colors = {
  primary: '#22C55E',
  primaryContainer: '#DCFCE7',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#1F2937',

  secondary: '#16A34A',
  secondaryContainer: '#DCFCE7',
  onSecondaryContainer: '#1F2937',
  onSecondaryFixed: '#1F2937',

  surface: '#F8FAF5',
  surfaceContainer: '#FFFFFF',
  surfaceContainerLow: '#F3F4F6',
  surfaceContainerHigh: '#E5E7EB',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerHighest: '#D1D5DB',

  onSurface: '#1F2937',
  onSurfaceVariant: 'rgba(31,41,55,0.6)',
  outline: 'rgba(31,41,55,0.4)',

  error: '#DC2626',
  errorContainer: '#FEE2E2',
  onError: '#FFFFFF',
  onErrorContainer: '#7F1D1D',

  tertiary: '#7C3AED',
  tertiaryContainer: '#EDE9FE',
  onTertiaryFixed: '#4C1D95',

  border: '#DCFCE7',
} as const;

export const Typography = {
  headlineLg: { fontSize: 28, fontWeight: '700' as const, lineHeight: 36, letterSpacing: -0.02 },
  headlineMd: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32, letterSpacing: -0.01 },
  titleSm: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24, letterSpacing: -0.01 },
  bodyLg: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodyMd: { fontSize: 15, fontWeight: '500' as const, lineHeight: 22.5 },
  labelMd: { fontSize: 14, fontWeight: '600' as const, lineHeight: 20, letterSpacing: 0.01 },
  labelSm: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16, letterSpacing: 0.04 },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const Radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;
