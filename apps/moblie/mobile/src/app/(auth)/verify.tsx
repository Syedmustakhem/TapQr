
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from "react-native";

import {
  getAuthErrorMessage,
  sendEmailOtp,
  sendWhatsappOtp,
  verifyEmailOtp,
  verifyWhatsappOtp,
} from "../../api/authApi";
import { useAuthStore } from "../../store/auth.store";

const BLUE = "#2F6BFF";
const DARK = "#080B12";
const MUTED = "#697386";
const BORDER = "#E3E8F0";
const WHITE = "#FFFFFF";
const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

type AuthMethod = "email" | "whatsapp";
type AuthMode = "login" | "register";

export default function VerifyScreen() {
  const params = useLocalSearchParams<{
    method?: string;
    identifier?: string;
    mode?: string;
    fullName?: string;
  }>();

  const method: AuthMethod =
    params.method === "whatsapp" ? "whatsapp" : "email";

  const mode: AuthMode =
    params.mode === "register" ? "register" : "login";

  const identifier =
    typeof params.identifier === "string" ? params.identifier : "";

  const fullName =
    typeof params.fullName === "string" ? params.fullName : "";

  const [otp, setOtp] = useState<string[]>(
    Array(OTP_LENGTH).fill("")
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  const inputRefs = useRef<Array<TextInput | null>>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;

  const setTokens = useAuthStore((state) => state.setTokens);

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]);

    animation.start();

    const focusTimer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 500);

    return () => {
      clearTimeout(focusTimer);
      animation.stop();
    };
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    if (secondsLeft <= 0) return;

    const timer = setInterval(() => {
      setSecondsLeft((previous) =>
        previous > 0 ? previous - 1 : 0
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft]);

  function handleOtpChange(value: string, index: number) {
    setError("");

    const numericValue = value.replace(/[^0-9]/g, "");

    if (numericValue.length > 1) {
      const digits = numericValue.slice(0, OTP_LENGTH).split("");
      const nextOtp = [...otp];

      digits.forEach((digit, offset) => {
        if (index + offset < OTP_LENGTH) {
          nextOtp[index + offset] = digit;
        }
      });

      setOtp(nextOtp);

      const nextIndex = Math.min(
        index + digits.length,
        OTP_LENGTH - 1
      );

      inputRefs.current[nextIndex]?.focus();

      if (nextOtp.every(Boolean)) Keyboard.dismiss();
      return;
    }

    const nextOtp = [...otp];
    nextOtp[index] = numericValue.slice(-1);
    setOtp(nextOtp);

    if (numericValue && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (index === OTP_LENGTH - 1 && numericValue) {
      Keyboard.dismiss();
    }
  }

  function handleKeyPress(
    event: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) {
    if (
      event.nativeEvent.key === "Backspace" &&
      !otp[index] &&
      index > 0
    ) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerify() {
    const enteredOtp = otp.join("");
    setError("");

    if (!identifier) {
      setError(
        "Your verification session is incomplete. Please go back and try again."
      );
      return;
    }

    if (enteredOtp.length !== OTP_LENGTH) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    try {
      setLoading(true);

      const response =
        method === "whatsapp"
          ? await verifyWhatsappOtp(
              identifier,
              enteredOtp,
              mode,
              mode === "register" ? fullName || undefined : undefined
            )
          : await verifyEmailOtp(
              identifier,
              enteredOtp,
              mode,
              mode === "register" ? fullName || undefined : undefined
            );

      const authData = response?.data ?? response;
      const accessToken = authData?.accessToken;
      const refreshToken = authData?.refreshToken;

      if (!accessToken) {
        throw new Error(
          "Authentication succeeded but no access token was returned."
        );
      }

      await setTokens(accessToken, refreshToken);

      Keyboard.dismiss();
      router.replace("/app/business");
    } catch (verificationError) {
      console.error("OTP verification failed:", verificationError);
      setError(getAuthErrorMessage(verificationError));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (secondsLeft > 0 || loading || !identifier) return;

    try {
      setError("");
      setLoading(true);

      if (method === "whatsapp") {
        await sendWhatsappOtp(identifier, mode);
      } else {
        await sendEmailOtp(identifier, mode);
      }

      setOtp(Array(OTP_LENGTH).fill(""));
      setSecondsLeft(RESEND_SECONDS);

      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } catch (resendError) {
      console.error("Resend OTP failed:", resendError);
      setError(getAuthErrorMessage(resendError));
    } finally {
      setLoading(false);
    }
  }

  function handleBack() {
    if (loading) return;
    Keyboard.dismiss();
    router.back();
  }

  const formattedTime = `00:${secondsLeft
    .toString()
    .padStart(2, "0")}`;

  const isComplete = otp.join("").length === OTP_LENGTH;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View
        style={[
          styles.screen,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.topBar}>
          <Pressable
            onPress={handleBack}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="arrow-back" size={20} color={DARK} />
          </Pressable>

          <View style={styles.brand}>
            <View style={styles.brandMark}>
              <Ionicons
                name="qr-code-outline"
                size={21}
                color={WHITE}
              />
            </View>
            <Text style={styles.brandText}>TapQR</Text>
          </View>

          <View style={styles.topSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroIcon}>
            <Ionicons
              name={
                method === "whatsapp"
                  ? "logo-whatsapp"
                  : "shield-checkmark-outline"
              }
              size={30}
              color={method === "whatsapp" ? "#20B86A" : BLUE}
            />
          </View>

          <View style={styles.eyebrowBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.eyebrow}>IDENTITY VERIFICATION</Text>
          </View>

          <Text style={styles.title}>
            Enter your{"\n"}code.
          </Text>

          <Text style={styles.subtitle}>
            We sent a 6-digit verification code to:
          </Text>

          <Text style={styles.identifier} numberOfLines={2}>
            {identifier || "your account"}
          </Text>

          <View style={styles.methodCard}>
            <View
              style={[
                styles.methodIcon,
                method === "whatsapp"
                  ? styles.whatsappIcon
                  : styles.emailIcon,
              ]}
            >
              <Ionicons
                name={
                  method === "whatsapp"
                    ? "logo-whatsapp"
                    : "mail-outline"
                }
                size={20}
                color={method === "whatsapp" ? "#20B86A" : BLUE}
              />
            </View>

            <View style={styles.methodContent}>
              <Text style={styles.methodLabel}>Verification method</Text>
              <Text style={styles.methodValue}>
                {method === "whatsapp" ? "WhatsApp OTP" : "Email OTP"}
              </Text>
            </View>

            <View style={styles.digitPill}>
              <Text style={styles.digitPillText}>6 DIGITS</Text>
            </View>
          </View>

          <View style={styles.otpSection}>
            <View style={styles.otpLabelRow}>
              <Text style={styles.otpLabel}>Verification code</Text>
              <Text style={styles.otpCount}>
                {otp.filter(Boolean).length}/{OTP_LENGTH}
              </Text>
            </View>

            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  value={digit}
                  onChangeText={(value) =>
                    handleOtpChange(value, index)
                  }
                  onKeyPress={(event) =>
                    handleKeyPress(event, index)
                  }
                  keyboardType="number-pad"
                  inputMode="numeric"
                  maxLength={OTP_LENGTH}
                  selectTextOnFocus
                  textAlign="center"
                  editable={!loading}
                  accessibilityLabel={`Verification digit ${index + 1}`}
                  style={[
                    styles.otpInput,
                    digit ? styles.otpInputFilled : undefined,
                    error ? styles.otpInputError : undefined,
                  ]}
                />
              ))}
            </View>

            <View style={styles.otpHintRow}>
              <Ionicons
                name="information-circle-outline"
                size={15}
                color="#8994A5"
              />
              <Text style={styles.otpHint}>
                Enter each digit or paste your complete code.
              </Text>
            </View>
          </View>

          {error ? (
            <View style={styles.errorBox} accessibilityRole="alert">
              <Ionicons
                name="alert-circle-outline"
                size={19}
                color="#DC2626"
              />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Pressable
            onPress={handleVerify}
            disabled={loading || !isComplete}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.verifyButton,
              (!isComplete || loading) && styles.verifyButtonDisabled,
              pressed && isComplete && !loading
                ? styles.verifyButtonPressed
                : undefined,
            ]}
          >
            {loading ? (
              <ActivityIndicator color={WHITE} />
            ) : (
              <>
                <Text style={styles.verifyText}>
                  Verify and continue
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={19}
                  color={WHITE}
                />
              </>
            )}
          </Pressable>

          <View style={styles.resendContainer}>
            {secondsLeft > 0 ? (
              <Text style={styles.resendText}>
                Resend code in{" "}
                <Text style={styles.resendHighlight}>
                  {formattedTime}
                </Text>
              </Text>
            ) : (
              <Pressable
                onPress={handleResend}
                disabled={loading}
                accessibilityRole="button"
              >
                <Text style={styles.resendButton}>
                  Resend verification code
                </Text>
              </Pressable>
            )}
          </View>

          <View style={styles.securityCard}>
            <View style={styles.securityIcon}>
              <Ionicons
                name="shield-checkmark-outline"
                size={19}
                color={BLUE}
              />
            </View>
            <View style={styles.securityContent}>
              <Text style={styles.securityTitle}>
                Secure passwordless access
              </Text>
              <Text style={styles.securityText}>
                Keep your verification code private. Never share it with
                anyone.
              </Text>
            </View>
            <Ionicons
              name="checkmark-circle"
              size={19}
              color="#20A875"
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Ionicons
            name="lock-closed-outline"
            size={12}
            color="#8994A5"
          />
          <Text style={styles.footerText}>
            Secure verification powered by TapQR
          </Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F6F8FC",
  },
  screen: {
    flex: 1,
    paddingHorizontal: 20,
  },
  topBar: {
    height: 68,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  brandMark: {
    width: 35,
    height: 35,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BLUE,
  },
  brandText: {
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: -0.6,
    color: DARK,
  },
  topSpacer: {
    width: 42,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 20,
    paddingBottom: 24,
  },
  heroIcon: {
    width: 61,
    height: 61,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8EFFF",
    borderWidth: 1,
    borderColor: "#DCE6FF",
    marginBottom: 21,
  },
  eyebrowBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#EAF0FF",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BLUE,
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.1,
    color: BLUE,
  },
  title: {
    marginTop: 14,
    fontSize: 42,
    lineHeight: 45,
    fontWeight: "800",
    letterSpacing: -1.8,
    color: DARK,
  },
  subtitle: {
    marginTop: 14,
    fontSize: 14,
    lineHeight: 22,
    color: MUTED,
  },
  identifier: {
    marginTop: 5,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "700",
    color: DARK,
  },
  methodCard: {
    marginTop: 23,
    minHeight: 72,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: WHITE,
    paddingHorizontal: 13,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
  },
  methodIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  whatsappIcon: {
    backgroundColor: "#E7F9EF",
  },
  emailIcon: {
    backgroundColor: "#EAF0FF",
  },
  methodContent: {
    flex: 1,
    marginLeft: 12,
  },
  methodLabel: {
    fontSize: 10,
    color: "#8994A5",
  },
  methodValue: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: "800",
    color: DARK,
  },
  digitPill: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#F1F4F9",
  },
  digitPillText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.7,
    color: "#667085",
  },
  otpSection: {
    marginTop: 25,
  },
  otpLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 11,
  },
  otpLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: DARK,
  },
  otpCount: {
    fontSize: 11,
    fontWeight: "700",
    color: MUTED,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 7,
  },
  otpInput: {
    flex: 1,
    minWidth: 0,
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DCE3EE",
    backgroundColor: WHITE,
    fontSize: 21,
    fontWeight: "800",
    color: DARK,
    paddingHorizontal: 0,
  },
  otpInputFilled: {
    borderColor: BLUE,
    backgroundColor: "#F2F6FF",
  },
  otpInputError: {
    borderColor: "#DC2626",
  },
  otpHintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  otpHint: {
    flex: 1,
    fontSize: 10,
    lineHeight: 16,
    color: "#8994A5",
  },
  errorBox: {
    marginTop: 15,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: "#B91C1C",
  },
  verifyButton: {
    minHeight: 56,
    marginTop: 21,
    borderRadius: 15,
    backgroundColor: BLUE,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  verifyButtonDisabled: {
    opacity: 0.45,
    shadowOpacity: 0,
    elevation: 0,
  },
  verifyButtonPressed: {
    transform: [{ scale: 0.985 }],
  },
  verifyText: {
    fontSize: 14,
    fontWeight: "800",
    color: WHITE,
  },
  resendContainer: {
    alignItems: "center",
    marginTop: 18,
    minHeight: 24,
    justifyContent: "center",
  },
  resendText: {
    fontSize: 12,
    color: MUTED,
  },
  resendHighlight: {
    fontWeight: "800",
    color: BLUE,
  },
  resendButton: {
    fontSize: 12,
    fontWeight: "800",
    color: BLUE,
    paddingVertical: 5,
  },
  securityCard: {
    marginTop: 25,
    padding: 13,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E0E8FA",
    backgroundColor: WHITE,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  securityIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF0FF",
  },
  securityContent: {
    flex: 1,
  },
  securityTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: DARK,
  },
  securityText: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 15,
    color: MUTED,
  },
  footer: {
    minHeight: 35,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingBottom: 8,
  },
  footerText: {
    fontSize: 10,
    color: "#8994A5",
  },
});
