import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";

import {
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

import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

import { COLORS } from "../../constants/colors";
import { SPACING } from "../../constants/spacing";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] =
    useState("");

  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  // Screen entrance animation
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

  const getPasswordStrength = () => {
    if (!password) {
      return 0;
    }

    let strength = 0;

    if (password.length >= 8) {
      strength++;
    }

    if (/[A-Z]/.test(password)) {
      strength++;
    }

    if (/[0-9]/.test(password)) {
      strength++;
    }

    if (/[^A-Za-z0-9]/.test(password)) {
      strength++;
    }

    return strength;
  };

  const passwordStrength = getPasswordStrength();

  const getPasswordStrengthText = () => {
    if (!password) {
      return "";
    }

    if (passwordStrength <= 1) {
      return "Weak password";
    }

    if (passwordStrength === 2) {
      return "Fair password";
    }

    if (passwordStrength === 3) {
      return "Good password";
    }

    return "Strong password";
  };

  const validateForm = () => {
    let hasError = false;

    setNameError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");

    if (!name.trim()) {
      setNameError("Name is required.");
      hasError = true;
    } else if (name.trim().length < 3) {
      setNameError("Name must be at least 3 characters.");
      hasError = true;
    }

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
    } else if (password.length < 8) {
      setPasswordError(
        "Password must be at least 8 characters."
      );
      hasError = true;
    }

    if (!confirmPassword.trim()) {
      setConfirmPasswordError(
        "Please confirm your password."
      );
      hasError = true;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError(
        "Passwords do not match."
      );
      hasError = true;
    }

    return !hasError;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      /*
       * Backend integration will be added later.
       *
       * Eventually:
       *
       * POST /auth/register
       *
       * {
       *   fullName: name,
       *   email,
       *   password
       * }
       */

      console.log("Registration data:", {
        fullName: name.trim(),
        email: email.trim(),
        password,
      });

      await new Promise((resolve) =>
        setTimeout(resolve, 1000)
      );

      router.push("/(auth)/verify");
    } catch (error) {
      console.error(
        "Registration failed:",
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
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.main,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: slideAnim,
                  },
                ],
              },
            ]}
          >
            {/* Logo */}

            <Text style={styles.logo}>
              TapQR
            </Text>

            {/* Header */}

            <View style={styles.header}>
              <Text style={styles.title}>
                Create your account
              </Text>

              <Text style={styles.subtitle}>
                Start managing your QR-powered
                business with TapQR.
              </Text>
            </View>

            {/* Form */}

            <View style={styles.form}>
              {/* Name */}

              <Input
                label="Full Name"
                value={name}
                onChangeText={setName}
                placeholder="Your full name"
                autoCapitalize="words"
                autoCorrect={false}
                error={nameError}
              />

              {/* Email */}

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

              {/* Password */}

              <View style={styles.passwordContainer}>
                <Input
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 8 characters"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={passwordError}
                />

                <Pressable
                  style={styles.passwordToggle}
                  onPress={() =>
                    setShowPassword(
                      (previous) =>
                        !previous
                    )
                  }
                >
                  <Text
                    style={
                      styles.passwordToggleText
                    }
                  >
                    {showPassword
                      ? "Hide"
                      : "Show"}
                  </Text>
                </Pressable>
              </View>

              {/* Password strength */}

              {password.length > 0 && (
                <View
                  style={
                    styles.strengthContainer
                  }
                >
                  <View
                    style={
                      styles.strengthBars
                    }
                  >
                    {[1, 2, 3, 4].map(
                      (level) => (
                        <View
                          key={level}
                          style={[
                            styles.strengthBar,

                            level <=
                            passwordStrength
                              ? styles.strengthBarActive
                              : styles.strengthBarInactive,
                          ]}
                        />
                      )
                    )}
                  </View>

                  <Text
                    style={
                      styles.strengthText
                    }
                  >
                    {getPasswordStrengthText()}
                  </Text>
                </View>
              )}

              {/* Confirm password */}

              <View style={styles.passwordContainer}>
                <Input
                  label="Confirm Password"
                  value={confirmPassword}
                  onChangeText={
                    setConfirmPassword
                  }
                  placeholder="Enter password again"
                  secureTextEntry={
                    !showConfirmPassword
                  }
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={
                    confirmPasswordError
                  }
                />

                <Pressable
                  style={styles.passwordToggle}
                  onPress={() =>
                    setShowConfirmPassword(
                      (previous) =>
                        !previous
                    )
                  }
                >
                  <Text
                    style={
                      styles.passwordToggleText
                    }
                  >
                    {showConfirmPassword
                      ? "Hide"
                      : "Show"}
                  </Text>
                </Pressable>
              </View>

              {/* Password match */}

              {confirmPassword.length > 0 &&
                !confirmPasswordError && (
                  <Text
                    style={styles.matchText}
                  >
                    ✓ Passwords match
                  </Text>
                )}

              {/* Create account */}

              <View style={styles.buttonContainer}>
                <Button
                  title="Create Account"
                  onPress={handleRegister}
                  loading={loading}
                />
              </View>
            </View>

            {/* Login */}

            <View style={styles.bottom}>
              <Text style={styles.bottomText}>
                Already have an account?
              </Text>

              <Pressable
                onPress={() =>
                  router.push(
                    "/(auth)/login"
                  )
                }
              >
                <Text style={styles.link}>
                  Sign in
                </Text>
              </Pressable>
            </View>
          </Animated.View>
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
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl,
  },

  main: {
    flex: 1,
  },

  logo: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: SPACING.xxxl,
  },

  header: {
    marginBottom: SPACING.xxl,
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: COLORS.text,
  },

  subtitle: {
    marginTop: SPACING.sm,
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.textSecondary,
    maxWidth: 500,
  },

  form: {
    width: "100%",
  },

  passwordContainer: {
    position: "relative",
  },

  passwordToggle: {
    position: "absolute",
    right: SPACING.md,
    top: 40,
    padding: SPACING.xs,
  },

  passwordToggleText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "600",
  },

  strengthContainer: {
    marginTop: -SPACING.sm,
    marginBottom: SPACING.lg,
  },

  strengthBars: {
    flexDirection: "row",
    gap: 5,
  },

  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 4,
  },

  strengthBarActive: {
    backgroundColor: COLORS.primary,
  },

  strengthBarInactive: {
    backgroundColor: COLORS.border,
  },

  strengthText: {
    marginTop: 6,
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  matchText: {
    marginTop: -SPACING.sm,
    marginBottom: SPACING.lg,
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.success,
  },

  buttonContainer: {
    marginTop: SPACING.sm,
  },

  bottom: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: SPACING.xs,
    marginTop: SPACING.xxxl,
    paddingBottom: SPACING.lg,
  },

  bottomText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  link: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "700",
  },
});