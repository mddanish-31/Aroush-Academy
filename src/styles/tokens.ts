export const brand = {
  navy: "#2F4156",
  navyHover: "#243344",
  navyActive: "#1B2735",
  teal: "#567B8D",
  tealHover: "#466676",
  tealDark: "#3D5A69",
  skyBlue: "#C8D9E6",
  skyBlueSubtle: "rgba(200, 217, 230, 0.45)",
  skyBlueStrong: "#AFC6D8",
  beige: "#F5F0EB",
  beigeMuted: "#ECE5DD",
  white: "#FFFFFF",
} as const;

export const colors = {
  brand,
  background: brand.beige,
  surface: brand.white,
  surfaceMuted: brand.beige,
  surfaceSoft: brand.skyBlueSubtle,
  surfaceSelected: brand.skyBlue,
  primary: brand.navy,
  primaryHover: brand.navyHover,
  primaryLight: "#3D526B",
  secondary: brand.teal,
  secondaryHover: brand.tealHover,
  text: brand.navy,
  textSecondary: "#465D73",
  neutral: "#8FA6B8",
  neutralDark: "#465D73",
  neutralLight: brand.skyBlue,
  accent: brand.teal,
  accentHover: brand.tealHover,
  accentSubtle: brand.skyBlueSubtle,
  border: brand.skyBlue,
  borderStrong: "#69879B",
  borderSubtle: "rgba(86, 123, 141, 0.22)",
  focusRing: "rgba(86, 123, 141, 0.45)",
  overlay: "rgba(47, 65, 86, 0.52)",
  success: "#1F6F54",
  successBg: "rgba(31, 111, 84, 0.10)",
  successBorder: "rgba(31, 111, 84, 0.28)",
  warning: "#8A5A19",
  warningBg: "rgba(180, 120, 36, 0.12)",
  warningBorder: "rgba(180, 120, 36, 0.32)",
  danger: "#A63232",
  dangerBg: "rgba(166, 50, 50, 0.09)",
  dangerBorder: "rgba(166, 50, 50, 0.28)",
} as const;

export const typography = {
  fontSans:
    'var(--font-manrope), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  fontDisplay: 'var(--font-fraunces), Georgia, serif',
  fontMono:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  sizes: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem",
    "5xl": "3rem",
    "6xl": "3.75rem",
  },
  weights: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
  lineHeights: {
    tight: "1.1",
    snug: "1.25",
    normal: "1.5",
    relaxed: "1.65",
  },
} as const;

export const spacing = {
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
} as const;

export const radii = {
  sm: "6px",
  md: "10px",
  lg: "14px",
  xl: "20px",
  full: "9999px",
} as const;

export const shadows = {
  sm: "0 1px 2px rgba(47, 65, 86, 0.05)",
  md: "0 4px 12px rgba(47, 65, 86, 0.07), 0 1px 2px rgba(47, 65, 86, 0.04)",
  lg: "0 12px 28px rgba(47, 65, 86, 0.10), 0 2px 6px rgba(47, 65, 86, 0.05)",
  glow: "0 0 0 3px rgba(86, 123, 141, 0.25)",
} as const;

export const layout = {
  containerMax: "1200px",
  containerNarrow: "840px",
} as const;

export const tokens = {
  brand,
  colors,
  typography,
  spacing,
  radii,
  shadows,
  layout,
} as const;

export type Tokens = typeof tokens;
