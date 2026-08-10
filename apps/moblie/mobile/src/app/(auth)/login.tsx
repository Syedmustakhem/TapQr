import { router } from "expo-router";
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

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setEmailError("");
    setPasswordError("");

    let hasError = false;

    if (!email.trim()) {
      setEmailError("Email is required.");
      hasError = true;
    } else if (!email.includes("@")) {
      setEmailError("Enter a valid email address.");
      hasError = true;
    }

    if (!password.trim()) {
      setPasswordError("Password is required.");
      hasError = true;
    }

    if (hasError) {
      return;
    }

    try {
      setLoading(true);

      console.log("Login:", {
        email: email.trim(),
        password,
      });

      // Temporary navigation.
      // Backend authentication will be connected later.
      router.replace("/app/dashboard");
    } catch (error) {
      console.error("Login failed:", error);
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
          showsVerticalScrollIndicator={false}
        >
          <View>
            <Text style={styles.logo}>TapQR</Text>

            <Text style={styles.title}>
              Welcome back
            </Text>

            <Text style={styles.subtitle}>
              Sign in to manage your business
              and QR codes.
            </Text>

            <View style={styles.form}>
              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={emailError}
              />

              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                error={passwordError}
              />

              <Text style={styles.forgotPassword}>
                Forgot password?
              </Text>

              <Button
                title="Sign In"
                onPress={handleLogin}
                loading={loading}
              />
            </View>
          </View>

          <View style={styles.bottom}>
            <Text style={styles.bottomText}>
              Don't have an account?
            </Text>

            <Text
              style={styles.link}
              onPress={() =>
                router.push("/(auth)/register")
              }
            >
              Create account
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

  form: {
    marginTop: SPACING.xxxl,
  },

  forgotPassword: {
    textAlign: "right",
    marginBottom: SPACING.xl,
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "500",
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