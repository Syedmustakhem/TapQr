import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { COLORS } from "../../constants/colors";
import { SPACING } from "../../constants/spacing";

type BillingCycle = "MONTHLY" | "YEARLY";

type Plan = {
  id: "FREE" | "PRO" | "BUSINESS";
  name: string;
  monthlyPrice: string;
  yearlyPrice: string;
  description: string;
  popular?: boolean;
  features: string[];
};

const PLANS: Plan[] = [
  {
    id: "FREE",
    name: "Free",
    monthlyPrice: "₹0",
    yearlyPrice: "₹0",
    description: "Everything you need to get started.",
    features: [
      "Up to 5 QR codes",
      "Static QR codes",
      "Basic dashboard",
      "Basic scan tracking",
      "QR code management",
    ],
  },
  {
    id: "PRO",
    name: "Pro",
    monthlyPrice: "₹199",
    yearlyPrice: "₹1,999",
    description: "For businesses that want more control.",
    popular: true,
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
  {
    id: "BUSINESS",
    name: "Business",
    monthlyPrice: "₹499",
    yearlyPrice: "₹4,999",
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
];

export default function PlansScreen() {
  const [billingCycle, setBillingCycle] =
    useState<BillingCycle>("MONTHLY");

  const currentPlan = "FREE";

  const handleSelectPlan = (plan: Plan) => {
    if (plan.id === currentPlan) {
      return;
    }

    // Backend/payment integration will be added later.
    router.push({
      pathname: "/app/checkout",
      params: {
        plan: plan.id,
        billingCycle,
      },
    });
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
            Plans
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        {/* Hero */}

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons
              name="sparkles"
              size={26}
              color={COLORS.primary}
            />
          </View>

          <Text style={styles.heroTitle}>
            Upgrade TapQR
          </Text>

          <Text style={styles.heroSubtitle}>
            Unlock powerful QR tools and analytics
            for your business.
          </Text>
        </View>

        {/* Current plan */}

        <View style={styles.currentPlanCard}>
          <View style={styles.currentPlanIcon}>
            <Ionicons
              name="checkmark-circle"
              size={22}
              color={COLORS.primary}
            />
          </View>

          <View style={styles.currentPlanContent}>
            <Text style={styles.currentPlanLabel}>
              CURRENT PLAN
            </Text>

            <Text style={styles.currentPlanName}>
              Free Plan
            </Text>

            <Text style={styles.currentPlanDescription}>
              You're currently using the free TapQR plan.
            </Text>
          </View>
        </View>

        {/* Billing */}

        <View style={styles.billingSection}>
          <Text style={styles.billingTitle}>
            Billing
          </Text>

          <View style={styles.billingToggle}>
            <Pressable
              style={[
                styles.billingOption,
                billingCycle === "MONTHLY" &&
                  styles.billingOptionActive,
              ]}
              onPress={() =>
                setBillingCycle("MONTHLY")
              }
            >
              <Text
                style={[
                  styles.billingText,
                  billingCycle === "MONTHLY" &&
                    styles.billingTextActive,
                ]}
              >
                Monthly
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.billingOption,
                billingCycle === "YEARLY" &&
                  styles.billingOptionActive,
              ]}
              onPress={() =>
                setBillingCycle("YEARLY")
              }
            >
              <Text
                style={[
                  styles.billingText,
                  billingCycle === "YEARLY" &&
                    styles.billingTextActive,
                ]}
              >
                Yearly
              </Text>

              <View style={styles.saveBadge}>
                <Text style={styles.saveBadgeText}>
                  SAVE
                </Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Plans */}

        <View style={styles.plans}>
          {PLANS.map((plan) => {
            const isCurrent =
              plan.id === currentPlan;

            const price =
              billingCycle === "MONTHLY"
                ? plan.monthlyPrice
                : plan.yearlyPrice;

            return (
              <View
                key={plan.id}
                style={[
                  styles.planCard,
                  plan.popular &&
                    styles.popularPlanCard,
                ]}
              >
                {plan.popular && (
                  <View style={styles.popularBadge}>
                    <Ionicons
                      name="star"
                      size={12}
                      color={COLORS.white}
                    />

                    <Text style={styles.popularText}>
                      MOST POPULAR
                    </Text>
                  </View>
                )}

                <View style={styles.planTop}>
                  <View>
                    <Text style={styles.planName}>
                      {plan.name}
                    </Text>

                    <Text style={styles.planDescription}>
                      {plan.description}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.planIcon,
                      plan.popular &&
                        styles.planIconPopular,
                    ]}
                  >
                    <Ionicons
                      name={
                        plan.id === "FREE"
                          ? "leaf-outline"
                          : plan.id === "PRO"
                          ? "rocket-outline"
                          : "business-outline"
                      }
                      size={21}
                      color={COLORS.primary}
                    />
                  </View>
                </View>

                <View style={styles.priceRow}>
                  <Text style={styles.price}>
                    {price}
                  </Text>

                  {plan.id !== "FREE" && (
                    <Text style={styles.pricePeriod}>
                      /{billingCycle === "MONTHLY"
                        ? "month"
                        : "year"}
                    </Text>
                  )}
                </View>

                <View style={styles.divider} />

                <Text style={styles.includes}>
                  Includes:
                </Text>

                <View style={styles.features}>
                  {plan.features.map((feature) => (
                    <View
                      key={feature}
                      style={styles.featureRow}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={COLORS.primary}
                      />

                      <Text style={styles.featureText}>
                        {feature}
                      </Text>
                    </View>
                  ))}
                </View>

                <Pressable
                  disabled={isCurrent}
                  onPress={() =>
                    handleSelectPlan(plan)
                  }
                  style={({ pressed }) => [
                    styles.planButton,
                    plan.popular &&
                      styles.planButtonPopular,
                    isCurrent &&
                      styles.planButtonCurrent,
                    pressed &&
                      !isCurrent &&
                      styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.planButtonText,
                      plan.popular &&
                        styles.planButtonTextPopular,
                      isCurrent &&
                        styles.planButtonTextCurrent,
                    ]}
                  >
                    {isCurrent
                      ? "Current Plan"
                      : `Choose ${plan.name}`}
                  </Text>

                  {!isCurrent && (
                    <Ionicons
                      name="arrow-forward"
                      size={18}
                      color={
                        plan.popular
                          ? COLORS.white
                          : COLORS.primary
                      }
                    />
                  )}
                </Pressable>
              </View>
            );
          })}
        </View>

        {/* Bottom information */}

        <View style={styles.secureBox}>
          <Ionicons
            name="shield-checkmark-outline"
            size={22}
            color={COLORS.primary}
          />

          <View style={styles.secureContent}>
            <Text style={styles.secureTitle}>
              Secure subscriptions
            </Text>

            <Text style={styles.secureText}>
              Your subscription and payment information
              will be securely handled when payments are
              connected.
            </Text>
          </View>
        </View>

        <Text style={styles.footerText}>
          Plans can be changed or cancelled from your
          subscription settings.
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

  hero: {
    alignItems: "center",
    marginTop: SPACING.xxxl,
    marginBottom: SPACING.xxl,
  },

  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },

  heroTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
  },

  heroSubtitle: {
    marginTop: SPACING.sm,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textSecondary,
    textAlign: "center",
    maxWidth: 330,
  },

  currentPlanCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
  },

  currentPlanIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },

  currentPlanContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },

  currentPlanLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: COLORS.primary,
  },

  currentPlanName: {
    marginTop: 3,
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },

  currentPlanDescription: {
    marginTop: 3,
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  billingSection: {
    marginTop: SPACING.xxxl,
  },

  billingTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.md,
  },

  billingToggle: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 4,
    flexDirection: "row",
  },

  billingOption: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
  },

  billingOptionActive: {
    backgroundColor: COLORS.primary,
  },

  billingText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },

  billingTextActive: {
    color: COLORS.white,
  },

  saveBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "#DCFCE7",
  },

  saveBadgeText: {
    fontSize: 8,
    fontWeight: "800",
    color: "#15803D",
  },

  plans: {
    marginTop: SPACING.xxl,
    gap: SPACING.lg,
  },

  planCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
  },

  popularPlanCard: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },

  popularBadge: {
    alignSelf: "flex-start",
    marginBottom: SPACING.lg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  popularText: {
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.white,
    letterSpacing: 0.5,
  },

  planTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  planName: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text,
  },

  planDescription: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
    maxWidth: 240,
  },

  planIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  planIconPopular: {
    backgroundColor: "#DBEAFE",
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: SPACING.xl,
  },

  price: {
    fontSize: 32,
    fontWeight: "800",
    color: COLORS.text,
  },

  pricePeriod: {
    marginLeft: 5,
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.xl,
  },

  includes: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.md,
  },

  features: {
    gap: 11,
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

  planButton: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginTop: SPACING.xxl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  planButtonPopular: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  planButtonCurrent: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
  },

  planButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.primary,
  },

  planButtonTextPopular: {
    color: COLORS.white,
  },

  planButtonTextCurrent: {
    color: COLORS.textSecondary,
  },

  secureBox: {
    marginTop: SPACING.xxxl,
    padding: SPACING.lg,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    flexDirection: "row",
    alignItems: "flex-start",
  },

  secureContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },

  secureTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },

  secureText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textSecondary,
  },

  footerText: {
    marginTop: SPACING.lg,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textMuted,
    textAlign: "center",
  },

  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
});