import React, { useState } from "react";

import {

  ActivityIndicator,

  KeyboardAvoidingView,

  Platform,

  Pressable,

  SafeAreaView,

  ScrollView,

  StatusBar,

  StyleSheet,

  Text,

  TextInput,

  View,

} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { router } from "expo-router";

import Constants from "expo-constants";

import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";



import {

  googleLogin,

  identifyAccount,

  sendEmailOtp,

  sendWhatsappOtp,

  getAuthErrorMessage,

  type AuthMode,

} from "../../api/authApi";

import { useAuthStore } from "../../store/auth.store";





const BLUE = "#2F6BFF";

const DARK = "#080B12";

const PAGE = "#F6F8FC";

const BORDER = "rgba(0,0,0,0.10)";

const WHITE = "#FFFFFF";



const GOOGLE_WEB_CLIENT_ID =

  Constants.expoConfig?.extra?.googleWebClientId as

    | string

    | undefined;



const GOOGLE_ANDROID_CLIENT_ID =

  Constants.expoConfig?.extra?.googleAndroidClientId as

    | string

    | undefined;

if (GOOGLE_WEB_CLIENT_ID) {
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
  });
}



type Step = "choices" | "identifier" | "details";

type Method = "email" | "whatsapp";



export default function LoginScreen() {

  const [step, setStep] = useState<Step>("choices");

  const [method, setMethod] = useState<Method>("email");

  const [identifier, setIdentifier] = useState("");

  const [phoneNumber, setPhoneNumber] = useState("");

  const [fullName, setFullName] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");



  const setTokens = useAuthStore((state) => state.setTokens);



  function clearMessages() {

    setError("");

    setSuccess("");

  }



  function chooseMethod(next: Method) {

    clearMessages();

    setMethod(next);

    setIdentifier("");

    setPhoneNumber("");

    setFullName("");

    setStep("identifier");

  }



  function goBack() {

    clearMessages();



    if (step === "details") {

      setFullName("");

      setStep("identifier");

      return;

    }



    if (step === "identifier") {

      setStep("choices");

    }

  }



  function getIdentifier(): string {

    if (method === "email") {

      return identifier.trim().toLowerCase();

    }



    const digits = phoneNumber

      .replace(/\D/g, "")

      .replace(/^0+/, "");



    return `+91${digits}`;

  }



  function validateIdentifier(value: string): boolean {

    if (!value) {

      setError(

        method === "email"

          ? "Please enter your email address."

          : "Please enter your WhatsApp number."

      );

      return false;

    }



    if (

      method === "email" &&

      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

    ) {

      setError("Please enter a valid email address.");

      return false;

    }



    if (

      method === "whatsapp" &&

      !/^\+[1-9]\d{6,14}$/.test(value)

    ) {

      setError("Please enter a valid WhatsApp number.");

      return false;

    }



    return true;

  }



  async function sendOtp(value: string, mode: AuthMode) {

    if (method === "email") {

      await sendEmailOtp(value, mode);

    } else {

      await sendWhatsappOtp(value, mode);

    }

  }



  async function identifyAndContinue() {

    clearMessages();



    const value = getIdentifier();



    if (!validateIdentifier(value)) {

      return;

    }



    setLoading(true);



    try {

      const response = await identifyAccount(

        value,

        method === "email" ? "email" : "phone"

      );



      if (!response?.data) {

        throw new Error("Unable to identify this account.");

      }



      if (response.data.exists) {

        const mode: AuthMode = "login";



        await sendOtp(value, mode);



        router.push({

          pathname: "/(auth)/verify",

          params: {

            method,

            identifier: value,

            mode,

          },

        });



        return;

      }



      setStep("details");

      setSuccess("Let's create your TapQR account.");

    } catch (err) {

      setError(getAuthErrorMessage(err));

    } finally {

      setLoading(false);

    }

  }



  async function continueRegistration() {

    clearMessages();



    const name = fullName.trim();



    if (name.length < 3) {

      setError("Full name must be at least 3 characters.");

      return;

    }



    const value = getIdentifier();



    if (!validateIdentifier(value)) {

      return;

    }



    setLoading(true);



    try {

      await sendOtp(value, "register");



      router.push({

        pathname: "/(auth)/verify",

        params: {

          method,

          identifier: value,

          mode: "register",

          fullName: name,

        },

      });

    } catch (err) {

      setError(getAuthErrorMessage(err));

    } finally {

      setLoading(false);

    }

  }



  async function handleGoogle() {
    clearMessages();

    if (!GOOGLE_WEB_CLIENT_ID) {
      setError("Google sign-in configuration is missing. Check app.json.");
      return;
    }

    if (Platform.OS === "web") {
      setError("Native Google sign-in is configured for the Android app.");
      return;
    }

    setLoading(true);

    try {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      const signInResult = await GoogleSignin.signIn();

      if (signInResult.type === "cancelled") {
        return;
      }

      const tokens = await GoogleSignin.getTokens();
      const idToken = tokens.idToken;

      if (!idToken) {
        throw new Error(
          "Google did not return an ID token. Check your Web OAuth client ID."
        );
      }

      const response = await googleLogin(idToken, "login");
      const authData = response?.data ?? response;

      const accessToken =
        authData?.accessToken ?? authData?.data?.accessToken;
      const refreshToken =
        authData?.refreshToken ?? authData?.data?.refreshToken;

      if (!accessToken) {
        throw new Error(
          "Google authentication succeeded, but TapQR did not return an access token."
        );
      }

      await setTokens(accessToken, refreshToken);
      router.replace("/app/business");
    } catch (err: any) {
      console.error("Google sign-in failed:", err);

      if (err?.code === statusCodes.SIGN_IN_CANCELLED) {
        return;
      }

      if (err?.code === statusCodes.IN_PROGRESS) {
        setError("Google sign-in is already in progress.");
        return;
      }

      if (err?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setError("Google Play Services is unavailable or needs updating.");
        return;
      }

      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const stepLabel =

    step === "choices"

      ? "Choose your sign-in method"

      : step === "identifier"

        ? method === "email"

          ? "Email authentication"

          : "WhatsApp authentication"

        : "Create your account";



  return (

    <SafeAreaView style={styles.safeArea}>

      <StatusBar barStyle="dark-content" backgroundColor={PAGE} />



      <KeyboardAvoidingView

        style={styles.flex}

        behavior={Platform.OS === "ios" ? "padding" : undefined}

      >

        <ScrollView

          contentContainerStyle={styles.scrollContent}

          keyboardShouldPersistTaps="handled"

          showsVerticalScrollIndicator={false}

        >

          <View style={styles.page}>

            <View style={styles.brandHeader}>

              <View style={styles.brand}>

                <View style={styles.brandIcon}>

                  <Ionicons

                    name="qr-code-outline"

                    size={23}

                    color={WHITE}

                  />

                </View>

                <Text style={styles.brandName}>TapQR</Text>

              </View>



              <View style={styles.secureBadge}>

                <Ionicons

                  name="shield-checkmark-outline"

                  size={14}

                  color={BLUE}

                />

                <Text style={styles.secureBadgeText}>

                  Secure sign in

                </Text>

              </View>

            </View>



            <View style={styles.card}>

              <Text style={styles.stepLabel}>{stepLabel}</Text>



              {step === "choices" && (

                <>

                  <View style={styles.headingIcon}>

                    <Ionicons

                      name="qr-code-outline"

                      size={25}

                      color={BLUE}

                    />

                  </View>



                  <Text style={styles.title}>

                    Sign in to TapQR.

                  </Text>



                  <Text style={styles.description}>

                    Access your digital profile, QR codes and business

                    tools.

                  </Text>



                  <View style={styles.options}>

                    <Pressable

                      onPress={handleGoogle}

                      disabled={loading}

                      style={({ pressed }) => [

                        styles.optionButton,

                        pressed && styles.pressed,

                      ]}

                    >

                      <View style={styles.googleIcon}>

                        <Text style={styles.googleG}>G</Text>

                      </View>



                      <View style={styles.optionCopy}>

                        <Text style={styles.optionTitle}>

                          Continue with Google

                        </Text>

                        <Text style={styles.optionSubtitle}>

                          Sign in with your Google account

                        </Text>

                      </View>



                      <Ionicons

                        name="arrow-forward"

                        size={18}

                        color="#777F8E"

                      />

                    </Pressable>



                    <Pressable

                      onPress={() => chooseMethod("whatsapp")}

                      disabled={loading}

                      style={({ pressed }) => [

                        styles.optionButton,

                        pressed && styles.pressed,

                      ]}

                    >

                      <View style={styles.whatsappIcon}>

                        <Ionicons

                          name="logo-whatsapp"

                          size={23}

                          color="#25D366"

                        />

                      </View>



                      <View style={styles.optionCopy}>

                        <Text style={styles.optionTitle}>

                          Continue with WhatsApp

                        </Text>

                        <Text style={styles.optionSubtitle}>

                          Login or create account with OTP

                        </Text>

                      </View>



                      <Ionicons

                        name="arrow-forward"

                        size={18}

                        color="#777F8E"

                      />

                    </Pressable>



                    <View style={styles.dividerRow}>

                      <View style={styles.divider} />

                      <Text style={styles.dividerText}>OR</Text>

                      <View style={styles.divider} />

                    </View>



                    <Pressable

                      onPress={() => chooseMethod("email")}

                      disabled={loading}

                      style={({ pressed }) => [

                        styles.emailOption,

                        pressed && styles.pressed,

                      ]}

                    >

                      <View style={styles.emailIcon}>

                        <Text style={styles.emailAt}>@</Text>

                      </View>



                      <View style={styles.optionCopy}>

                        <Text style={styles.emailOptionTitle}>

                          Continue with Email

                        </Text>

                        <Text style={styles.emailOptionSubtitle}>

                          Login or create account with OTP

                        </Text>

                      </View>



                      <Ionicons

                        name="arrow-forward"

                        size={18}

                        color="rgba(255,255,255,0.5)"

                      />

                    </Pressable>

                  </View>

                </>

              )}



              {step === "identifier" && (

                <>

                  <Pressable

                    onPress={goBack}

                    disabled={loading}

                    style={styles.backButton}

                  >

                    <Ionicons

                      name="arrow-back"

                      size={17}

                      color="#667085"

                    />

                    <Text style={styles.backText}>

                      Back to login options

                    </Text>

                  </Pressable>



                  <View style={styles.headingIcon}>

                    {method === "email" ? (

                      <Text style={styles.emailAtBlue}>@</Text>

                    ) : (

                      <Ionicons

                        name="logo-whatsapp"

                        size={24}

                        color={BLUE}

                      />

                    )}

                  </View>



                  <Text style={styles.title}>

                    Continue to TapQR.

                  </Text>



                  <Text style={styles.description}>

                    Enter your{" "}

                    {method === "email"

                      ? "email address"

                      : "WhatsApp number"}{" "}

                    and we'll automatically determine whether you need

                    to sign in or create an account.

                  </Text>



                  <View style={styles.form}>

                    <Text style={styles.inputLabel}>

                      {method === "email"

                        ? "Email address"

                        : "WhatsApp number"}

                    </Text>



                    {method === "email" ? (

                      <TextInput

                        value={identifier}

                        onChangeText={(value) => {

                          setIdentifier(value);

                          clearMessages();

                        }}

                        placeholder="you\@example.com"

                        placeholderTextColor="#9AA3B2"

                        keyboardType="email-address"

                        autoCapitalize="none"

                        autoCorrect={false}

                        autoComplete="email"

                        editable={!loading}

                        returnKeyType="go"

                        onSubmitEditing={() =>

                          void identifyAndContinue()

                        }

                        style={styles.input}

                      />

                    ) : (

                      <>

                        <View style={styles.countrySelector}>

                          <Text style={styles.flag}>🇮🇳</Text>

                          <Text style={styles.countryName}>

                            India

                          </Text>

                          <Text style={styles.dialCode}>+91</Text>

                        </View>



                        <View style={styles.phoneInputRow}>

                          <View style={styles.phonePrefix}>

                            <Text style={styles.dialCode}>

                              🇮🇳 +91

                            </Text>

                          </View>



                          <TextInput

                            value={phoneNumber}

                            onChangeText={(value) => {

                              setPhoneNumber(value.replace(/\D/g, ""));

                              clearMessages();

                            }}

                            placeholder="9876543210"

                            placeholderTextColor="#9AA3B2"

                            keyboardType="phone-pad"

                            autoComplete="tel"

                            editable={!loading}

                            returnKeyType="go"

                            onSubmitEditing={() =>

                              void identifyAndContinue()

                            }

                            style={styles.phoneInput}

                          />

                        </View>



                        <Text style={styles.helperText}>

                          We'll send a secure verification code to

                          your WhatsApp number.

                        </Text>

                      </>

                    )}



                    {error ? (

                      <View style={styles.errorBox}>

                        <Ionicons

                          name="alert-circle-outline"

                          size={18}

                          color="#B91C1C"

                        />

                        <Text style={styles.errorText}>{error}</Text>

                      </View>

                    ) : null}



                    {success ? (

                      <Text style={styles.successText}>

                        {success}

                      </Text>

                    ) : null}



                    <Pressable

                      onPress={() => void identifyAndContinue()}

                      disabled={loading}

                      style={({ pressed }) => [

                        styles.primaryButton,

                        pressed && styles.pressed,

                        loading && styles.disabled,

                      ]}

                    >

                      {loading ? (

                        <>

                          <ActivityIndicator

                            color={WHITE}

                            size="small"

                          />

                          <Text style={styles.primaryButtonText}>

                            Checking your account...

                          </Text>

                        </>

                      ) : (

                        <>

                          <Text style={styles.primaryButtonText}>

                            Continue

                          </Text>

                          <Ionicons

                            name="arrow-forward"

                            size={18}

                            color={WHITE}

                          />

                        </>

                      )}

                    </Pressable>

                  </View>

                </>

              )}



              {step === "details" && (

                <>

                  <Pressable

                    onPress={goBack}

                    disabled={loading}

                    style={styles.backButton}

                  >

                    <Ionicons

                      name="arrow-back"

                      size={17}

                      color="#667085"

                    />

                    <Text style={styles.backText}>Back</Text>

                  </Pressable>



                  <View style={styles.headingIcon}>

                    <Ionicons

                      name="person-add-outline"

                      size={24}

                      color={BLUE}

                    />

                  </View>



                  <Text style={styles.title}>

                    Welcome to TapQR.

                  </Text>



                  <Text style={styles.description}>

                    We couldn't find an account with this{" "}

                    {method === "email" ? "email" : "WhatsApp number"}.

                    Enter your name to create one.

                  </Text>



                  <View style={styles.form}>

                    <Text style={styles.inputLabel}>Full name</Text>



                    <TextInput

                      value={fullName}

                      onChangeText={(value) => {

                        setFullName(value);

                        clearMessages();

                      }}

                      placeholder="Your full name"

                      placeholderTextColor="#9AA3B2"

                      autoComplete="name"

                      autoCapitalize="words"

                      editable={!loading}

                      style={styles.input}

                    />



                    <View style={styles.identifierBox}>

                      <Text style={styles.identifierLabel}>

                        Account identifier

                      </Text>

                      <Text style={styles.identifierValue}>

                        {getIdentifier()}

                      </Text>

                    </View>



                    {error ? (

                      <View style={styles.errorBox}>

                        <Ionicons

                          name="alert-circle-outline"

                          size={18}

                          color="#B91C1C"

                        />

                        <Text style={styles.errorText}>{error}</Text>

                      </View>

                    ) : null}



                    <Pressable

                      onPress={() => void continueRegistration()}

                      disabled={loading}

                      style={({ pressed }) => [

                        styles.primaryButton,

                        pressed && styles.pressed,

                        loading && styles.disabled,

                      ]}

                    >

                      {loading ? (

                        <>

                          <ActivityIndicator

                            color={WHITE}

                            size="small"

                          />

                          <Text style={styles.primaryButtonText}>

                            Sending code...

                          </Text>

                        </>

                      ) : (

                        <>

                          <Text style={styles.primaryButtonText}>

                            Continue

                          </Text>

                          <Ionicons

                            name="arrow-forward"

                            size={18}

                            color={WHITE}

                          />

                        </>

                      )}

                    </Pressable>

                  </View>

                </>

              )}

            </View>



            <View style={styles.securityRow}>

              <Ionicons

                name="shield-checkmark-outline"

                size={19}

                color={BLUE}

              />

              <Text style={styles.securityText}>

                Secure, passwordless access with email or WhatsApp OTP.

              </Text>

            </View>



            <Text style={styles.legalText}>

              By continuing, you agree to the TapQR Terms of Service

              and Privacy Policy.

            </Text>



            <View style={styles.footer}>

              <View style={styles.footerBrand}>

                <Ionicons

                  name="qr-code-outline"

                  size={15}

                  color={BLUE}

                />

                <Text style={styles.footerBrandName}>TapQR</Text>

              </View>

              <Text style={styles.footerTagline}>

                One scan. Everything.

              </Text>

              <Text style={styles.copyright}>© 2026 TapQR</Text>

            </View>

          </View>

        </ScrollView>

      </KeyboardAvoidingView>

    </SafeAreaView>

  );

}



const styles = StyleSheet.create({

  safeArea: {

    flex: 1,

    backgroundColor: PAGE,

  },

  flex: {

    flex: 1,

  },

  scrollContent: {

    flexGrow: 1,

    paddingBottom: 28,

  },

  page: {

    flexGrow: 1,

    width: "100%",

    maxWidth: 540,

    alignSelf: "center",

    paddingHorizontal: 20,

  },

  brandHeader: {

    minHeight: 76,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    gap: 10,

  },

  brand: {

    flexDirection: "row",

    alignItems: "center",

    gap: 11,

  },

  brandIcon: {

    width: 42,

    height: 42,

    alignItems: "center",

    justifyContent: "center",

    borderRadius: 12,

    backgroundColor: BLUE,

  },

  brandName: {

    color: DARK,

    fontSize: 21,

    fontWeight: "700",

    letterSpacing: -0.7,

  },

  secureBadge: {

    flexDirection: "row",

    alignItems: "center",

    gap: 5,

    paddingHorizontal: 10,

    paddingVertical: 7,

    borderRadius: 999,

    borderWidth: 1,

    borderColor: "#E0E8FF",

    backgroundColor: "#F0F4FF",

  },

  secureBadgeText: {

    color: BLUE,

    fontSize: 10,

    fontWeight: "600",

  },

  card: {

    marginTop: 24,

    padding: 24,

    borderRadius: 24,

    borderWidth: 1,

    borderColor: "rgba(0,0,0,0.055)",

    backgroundColor: WHITE,

    shadowColor: "#102040",

    shadowOffset: { width: 0, height: 8 },

    shadowOpacity: 0.045,

    shadowRadius: 22,

    elevation: 2,

  },

  stepLabel: {

    marginBottom: 25,

    color: BLUE,

    fontSize: 10,

    fontWeight: "700",

    letterSpacing: 1.6,

    textTransform: "uppercase",

  },

  headingIcon: {

    width: 48,

    height: 48,

    marginBottom: 20,

    alignItems: "center",

    justifyContent: "center",

    borderRadius: 16,

    backgroundColor: "#EEF3FF",

  },

  title: {

    color: DARK,

    fontSize: 36,

    lineHeight: 42,

    fontWeight: "600",

    letterSpacing: -1.4,

  },

  description: {

    marginTop: 13,

    color: "rgba(11,13,12,0.53)",

    fontSize: 13,

    lineHeight: 22,

  },

  options: {

    marginTop: 29,

    gap: 12,

  },

  optionButton: {

    minHeight: 75,

    flexDirection: "row",

    alignItems: "center",

    gap: 13,

    paddingHorizontal: 15,

    paddingVertical: 14,

    borderWidth: 1,

    borderColor: BORDER,

    borderRadius: 17,

    backgroundColor: WHITE,

  },

  googleIcon: {

    width: 39,

    height: 39,

    alignItems: "center",

    justifyContent: "center",

    borderRadius: 999,

    backgroundColor: "#F4F6FA",

  },

  googleG: {

    color: "#4285F4",

    fontSize: 21,

    fontWeight: "700",

  },

  whatsappIcon: {

    width: 39,

    height: 39,

    alignItems: "center",

    justifyContent: "center",

    borderRadius: 999,

    backgroundColor: "rgba(37,211,102,0.10)",

  },

  optionCopy: {

    flex: 1,

  },

  optionTitle: {

    color: DARK,

    fontSize: 12,

    fontWeight: "600",

  },

  optionSubtitle: {

    marginTop: 4,

    color: "rgba(0,0,0,0.40)",

    fontSize: 10,

    lineHeight: 15,

  },

  dividerRow: {

    flexDirection: "row",

    alignItems: "center",

    gap: 14,

    paddingVertical: 8,

  },

  divider: {

    flex: 1,

    height: 1,

    backgroundColor: "rgba(0,0,0,0.08)",

  },

  dividerText: {

    color: "rgba(0,0,0,0.35)",

    fontSize: 10,

    fontWeight: "500",

    letterSpacing: 1.1,

  },

  emailOption: {

    minHeight: 75,

    flexDirection: "row",

    alignItems: "center",

    gap: 13,

    paddingHorizontal: 15,

    paddingVertical: 14,

    borderRadius: 17,

    backgroundColor: DARK,

  },

  emailIcon: {

    width: 39,

    height: 39,

    alignItems: "center",

    justifyContent: "center",

    borderRadius: 999,

    backgroundColor: "rgba(255,255,255,0.10)",

  },

  emailAt: {

    color: WHITE,

    fontSize: 21,

    fontWeight: "700",

  },

  emailAtBlue: {

    color: BLUE,

    fontSize: 25,

    fontWeight: "600",

  },

  emailOptionTitle: {

    color: WHITE,

    fontSize: 12,

    fontWeight: "600",

  },

  emailOptionSubtitle: {

    marginTop: 4,

    color: "rgba(255,255,255,0.42)",

    fontSize: 10,

    lineHeight: 15,

  },

  backButton: {

    flexDirection: "row",

    alignItems: "center",

    gap: 8,

    alignSelf: "flex-start",

    marginBottom: 25,

    paddingVertical: 5,

  },

  backText: {

    color: "#667085",

    fontSize: 12,

    fontWeight: "500",

  },

  form: {

    marginTop: 29,

    gap: 12,

  },

  inputLabel: {

    marginBottom: 0,

    color: DARK,

    fontSize: 12,

    fontWeight: "600",

  },

  input: {

    minHeight: 52,

    paddingHorizontal: 15,

    borderWidth: 1,

    borderColor: BORDER,

    borderRadius: 15,

    backgroundColor: WHITE,

    color: DARK,

    fontSize: 13,

  },

  countrySelector: {

    minHeight: 50,

    flexDirection: "row",

    alignItems: "center",

    gap: 10,

    paddingHorizontal: 14,

    borderWidth: 1,

    borderColor: BORDER,

    borderRadius: 15,

    backgroundColor: WHITE,

  },

  flag: {

    fontSize: 19,

  },

  countryName: {

    flex: 1,

    color: DARK,

    fontSize: 12,

    fontWeight: "500",

  },

  dialCode: {

    color: "#626B7A",

    fontSize: 12,

    fontWeight: "600",

  },

  phoneInputRow: {

    minHeight: 52,

    flexDirection: "row",

    alignItems: "center",

    overflow: "hidden",

    borderWidth: 1,

    borderColor: BORDER,

    borderRadius: 15,

    backgroundColor: WHITE,

  },

  phonePrefix: {

    minHeight: 52,

    alignItems: "center",

    justifyContent: "center",

    paddingHorizontal: 13,

    borderRightWidth: 1,

    borderRightColor: BORDER,

  },

  phoneInput: {

    flex: 1,

    minWidth: 0,

    minHeight: 52,

    paddingHorizontal: 13,

    color: DARK,

    fontSize: 13,

  },

  helperText: {

    color: "rgba(0,0,0,0.40)",

    fontSize: 10,

    lineHeight: 16,

  },

  identifierBox: {

    padding: 15,

    borderWidth: 1,

    borderColor: "rgba(47,107,255,0.15)",

    borderRadius: 15,

    backgroundColor: "rgba(47,107,255,0.045)",

  },

  identifierLabel: {

    color: "rgba(0,0,0,0.45)",

    fontSize: 10,

  },

  identifierValue: {

    marginTop: 6,

    color: DARK,

    fontSize: 12,

    fontWeight: "600",

  },

  errorBox: {

    flexDirection: "row",

    alignItems: "flex-start",

    gap: 8,

    padding: 12,

    borderWidth: 1,

    borderColor: "#FECACA",

    borderRadius: 13,

    backgroundColor: "#FEF2F2",

  },

  errorText: {

    flex: 1,

    color: "#B91C1C",

    fontSize: 11,

    lineHeight: 17,

  },

  successText: {

    color: "#15803D",

    fontSize: 12,

    lineHeight: 18,

  },

  primaryButton: {

    minHeight: 53,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 9,

    marginTop: 6,

    paddingHorizontal: 18,

    borderRadius: 15,

    backgroundColor: BLUE,

    shadowColor: BLUE,

    shadowOffset: { width: 0, height: 5 },

    shadowOpacity: 0.18,

    shadowRadius: 10,

    elevation: 3,

  },

  primaryButtonText: {

    color: WHITE,

    fontSize: 12,

    fontWeight: "600",

  },

  pressed: {

    opacity: 0.85,

  },

  disabled: {

    opacity: 0.6,

  },

  securityRow: {

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 8,

    marginTop: 23,

  },

  securityText: {

    color: "#667085",

    fontSize: 10,

  },

  legalText: {

    marginTop: 24,

    color: "rgba(0,0,0,0.35)",

    fontSize: 10,

    lineHeight: 17,

    textAlign: "center",

  },

  footer: {

    alignItems: "center",

    paddingTop: 26,

  },

  footerBrand: {

    flexDirection: "row",

    alignItems: "center",

    gap: 5,

  },

  footerBrandName: {

    color: DARK,

    fontSize: 12,

    fontWeight: "700",

  },

  footerTagline: {

    marginTop: 6,

    color: "#667085",

    fontSize: 10,

  },

  copyright: {

    marginTop: 14,

    color: "rgba(0,0,0,0.28)",

    fontSize: 9,

  },

});
