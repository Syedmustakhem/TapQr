import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

import { COLORS } from "../../constants/colors";
import { SPACING } from "../../constants/spacing";

export default function VerifyScreen() {
  const params = useLocalSearchParams();

  const email =
    typeof params.email === "string"
      ? params.email
      : "";

  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    setCodeError("");

    if (!code.trim()) {
      setCodeError("Verification code is required.");
      return;
    }

    if (code.length !== 6) {
      setCodeError(
        "Verification code must be 6 digits."
      );
      return;
    }

    try {
      setLoading(true);

      // Backend verification will be connected later.

      console.log("Verify code:", {
        email,
        code,
      });

      router.replace("/app/dashboard");
    } catch (error) {
      console.error(
        "Verification failed:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View>
            <Text style={styles.logo}>
              TapQR
            </Text>

            <Text style={styles.title}>
              Verify your account
            </Text>

            <Text style={styles.subtitle}>
              Enter the 6-digit verification code
              sent to your email.
            </Text>

            {email ? (
              <Text style={styles.email}>
                {email}
              </Text>
            ) : null}

            <View style={styles.form}>
              <Input
                label="Verification code"
                value={code}
                onChangeText={setCode}
                placeholder="123456"
                keyboardType="number-pad"
                maxLength={6}
                autoCapitalize="none"
                error={codeError}
              />

              <Button
                title="Verify Account"
                onPress={handleVerify}
                loading={loading}
              />
            </View>
          </View>

          <View style={styles.bottom}>
            <Text style={styles.bottomText}>
              Didn't receive the code?
            </Text>

            <Text style={styles.link}>
              Resend
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  keyboard: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    justifyContent: "space-between",
    padding: SPACING.xxxl,
  },

  logo: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: SPACING.huge,
  },

  title: {
    fontSize: 32,
    fontWeight: "700",
    color: COLORS.text,
  },

  subtitle: {
    marginTop: SPACING.md,
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.textSecondary,
  },

  email: {
    marginTop: SPACING.md,
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.primary,
  },

  form: {
    marginTop: SPACING.xxxl,
  },

  bottom: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: SPACING.xs,
    marginTop: SPACING.xxxl,
  },

  bottomText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  link: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
  },
});