import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Button from "../../components/ui/Button";
import EmptyState from "../../components/common/EmptyState";
import ScreenLoader from "../../components/loaders/ScreenLoader";

import { COLORS } from "../../constants/colors";
import { SPACING } from "../../constants/spacing";

import {
  cancelSubscription,
  formatBillingDate,
  formatINR,
  getBillingHistory,
  getBillingStatus,
  getInvoiceUrl,
  type HistoryPayment,
} from "../../api/billingApi";

/*
 * ============================================================
 * PAYMENTS — plans + billing
 * ============================================================
 *
 * Mirrors the web dashboard /dashboard/payments:
 * plan cards (Pro Monthly / Pro Yearly) with a
 * current-plan highlight from GET /billing/status,
 * plus a BillingSection (current plan, usage, invoices
 * from GET /billing/history).
 *
 * CHECKOUT STUBBED — the website takes payment through
 * Razorpay's web checkout, and mobile needs a separate
 * product decision on the Razorpay React Native SDK
 * before any payment flow can be built. The upgrade
 * buttons below deliberately do NOT call
 * POST /billing/checkout (the API wrapper exists in
 * billingApi.ts for later use).
 */

type PlanOption = {
  code: "PRO_MONTHLY" | "PRO_YEARLY";
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
};

const PRO_PLANS: PlanOption[] = [
  {
    code: "PRO_MONTHLY",
    name: "Pro Monthly",
    price: "₹199",
    period: "/ month",
    description:
      "Build a branded digital identity.",
    features: [
      "Everything in Free",
      "Multiple QR profiles",
      "Custom QR colors",
      "Add your own logo",
      "Review Funnel",
      "Today's Specials Banner",
      "Digital Loyalty Card",
      "Scan-to-WhatsApp Ordering",
      "TapQR Agent OS access",
    ],
  },
  {
    code: "PRO_YEARLY",
    name: "Pro Yearly",
    price: "₹999",
    period: "/ year",
    description:
      "Two months of Pro, on the house.",
    features: [
      "Everything in Pro Monthly",
      "Priority support",
      "Early access to new features",
    ],
  },
];

/**
 * Shown when the merchant taps an upgrade button.
 * Checkout stays stubbed until Syed decides on the
 * Razorpay React Native SDK for the mobile app.
 */
function handleUpgrade(plan: PlanOption) {
  Alert.alert(
    `Upgrade to ${plan.name}`,
    "Mobile checkout isn't available yet. TapQR uses Razorpay on the web, and the mobile checkout needs a decision on the Razorpay React Native SDK first. You can upgrade from the TapQR website in the meantime.",
    [{ text: "OK" }]
  );
}

function UsageBar({
  label,
  used,
  max,
}: {
  label: string;
  used: number;
  max: number;
}) {
  const ratio =
    max > 0
      ? Math.min(used / max, 1)
      : 0;

  return (
    <View style={styles.usageRow}>
      <View style={styles.usageLabels}>
        <Text style={styles.usageLabel}>
          {label}
        </Text>

        <Text style={styles.usageValue}>
          {used} /{" "}
          {max > 0 ? max : "∞"}
        </Text>
      </View>

      <View style={styles.usageTrack}>
        <View
          style={[
            styles.usageFill,
            { width: `${ratio * 100}%` },
          ]}
        />
      </View>
    </View>
  );
}

function InvoiceRow({
  invoice,
}: {
  invoice: HistoryPayment;
}) {
  const openInvoice = async () => {
    try {
      const data = await getInvoiceUrl(
        invoice.id
      );

      await Linking.openURL(data.url);
    } catch {
      Alert.alert(
        "Invoice",
        "Couldn't load the invoice right now."
      );
    }
  };

  return (
    <Pressable
      onPress={openInvoice}
      style={({ pressed }) => [
        styles.invoiceRow,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.invoiceLeft}>
        <Ionicons
          name="receipt-outline"
          size={20}
          color={COLORS.textSecondary}
        />

        <View>
          <Text style={styles.invoiceAmount}>
            {formatINR(invoice.amountPaise)}
          </Text>

          <Text style={styles.invoiceMeta}>
            {formatBillingDate(
              invoice.createdAt
            )}{" "}
            • {invoice.status}
          </Text>
        </View>
      </View>

      <Ionicons
        name="chevron-forward-outline"
        size={18}
        color={COLORS.textMuted}
      />
    </Pressable>
  );
}

export default function PaymentsScreen() {
  const statusQuery = useQuery({
    queryKey: ["billing-status"],
    queryFn: getBillingStatus,
    staleTime: 60 * 1000,
  });

  const historyQuery = useQuery({
    queryKey: ["billing-history"],
    queryFn: getBillingHistory,
    staleTime: 60 * 1000,
  });

  const status = statusQuery.data ?? null;
  const invoices =
    historyQuery.data ?? [];
  const currentCode =
    status?.plan.code ?? "FREE";

  const onCancelSubscription = () => {
    Alert.alert(
      "Cancel subscription",
      "Your Pro plan stays active until the end of the current billing period.",
      [
        { text: "Keep Pro", style: "cancel" },
        {
          text: "Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelSubscription();
              await statusQuery.refetch();
            } catch {
              Alert.alert(
                "Couldn't cancel",
                "Please try again."
              );
            }
          },
        },
      ]
    );
  };

  const loading =
    statusQuery.isLoading ||
    historyQuery.isLoading;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          styles.content
        }
      >
        <Text style={styles.title}>
          Payments
        </Text>

        <Text style={styles.subtitle}>
          Manage your TapQR plan and billing.
        </Text>

        {loading ? (
          <ScreenLoader />
        ) : statusQuery.isError ? (
          <EmptyState
            title="Couldn't load billing"
            message="Check your connection and try again."
          />
        ) : (
          <>
            {/* PLAN CARDS */}
            {PRO_PLANS.map((plan) => {
              const isCurrent =
                currentCode === plan.code;

              return (
                <View
                  key={plan.code}
                  style={[
                    styles.planCard,
                    isCurrent &&
                      styles.planCardCurrent,
                  ]}
                >
                  <View
                    style={styles.planHeader}
                  >
                    <View>
                      <Text
                        style={styles.planName}
                      >
                        {plan.name}
                      </Text>

                      <Text
                        style={
                          styles.planDescription
                        }
                      >
                        {plan.description}
                      </Text>
                    </View>

                    {isCurrent && (
                      <View
                        style={styles.currentBadge}
                      >
                        <Text
                          style={
                            styles.currentBadgeText
                          }
                        >
                          Current plan
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.planPrice}>
                    {plan.price}
                    <Text
                      style={styles.planPeriod}
                    >
                      {plan.period}
                    </Text>
                  </Text>

                  {plan.features.map(
                    (feature) => (
                      <View
                        key={feature}
                        style={
                          styles.featureRow
                        }
                      >
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color={COLORS.success}
                        />

                        <Text
                          style={
                            styles.featureText
                          }
                        >
                          {feature}
                        </Text>
                      </View>
                    )
                  )}

                  {!isCurrent && (
                    /*
                     * STUB: no POST /billing/checkout call
                     * here — pending the Razorpay RN SDK
                     * decision. handleUpgrade explains why.
                     */
                    <Button
                      title={`Upgrade to ${plan.name}`}
                      onPress={() =>
                        handleUpgrade(plan)
                      }
                    />
                  )}
                </View>
              );
            })}

            {/* BILLING SECTION */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Billing
              </Text>

              <View style={styles.card}>
                <Text style={styles.cardLabel}>
                  Current plan
                </Text>

                <Text style={styles.cardValue}>
                  {status?.plan.name ?? "Free"}
                </Text>

                {status?.subscription && (
                  <Text
                    style={styles.cardSub}
                  >
                    {status.subscription.status}
                    {status.subscription
                      .currentPeriodEnd
                      ? ` • Renews ${formatBillingDate(
                          status.subscription
                            .currentPeriodEnd
                        )}`
                      : ""}
                    {status.subscription
                      .cancelAtPeriodEnd
                      ? " • Cancels at period end"
                      : ""}
                  </Text>
                )}

                {status?.subscription &&
                  !status.subscription
                    .cancelAtPeriodEnd && (
                    <Pressable
                      onPress={
                        onCancelSubscription
                      }
                      style={
                        styles.cancelButton
                      }
                    >
                      <Text
                        style={
                          styles.cancelButtonText
                        }
                      >
                        Cancel subscription
                      </Text>
                    </Pressable>
                  )}
              </View>

              <View style={styles.card}>
                <Text style={styles.cardLabel}>
                  Usage
                </Text>

                <UsageBar
                  label="QR codes"
                  used={
                    status?.usage.qrCount ??
                    0
                  }
                  max={
                    status?.limits.maxQrs ??
                    0
                  }
                />

                <UsageBar
                  label="Businesses"
                  used={
                    status?.usage
                      .businessCount ?? 0
                  }
                  max={
                    status?.limits
                      .maxBusinesses ?? 0
                  }
                />
              </View>

              <View style={styles.card}>
                <Text style={styles.cardLabel}>
                  Invoices
                </Text>

                {invoices.length === 0 ? (
                  <Text
                    style={styles.invoicesEmpty}
                  >
                    No invoices yet.
                  </Text>
                ) : (
                  invoices.map((invoice) => (
                    <InvoiceRow
                      key={invoice.id}
                      invoice={invoice}
                    />
                  ))
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scroll: {
    flex: 1,
  },

  content: {
    padding: SPACING.xl,
    paddingBottom: SPACING.huge,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.text,
  },

  subtitle: {
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg,
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  planCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
  },

  planCardCurrent: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },

  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.sm,
  },

  planName: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },

  planDescription: {
    marginTop: SPACING.xs,
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  currentBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },

  currentBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.white,
  },

  planPrice: {
    fontSize: 30,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: SPACING.md,
  },

  planPeriod: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.textSecondary,
  },

  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },

  featureText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },

  section: {
    marginTop: SPACING.sm,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.md,
  },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },

  cardLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },

  cardValue: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
  },

  cardSub: {
    marginTop: SPACING.xs,
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  cancelButton: {
    marginTop: SPACING.md,
    alignSelf: "flex-start",
  },

  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.danger,
  },

  usageRow: {
    marginTop: SPACING.md,
  },

  usageLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.xs,
  },

  usageLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  usageValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },

  usageTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
    overflow: "hidden",
  },

  usageFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },

  invoicesEmpty: {
    marginTop: SPACING.sm,
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  invoiceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  invoiceLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },

  invoiceAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },

  invoiceMeta: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  pressed: {
    opacity: 0.7,
  },
});
