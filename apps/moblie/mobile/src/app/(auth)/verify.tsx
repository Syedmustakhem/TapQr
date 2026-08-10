import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";

import {
  Animated,
  Keyboard,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import Button from "../../components/ui/Button";

import { COLORS } from "../../constants/colors";
import { SPACING } from "../../constants/spacing";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

export default function VerifyScreen() {
  const [otp, setOtp] = useState(
    Array(OTP_LENGTH).fill("")
  );

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [secondsLeft, setSecondsLeft] =
    useState(RESEND_SECONDS);

  const inputRefs = useRef<
    Array<TextInput | null>
  >([]);

  const fadeAnim = useRef(
    new Animated.Value(0)
  ).current;

  const slideAnim = useRef(
    new Animated.Value(30)
  ).current;

  /*
   * Screen entrance animation
   */
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

  /*
   * OTP countdown
   */
  useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((previous) => {
        if (previous <= 1) {
          clearInterval(timer);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft]);

  /*
   * Handle OTP input
   */
  const handleOtpChange = (
    value: string,
    index: number
  ) => {
    setError("");

    /*
     * Only allow numbers.
     */
    const numericValue =
      value.replace(/[^0-9]/g, "");

    if (!numericValue) {
      const updatedOtp = [...otp];

      updatedOtp[index] = "";

      setOtp(updatedOtp);

      return;
    }

    const digit =
      numericValue[numericValue.length - 1];

    const updatedOtp = [...otp];

    updatedOtp[index] = digit;

    setOtp(updatedOtp);

    /*
     * Automatically move to next box.
     */
    if (
      index < OTP_LENGTH - 1
    ) {
      inputRefs.current[
        index + 1
      ]?.focus();
    } else {
      Keyboard.dismiss();
    }
  };

  /*
   * Handle backspace
   */
  const handleKeyPress = (
    event: any,
    index: number
  ) => {
    if (
      event.nativeEvent.key === "Backspace" &&
      !otp[index] &&
      index > 0
    ) {
      inputRefs.current[
        index - 1
      ]?.focus();
    }
  };

  /*
   * Verify OTP
   */
  const handleVerify = async () => {
    const enteredOtp = otp.join("");

    setError("");

    if (enteredOtp.length !== OTP_LENGTH) {
      setError(
        "Please enter the complete verification code."
      );

      return;
    }

    try {
      setLoading(true);

      console.log(
        "Verifying OTP:",
        enteredOtp
      );

      /*
       * Backend verification will be connected here.
       *
       * Example later:
       *
       * POST /auth/verify
       *
       * {
       *   email,
       *   otp
       * }
       */

      await new Promise((resolve) =>
        setTimeout(resolve, 1000)
      );

      /*
       * Temporary navigation.
       *
       * Later this will happen only
       * after successful backend verification.
       */
      router.replace("/app/business");
    } catch (error) {
      console.error(
        "OTP verification failed:",
        error
      );

      setError(
        "Verification failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * Resend OTP
   */
  const handleResend = async () => {
    if (secondsLeft > 0) {
      return;
    }

    try {
      setError("");

      console.log("Resending OTP...");

      /*
       * Backend resend API will be connected later.
       */

      await new Promise((resolve) =>
        setTimeout(resolve, 700)
      );

      setOtp(
        Array(OTP_LENGTH).fill("")
      );

      setSecondsLeft(
        RESEND_SECONDS
      );

      inputRefs.current[0]?.focus();
    } catch (error) {
      console.error(
        "Resend OTP failed:",
        error
      );

      setError(
        "Unable to resend the code."
      );
    }
  };

  const formattedTime =
    `00:${secondsLeft
      .toString()
      .padStart(2, "0")}`;

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[
          styles.content,
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
            Verify your account
          </Text>

          <Text style={styles.subtitle}>
            Enter the 6-digit verification
            code sent to your email address.
          </Text>
        </View>

        {/* OTP */}

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] =
                  ref;
              }}
              value={digit}
              onChangeText={(value) =>
                handleOtpChange(
                  value,
                  index
                )
              }
              onKeyPress={(event) =>
                handleKeyPress(
                  event,
                  index
                )
              }
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              selectTextOnFocus
              style={[
                styles.otpInput,

                digit
                  ? styles.otpInputFilled
                  : null,

                error
                  ? styles.otpInputError
                  : null,
              ]}
            />
          ))}
        </View>

        {/* Error */}

        {error ? (
          <Text style={styles.error}>
            {error}
          </Text>
        ) : null}

        {/* Resend */}

        <View style={styles.resendContainer}>
          {secondsLeft > 0 ? (
            <Text style={styles.timerText}>
              Resend code in{" "}
              <Text
                style={
                  styles.timerHighlight
                }
              >
                {formattedTime}
              </Text>
            </Text>
          ) : (
            <Pressable
              onPress={handleResend}
            >
              <Text
                style={styles.resendButton}
              >
                Resend code
              </Text>
            </Pressable>
          )}
        </View>

        {/* Verify button */}

        <View style={styles.buttonContainer}>
          <Button
            title="Verify Account"
            onPress={handleVerify}
            loading={loading}
          />
        </View>

        {/* Back */}

        <Pressable
          style={styles.backButton}
          onPress={() =>
            router.back()
          }
        >
          <Text style={styles.backText}>
            ← Back
          </Text>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl,
  },

  logo: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: SPACING.xxxl,
  },

  header: {
    marginBottom: SPACING.xxxl,
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

  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: SPACING.sm,
  },

  otpInput: {
    width: 48,
    height: 58,

    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,

    backgroundColor: COLORS.surface,

    fontSize: 22,
    fontWeight: "700",

    color: COLORS.text,
  },

  otpInputFilled: {
    borderColor: COLORS.primary,
  },

  otpInputError: {
    borderColor: COLORS.danger,
  },

  error: {
    marginTop: SPACING.md,
    fontSize: 13,
    color: COLORS.danger,
    fontWeight: "500",
  },

  resendContainer: {
    alignItems: "center",
    marginTop: SPACING.xxl,
  },

  timerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  timerHighlight: {
    color: COLORS.primary,
    fontWeight: "700",
  },

  resendButton: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "700",
  },

  buttonContainer: {
    marginTop: SPACING.xxl,
  },

  backButton: {
    alignItems: "center",
    marginTop: SPACING.xxl,
  },

  backText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
});