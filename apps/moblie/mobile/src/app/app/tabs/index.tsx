import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { COLORS } from "../../../constants/colors";
import { SPACING } from "../../../constants/spacing";

type QRCode = {
  id: string;
  name: string;
  type: "STATIC" | "DYNAMIC";
  status: "ACTIVE" | "PAUSED";
  scans: number;
  destination: string;
  destinationType: string;
  createdAt: string;
};

const STORAGE_KEY = "@tapqr_qr_codes";
const PREMIUM_BANNER_KEY = "@tapqr_premium_banner_last_shown";

// Show the premium banner again after 7 days.
const PREMIUM_BANNER_INTERVAL = 7 * 24 * 60 * 60 * 1000;

/* =========================================================
   STYLES
   Keep styles BEFORE the components.
   This prevents the "styles before initialization" error.
========================================================= */

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
    marginBottom: SPACING.xxl,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  logo: {
    fontSize: 25,
    fontWeight: "800",
    color: COLORS.primary,
  },

  profileButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  greeting: {
    marginTop: SPACING.xxl,
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

  premiumBanner: {
    marginTop: SPACING.lg,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: COLORS.primary,
  },

  premiumBannerInner: {
    padding: SPACING.xl,
    flexDirection: "row",
    alignItems: "center",
  },

  premiumContent: {
    flex: 1,
    paddingRight: SPACING.md,
  },

  premiumLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    color: "rgba(255,255,255,0.78)",
    textTransform: "uppercase",
  },

  premiumTitle: {
    marginTop: 5,
    fontSize: 21,
    lineHeight: 27,
    fontWeight: "800",
    color: COLORS.white,
  },

  premiumDescription: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(255,255,255,0.82)",
  },

  premiumButton: {
    marginTop: SPACING.md,
    alignSelf: "flex-start",
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  premiumButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.primary,
  },

  premiumIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },

  sectionHeader: {
    marginTop: SPACING.xxl,
    marginBottom: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
  },

  sectionAction: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
  },

  statCard: {
    width: "48%",
    minHeight: 140,
    padding: SPACING.lg,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
  },

  statTitle: {
    marginTop: SPACING.md,
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },

  statValue: {
    marginTop: 5,
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.text,
  },

  statSubtitle: {
    marginTop: 2,
    fontSize: 11,
    color: COLORS.textSecondary,
  },

  actionsContainer: {
    gap: SPACING.md,
  },

  actionCard: {
    minHeight: 82,
    padding: SPACING.lg,
    borderRadius: 17,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
  },

  actionIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  actionContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },

  actionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
  },

  actionDescription: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.textSecondary,
  },

  actionArrow: {
    marginLeft: SPACING.sm,
  },

  recentHeader: {
    marginTop: SPACING.xxl,
    marginBottom: SPACING.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  recentCard: {
    padding: SPACING.lg,
    borderRadius: 17,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  recentRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  qrIcon: {
    width: 45,
    height: 45,
    borderRadius: 13,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  recentInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },

  recentName: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
  },

  recentDestination: {
    marginTop: 3,
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  recentMeta: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  badge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#DCFCE7",
  },

  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#15803D",
  },

  scanText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },

  emptyCard: {
    padding: SPACING.xl,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },

  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    marginTop: SPACING.md,
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },

  emptyText: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    color: COLORS.textSecondary,
  },

  emptyButton: {
    marginTop: SPACING.md,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
  },

  emptyButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.white,
  },

  loaderContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },

  loaderText: {
    marginTop: SPACING.md,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});

/* =========================================================
   HOME SCREEN
========================================================= */

export default function HomeScreen() {
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPremiumBanner, setShowPremiumBanner] = useState(false);

  const loadQRs = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);

      if (stored) {
        const parsed: QRCode[] = JSON.parse(stored);
        setQrCodes(parsed);
      } else {
        setQrCodes([]);
      }
    } catch (error) {
      console.log("Failed to load QR codes:", error);
      setQrCodes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkPremiumBanner = useCallback(async () => {
    try {
      const lastShown = await AsyncStorage.getItem(
        PREMIUM_BANNER_KEY
      );

      if (!lastShown) {
        setShowPremiumBanner(true);
        return;
      }

      const lastShownTime = Number(lastShown);
      const now = Date.now();

      if (
        Number.isNaN(lastShownTime) ||
        now - lastShownTime >= PREMIUM_BANNER_INTERVAL
      ) {
        setShowPremiumBanner(true);
      } else {
        setShowPremiumBanner(false);
      }
    } catch (error) {
      console.log(
        "Premium banner check failed:",
        error
      );

      setShowPremiumBanner(true);
    }
  }, []);

  useEffect(() => {
    loadQRs();
    checkPremiumBanner();
  }, [loadQRs, checkPremiumBanner]);

  const handleRefresh = async () => {
    setRefreshing(true);

    await loadQRs();

    setRefreshing(false);
  };

  const handlePremiumPress = async () => {
    try {
      await AsyncStorage.setItem(
        PREMIUM_BANNER_KEY,
        Date.now().toString()
      );
    } catch (error) {
      console.log(
        "Failed to save premium banner state:",
        error
      );
    }

    setShowPremiumBanner(false);

    router.push("/app/plans");
  };

  const totalScans = qrCodes.reduce(
    (total, qr) => total + Number(qr.scans || 0),
    0
  );

  const activeQRs = qrCodes.filter(
    (qr) => qr.status === "ACTIVE"
  ).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />

        <Text style={styles.loaderText}>
          Loading dashboard...
        </Text>
      </SafeAreaView>
    );
  }

  const recentQRs = [...qrCodes]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    )
    .slice(0, 3);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* HEADER */}

        <View style={styles.header}>
          <View style={styles.topRow}>
            <Text style={styles.logo}>
              TapQR
            </Text>

            <Pressable
              onPress={() =>
                router.push("/app/profile")
              }
              style={({ pressed }) => [
                styles.profileButton,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Ionicons
                name="person-outline"
                size={20}
                color={COLORS.text}
              />
            </Pressable>
          </View>

          <Text style={styles.greeting}>
            Good morning 👋
          </Text>

          <Text style={styles.subtitle}>
            Here's your business overview.
          </Text>
        </View>

        {/* PREMIUM BANNER */}

        {showPremiumBanner && (
          <PremiumBanner
            onPress={handlePremiumPress}
          />
        )}

        {/* OVERVIEW */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Overview
          </Text>

          <Pressable
            onPress={() =>
              router.push("/app/analytics")
            }
          >
            <Text style={styles.sectionAction}>
              Analytics
            </Text>
          </Pressable>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            icon="qr-code-outline"
            title="QR Codes"
            value={String(qrCodes.length)}
            subtitle="Total created"
          />

          <StatCard
            icon="scan-outline"
            title="Total Scans"
            value={totalScans.toLocaleString()}
            subtitle="All time"
          />

          <StatCard
            icon="checkmark-circle-outline"
            title="Active"
            value={String(activeQRs)}
            subtitle="Currently active"
          />

          <StatCard
            icon="people-outline"
            title="Customers"
            value="—"
            subtitle="Coming with backend"
          />
        </View>

        {/* QUICK ACTIONS */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Quick Actions
          </Text>
        </View>

        <View style={styles.actionsContainer}>
          <ActionCard
            icon="add"
            title="Create QR Code"
            description="Create a new QR code for your business"
            onPress={() =>
              router.push("/app/create-qr")
            }
          />

          <ActionCard
            icon="qr-code-outline"
            title="View QR Codes"
            description="Manage your existing QR codes"
            onPress={() =>
              router.push("/app/qrcodes")
            }
          />

          <ActionCard
            icon="bar-chart-outline"
            title="View Analytics"
            description="Track scans and customer activity"
            onPress={() =>
              router.push("/app/analytics")
            }
          />
        </View>

        {/* RECENT QR CODES */}

        <View style={styles.recentHeader}>
          <Text style={styles.sectionTitle}>
            Recent QR Codes
          </Text>

          {qrCodes.length > 0 && (
            <Pressable
              onPress={() =>
                router.push("/app/qrcodes")
              }
            >
              <Text style={styles.sectionAction}>
                View all
              </Text>
            </Pressable>
          )}
        </View>

        {recentQRs.length > 0 ? (
          <View style={{ gap: SPACING.md }}>
            {recentQRs.map((qr) => (
              <RecentQRCard
                key={qr.id}
                qr={qr}
                onPress={() =>
                  router.push({
                    pathname: "/app/qr-details",
                    params: {
                      id: qr.id,
                    },
                  })
                }
              />
            ))}
          </View>
        ) : (
          <EmptyQRCard
            onPress={() =>
              router.push("/app/create-qr")
            }
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* =========================================================
   PREMIUM BANNER
========================================================= */

function PremiumBanner({
  onPress,
}: {
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.premiumBanner,
        pressed && { opacity: 0.9 },
      ]}
    >
      <View style={styles.premiumBannerInner}>
        <View style={styles.premiumContent}>
          <Text style={styles.premiumLabel}>
            TAPQR PREMIUM
          </Text>

          <Text style={styles.premiumTitle}>
            Unlock more from your QR codes
          </Text>

          <Text style={styles.premiumDescription}>
            Get advanced analytics, more QR codes
            and powerful business features.
          </Text>

          <View style={styles.premiumButton}>
            <Text style={styles.premiumButtonText}>
              Explore Plans
            </Text>

            <Ionicons
              name="arrow-forward"
              size={14}
              color={COLORS.primary}
            />
          </View>
        </View>

        <View style={styles.premiumIcon}>
          <Ionicons
            name="diamond"
            size={32}
            color={COLORS.white}
          />
        </View>
      </View>
    </Pressable>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  icon,
  title,
  value,
  subtitle,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>
        <Ionicons
          name={icon}
          size={21}
          color={COLORS.primary}
        />
      </View>

      <Text style={styles.statTitle}>
        {title}
      </Text>

      <Text style={styles.statValue}>
        {value}
      </Text>

      <Text style={styles.statSubtitle}>
        {subtitle}
      </Text>
    </View>
  );
}

/* =========================================================
   ACTION CARD
========================================================= */

function ActionCard({
  icon,
  title,
  description,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionCard,
        pressed && {
          opacity: 0.75,
          transform: [{ scale: 0.99 }],
        },
      ]}
    >
      <View style={styles.actionIcon}>
        <Ionicons
          name={icon}
          size={22}
          color={COLORS.white}
        />
      </View>

      <View style={styles.actionContent}>
        <Text style={styles.actionTitle}>
          {title}
        </Text>

        <Text style={styles.actionDescription}>
          {description}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={19}
        color={COLORS.textSecondary}
        style={styles.actionArrow}
      />
    </Pressable>
  );
}

/* =========================================================
   RECENT QR CARD
========================================================= */

function RecentQRCard({
  qr,
  onPress,
}: {
  qr: QRCode;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.recentCard,
        pressed && { opacity: 0.75 },
      ]}
    >
      <View style={styles.recentRow}>
        <View style={styles.qrIcon}>
          <Ionicons
            name="qr-code-outline"
            size={24}
            color={COLORS.primary}
          />
        </View>

        <View style={styles.recentInfo}>
          <Text
            style={styles.recentName}
            numberOfLines={1}
          >
            {qr.name}
          </Text>

          <Text
            style={styles.recentDestination}
            numberOfLines={1}
          >
            {qr.destination}
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={18}
          color={COLORS.textSecondary}
        />
      </View>

      <View style={styles.recentMeta}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {qr.status}
          </Text>
        </View>

        <Text style={styles.scanText}>
          {qr.scans || 0} scans
        </Text>
      </View>
    </Pressable>
  );
}

/* =========================================================
   EMPTY QR STATE
========================================================= */

function EmptyQRCard({
  onPress,
}: {
  onPress: () => void;
}) {
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIcon}>
        <Ionicons
          name="qr-code-outline"
          size={28}
          color={COLORS.primary}
        />
      </View>

      <Text style={styles.emptyTitle}>
        No QR codes yet
      </Text>

      <Text style={styles.emptyText}>
        Create your first QR code and start
        tracking your scans.
      </Text>

      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.emptyButton,
          pressed && { opacity: 0.75 },
        ]}
      >
        <Text style={styles.emptyButtonText}>
          Create QR Code
        </Text>
      </Pressable>
    </View>
  );
}