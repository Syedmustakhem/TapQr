// src/constants/theme.ts

/*
 * TapQR shared theme.
 *
 * This file intentionally exposes both:
 *
 *   Modern exports:
 *   - colors
 *   - spacing
 *   - radius
 *   - typography
 *
 *   Legacy/compatibility exports:
 *   - Colors
 *   - Spacing
 *   - Fonts
 *   - ThemeColor
 *   - MaxContentWidth
 *
 * This allows existing components to keep working while
 * we progressively move the app to the new TapQR design system.
 */

/* =========================================================
   COLORS
========================================================= */

export const colors = {
  canvas: "#F7F7F5",
  ink: "#111111",
  muted: "#6B6B6B",

  surface: "#FFFFFF",

  accent: "#6C4CF1",
  accentDark: "#5639D8",
  accentLight: "#EEE9FF",

  success: "#18B981",
  warning: "#F5A524",
  danger: "#EF4444",

  border: "#E7E5E4",

  primary: "#6C4CF1",
  primaryDark: "#5639D8",
  primaryLight: "#EEE9FF",

  background: "#F7F7F5",

  text: "#111111",
  textSecondary: "#6B6B6B",
  textMuted: "#969696",

  white: "#FFFFFF",
  black: "#000000",

  error: "#EF4444",
} as const;

/* =========================================================
   LEGACY COLOR SYSTEM
========================================================= */

export const Colors = {
  light: {
    text: colors.ink,
    textSecondary: colors.muted,

    background: colors.canvas,
    backgroundElement: colors.surface,
    backgroundSelected: colors.accentLight,

    tint: colors.accent,
    icon: colors.muted,

    border: colors.border,

    primary: colors.primary,
    primaryDark: colors.primaryDark,
    primaryLight: colors.primaryLight,

    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,

    white: colors.white,
    black: colors.black,
  },

  dark: {
    text: "#F7F7F5",
    textSecondary: "#B7B5B1",

    background: "#111111",
    backgroundElement: "#1B1B1B",
    backgroundSelected: "#29213F",

    tint: "#A895FF",
    icon: "#A8A5A0",

    border: "#343434",

    primary: "#8B73FF",
    primaryDark: "#6C4CF1",
    primaryLight: "#29213F",

    success: "#31C992",
    warning: "#F7B84B",
    danger: "#F87171",

    white: "#FFFFFF",
    black: "#000000",
  },
} as const;

/* =========================================================
   SPACING
========================================================= */

export const spacing = {
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,

  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
  huge: 80,
} as const;

/*
 * Compatibility alias.
 *
 * Existing components such as app-tabs.web.tsx use
 * Spacing.one through Spacing.five.
 */
export const Spacing = spacing;

/* =========================================================
   RADIUS
========================================================= */

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 999,
} as const;

/* =========================================================
   TYPOGRAPHY
========================================================= */

export const typography = {
  title: {
    fontSize: 32,
    fontWeight: "700" as const,
  },

  heading: {
    fontSize: 24,
    fontWeight: "700" as const,
  },

  subheading: {
    fontSize: 18,
    fontWeight: "600" as const,
  },

  body: {
    fontSize: 16,
    fontWeight: "400" as const,
  },

  small: {
    fontSize: 14,
    fontWeight: "400" as const,
  },

  caption: {
    fontSize: 12,
    fontWeight: "400" as const,
  },
};

export const TYPOGRAPHY = typography;

/* =========================================================
   FONTS
========================================================= */

export const Fonts = {
  sans: "System",
  mono: "monospace",
} as const;

/* =========================================================
   THEME COLOR TYPE
========================================================= */

export type ThemeColor = keyof typeof Colors.light;

/* =========================================================
   CONTENT WIDTH
========================================================= */

export const MaxContentWidth = 1200;

/* =========================================================
   DEFAULT EXPORT
========================================================= */

export default {
  colors,
  Colors,
  spacing,
  Spacing,
  radius,
  typography,
  TYPOGRAPHY,
  Fonts,
  MaxContentWidth,
};