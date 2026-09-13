export const colors = {
  background: '#0B1220',
  splashBackground: '#180C24',
  brandBgTop: '#52157A',
  brandBgUpper: '#35104F',
  brandBgMid: '#251032',
  brandPurple: '#8D12E5',
  brandCTA: '#761ABE',
  brandCTAPressed: '#5F1599',
  paginationActive: '#A180F2',
  paginationInactive: 'rgba(255,255,255,0.4)',
  panelOverlay: 'rgba(24, 12, 36, 0.88)',
  onboardingPanelBase: 'rgba(24, 12, 36, 0.62)',
  onboardingPanelTint: 'rgba(69, 32, 156, 0.11)',
  authOverlayDim: 'rgba(0, 0, 0, 0.7)',
  authSheetCard: '#272727',
  authAvatarBorder: '#777777',
  authSuccess: '#09893A',
  outlineBorder: '#94929B',
  outlineLabel: '#BEBEBE',
  socialBorder: '#34323B',
  signupAccent: '#C27AFF',
  licensedText: '#B7B6BC',
  inputFill: '#181623',
  inputPlaceholder: '#FFFFFF',
  surface: '#121A2B',
  border: '#243047',
  text: '#F4F7FB',
  textMuted: '#9AA8C0',
  primary: '#3DDC97',
  primaryPressed: '#2FB87C',
  danger: '#FF6B6B',
  white: '#FFFFFF',
} as const;

export const brandAtmosphere = {
  gradientColors: [
    colors.brandBgTop,
    colors.brandBgUpper,
    colors.brandBgMid,
    colors.splashBackground,
    colors.splashBackground,
  ] as const,
  gradientLocations: [0, 0.2, 0.4, 0.65, 1] as const,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 78,
} as const;

export const typography = {
  brand: {
    fontSize: 32,
    fontWeight: '700' as const,
    letterSpacing: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '600' as const,
  },
  welcome: {
    fontSize: 20,
    fontWeight: '500' as const,
    lineHeight: 38,
  },
  welcomeSubtitle: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 38,
  },
  onboardingTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    lineHeight: 26,
    includeFontPadding: false,
  },
  onboardingBody: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 18,
    includeFontPadding: false,
  },
  cta: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  input: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  forgot: {
    fontSize: 10,
    fontWeight: '400' as const,
    lineHeight: 20,
    letterSpacing: -0.06,
  },
  signup: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  licensed: {
    fontSize: 10,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  authSheetTitle: {
    fontSize: 20,
    fontWeight: '500' as const,
    lineHeight: 38,
  },
  authSheetSubtitle: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  authAccountName: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  authAccountEmail: {
    fontSize: 10,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  authSigningIn: {
    fontSize: 10,
    fontWeight: '300' as const,
    fontStyle: 'italic' as const,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
  },
  label: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
} as const;
