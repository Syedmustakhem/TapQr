import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
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

export default function SubscriptionSuccessScreen() {
  const params = useLocalSearchParams<{
    plan?: string;
    billingCycle?: string;
  }>();

  const plan =
    params.plan === "BUSINESS"
      ? "Business"
      : "Pro";

  const billing =
    params.billingCycle === "YEARLY"
      ? "Yearly"
      : "Monthly";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Icon */}
        <View style={styles.successIcon}>
          <Ionicons
            name="checkmark"
            size={48}
            color={COLORS.white}
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>
          You're upgraded!
        </Text>

        <Text style={styles.subtitle}>
          Your TapQR {plan} plan is ready.
        </Text>

        {/* Subscription Details */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.label}>
              Plan
            </Text>

            <Text style={styles.value}>
              TapQR {plan}
            </Text>
          </View>

          <View style={styles.cardRow}>
            <Text style={styles.label}>
              Billing
            </Text>

            <Text style={styles.value}>
              {billing}
            </Text>
          </View>

          <View style={styles.cardRow}>
            <Text style={styles.label}>
              Status
            </Text>

            <View style={styles.activeBadge}>
              <Text style={styles.activeText}>
                Active
              </Text>
            </View>
          </View>
        </View>

        {/* Information */}
        <View style={styles.infoBox}>
          <Ionicons
            name="information-circle-outline"
            size={21}
            color={COLORS.primary}
          />

          <Text style={styles.infoText}>
            This is currently a frontend preview.
            Real subscription activation and payment
            verification will be connected when the
            TapQR backend is implemented.
          </Text>
        </View>

        {/* Dashboard Button */}
        <Pressable
          onPress={() => router.replace("/app/dashboard")}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.buttonText}>
            Go to Dashboard
          </Text>

          <Ionicons
            name="arrow-forward"
            size={19}
            color={COLORS.white}
          />
        </Pressable>

        {/* Plans Button */}
        <Pressable
          onPress={() => router.replace("/app/plans")}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.secondaryText}>
            View Plans
          </Text>
        </Pressable>

        {/* Home / QR Dashboard */}
        <Pressable
          onPress={() => router.replace("/app/tabs")}
          style={({ pressed }) => [
            styles.homeButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="home-outline"
            size={18}
            color={COLORS.textSecondary}
          />

          <Text style={styles.homeText}>
            Back to TapQR Home
          </Text>
        </Pressable>
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
    flexGrow: 1,
    padding: SPACING.xl,
    paddingBottom: SPACING.huge,
    alignItems: "center",
    justifyContent: "center",
  },

  successIcon: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    marginTop: SPACING.xxl,
    fontSize: 30,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
  },

  subtitle: {
    marginTop: SPACING.sm,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textSecondary,
    textAlign: "center",
  },

  card: {
    width: "100%",
    marginTop: SPACING.xxxl,
    padding: SPACING.xl,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  cardRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  value: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },

  activeBadge: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#DCFCE7",
  },

  activeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#15803D",
  },

  infoBox: {
    width: "100%",
    marginTop: SPACING.xxl,
    padding: SPACING.lg,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    flexDirection: "row",
    alignItems: "flex-start",
  },

  infoText: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textSecondary,
  },

  button: {
    width: "100%",
    height: 52,
    marginTop: SPACING.xxxl,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  buttonText: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.white,
  },

  secondaryButton: {
    width: "100%",
    height: 48,
    marginTop: SPACING.md,
    alignItems: "center",
    justifyContent: "center",
  },

  secondaryText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
  },

  homeButton: {
    marginTop: SPACING.md,
    minHeight: 44,
    paddingHorizontal: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  homeText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },

  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
});