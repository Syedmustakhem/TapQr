import { Ionicons } from "@expo/vector-icons";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import QRCode from "react-native-qrcode-svg";
import {
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Button from "../../components/ui/Button";
import EmptyState from "../../components/common/EmptyState";
import ScreenLoader from "../../components/loaders/ScreenLoader";

import { COLORS } from "../../constants/colors";
import { SPACING } from "../../constants/spacing";

import { formatBillingDate } from "../../api/billingApi";

import {
  buildReferralLink,
  getOrCreateReferralCode,
  getReferralStats,
} from "../../api/growthApi";

/*
 * ============================================================
 * REFER & EARN
 * ============================================================
 *
 * Mirrors the web dashboard /dashboard/refer
 * (ReferralWidget): referral code + referral link +
 * client-side QR (react-native-qrcode-svg, same role as
 * the web's `qrcode` lib), live stats (earnedDays,
 * proUntil, rewardDays from GET /growth/referral/stats),
 * and a WhatsApp share deep link.
 *
 * The pitch: every referred business that subscribes
 * to Pro earns the referrer 30 days of Pro free
 * (credited after their current plan time ends).
 */

export default function ReferScreen() {
  const queryClient = useQueryClient();

  const statsQuery = useQuery({
    queryKey: ["referral-stats"],
    queryFn: getReferralStats,
    staleTime: 60 * 1000,
  });

  const generateMutation = useMutation({
    mutationFn: getOrCreateReferralCode,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["referral-stats"],
      });
    },
    onError: () => {
      Alert.alert(
        "Referral code",
        "Couldn't generate a code right now."
      );
    },
  });

  const stats = statsQuery.data ?? null;
  const code = stats?.code ?? null;
  const link = code
    ? buildReferralLink(code)
    : null;

  const shareMessage = link
    ? `I'm using TapQR for my business — one QR for my menu, reviews, bookings and more. Try it free with my link: ${link}`
    : "";

  const shareOnWhatsApp = () => {
    if (!link) {
      return;
    }

    void Linking.openURL(
      "https://wa.me/?text=" +
        encodeURIComponent(shareMessage)
    );
  };

  const shareNative = async () => {
    if (!link) {
      return;
    }

    try {
      await Share.share({
        message: shareMessage,
      });
    } catch {
      /* User dismissed the share sheet. */
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          styles.content
        }
      >
        <Text style={styles.title}>
          Refer &amp; Earn
        </Text>

        <Text style={styles.subtitle}>
          Invite other businesses to TapQR —
          every one that subscribes to Pro
          earns you 30 days of Pro free,
          and them a 45-day Pro bonus.
        </Text>

        {statsQuery.isLoading ? (
          <ScreenLoader />
        ) : statsQuery.isError ? (
          <EmptyState
            title="Couldn't load referrals"
            message="Check your connection and try again."
          />
        ) : !code ? (
          <View style={styles.card}>
            <Ionicons
              name="gift-outline"
              size={40}
              color={COLORS.primary}
            />

            <Text style={styles.cardTitle}>
              Get your referral code
            </Text>

            <Text style={styles.cardText}>
              Generate a code to start
              inviting businesses and
              earning free Pro days.
            </Text>

            <Button
              title="Generate code"
              loading={
                generateMutation.isPending
              }
              onPress={() =>
                generateMutation.mutate()
              }
            />
          </View>
        ) : (
          <>
            {/* CODE CARD */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>
                Your referral code
              </Text>

              <Text style={styles.codeText}>
                {code}
              </Text>

              <Text style={styles.cardLabel}>
                Your referral link
              </Text>

              <Text style={styles.linkText}>
                {link}
              </Text>
            </View>

            {/* QR CARD */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>
                Scan to join with your link
              </Text>

              <View style={styles.qrWrap}>
                <QRCode
                  value={link ?? ""}
                  size={200}
                  backgroundColor={
                    COLORS.white
                  }
                  color="#111111"
                />
              </View>
            </View>

            {/* LIVE STATS */}
            <View style={styles.statsRow}>
              <View
                style={[
                  styles.statCard,
                  styles.statCardLeft,
                ]}
              >
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={COLORS.primary}
                />

                <Text style={styles.statValue}>
                  {stats?.earnedDays ?? 0}
                </Text>

                <Text style={styles.statLabel}>
                  Pro days earned
                </Text>
              </View>

              <View
                style={[
                  styles.statCard,
                  styles.statCardRight,
                ]}
              >
                <Ionicons
                  name="trophy-outline"
                  size={20}
                  color={COLORS.primary}
                />

                <Text style={styles.statValue}>
                  {stats?.rewardDays ?? 0}
                </Text>

                <Text style={styles.statLabel}>
                  Reward days
                </Text>
              </View>
            </View>

            <View style={styles.proUntilCard}>
              <Ionicons
                name="time-outline"
                size={20}
                color={COLORS.textSecondary}
              />

              <View>
                <Text
                  style={styles.proUntilLabel}
                >
                  Pro valid until
                </Text>

                <Text
                  style={styles.proUntilValue}
                >
                  {formatBillingDate(
                    stats?.proUntil
                  )}
                </Text>
              </View>
            </View>

            {/* SHARE ACTIONS */}
            <Button
              title="Share on WhatsApp"
              onPress={shareOnWhatsApp}
            />

            <View
              style={styles.secondaryShare}
            >
              <Button
                title="Share via…"
                onPress={() =>
                  void shareNative()
                }
              />
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
    lineHeight: 20,
    color: COLORS.textSecondary,
  },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    marginBottom: SPACING.md,
    alignItems: "center",
  },

  cardLabel: {
    alignSelf: "flex-start",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },

  codeText: {
    alignSelf: "flex-start",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 4,
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },

  linkText: {
    alignSelf: "flex-start",
    fontSize: 14,
    color: COLORS.primary,
    lineHeight: 20,
  },

  cardTitle: {
    marginTop: SPACING.md,
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },

  cardText: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },

  qrWrap: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: 12,
  },

  statsRow: {
    flexDirection: "row",
    marginBottom: SPACING.md,
  },

  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    alignItems: "center",
  },

  statCardLeft: {
    marginRight: SPACING.sm,
  },

  statCardRight: {
    marginLeft: SPACING.sm,
  },

  statValue: {
    marginTop: SPACING.sm,
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.text,
  },

  statLabel: {
    marginTop: SPACING.xs,
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
  },

  proUntilCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },

  proUntilLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  proUntilValue: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },

  secondaryShare: {
    marginTop: SPACING.md,
  },
});
