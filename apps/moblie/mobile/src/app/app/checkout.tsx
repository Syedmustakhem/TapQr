import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { COLORS } from "../../constants/colors";
import { SPACING } from "../../constants/spacing";

type PlanId = "PRO" | "BUSINESS";
type BillingCycle = "MONTHLY" | "YEARLY";

const PLAN_DETAILS = {
  PRO: {
    name: "Pro",
    monthlyPrice: 199,
    yearlyPrice: 1999,
    description: "For businesses that want more control.",
    features: [
      "Up to 50 QR codes",
      "Dynamic QR codes",
      "Advanced analytics",
      "Scan history",
      "QR downloads",
      "QR customization",
      "Priority support",
    ],
  },

  BUSINESS: {
    name: "Business",
    monthlyPrice: 499,
    yearlyPrice: 4999,
    description: "Powerful tools for growing businesses.",
    features: [
      "Unlimited QR codes",
      "Everything in Pro",
      "Multiple staff members",
      "Multiple businesses",
      "Advanced customization",
      "Advanced reporting",
      "Priority business support",
    ],
  },
};

export default function CheckoutScreen() {
  const params = useLocalSearchParams<{
    plan?: string;
    billingCycle?: string;
  }>();

  const [loading, setLoading] = useState(false);

  const planId: PlanId =
    params.plan === "BUSINESS"
      ? "BUSINESS"
      : "PRO";

  const billingCycle: BillingCycle =
    params.billingCycle === "YEARLY"
      ? "YEARLY"
      : "MONTHLY";

  const plan = PLAN_DETAILS[planId];

  const price = useMemo(() => {
    return billingCycle === "YEARLY"
      ? plan.yearlyPrice
      : plan.monthlyPrice;
  }, [billingCycle, plan]);

  const period =
    billingCycle === "YEARLY"
      ? "year"
      : "month";

  const handleContinue = async () => {
    if (loading) {
      return;
    }

    setLoading(true);

    /*
     * FRONTEND ONLY
     *
     * Real payment integration will be added later.
     *
     * Future flow:
     *
     * App
     *   ↓
     * Backend
     *   ↓
     * Payment Gateway
     *   ↓
     * Payment Verification
     *   ↓
     * Subscription Activated
     */

    setTimeout(() => {
      setLoading(false);

      router.push({
        pathname: "/app/subscription-success",
        params: {
          plan: planId,
          billingCycle,
        },
      });
    }, 800);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}

        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={COLORS.text}
            />
          </Pressable>

          <Text style={styles.headerTitle}>
            Checkout
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        {/* Heading */}

        <View style={styles.heading}>
          <Text style={styles.title}>
            Review your plan
          </Text>

          <Text style={styles.subtitle}>
            Confirm your TapQR subscription before
            continuing.
          </Text>
        </View>

        {/* Selected plan */}

        <View style={styles.planCard}>
          <View style={styles.planHeader}>
            <View>
              <Text style={styles.planLabel}>
                SELECTED PLAN
              </Text>

              <Text style={styles.planName}>
                TapQR {plan.name}
              </Text>

              <Text style={styles.planDescription}>
                {plan.description}
              </Text>
            </View>

            <View style={styles.planIcon}>
              <Ionicons
                name={
                  planId === "PRO"
                    ? "rocket-outline"
                    : "business-outline"
                }
                size={24}
                color={COLORS.primary}
              />
            </View>
          </View>

          {/* Price */}

          <View style={styles.priceContainer}>
            <Text style={styles.price}>
              ₹{price.toLocaleString("en-IN")}
            </Text>

            <Text style={styles.period}>
              /{period}
            </Text>
          </View>

          <View style={styles.billingBadge}>
            <Ionicons
              name="calendar-outline"
              size={14}
              color={COLORS.primary}
            />

            <Text style={styles.billingBadgeText}>
              Billed{" "}
              {billingCycle === "YEARLY"
                ? "yearly"
                : "monthly"}
            </Text>
          </View>
        </View>

        {/* Features */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            What's included
          </Text>

          <View style={styles.featuresCard}>
            {plan.features.map((feature) => (
              <View
                key={feature}
                style={styles.featureRow}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={19}
                  color={COLORS.primary}
                />

                <Text style={styles.featureText}>
                  {feature}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Order summary */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Order summary
          </Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                {plan.name} plan
              </Text>

              <Text style={styles.summaryValue}>
                ₹{price.toLocaleString("en-IN")}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Billing
              </Text>

              <Text style={styles.summaryValue}>
                {billingCycle === "YEARLY"
                  ? "Yearly"
                  : "Monthly"}
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Total
              </Text>

              <Text style={styles.totalValue}>
                ₹{price.toLocaleString("en-IN")}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment notice */}

        <View style={styles.paymentNotice}>
          <View style={styles.paymentIcon}>
            <Ionicons
              name="shield-checkmark-outline"
              size={22}
              color={COLORS.primary}
            />
          </View>

          <View style={styles.paymentContent}>
            <Text style={styles.paymentTitle}>
              Secure payment
            </Text>

            <Text style={styles.paymentText}>
              Payments will be securely processed
              through TapQR's payment system.
            </Text>
          </View>
        </View>

        {/* Continue */}

        <Pressable
          onPress={handleContinue}
          disabled={loading}
          style={({ pressed }) => [
            styles.continueButton,
            pressed && !loading && styles.pressed,
            loading && styles.disabledButton,
          ]}
        >
          {loading ? (
            <ActivityIndicator
              size="small"
              color={COLORS.white}
            />
          ) : (
            <>
              <Text style={styles.continueText}>
                Continue to Payment
              </Text>

              <Ionicons
                name="arrow-forward"
                size={19}
                color={COLORS.white}
              />
            </>
          )}
        </Pressable>

        <Text style={styles.termsText}>
          By continuing, you agree to TapQR's
          subscription terms and privacy policy.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    padding: SPACING.xl,
    paddingBottom: SPACING.huge,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },

  headerSpacer: {
    width: 44,
  },

  heading: {
    marginTop: SPACING.xxxl,
    marginBottom: SPACING.xxl,
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: COLORS.text,
  },

  subtitle: {
    marginTop: SPACING.sm,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textSecondary,
  },

  planCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: COLORS.primary,
    padding: SPACING.xl,
  },

  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  planLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: COLORS.primary,
  },

  planName: {
    marginTop: 5,
    fontSize: 25,
    fontWeight: "800",
    color: COLORS.text,
  },

  planDescription: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
    maxWidth: 230,
  },

  planIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },

  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: SPACING.xxl,
  },

  price: {
    fontSize: 34,
    fontWeight: "800",
    color: COLORS.text,
  },

  period: {
    marginLeft: 5,
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  billingBadge: {
    alignSelf: "flex-start",
    marginTop: SPACING.md,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#EFF6FF",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  billingBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
  },

  section: {
    marginTop: SPACING.xxxl,
  },

  sectionTitle: {
    marginBottom: SPACING.md,
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },

  featuresCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: 13,
  },

  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  featureText: {
    flex: 1,
    marginLeft: 9,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
  },

  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },

  summaryLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  summaryValue: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },

  summaryDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: SPACING.sm,
  },

  totalLabel: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.text,
  },

  totalValue: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.primary,
  },

  paymentNotice: {
    marginTop: SPACING.xxxl,
    padding: SPACING.lg,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    flexDirection: "row",
    alignItems: "flex-start",
  },

  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },

  paymentContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },

  paymentTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },

  paymentText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textSecondary,
  },

  continueButton: {
    height: 54,
    borderRadius: 15,
    marginTop: SPACING.xxxl,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },

  continueText: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.white,
  },

  disabledButton: {
    opacity: 0.65,
  },

  termsText: {
    marginTop: SPACING.md,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    color: COLORS.textMuted,
  },

  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
});