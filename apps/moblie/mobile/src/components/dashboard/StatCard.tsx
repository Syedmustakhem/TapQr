import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { COLORS } from "../../constants/colors";
import { SPACING } from "../../constants/spacing";

type StatCardProps = {
  title: string;
  value: number;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  onPress,
}: StatCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={icon}
            size={21}
            color={COLORS.primary}
          />
        </View>

        <Ionicons
          name="chevron-forward-outline"
          size={18}
          color={COLORS.textMuted}
        />
      </View>

      <Text style={styles.title}>
        {title}
      </Text>

      <Text style={styles.value}>
        {value.toLocaleString()}
      </Text>

      <Text style={styles.subtitle}>
        {subtitle}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 150,
    minHeight: 155,

    backgroundColor: COLORS.surface,

    borderRadius: 18,

    borderWidth: 1,
    borderColor: COLORS.border,

    padding: SPACING.lg,

    justifyContent: "space-between",
  },

  pressed: {
    opacity: 0.8,
    transform: [
      {
        scale: 0.98,
      },
    ],
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  iconContainer: {
    width: 42,
    height: 42,

    borderRadius: 13,

    backgroundColor: COLORS.primaryLight,

    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    marginTop: SPACING.md,

    fontSize: 12,
    fontWeight: "600",

    color: COLORS.textSecondary,

    textTransform: "uppercase",
  },

  value: {
    marginTop: SPACING.xs,

    fontSize: 30,
    fontWeight: "800",

    color: COLORS.text,
  },

  subtitle: {
    marginTop: SPACING.xs,

    fontSize: 12,

    color: COLORS.textSecondary,
  },
});