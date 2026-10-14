// src/components/dashboard/StatusPill.tsx
//
// Small status badge used by the Smart Rules and
// A/B Experiments screens. Callers pass the tone
// that matches each status enum.

import { StyleSheet, Text, View } from "react-native";

import { COLORS } from "../../constants/colors";
import { SPACING } from "../../constants/spacing";

export type StatusTone =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "muted";

type StatusPillProps = {
  label: string;
  tone: StatusTone;
};

const TONE_COLORS: Record<
  StatusTone,
  { fg: string; bg: string }
> = {
  success: {
    fg: COLORS.success,
    bg: "#DCFCE7",
  },
  warning: {
    fg: "#B45309",
    bg: "#FEF3C7",
  },
  danger: {
    fg: COLORS.danger,
    bg: "#FEE2E2",
  },
  info: {
    fg: COLORS.primary,
    bg: "#DBEAFE",
  },
  muted: {
    fg: COLORS.textSecondary,
    bg: "#F1F5F9",
  },
};

export default function StatusPill({
  label,
  tone,
}: StatusPillProps) {
  const toneColors = TONE_COLORS[tone];

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: toneColors.bg,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: toneColors.fg },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 999,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },

  label: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});
