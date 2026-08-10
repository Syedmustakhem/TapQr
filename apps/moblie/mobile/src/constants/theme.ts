export const colors = {
  background: "#F8FAFC",
  surface: "#FFFFFF",

  primary: "#2563EB",
  primaryDark: "#1D4ED8",
  primaryLight: "#DBEAFE",

  text: "#0F172A",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",

  border: "#E2E8F0",

  success: "#16A34A",
  warning: "#F59E0B",
  danger: "#DC2626",

  white: "#FFFFFF",
  black: "#000000",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

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