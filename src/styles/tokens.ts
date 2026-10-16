/**
 * Centralized Design Tokens for ArousH Academy
 * Apple-inspired minimalism, premium B2B SaaS aesthetic
 * All values align with CSS variables declared in src/app/globals.css
 */

export const colors = {
  background: "#F5F5F7",
  surface: "#FFFFFF",
  surfaceMuted: "#F0F0F3",
  primary: "#1D1D1F",
  primaryLight: "#2D2D30",
  neutral: "#AAAAAA",
  neutralDark: "#6E6E73",
  neutralLight: "#E5E5EA",
  accent: "#007AFF",
  accentHover: "#0062CC",
  accentSubtle: "rgba(0, 122, 255, 0.08)",
  border: "rgba(0, 0, 0, 0.08)",
  borderSubtle: "rgba(0, 0, 0, 0.04)",
  focusRing: "rgba(0, 122, 255, 0.4)",
  success: "#34C759",
  warning: "#FF9500",
} as const;

export const typography = {
  fontSans:
    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
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
  lg: "16px",
  xl: "24px",
  full: "9999px",
} as const;

export const shadows = {
  sm: "0 1px 2px rgba(0, 0, 0, 0.04)",
  md: "0 4px 12px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.04)",
  lg: "0 12px 32px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)",
  glow: "0 0 24px rgba(0, 122, 255, 0.2)",
} as const;

export const layout = {
  containerMax: "1200px",
  containerNarrow: "840px",
} as const;

export const tokens = {
  colors,
  typography,
  spacing,
  radii,
  shadows,
  layout,
} as const;

export type Tokens = typeof tokens;
