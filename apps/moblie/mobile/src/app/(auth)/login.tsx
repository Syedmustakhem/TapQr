import React, { useEffect, useRef, useState } from "react";

import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { router } from "expo-router";

import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

import { COLORS } from "../../constants/colors";
import { SPACING } from "../../constants/spacing";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),

      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const validateForm = () => {
    let valid = true;

    setEmailError("");
    setPasswordError("");

    if (!email.trim()) {
      setEmailError("Email is required");
      valid = false;
    } else if (!email.includes("@")) {
      setEmailError("Enter a valid email address");
      valid = false;
    }

    if (!password.trim()) {
      setPasswordError("Password is required");
      valid = false;
    } else if (password.length < 6) {
      setPasswordError("Password must contain at least 6 characters");
      valid = false;
    }

    return valid;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    // Temporary frontend-only loading.
    // Backend authentication will be connected later.
    setLoading(true);

    setTimeout(() => {
      setLoading(false);

      Alert.alert(
        "Frontend Ready",
        "Login UI is working. We will connect the authentication API after the backend is deployed."
      );
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.container,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Brand */}
            <View style={styles.brandContainer}>
              <Text style={styles.logo}>TapQR</Text>
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Welcome back 👋</Text>

              <Text style={styles.subtitle}>
                Sign in to manage your business and QR codes.
              </Text>
            </View>

            {/* Form */}
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

              <View style={styles.passwordWrapper}>
                <Input
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  error={passwordError}
                />

                <Pressable
                  style={styles.showPassword}
                  onPress={() => setShowPassword((previous) => !previous)}
                >
                  <Text style={styles.showPasswordText}>
                    {showPassword ? "Hide" : "Show"}
                  </Text>
                </Pressable>
              </View>

              {/* Forgot password */}
              <Pressable
                style={styles.forgotButton}
                onPress={() => {
                  Alert.alert(
                    "Coming next",
                    "Forgot password will be built in the next authentication step."
                  );
                }}
              >
                <Text style={styles.forgotText}>Forgot password?</Text>
              </Pressable>

              {/* Login */}
              <Button
                title="Sign In"
                onPress={handleLogin}
                loading={loading}
              />

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.divider} />

                <Text style={styles.orText}>OR</Text>

                <View style={styles.divider} />
              </View>

              {/* Google */}
              <Pressable
                style={({ pressed }) => [
                  styles.googleButton,
                  pressed && styles.googlePressed,
                ]}
                onPress={() => {
                  Alert.alert(
                    "Coming next",
                    "Google authentication will be connected after the authentication backend is ready."
                  );
                }}
              >
                <View style={styles.googleIcon}>
                  <Text style={styles.googleIconText}>G</Text>
                </View>

                <Text style={styles.googleText}>
                  Continue with Google
                </Text>
              </Pressable>
            </View>

            {/* Register */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>
                Don't have an account?
              </Text>

              <Pressable
                onPress={() => router.push("/(auth)/register")}
              >
                <Text style={styles.registerLink}> Create account</Text>
              </Pressable>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  flex: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
  },

  container: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xxl,
  },

  brandContainer: {
    marginBottom: SPACING.xxxl,
  },

  logo: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: -0.8,
  },

  header: {
    marginBottom: SPACING.xxl,
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },

  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.textSecondary,
    maxWidth: 420,
  },

  form: {
    width: "100%",
  },

  passwordWrapper: {
    position: "relative",
  },

  showPassword: {
    position: "absolute",
    right: SPACING.md,
    top: 40,
    padding: SPACING.xs,
  },

  showPasswordText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "600",
  },

  forgotButton: {
    alignSelf: "flex-end",
    marginBottom: SPACING.lg,
  },

  forgotText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "600",
  },

  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: SPACING.xxl,
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },

  orText: {
    marginHorizontal: SPACING.md,
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },

  googleButton: {
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  googlePressed: {
    opacity: 0.7,
  },

  googleIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.sm,
    backgroundColor: COLORS.background,
  },

  googleIconText: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.primary,
  },

  googleText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "600",
  },

  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "auto",
    paddingTop: SPACING.xxxl,
  },

  registerText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },

  registerLink: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "700",
  },
});