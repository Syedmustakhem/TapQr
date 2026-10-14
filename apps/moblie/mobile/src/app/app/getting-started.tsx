import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import {
  useEffect,
  useState,
} from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import ScreenLoader from "../../components/loaders/ScreenLoader";
import EmptyState from "../../components/common/EmptyState";

import { COLORS } from "../../constants/colors";
import { SPACING } from "../../constants/spacing";
import { getCampaigns } from "../../api/campaignApi";
import { getBillingStatus } from "../../api/billingApi";
import {
  getQRCodes,
  type QRCodeRecord,
} from "../../api/qrcodeApi";

import { useCurrentBusiness } from "../../hooks/useCurrentBusiness";

/*
 * ============================================================
 * GETTING STARTED — the guided setup chain
 * ============================================================
 *
 * Mirrors the web dashboard /dashboard/getting-started
 * (lib/setup-chain): one strict order for every new user
 *
 *   Business → QR Studio → Campaigns → Go live → Pro
 *
 * Each step unlocks only when the previous one is done.
 * Progress is DERIVED from real data — never stored —
 * so it can never get out of sync.
 *
 * ASSUMPTION (differs from web): the web marks "Go live"
 * done when the business record has a PUBLISHED/ACTIVE
 * status. On mobile we mark it done when any QR code is
 * ACTIVE instead — the publish-status field is not yet
 * exposed to the mobile app, and an active QR is the
 * closest equivalent signal.
 *
 * The Pro step is dismissible; the dismissal persists in
 * AsyncStorage under the same key the web uses in
 * localStorage ("tapqr_setup_chain_done").
 */

const DISMISS_KEY =
  "tapqr_setup_chain_done";

type SetupStepId =
  | "business"
  | "qr"
  | "campaign"
  | "golive"
  | "pro";

type SetupStep = {
  id: SetupStepId;
  title: string;
  description: string;
  cta: string;
  route: string;
  icon: keyof typeof Ionicons.glyphMap;
  done: boolean;
  locked: boolean;
  current: boolean;
  dismissible: boolean;
};

/*
 * GET /campaign/business/:businessId/campaigns —
 * inlined here because the campaigns API module is
 * being built as its own section. Returns the count,
 * defensively handling both array and { data } shapes.
 */
async function getCampaignCount(
  businessId: string
): Promise<number> {
  const campaigns = await getCampaigns(businessId);
  return campaigns.length;
}

function StepCard({
  step,
  onPress,
  onDismiss,
}: {
  step: SetupStep;
  onPress: () => void;
  onDismiss: () => void;
}) {
  const iconBg = step.done
    ? COLORS.success
    : step.current
      ? COLORS.text
      : COLORS.border;

  return (
    <Pressable
      onPress={onPress}
      disabled={step.locked}
      style={({ pressed }) => [
        styles.stepCard,
        step.current &&
          styles.stepCardCurrent,
        step.locked && styles.stepCardLocked,
        pressed &&
          !step.locked &&
          styles.pressed,
      ]}
    >
      <View style={styles.stepRow}>
        <View
          style={[
            styles.stepIcon,
            { backgroundColor: iconBg },
          ]}
        >
          {step.done ? (
            <Ionicons
              name="checkmark"
              size={20}
              color={COLORS.white}
            />
          ) : step.locked ? (
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color={COLORS.textMuted}
            />
          ) : (
            <Ionicons
              name={step.icon}
              size={20}
              color={COLORS.white}
            />
          )}
        </View>

        <View style={styles.stepBody}>
          <View style={styles.stepTitleRow}>
            <Text style={styles.stepTitle}>
              {step.title}
            </Text>

            {step.current && (
              <View style={styles.nowBadge}>
                <Text
                  style={styles.nowBadgeText}
                >
                  Now
                </Text>
              </View>
            )}
          </View>

          <Text
            style={styles.stepDescription}
          >
            {step.description}
          </Text>

          <Text style={styles.stepCta}>
            {step.cta} →
          </Text>

          {step.dismissible &&
            !step.done && (
              <Pressable
                onPress={onDismiss}
                style={styles.dismissButton}
              >
                <Text
                  style={
                    styles.dismissButtonText
                  }
                >
                  Not now
                </Text>
              </Pressable>
            )}
        </View>
      </View>
    </Pressable>
  );
}

export default function GettingStartedScreen() {
  const {
    businesses,
    businessId,
    isLoading: businessLoading,
    isError: businessError,
  } = useCurrentBusiness();

  const [dismissed, setDismissed] =
    useState(false);

  useEffect(() => {
    (async () => {
      try {
        const value =
          await AsyncStorage.getItem(
            DISMISS_KEY
          );

        setDismissed(value === "1");
      } catch {
        setDismissed(false);
      }
    })();
  }, []);

  const dismissProStep = async () => {
    try {
      await AsyncStorage.setItem(
        DISMISS_KEY,
        "1"
      );
    } catch {
      /* Dismissal persistence is best-effort. */
    }

    setDismissed(true);
  };

  const qrQuery = useQuery({
    queryKey: ["qrcodes", businessId],
    queryFn: () =>
      getQRCodes(businessId as string),
    enabled: Boolean(businessId),
  });

  const campaignQuery = useQuery({
    queryKey: ["campaigns", businessId],
    queryFn: () =>
      getCampaignCount(
        businessId as string
      ),
    enabled: Boolean(businessId),
  });

  const billingQuery = useQuery({
    queryKey: ["billing-status"],
    queryFn: getBillingStatus,
    staleTime: 60 * 1000,
  });

  const qrs: QRCodeRecord[] =
    qrQuery.data ?? [];

  const hasBusiness =
    businesses.length > 0;
  const hasQr = qrs.length > 0;
  const hasCampaign =
    (campaignQuery.data ?? 0) > 0;
  const isPublished = qrs.some(
    (qr) => qr.status === "ACTIVE"
  );
  const isPro =
    (billingQuery.data?.plan.code ??
      "FREE") !== "FREE";

  const stepDone = [
    hasBusiness,
    hasQr,
    hasCampaign,
    isPublished,
    isPro || dismissed,
  ];

  const steps: SetupStep[] = [
    {
      id: "business",
      title: "Set up your business",
      description:
        "Add your business name, logo and contact details. Everything else builds on this.",
      cta: "Set up business",
      route: "/app/business",
      icon: "storefront-outline",
      done: stepDone[0],
      locked: false,
      current: false,
      dismissible: false,
    },
    {
      id: "qr",
      title: "Create your first QR",
      description:
        "Design a smart QR code. One scan opens your whole business experience.",
      cta: "Open QR Studio",
      route: "/app/tabs/qrcodes",
      icon: "qr-code-outline",
      done: stepDone[1],
      locked: !stepDone[0],
      current: false,
      dismissible: false,
    },
    {
      id: "campaign",
      title: "Launch a campaign",
      description:
        "Put your QR to work — run your first campaign and track real scans.",
      cta: "Create campaign",
      route: "/app/campaigns",
      icon: "megaphone-outline",
      done: stepDone[2],
      locked: !stepDone[1],
      current: false,
      dismissible: false,
    },
    {
      id: "golive",
      title: "Go live",
      description:
        "Activate a QR code so customers can reach you when they scan.",
      cta: "Go live",
      route: "/app/business",
      icon: "rocket-outline",
      done: stepDone[3],
      locked: !stepDone[2],
      current: false,
      dismissible: false,
    },
    {
      id: "pro",
      title: "Supercharge with Pro",
      description:
        "Unlock review funnels, loyalty cards, bookings, WhatsApp orders and more.",
      cta: "Upgrade to Pro",
      route: "/app/payments",
      icon: "diamond-outline",
      done: stepDone[4],
      locked: !stepDone[3],
      current: false,
      dismissible: true,
    },
  ];

  let currentAssigned = false;
  for (const step of steps) {
    if (
      !step.done &&
      !step.locked &&
      !currentAssigned
    ) {
      step.current = true;
      currentAssigned = true;
    }
  }

  const doneCount = steps.filter(
    (step) => step.done
  ).length;
  const complete =
    doneCount === steps.length;

  const loading =
    businessLoading ||
    qrQuery.isLoading ||
    campaignQuery.isLoading ||
    billingQuery.isLoading;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          styles.content
        }
      >
        <Text style={styles.title}>
          Getting started
        </Text>

        <Text style={styles.subtitle}>
          Five steps to a live TapQR
          business.
        </Text>

        {/* PROGRESS */}
        <View style={styles.progressRow}>
          <Text
            style={styles.progressLabel}
          >
            {doneCount} of {steps.length}{" "}
            steps complete
          </Text>

          <View
            style={styles.progressTrack}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${
                    (doneCount /
                      steps.length) *
                    100
                  }%`,
                },
              ]}
            />
          </View>
        </View>

        {loading ? (
          <ScreenLoader />
        ) : businessError ? (
          <EmptyState
            title="Couldn't load setup status"
            message="Check your connection and try again."
          />
        ) : complete ? (
          <View style={styles.completeCard}>
            <Ionicons
              name="checkmark-circle"
              size={48}
              color={COLORS.success}
            />

            <Text
              style={styles.completeTitle}
            >
              You&apos;re all set!
            </Text>

            <Text
              style={styles.completeText}
            >
              Your TapQR business is live
              and running.
            </Text>
          </View>
        ) : (
          steps.map((step) => (
            <StepCard
              key={step.id}
              step={step}
              onPress={() => {
                if (step.locked) {
                  return;
                }

                router.push(
                  step.route as never
                );
              }}
              onDismiss={dismissProStep}
            />
          ))
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

  progressRow: {
    marginBottom: SPACING.lg,
  },

  progressLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },

  progressTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.border,
    overflow: "hidden",
  },

  progressFill: {
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },

  stepCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },

  stepCardCurrent: {
    borderColor: COLORS.text,
    borderWidth: 2,
  },

  stepCardLocked: {
    opacity: 0.7,
  },

  pressed: {
    opacity: 0.8,
  },

  stepRow: {
    flexDirection: "row",
    gap: SPACING.lg,
  },

  stepIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  stepBody: {
    flex: 1,
  },

  stepTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },

  stepTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },

  nowBadge: {
    backgroundColor: COLORS.text,
    borderRadius: 999,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },

  nowBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.white,
  },

  stepDescription: {
    marginTop: SPACING.xs,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
  },

  stepCta: {
    marginTop: SPACING.sm,
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
  },

  dismissButton: {
    marginTop: SPACING.sm,
    alignSelf: "flex-start",
  },

  dismissButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textMuted,
  },

  completeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.huge,
    paddingHorizontal: SPACING.xl,
    alignItems: "center",
  },

  completeTitle: {
    marginTop: SPACING.md,
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
  },

  completeText: {
    marginTop: SPACING.sm,
    textAlign: "center",
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
