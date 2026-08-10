import React from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors, spacing } from "../../constants/theme";

interface EmptyStateProps {
  title: string;
  message: string;
}

export default function EmptyState({
  title,
  message,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.icon}>
        <Text style={styles.iconText}>✓</Text>
      </View>

      <Text style={styles.title}>
        {title}
      </Text>

      <Text style={styles.message}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xxl,
  },

  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F5E9",
    marginBottom: spacing.lg,
  },

  iconText: {
    fontSize: 28,
    color: colors.success,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },

  message: {
    marginTop: spacing.sm,
    textAlign: "center",
    color: colors.textSecondary,
    lineHeight: 21,
  },
});