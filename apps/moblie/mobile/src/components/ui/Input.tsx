import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

import { COLORS } from "../../constants/colors";
import { SPACING } from "../../constants/spacing";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export default function Input({
  label,
  error,
  ...textInputProps
}: InputProps) {
  return (
    <View style={styles.container}>
      {label ? (
        <Text style={styles.label}>
          {label}
        </Text>
      ) : null}

      <TextInput
        {...textInputProps}
        style={[
          styles.input,
          error ? styles.inputError : null,
        ]}
        placeholderTextColor={COLORS.textSecondary}
      />

      {error ? (
        <Text style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
  },

  inputError: {
    borderColor: COLORS.error,
  },

  error: {
    marginTop: SPACING.xs,
    fontSize: 13,
    color: COLORS.error,
  },
});