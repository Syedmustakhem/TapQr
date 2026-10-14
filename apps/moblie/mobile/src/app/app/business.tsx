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

import {
  Alert,
} from "react-native";

import {
  createBusiness,
  updateBusiness,
} from "../../api/businessApi";

import { COLORS } from "../../constants/colors";
import { SPACING } from "../../constants/spacing";

export default function BusinessSetupScreen() {
  const [businessName, setBusinessName] =
    useState("");

  const [category, setCategory] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [address, setAddress] =
    useState("");

  const [businessNameError, setBusinessNameError] =
    useState("");

  const [categoryError, setCategoryError] =
    useState("");

  const [phoneError, setPhoneError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleContinue = async () => {
    setBusinessNameError("");
    setCategoryError("");
    setPhoneError("");

    let hasError = false;

    // Business name validation
    if (!businessName.trim()) {
      setBusinessNameError(
        "Business name is required."
      );

      hasError = true;
    }

    // Category validation
    if (!category.trim()) {
      setCategoryError(
        "Business category is required."
      );

      hasError = true;
    }

    // Phone validation
    if (!phone.trim()) {
      setPhoneError(
        "Phone number is required."
      );

      hasError = true;
    } else if (
      phone.replace(/\D/g, "").length !== 10
    ) {
      setPhoneError(
        "Enter a valid 10-digit phone number."
      );

      hasError = true;
    }

    if (hasError) {
      return;
    }

    try {
      setLoading(true);

      /*
       * POST /businesses — mirrors the web dashboard
       * create form ({ name, phone, description }).
       * Category is a business-level field, saved with
       * a follow-up PATCH /businesses/:id.
       */
      const created = await createBusiness({
        name: businessName.trim(),
        phone: phone.trim(),
        description:
          address.trim() || undefined,
      });

      if (category.trim()) {
        await updateBusiness(created.id, {
          category: category.trim(),
        });
      }

      router.replace("/app/tabs");
    } catch (error) {
      console.error(
        "Business setup failed:",
        error
      );

      Alert.alert(
        "Setup failed",
        error instanceof Error
          ? error.message
          : "Could not create your business. Please try again."
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
          contentContainerStyle={
            styles.content
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}

          <Text style={styles.logo}>
            TapQR
          </Text>

          {/* Header */}

          <View style={styles.header}>
            <Text style={styles.title}>
              Set up your business
            </Text>

            <Text style={styles.subtitle}>
              Tell us a little about your
              business to get started with
              TapQR.
            </Text>
          </View>

          {/* Form */}

          <View style={styles.form}>
            <Input
              label="Business name"
              value={businessName}
              onChangeText={
                setBusinessName
              }
              placeholder="Your business name"
              autoCapitalize="words"
              error={businessNameError}
            />

            <Input
              label="Business category"
              value={category}
              onChangeText={setCategory}
              placeholder="Restaurant, Retail, Salon..."
              autoCapitalize="words"
              error={categoryError}
            />

            <Input
              label="Phone number"
              value={phone}
              onChangeText={(value) =>
                setPhone(
                  value.replace(
                    /[^0-9]/g,
                    ""
                  )
                )
              }
              placeholder="10-digit phone number"
              keyboardType="phone-pad"
              maxLength={10}
              error={phoneError}
            />

            <Input
              label="Business address"
              value={address}
              onChangeText={setAddress}
              placeholder="Optional"
              multiline
              numberOfLines={3}
            />

            <View style={styles.button}>
              <Button
                title="Continue"
                onPress={
                  handleContinue
                }
                loading={loading}
              />
            </View>
          </View>

          {/* Information */}

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>
              Why do we need this?
            </Text>

            <Text style={styles.infoText}>
              Your business information will
              be used to personalize your
              TapQR dashboard and QR codes.
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
    backgroundColor:
      COLORS.background,
  },

  keyboard: {
    flex: 1,
  },

  content: {
    paddingHorizontal:
      SPACING.xl,

    paddingVertical:
      SPACING.xxl,

    paddingBottom:
      SPACING.huge,
  },

  logo: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom:
      SPACING.xxxl,
  },

  header: {
    marginBottom:
      SPACING.xxl,
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: COLORS.text,
  },

  subtitle: {
    marginTop:
      SPACING.sm,

    fontSize: 16,

    lineHeight: 24,

    color:
      COLORS.textSecondary,
  },

  form: {
    marginTop:
      SPACING.md,
  },

  button: {
    marginTop:
      SPACING.md,
  },

  infoBox: {
    marginTop:
      SPACING.xxl,

    padding:
      SPACING.lg,

    borderRadius: 14,

    backgroundColor:
      COLORS.surface,
  },

  infoTitle: {
    fontSize: 14,

    fontWeight: "700",

    color:
      COLORS.text,

    marginBottom:
      SPACING.xs,
  },

  infoText: {
    fontSize: 13,

    lineHeight: 20,

    color:
      COLORS.textSecondary,
  },
});