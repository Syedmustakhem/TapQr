import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
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

type Period = "7D" | "30D" | "ALL";

const STORAGE_KEY = "@tapqr_qr_codes";

export default function AnalyticsScreen() {
  const [qrCodes, setQrCodes] =
    useState<QRCode[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [period, setPeriod] =
    useState<Period>("7D");

  const loadAnalytics = useCallback(
    async () => {
      try {
        const stored =
          await AsyncStorage.getItem(
            STORAGE_KEY
          );

        if (!stored) {
          setQrCodes([]);
          return;
        }

        const parsed =
          JSON.parse(stored);

        if (Array.isArray(parsed)) {
          setQrCodes(parsed);
        } else {
          setQrCodes([]);
        }
      } catch (error) {
        console.error(
          "Failed to load analytics:",
          error
        );

        setQrCodes([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
  };

  const totalScans = useMemo(() => {
    return qrCodes.reduce(
      (total, qr) =>
        total + Number(qr.scans || 0),
      0
    );
  }, [qrCodes]);

  const activeQRCodes = useMemo(() => {
    return qrCodes.filter(
      (qr) => qr.status === "ACTIVE"
    ).length;
  }, [qrCodes]);

  const dynamicQRCodes = useMemo(() => {
    return qrCodes.filter(
      (qr) => qr.type === "DYNAMIC"
    ).length;
  }, [qrCodes]);

  const topQRCodes = useMemo(() => {
    return [...qrCodes]
      .sort(
        (a, b) =>
          Number(b.scans || 0) -
          Number(a.scans || 0)
      )
      .slice(0, 5);
  }, [qrCodes]);

  /*
   * Frontend demo trend data.
   *
   * Backend analytics will replace this
   * with real daily scan data later.
   */
  const chartData = useMemo(() => {
    if (period === "30D") {
      return [
        { label: "1", value: 18 },
        { label: "5", value: 32 },
        { label: "10", value: 27 },
        { label: "15", value: 45 },
        { label: "20", value: 38 },
        { label: "25", value: 56 },
        { label: "30", value: 64 },
      ];
    }

    if (period === "ALL") {
      return [
        { label: "Jan", value: 22 },
        { label: "Feb", value: 38 },
        { label: "Mar", value: 31 },
        { label: "Apr", value: 52 },
        { label: "May", value: 48 },
        { label: "Jun", value: 71 },
        { label: "Jul", value: 64 },
      ];
    }

    return [
      { label: "Mon", value: 12 },
      { label: "Tue", value: 24 },
      { label: "Wed", value: 18 },
      { label: "Thu", value: 32 },
      { label: "Fri", value: 28 },
      { label: "Sat", value: 44 },
      { label: "Sun", value: 36 },
    ];
  }, [period]);

  const maxChartValue = Math.max(
    ...chartData.map(
      (item) => item.value
    ),
    1
  );

  if (loading) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View style={styles.loader}>
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
          />

          <Text style={styles.loaderText}>
            Loading analytics...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (qrCodes.length === 0) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={
            styles.emptyScroll
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          }
        >
          <View style={styles.header}>
            <Text style={styles.title}>
              Analytics
            </Text>

            <Text style={styles.subtitle}>
              Track QR scans and business
              activity.
            </Text>
          </View>

          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="bar-chart-outline"
                size={36}
                color={COLORS.primary}
              />
            </View>

            <Text style={styles.emptyTitle}>
              No analytics yet
            </Text>

            <Text
              style={styles.emptyText}
            >
              Create your first QR code to
              start tracking scans and
              customer activity.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
      >
        {/* HEADER */}

        <View style={styles.header}>
          <Text style={styles.title}>
            Analytics
          </Text>

          <Text style={styles.subtitle}>
            Track QR scans and business
            activity.
          </Text>
        </View>

        {/* MAIN STAT */}

        <View style={styles.mainCard}>
          <View>
            <Text
              style={styles.mainLabel}
            >
              Total Scans
            </Text>

            <Text
              style={styles.mainValue}
            >
              {totalScans.toLocaleString()}
            </Text>

            <View
              style={styles.trendRow}
            >
              <View
                style={styles.trendIcon}
              >
                <Ionicons
                  name="trending-up"
                  size={14}
                  color={COLORS.success}
                />
              </View>

              <Text
                style={styles.trendText}
              >
                Scan activity
              </Text>
            </View>
          </View>

          <View style={styles.mainIcon}>
            <Ionicons
              name="bar-chart"
              size={32}
              color={COLORS.primary}
            />
          </View>
        </View>

        {/* SMALL STATS */}

        <View style={styles.statsGrid}>
          <StatCard
            icon="qr-code-outline"
            label="QR Codes"
            value={qrCodes.length}
          />

          <StatCard
            icon="checkmark-circle-outline"
            label="Active"
            value={activeQRCodes}
          />

          <StatCard
            icon="flash-outline"
            label="Dynamic"
            value={dynamicQRCodes}
          />

          <StatCard
            icon="pause-circle-outline"
            label="Paused"
            value={
              qrCodes.length -
              activeQRCodes
            }
          />
        </View>

        {/* CHART */}

        <View style={styles.sectionHeader}>
          <View>
            <Text
              style={styles.sectionTitle}
            >
              Scan Activity
            </Text>

            <Text
              style={styles.sectionSubtitle}
            >
              Scan trend overview
            </Text>
          </View>
        </View>

        <View style={styles.chartCard}>
          <View style={styles.periodRow}>
            <PeriodButton
              title="7 Days"
              active={period === "7D"}
              onPress={() =>
                setPeriod("7D")
              }
            />

            <PeriodButton
              title="30 Days"
              active={period === "30D"}
              onPress={() =>
                setPeriod("30D")
              }
            />

            <PeriodButton
              title="All Time"
              active={period === "ALL"}
              onPress={() =>
                setPeriod("ALL")
              }
            />
          </View>

          <View style={styles.chart}>
            {chartData.map(
              (item, index) => {
                const height =
                  (item.value /
                    maxChartValue) *
                  150;

                return (
                  <View
                    key={`${item.label}-${index}`}
                    style={styles.chartColumn}
                  >
                    <Text
                      style={
                        styles.chartValue
                      }
                    >
                      {item.value}
                    </Text>

                    <View
                      style={
                        styles.chartBarContainer
                      }
                    >
                      <View
                        style={[
                          styles.chartBar,
                          {
                            height,
                          },
                        ]}
                      />
                    </View>

                    <Text
                      style={
                        styles.chartLabel
                      }
                    >
                      {item.label}
                    </Text>
                  </View>
                );
              }
            )}
          </View>
        </View>

        {/* TOP QR CODES */}

        <View style={styles.sectionHeader}>
          <View>
            <Text
              style={styles.sectionTitle}
            >
              Top QR Codes
            </Text>

            <Text
              style={styles.sectionSubtitle}
            >
              Your best performing QR codes
            </Text>
          </View>
        </View>

        <View style={styles.topCard}>
          {topQRCodes.map(
            (qr, index) => (
              <View
                key={qr.id}
                style={[
                  styles.topRow,
                  index <
                    topQRCodes.length - 1 &&
                    styles.topRowBorder,
                ]}
              >
                <View
                  style={styles.rank}
                >
                  <Text
                    style={
                      styles.rankText
                    }
                  >
                    {index + 1}
                  </Text>
                </View>

                <View
                  style={
                    styles.topContent
                  }
                >
                  <Text
                    style={
                      styles.topName
                    }
                    numberOfLines={1}
                  >
                    {qr.name}
                  </Text>

                  <Text
                    style={
                      styles.topType
                    }
                  >
                    {qr.type} QR
                  </Text>
                </View>

                <View
                  style={
                    styles.scanCount
                  }
                >
                  <Text
                    style={
                      styles.scanNumber
                    }
                  >
                    {Number(
                      qr.scans || 0
                    ).toLocaleString()}
                  </Text>

                  <Text
                    style={
                      styles.scanLabel
                    }
                  >
                    scans
                  </Text>
                </View>
              </View>
            )
          )}
        </View>

        {/* OVERVIEW */}

        <View style={styles.sectionHeader}>
          <View>
            <Text
              style={styles.sectionTitle}
            >
              QR Overview
            </Text>

            <Text
              style={styles.sectionSubtitle}
            >
              Current QR code status
            </Text>
          </View>
        </View>

        <View style={styles.overviewCard}>
          <OverviewRow
            icon="checkmark-circle-outline"
            title="Active QR Codes"
            value={activeQRCodes}
            iconStyle="success"
          />

          <OverviewRow
            icon="pause-circle-outline"
            title="Paused QR Codes"
            value={
              qrCodes.length -
              activeQRCodes
            }
            iconStyle="warning"
          />

          <OverviewRow
            icon="qr-code-outline"
            title="Total QR Codes"
            value={qrCodes.length}
            iconStyle="primary"
            last
          />
        </View>

        {/* NOTE */}

        <View style={styles.infoBox}>
          <Ionicons
            name="information-circle-outline"
            size={21}
            color={COLORS.primary}
          />

          <Text style={styles.infoText}>
            Scan trend data is currently
            shown as frontend demo data.
            Real scan analytics will be
            connected to the TapQR backend
            later.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* -------------------------------- */
/* Stat Card */
/* -------------------------------- */

function StatCard({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>
        <Ionicons
          name={icon}
          size={20}
          color={COLORS.primary}
        />
      </View>

      <Text style={styles.statValue}>
        {value.toLocaleString()}
      </Text>

      <Text style={styles.statLabel}>
        {label}
      </Text>
    </View>
  );
}

/* -------------------------------- */
/* Period Button */
/* -------------------------------- */

function PeriodButton({
  title,
  active,
  onPress,
}: {
  title: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.periodButton,
        active &&
          styles.periodButtonActive,
      ]}
    >
      <Text
        style={[
          styles.periodText,
          active &&
            styles.periodTextActive,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

/* -------------------------------- */
/* Overview Row */
/* -------------------------------- */

function OverviewRow({
  icon,
  title,
  value,
  iconStyle,
  last = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: number;
  iconStyle:
    | "success"
    | "warning"
    | "primary";
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.overviewRow,
        !last &&
          styles.overviewRowBorder,
      ]}
    >
      <View
        style={[
          styles.overviewIcon,
          iconStyle === "success" &&
            styles.successIcon,
          iconStyle === "warning" &&
            styles.warningIcon,
          iconStyle === "primary" &&
            styles.primaryIcon,
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={
            iconStyle === "success"
              ? COLORS.success
              : iconStyle === "warning"
              ? COLORS.warning
              : COLORS.primary
          }
        />
      </View>

      <Text
        style={styles.overviewTitle}
      >
        {title}
      </Text>

      <Text
        style={styles.overviewValue}
      >
        {value.toLocaleString()}
      </Text>
    </View>
  );
}

/* -------------------------------- */
/* Styles */
/* -------------------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:
      COLORS.background,
  },

  content: {
    padding: SPACING.xl,
    paddingBottom:
      SPACING.huge,
  },

  emptyScroll: {
    flexGrow: 1,
    padding: SPACING.xl,
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
    marginTop: SPACING.sm,
    fontSize: 15,
    lineHeight: 22,
    color:
      COLORS.textSecondary,
  },

  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent:
      "center",
  },

  loaderText: {
    marginTop: SPACING.md,
    fontSize: 14,
    color:
      COLORS.textSecondary,
  },

  mainCard: {
    backgroundColor:
      COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    padding: SPACING.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
  },

  mainLabel: {
    fontSize: 14,
    fontWeight: "600",
    color:
      COLORS.textSecondary,
  },

  mainValue: {
    marginTop: 5,
    fontSize: 36,
    fontWeight: "800",
    color: COLORS.text,
  },

  trendRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
  },

  trendIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor:
      "#DCFCE7",
    alignItems: "center",
    justifyContent:
      "center",
  },

  trendText: {
    marginLeft: 7,
    fontSize: 12,
    fontWeight: "600",
    color:
      COLORS.success,
  },

  mainIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor:
      "#DBEAFE",
    alignItems: "center",
    justifyContent:
      "center",
  },

  statsGrid: {
    marginTop: SPACING.md,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
  },

  statCard: {
    width: "48%",
    minHeight: 115,
    padding: SPACING.lg,
    borderRadius: 16,
    backgroundColor:
      COLORS.surface,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor:
      "#DBEAFE",
    alignItems: "center",
    justifyContent:
      "center",
  },

  statValue: {
    marginTop: 10,
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.text,
  },

  statLabel: {
    marginTop: 2,
    fontSize: 12,
    color:
      COLORS.textSecondary,
  },

  sectionHeader: {
    marginTop: SPACING.xxxl,
    marginBottom: SPACING.md,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: COLORS.text,
  },

  sectionSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color:
      COLORS.textSecondary,
  },

  chartCard: {
    backgroundColor:
      COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    padding: SPACING.lg,
  },

  periodRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: SPACING.xl,
  },

  periodButton: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent:
      "center",
    backgroundColor:
      COLORS.background,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  periodButtonActive: {
    backgroundColor:
      COLORS.primary,
    borderColor:
      COLORS.primary,
  },

  periodText: {
    fontSize: 11,
    fontWeight: "700",
    color:
      COLORS.textSecondary,
  },

  periodTextActive: {
    color: COLORS.white,
  },

  chart: {
    height: 210,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent:
      "space-between",
  },

  chartColumn: {
    flex: 1,
    height: 200,
    alignItems: "center",
    justifyContent:
      "flex-end",
  },

  chartValue: {
    marginBottom: 5,
    fontSize: 10,
    fontWeight: "600",
    color:
      COLORS.textSecondary,
  },

  chartBarContainer: {
    height: 150,
    width: 24,
    justifyContent:
      "flex-end",
    borderRadius: 8,
    backgroundColor:
      COLORS.background,
    overflow: "hidden",
  },

  chartBar: {
    width: "100%",
    borderRadius: 8,
    backgroundColor:
      COLORS.primary,
  },

  chartLabel: {
    marginTop: 7,
    fontSize: 10,
    color:
      COLORS.textMuted,
  },

  topCard: {
    backgroundColor:
      COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    overflow: "hidden",
  },

  topRow: {
    minHeight: 72,
    paddingHorizontal:
      SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
  },

  topRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor:
      COLORS.border,
  },

  rank: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor:
      "#DBEAFE",
    alignItems: "center",
    justifyContent:
      "center",
  },

  rankText: {
    fontSize: 13,
    fontWeight: "800",
    color:
      COLORS.primary,
  },

  topContent: {
    flex: 1,
    marginLeft: SPACING.md,
    marginRight: SPACING.md,
  },

  topName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },

  topType: {
    marginTop: 3,
    fontSize: 11,
    color:
      COLORS.textSecondary,
  },

  scanCount: {
    alignItems: "flex-end",
  },

  scanNumber: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
  },

  scanLabel: {
    marginTop: 2,
    fontSize: 10,
    color:
      COLORS.textMuted,
  },

  overviewCard: {
    backgroundColor:
      COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    overflow: "hidden",
  },

  overviewRow: {
    minHeight: 68,
    paddingHorizontal:
      SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
  },

  overviewRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor:
      COLORS.border,
  },

  overviewIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent:
      "center",
  },

  successIcon: {
    backgroundColor:
      "#DCFCE7",
  },

  warningIcon: {
    backgroundColor:
      "#FEF3C7",
  },

  primaryIcon: {
    backgroundColor:
      "#DBEAFE",
  },

  overviewTitle: {
    flex: 1,
    marginLeft: SPACING.md,
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },

  overviewValue: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },

  infoBox: {
    marginTop: SPACING.xxl,
    padding: SPACING.lg,
    borderRadius: 16,
    backgroundColor:
      "#EFF6FF",
    flexDirection: "row",
    alignItems: "flex-start",
  },

  infoText: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: 12,
    lineHeight: 19,
    color:
      COLORS.textSecondary,
  },

  emptyCard: {
    marginTop: SPACING.xxxl,
    padding: SPACING.xxl,
    borderRadius: 20,
    backgroundColor:
      COLORS.surface,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    alignItems: "center",
  },

  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor:
      "#DBEAFE",
    alignItems: "center",
    justifyContent:
      "center",
  },

  emptyTitle: {
    marginTop: SPACING.lg,
    fontSize: 21,
    fontWeight: "800",
    color: COLORS.text,
  },

  emptyText: {
    marginTop: SPACING.sm,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    color:
      COLORS.textSecondary,
  },
});