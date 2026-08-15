import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import { COLORS } from "../../../constants/colors";
import { SPACING } from "../../../constants/spacing";

type Period = "7D" | "30D" | "90D";

type ScanData = {
  day: string;
  scans: number;
};

type QRPerformance = {
  name: string;
  scans: number;
  percentage: number;
  status: "Active" | "Inactive";
};

type RecentScan = {
  qr: string;
  device: string;
  location: string;
  time: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const SCAN_DATA: Record<Period, ScanData[]> = {
  "7D": [
    { day: "Mon", scans: 120 },
    { day: "Tue", scans: 180 },
    { day: "Wed", scans: 145 },
    { day: "Thu", scans: 230 },
    { day: "Fri", scans: 310 },
    { day: "Sat", scans: 270 },
    { day: "Sun", scans: 390 },
  ],

  "30D": [
    { day: "W1", scans: 620 },
    { day: "W2", scans: 810 },
    { day: "W3", scans: 970 },
    { day: "W4", scans: 1240 },
  ],

  "90D": [
    { day: "M1", scans: 2100 },
    { day: "M2", scans: 2860 },
    { day: "M3", scans: 3740 },
  ],
};

const QR_PERFORMANCE: QRPerformance[] = [
  {
    name: "Restaurant Menu",
    scans: 482,
    percentage: 92,
    status: "Active",
  },
  {
    name: "Google Review",
    scans: 318,
    percentage: 76,
    status: "Active",
  },
  {
    name: "Instagram Profile",
    scans: 246,
    percentage: 59,
    status: "Active",
  },
  {
    name: "Business Website",
    scans: 202,
    percentage: 48,
    status: "Active",
  },
  {
    name: "Contact Card",
    scans: 124,
    percentage: 30,
    status: "Inactive",
  },
];

const RECENT_SCANS: RecentScan[] = [
  {
    qr: "Restaurant Menu",
    device: "iPhone",
    location: "Kadiri",
    time: "2 min ago",
    icon: "phone-portrait-outline",
  },
  {
    qr: "Google Review",
    device: "Android",
    location: "Kadiri",
    time: "8 min ago",
    icon: "phone-portrait-outline",
  },
  {
    qr: "Instagram Profile",
    device: "iPhone",
    location: "Bengaluru",
    time: "16 min ago",
    icon: "phone-portrait-outline",
  },
  {
    qr: "Business Website",
    device: "Android",
    location: "Hyderabad",
    time: "32 min ago",
    icon: "phone-portrait-outline",
  },
  {
    qr: "Restaurant Menu",
    device: "Android",
    location: "Kadiri",
    time: "45 min ago",
    icon: "phone-portrait-outline",
  },
];

export default function AnalyticsScreen() {
  const { width } = useWindowDimensions();

  const isLargeScreen = width >= 900;

 const [period, setPeriod] =
  useState<Period>("7D");

  const scanData = SCAN_DATA[period];

  const totalScans =
    scanData.reduce(
      (total, item) => total + item.scans,
      0
    );

  const maxScans = Math.max(
    ...scanData.map((item) => item.scans)
  );

  const firstValue = scanData[0]?.scans || 1;

  const lastValue =
    scanData[scanData.length - 1]?.scans || 1;

  const growth =
    ((lastValue - firstValue) / firstValue) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          isLargeScreen && styles.largeContent,
        ]}
      >
        {/* HEADER */}

        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>
              BUSINESS INSIGHTS
            </Text>

            <Text style={styles.title}>
              Analytics
            </Text>

            <Text style={styles.subtitle}>
              Understand how your QR codes are
              performing.
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Ionicons
              name="stats-chart"
              size={22}
              color={COLORS.primary}
            />
          </View>
        </View>

        {/* PERIOD FILTER */}

        <View style={styles.periodContainer}>
          {(["7D", "30D", "90D"] as Period[]).map(
            (item) => {
              const selected = period === item;

              return (
                <Pressable
                  key={item}
                  onPress={() => setPeriod(item)}
                  style={[
                    styles.periodButton,
                    selected &&
                      styles.periodButtonSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.periodText,
                      selected &&
                        styles.periodTextSelected,
                    ]}
                  >
                    {item === "7D"
                      ? "7 Days"
                      : item === "30D"
                        ? "30 Days"
                        : "90 Days"}
                  </Text>
                </Pressable>
              );
            }
          )}
        </View>

        {/* KPI GRID */}

        <View
          style={[
            styles.kpiGrid,
            isLargeScreen && styles.kpiGridLarge,
          ]}
        >
          <KpiCard
            icon="scan-outline"
            title="Total Scans"
            value="1,248"
            change="+18.6%"
            positive
          />

          <KpiCard
            icon="people-outline"
            title="Unique Visitors"
            value="842"
            change="+12.4%"
            positive
          />

          <KpiCard
            icon="flash-outline"
            title="Today's Scans"
            value="126"
            change="+24.8%"
            positive
          />

          <KpiCard
            icon="qr-code-outline"
            title="Active QR Codes"
            value="10"
            change="83%"
            positive
          />
        </View>

        {/* SCAN TREND */}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>
                Scan activity
              </Text>

              <Text style={styles.cardSubtitle}>
                QR scans during the selected period
              </Text>
            </View>

            <View style={styles.growthBadge}>
              <Ionicons
                name="trending-up"
                size={14}
                color="#15803D"
              />

              <Text style={styles.growthText}>
                +{growth.toFixed(1)}%
              </Text>
            </View>
          </View>

          <View style={styles.chartSummary}>
            <Text style={styles.chartTotal}>
              {totalScans.toLocaleString()}
            </Text>

            <Text style={styles.chartTotalLabel}>
              scans
            </Text>
          </View>

          <View style={styles.chart}>
            {scanData.map((item) => {
              const height =
                maxScans > 0
                  ? (item.scans / maxScans) * 180
                  : 0;

              const isHighest =
                item.scans === maxScans;

              return (
                <View
                  key={item.day}
                  style={styles.chartColumn}
                >
                  <Text style={styles.chartValue}>
                    {item.scans}
                  </Text>

                  <View style={styles.barArea}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height,
                          backgroundColor:
                            isHighest
                              ? COLORS.primary
                              : "#CBD5E1",
                        },
                      ]}
                    />
                  </View>

                  <Text style={styles.chartLabel}>
                    {item.day}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* TWO COLUMN SECTION */}

        <View
          style={[
            styles.twoColumn,
            isLargeScreen && styles.twoColumnLarge,
          ]}
        >
          {/* TOP QR CODES */}

          <View
            style={[
              styles.card,
              isLargeScreen && styles.columnCard,
            ]}
          >
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>
                  Top QR Codes
                </Text>

                <Text style={styles.cardSubtitle}>
                  Best performing QR codes
                </Text>
              </View>

              <Ionicons
                name="trophy-outline"
                size={21}
                color={COLORS.primary}
              />
            </View>

            <View style={styles.qrList}>
              {QR_PERFORMANCE.map(
                (item, index) => (
                  <View
                    key={item.name}
                    style={styles.qrRow}
                  >
                    <View
                      style={[
                        styles.rank,
                        index === 0 &&
                          styles.rankFirst,
                      ]}
                    >
                      <Text
                        style={[
                          styles.rankText,
                          index === 0 &&
                            styles.rankTextFirst,
                        ]}
                      >
                        {index + 1}
                      </Text>
                    </View>

                    <View
                      style={styles.qrInfo}
                    >
                      <Text
                        numberOfLines={1}
                        style={styles.qrName}
                      >
                        {item.name}
                      </Text>

                      <View
                        style={
                          styles.progressBackground
                        }
                      >
                        <View
                          style={[
                            styles.progress,
                            {
                              width: `${item.percentage}%`,
                            },
                          ]}
                        />
                      </View>
                    </View>

                    <View
                      style={styles.qrStats}
                    >
                      <Text
                        style={styles.qrScans}
                      >
                        {item.scans}
                      </Text>

                      <Text
                        style={styles.qrPercent}
                      >
                        {item.percentage}%
                      </Text>
                    </View>
                  </View>
                )
              )}
            </View>
          </View>

          {/* DEVICE BREAKDOWN */}

          <View
            style={[
              styles.card,
              isLargeScreen && styles.columnCard,
            ]}
          >
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>
                  Devices
                </Text>

                <Text style={styles.cardSubtitle}>
                  Where your scans come from
                </Text>
              </View>

              <Ionicons
                name="phone-portrait-outline"
                size={21}
                color={COLORS.primary}
              />
            </View>

            <DeviceRow
              icon="logo-apple"
              label="iPhone"
              value="58%"
            />

            <DeviceRow
              icon="logo-android"
              label="Android"
              value="35%"
            />

            <DeviceRow
              icon="desktop-outline"
              label="Desktop"
              value="7%"
            />
          </View>
        </View>

        {/* INSIGHTS */}

        <View style={styles.insightCard}>
          <View style={styles.insightIcon}>
            <Ionicons
              name="bulb-outline"
              size={21}
              color={COLORS.primary}
            />
          </View>

          <View style={styles.insightContent}>
            <Text style={styles.insightTitle}>
              Performance insight
            </Text>

            <Text style={styles.insightText}>
              Your Restaurant Menu QR is currently
              your strongest performer. Scan activity
              is trending upward, with the highest
              activity occurring toward the end of
              the selected period.
            </Text>
          </View>
        </View>

        {/* RECENT ACTIVITY */}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>
                Recent scans
              </Text>

              <Text style={styles.cardSubtitle}>
                Latest QR activity
              </Text>
            </View>

            <Pressable>
              <Text style={styles.viewAll}>
                View all
              </Text>
            </Pressable>
          </View>

          <View style={styles.activityList}>
            {RECENT_SCANS.map((scan) => (
              <View
                key={`${scan.qr}-${scan.time}`}
                style={styles.activityRow}
              >
                <View style={styles.activityIcon}>
                  <Ionicons
                    name={scan.icon}
                    size={18}
                    color={COLORS.primary}
                  />
                </View>

                <View
                  style={styles.activityInfo}
                >
                  <Text
                    numberOfLines={1}
                    style={styles.activityQR}
                  >
                    {scan.qr}
                  </Text>

                  <Text
                    style={styles.activityMeta}
                  >
                    {scan.device} •{" "}
                    {scan.location}
                  </Text>
                </View>

                <Text style={styles.activityTime}>
                  {scan.time}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* FOOTER */}

        <View style={styles.footer}>
          <Ionicons
            name="shield-checkmark-outline"
            size={16}
            color={COLORS.textSecondary}
          />

          <Text style={styles.footerText}>
            Analytics shown here are currently
            frontend preview data.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================================================= */
/* KPI CARD                                          */
/* ================================================= */

function KpiCard({
  icon,
  title,
  value,
  change,
  positive,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string;
  change: string;
  positive: boolean;
}) {
  return (
    <View style={styles.kpiCard}>
      <View style={styles.kpiTop}>
        <View style={styles.kpiIcon}>
          <Ionicons
            name={icon}
            size={20}
            color={COLORS.primary}
          />
        </View>

        <View
          style={[
            styles.changeBadge,
            positive
              ? styles.changePositive
              : styles.changeNegative,
          ]}
        >
          <Ionicons
            name={
              positive
                ? "arrow-up"
                : "arrow-down"
            }
            size={11}
            color={
              positive ? "#15803D" : "#B91C1C"
            }
          />

          <Text
            style={[
              styles.changeText,
              positive
                ? styles.changeTextPositive
                : styles.changeTextNegative,
            ]}
          >
            {change}
          </Text>
        </View>
      </View>

      <Text style={styles.kpiValue}>
        {value}
      </Text>

      <Text style={styles.kpiTitle}>
        {title}
      </Text>
    </View>
  );
}

/* ================================================= */
/* DEVICE ROW                                        */
/* ================================================= */

function DeviceRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  const percentage =
    parseInt(value.replace("%", ""), 10);

  return (
    <View style={styles.deviceRow}>
      <View style={styles.deviceIcon}>
        <Ionicons
          name={icon}
          size={18}
          color={COLORS.text}
        />
      </View>

      <View style={styles.deviceContent}>
        <View style={styles.deviceHeader}>
          <Text style={styles.deviceLabel}>
            {label}
          </Text>

          <Text style={styles.deviceValue}>
            {value}
          </Text>
        </View>

        <View
          style={styles.deviceProgressBackground}
        >
          <View
            style={[
              styles.deviceProgress,
              {
                width: `${percentage}%`,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

/* ================================================= */
/* STYLES                                            */
/* ================================================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    padding: SPACING.xl,
    paddingBottom: SPACING.huge,
  },

  largeContent: {
    maxWidth: 1180,
    width: "100%",
    alignSelf: "center",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.xl,
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    color: COLORS.primary,
    marginBottom: 5,
  },

  title: {
    fontSize: 30,
    fontWeight: "900",
    color: COLORS.text,
  },

  subtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.textSecondary,
  },

  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  periodContainer: {
    alignSelf: "flex-start",
    flexDirection: "row",
    padding: 4,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xl,
  },

  periodButton: {
    minWidth: 82,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  periodButtonSelected: {
    backgroundColor: COLORS.primary,
  },

  periodText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },

  periodTextSelected: {
    color: COLORS.white,
  },

  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 14,
  },

  kpiGridLarge: {
    gap: 14,
  },

  kpiCard: {
    flexGrow: 1,
    flexBasis: "47%",
    minHeight: 145,
    padding: SPACING.lg,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  kpiTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  kpiIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  changeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },

  changePositive: {
    backgroundColor: "#DCFCE7",
  },

  changeNegative: {
    backgroundColor: "#FEE2E2",
  },

  changeText: {
    marginLeft: 3,
    fontSize: 10,
    fontWeight: "800",
  },

  changeTextPositive: {
    color: "#15803D",
  },

  changeTextNegative: {
    color: "#B91C1C",
  },

  kpiValue: {
    marginTop: SPACING.lg,
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.text,
  },

  kpiTitle: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },

  card: {
    marginBottom: 14,
    padding: SPACING.lg,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.text,
  },

  cardSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  growthBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#DCFCE7",
  },

  growthText: {
    marginLeft: 4,
    fontSize: 11,
    fontWeight: "800",
    color: "#15803D",
  },

  chartSummary: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: SPACING.xl,
  },

  chartTotal: {
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.text,
  },

  chartTotalLabel: {
    marginLeft: 7,
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  chart: {
    height: 250,
    marginTop: SPACING.lg,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
  },

  chartColumn: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
  },

  chartValue: {
    marginBottom: 7,
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },

  barArea: {
    width: "58%",
    maxWidth: 42,
    height: 180,
    justifyContent: "flex-end",
    alignItems: "center",
  },

  bar: {
    width: "100%",
    minHeight: 5,
    borderRadius: 8,
  },

  chartLabel: {
    marginTop: 9,
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },

  twoColumn: {
    width: "100%",
  },

  twoColumnLarge: {
    flexDirection: "row",
    gap: 14,
  },

  columnCard: {
    flex: 1,
    marginBottom: 14,
  },

  qrList: {
    marginTop: SPACING.lg,
  },

  qrRow: {
    minHeight: 61,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  rank: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },

  rankFirst: {
    backgroundColor: "#FEF3C7",
  },

  rankText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.textSecondary,
  },

  rankTextFirst: {
    color: "#B45309",
  },

  qrInfo: {
    flex: 1,
    marginLeft: 10,
    marginRight: 12,
  },

  qrName: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
  },

  progressBackground: {
    height: 5,
    marginTop: 7,
    borderRadius: 999,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
  },

  progress: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },

  qrStats: {
    width: 48,
    alignItems: "flex-end",
  },

  qrScans: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.text,
  },

  qrPercent: {
    marginTop: 2,
    fontSize: 10,
    color: COLORS.textSecondary,
  },

  deviceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.xl,
  },

  deviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },

  deviceContent: {
    flex: 1,
    marginLeft: 12,
  },

  deviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  deviceLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
  },

  deviceValue: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.textSecondary,
  },

  deviceProgressBackground: {
    height: 6,
    marginTop: 7,
    borderRadius: 999,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
  },

  deviceProgress: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },

  insightCard: {
    marginBottom: 14,
    padding: SPACING.lg,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    flexDirection: "row",
    alignItems: "flex-start",
  },

  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },

  insightContent: {
    flex: 1,
    marginLeft: 12,
  },

  insightTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
  },

  insightText: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 19,
    color: COLORS.textSecondary,
  },

  viewAll: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.primary,
  },

  activityList: {
    marginTop: SPACING.md,
  },

  activityRow: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  activityInfo: {
    flex: 1,
    marginLeft: 12,
  },

  activityQR: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
  },

  activityMeta: {
    marginTop: 3,
    fontSize: 11,
    color: COLORS.textSecondary,
  },

  activityTime: {
    marginLeft: 8,
    fontSize: 10,
    color: COLORS.textSecondary,
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },

  footerText: {
    marginLeft: 6,
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
});