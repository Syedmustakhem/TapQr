import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
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

export default function HomeScreen() {
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadQRCodes = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);

      if (!stored) {
        setQrCodes([]);
        return;
      }

      const parsed = JSON.parse(stored);

      if (Array.isArray(parsed)) {
        setQrCodes(parsed);
      } else {
        setQrCodes([]);
      }
    } catch (error) {
      console.error("Failed to load QR codes:", error);
      setQrCodes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadQRCodes();
  }, [loadQRCodes]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadQRCodes();
  };

  const totalScans = useMemo(() => {
    return qrCodes.reduce(
      (total, qr) => total + Number(qr.scans || 0),
      0
    );
  }, [qrCodes]);

  const activeCount = useMemo(() => {
    return qrCodes.filter(
      (qr) => qr.status === "ACTIVE"
    ).length;
  }, [qrCodes]);

  const pausedCount = useMemo(() => {
    return qrCodes.filter(
      (qr) => qr.status === "PAUSED"
    ).length;
  }, [qrCodes]);

  const recentQRCodes = useMemo(() => {
    return [...qrCodes].slice(0, 4);
  }, [qrCodes]);

  const topQR = useMemo(() => {
    if (qrCodes.length === 0) {
      return null;
    }

    return [...qrCodes].sort(
      (a, b) =>
        Number(b.scans || 0) -
        Number(a.scans || 0)
    )[0];
  }, [qrCodes]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loader}>
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
          />

          <Text style={styles.loaderText}>
            Loading dashboard...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
      >
        {/* HEADER */}

        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>
              TapQR
            </Text>

            <Text style={styles.greeting}>
              Good morning 👋
            </Text>

            <Text style={styles.subtitle}>
              Here's your business overview.
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.profileButton,
              pressed && styles.pressed,
            ]}
            onPress={() =>
              router.push("/app/tabs/settings")
            }
          >
            <Ionicons
              name="person-outline"
              size={21}
              color={COLORS.text}
            />
          </Pressable>
        </View>

        {/* MAIN SCAN CARD */}

        <View style={styles.mainCard}>
          <View style={styles.mainCardTop}>
            <View>
              <Text style={styles.mainLabel}>
                Total Scans
              </Text>

              <Text style={styles.mainValue}>
                {totalScans.toLocaleString()}
              </Text>
            </View>

            <View style={styles.mainIcon}>
              <Ionicons
                name="scan-outline"
                size={30}
                color={COLORS.primary}
              />
            </View>
          </View>

          <View style={styles.mainBottom}>
            <View style={styles.trendBadge}>
              <Ionicons
                name="trending-up"
                size={14}
                color={COLORS.success}
              />

              <Text style={styles.trendText}>
                Scan activity
              </Text>
            </View>

            <Text style={styles.allTimeText}>
              All time
            </Text>
          </View>
        </View>

        {/* QUICK STATS */}

        <View style={styles.statsGrid}>
          <StatCard
            icon="qr-code-outline"
            title="QR Codes"
            value={qrCodes.length}
            subtitle="Total created"
          />

          <StatCard
            icon="checkmark-circle-outline"
            title="Active"
            value={activeCount}
            subtitle="Currently active"
          />

          <StatCard
            icon="pause-circle-outline"
            title="Paused"
            value={pausedCount}
            subtitle="Currently paused"
          />

          <StatCard
            icon="analytics-outline"
            title="Scans"
            value={totalScans}
            subtitle="All time"
          />
        </View>

        {/* CREATE BUTTON */}

        <Pressable
          style={({ pressed }) => [
            styles.createButton,
            pressed && styles.createButtonPressed,
          ]}
          onPress={() =>
            router.push("/app/create-qr")
          }
        >
          <View style={styles.createIcon}>
            <Ionicons
              name="add"
              size={25}
              color={COLORS.white}
            />
          </View>

          <View style={styles.createContent}>
            <Text style={styles.createTitle}>
              Create QR Code
            </Text>

            <Text style={styles.createDescription}>
              Create a new QR code for your business
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color={COLORS.white}
          />
        </Pressable>

        {/* RECENT QR CODES */}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Recent QR Codes
            </Text>

            <Text style={styles.sectionSubtitle}>
              Your latest QR codes
            </Text>
          </View>

          <Pressable
            onPress={() =>
              router.push("/app/tabs/qrcodes")
            }
          >
            <Text style={styles.viewAll}>
              View all
            </Text>
          </Pressable>
        </View>

        {recentQRCodes.length > 0 ? (
          <View style={styles.qrList}>
            {recentQRCodes.map((qr) => (
              <Pressable
                key={qr.id}
                style={({ pressed }) => [
                  styles.qrCard,
                  pressed && styles.pressed,
                ]}
                onPress={() =>
                  router.push({
                    pathname: "/app/qr-details",
                    params: {
                      id: qr.id,
                      name: qr.name,
                      destination: qr.destination,
                      qrType: qr.type,
                      destinationType:
                        qr.destinationType,
                    },
                  })
                }
              >
                <View style={styles.qrIcon}>
                  <Ionicons
                    name="qr-code-outline"
                    size={23}
                    color={COLORS.primary}
                  />
                </View>

                <View style={styles.qrContent}>
                  <Text
                    style={styles.qrName}
                    numberOfLines={1}
                  >
                    {qr.name}
                  </Text>

                  <View style={styles.qrMeta}>
                    <Text style={styles.qrType}>
                      {qr.type}
                    </Text>

                    <View style={styles.metaDot} />

                    <View style={styles.statusRow}>
                      <View
                        style={[
                          styles.statusDot,
                          qr.status === "ACTIVE"
                            ? styles.activeDot
                            : styles.pausedDot,
                        ]}
                      />

                      <Text
                        style={[
                          styles.statusText,
                          qr.status === "ACTIVE"
                            ? styles.activeText
                            : styles.pausedText,
                        ]}
                      >
                        {qr.status}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.qrScans}>
                  <Text style={styles.qrScanValue}>
                    {Number(
                      qr.scans || 0
                    ).toLocaleString()}
                  </Text>

                  <Text style={styles.qrScanLabel}>
                    scans
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="qr-code-outline"
                size={32}
                color={COLORS.primary}
              />
            </View>

            <Text style={styles.emptyTitle}>
              No QR codes yet
            </Text>

            <Text style={styles.emptyText}>
              Create your first QR code to start
              building your TapQR dashboard.
            </Text>

            <Pressable
              style={styles.emptyButton}
              onPress={() =>
                router.push("/app/create-qr")
              }
            >
              <Text style={styles.emptyButtonText}>
                Create QR Code
              </Text>
            </Pressable>
          </View>
        )}

        {/* TOP PERFORMER */}

        {topQR && (
          <>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>
                  Top Performer
                </Text>

                <Text style={styles.sectionSubtitle}>
                  Your highest-scanning QR code
                </Text>
              </View>
            </View>

            <View style={styles.topCard}>
              <View style={styles.topIcon}>
                <Ionicons
                  name="trophy-outline"
                  size={25}
                  color={COLORS.primary}
                />
              </View>

              <View style={styles.topContent}>
                <Text
                  style={styles.topName}
                  numberOfLines={1}
                >
                  {topQR.name}
                </Text>

                <Text style={styles.topType}>
                  {topQR.type} QR
                </Text>
              </View>

              <View style={styles.topStats}>
                <Text style={styles.topScanValue}>
                  {Number(
                    topQR.scans || 0
                  ).toLocaleString()}
                </Text>

                <Text style={styles.topScanLabel}>
                  scans
                </Text>
              </View>
            </View>
          </>
        )}

        {/* ANALYTICS SHORTCUT */}

        <Pressable
          style={({ pressed }) => [
            styles.analyticsCard,
            pressed && styles.pressed,
          ]}
          onPress={() =>
            router.push("/app/tabs/analytics")
          }
        >
          <View style={styles.analyticsIcon}>
            <Ionicons
              name="bar-chart-outline"
              size={25}
              color={COLORS.primary}
            />
          </View>

          <View style={styles.analyticsContent}>
            <Text style={styles.analyticsTitle}>
              View Analytics
            </Text>

            <Text style={styles.analyticsText}>
              Track scans and QR performance
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color={COLORS.textMuted}
          />
        </Pressable>

        {/* FOOTER INFO */}

        <View style={styles.infoBox}>
          <Ionicons
            name="sparkles-outline"
            size={20}
            color={COLORS.primary}
          />

          <Text style={styles.infoText}>
            Your TapQR dashboard is ready. Real-time
            scan analytics will be connected when
            the backend is added.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* -------------------------------- */
/* STAT CARD */
/* -------------------------------- */

function StatCard({
  icon,
  title,
  value,
  subtitle,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: number;
  subtitle: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>
        <Ionicons
          name={icon}
          size={19}
          color={COLORS.primary}
        />
      </View>

      <Text style={styles.statValue}>
        {value.toLocaleString()}
      </Text>

      <Text style={styles.statTitle}>
        {title}
      </Text>

      <Text style={styles.statSubtitle}>
        {subtitle}
      </Text>
    </View>
  );
}

/* -------------------------------- */
/* STYLES */
/* -------------------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    padding: SPACING.xl,
    paddingBottom: SPACING.huge,
  },

  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loaderText: {
    marginTop: SPACING.md,
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  header: {
    marginBottom: SPACING.xxl,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  logo: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },

  greeting: {
    fontSize: 29,
    fontWeight: "800",
    color: COLORS.text,
  },

  subtitle: {
    marginTop: SPACING.sm,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },

  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },

  mainCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
  },

  mainCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  mainLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },

  mainValue: {
    marginTop: 5,
    fontSize: 36,
    fontWeight: "800",
    color: COLORS.text,
  },

  mainIcon: {
    width: 62,
    height: 62,
    borderRadius: 18,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },

  mainBottom: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: "#DCFCE7",
  },

  trendText: {
    marginLeft: 5,
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.success,
  },

  allTimeText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },

  statsGrid: {
    marginTop: SPACING.md,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
  },

  statCard: {
    width: "48%",
    minHeight: 130,
    padding: SPACING.lg,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },

  statValue: {
    marginTop: 9,
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.text,
  },

  statTitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text,
  },

  statSubtitle: {
    marginTop: 2,
    fontSize: 10,
    color: COLORS.textSecondary,
  },

  createButton: {
    marginTop: SPACING.xxl,
    minHeight: 82,
    borderRadius: 18,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
  },

  createButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },

  createIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  createContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },

  createTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.white,
  },

  createDescription: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.white,
    opacity: 0.85,
  },

  sectionHeader: {
    marginTop: SPACING.xxxl,
    marginBottom: SPACING.md,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: COLORS.text,
  },

  sectionSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  viewAll: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },

  qrList: {
    gap: SPACING.md,
  },

  qrCard: {
    minHeight: 82,
    padding: SPACING.lg,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
  },

  qrIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },

  qrContent: {
    flex: 1,
    marginLeft: SPACING.md,
    marginRight: SPACING.md,
  },

  qrName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },

  qrMeta: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
  },

  qrType: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },

  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 7,
    backgroundColor: COLORS.textMuted,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },

  activeDot: {
    backgroundColor: COLORS.success,
  },

  pausedDot: {
    backgroundColor: COLORS.warning,
  },

  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },

  activeText: {
    color: COLORS.success,
  },

  pausedText: {
    color: COLORS.warning,
  },

  qrScans: {
    alignItems: "flex-end",
  },

  qrScanValue: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
  },

  qrScanLabel: {
    marginTop: 2,
    fontSize: 10,
    color: COLORS.textMuted,
  },

  emptyCard: {
    padding: SPACING.xxl,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },

  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    marginTop: SPACING.lg,
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
  },

  emptyText: {
    marginTop: SPACING.sm,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    color: COLORS.textSecondary,
  },

  emptyButton: {
    marginTop: SPACING.lg,
    height: 46,
    paddingHorizontal: SPACING.xl,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.white,
  },

  topCard: {
    minHeight: 84,
    padding: SPACING.lg,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
  },

  topIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },

  topContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },

  topName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },

  topType: {
    marginTop: 3,
    fontSize: 11,
    color: COLORS.textSecondary,
  },

  topStats: {
    alignItems: "flex-end",
  },

  topScanValue: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.text,
  },

  topScanLabel: {
    marginTop: 2,
    fontSize: 10,
    color: COLORS.textMuted,
  },

  analyticsCard: {
    marginTop: SPACING.xxl,
    minHeight: 74,
    padding: SPACING.lg,
    borderRadius: 17,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
  },

  analyticsIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },

  analyticsContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },

  analyticsTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },

  analyticsText: {
    marginTop: 3,
    fontSize: 11,
    color: COLORS.textSecondary,
  },

  infoBox: {
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
    lineHeight: 19,
    color: COLORS.textSecondary,
  },
});