export const colors = {
  background: '#FBF6F0',
  surface: '#FFFFFF',
  primary: '#D96C3F',
  primaryDark: '#B44E28',
  accent: '#4C7A5F',
  text: '#2B2320',
  textMuted: '#7A6F68',
  border: '#EAE0D6',
  danger: '#C4453A',
  ja: '#4C7A5F',
  nee: '#C4453A',
  misschien: '#C99A3C',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
};

export const typography = {
  title: { fontSize: 26, fontWeight: '700' as const, color: colors.text },
  heading: { fontSize: 19, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 15, color: colors.text },
  muted: { fontSize: 13, color: colors.textMuted },
};
