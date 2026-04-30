export type ColorTokens = {
  brandPrimary: string;
  brandPrimaryDeep: string;
  brandSecondary: string;
  brandSecondaryDeep: string;
  ink900: string;
  ink700: string;
  ink500: string;
  surfaceBase: string;
  surfaceRaised: string;
  surfaceSunken: string;
  strokeSubtle: string;
  stateSuccess: string;
  stateWarning: string;
  stateDanger: string;
};

export const lightColors: ColorTokens = {
  brandPrimary: '#3FB08A',
  brandPrimaryDeep: '#1E7A5F',
  brandSecondary: '#3B7CB8',
  brandSecondaryDeep: '#1E4F82',

  ink900: '#0F1B2E',
  ink700: '#2A3A52',
  ink500: '#5C6A82',

  surfaceBase: '#FFFFFF',
  surfaceRaised: '#F4F8F6',
  surfaceSunken: '#E8F2ED',

  strokeSubtle: '#DCE7E1',

  stateSuccess: '#2E9D6E',
  stateWarning: '#D58A2A',
  stateDanger: '#C0413B',
};

export const darkColors: ColorTokens = {
  brandPrimary: '#4ECBA0',
  brandPrimaryDeep: '#2E9478',
  brandSecondary: '#5A9EDA',
  brandSecondaryDeep: '#2F6BA8',

  ink900: '#F4F7FA',
  ink700: '#C7D1DE',
  ink500: '#8A97AC',

  surfaceBase: '#0B1420',
  surfaceRaised: '#121D2D',
  surfaceSunken: '#09101A',

  strokeSubtle: '#1E2A3C',

  stateSuccess: '#4FC38C',
  stateWarning: '#F2B25E',
  stateDanger: '#E8695F',
} as const;

export const colors = lightColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: '700' as const },
  title1: { fontSize: 28, lineHeight: 34, fontWeight: '700' as const },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: '600' as const },
  title3: { fontSize: 18, lineHeight: 24, fontWeight: '600' as const },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' as const },
  bodyStrong: { fontSize: 16, lineHeight: 22, fontWeight: '600' as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' as const },
  micro: { fontSize: 11, lineHeight: 14, fontWeight: '500' as const },
} as const;
