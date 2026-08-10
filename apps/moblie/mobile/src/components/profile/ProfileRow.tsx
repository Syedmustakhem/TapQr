import React from "react";

import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  colors,
  spacing,
} from "../../constants/theme";

interface ProfileRowProps {
  label: string;
  value: string;
}

export default function ProfileRow({
  label,
  value,
}: ProfileRowProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
      </Text>

      <Text style={styles.value}>
        {value || "Not provided"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  label: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },

  value: {
    fontSize: 15,
    color: colors.text,
    fontWeight: "500",
  },
});