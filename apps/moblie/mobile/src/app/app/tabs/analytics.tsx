import { useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import {
  ActivityIndicator,
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

import {
  getBusinessAnalytics,
} from "../../../api/analyticsApi";

import {
  formatCount,
  relativeTime,
  toNumber,
} from "../../../api/utils";

import { useCurrentBusiness } from "../../../hooks/useCurrentBusiness";

type Period = "7D" | "30D" | "90D";

const PERIOD_DAYS: Record<Period, number> = {
  "7D": 7,
  "30D": 30,
  "90D": 90,
};

/*
 * Short axis label for a scans-by-day bucket.
 */
function dayLabel(
  iso: string,
  period: Period
): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  if (period === "7D") {
    return date.toLocaleDateString(
      undefined,
      { weekday: "short" }
    );
  }

  return date.toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "short",
    }
  );
}

function deviceIcon(
  label: string
): keyof typeof Ionicons.glyphMap {
  const lower = label.toLowerCase();

  if (
    lower.includes("iphone") ||
    lower.includes("ios") ||
    lower.includes("apple")
  ) {
    return "logo-apple";
  }

  if (lower.includes("android")) {
    return "logo-android";
  }

  return "desktop-outline";
}

export default function AnalyticsScreen() {
  const { width } = useWindowDimensions();

  const isLargeScreen = width >= 900;

  const [period, setPeriod] =
    useState<Period>("7D");

  const { businessId } =
    useCurrentBusiness();

  const days = PERIOD_DAYS[period];

  /*
   * GET /analytics/business/:businessId?days=&limit=
   * — mirrors the web dashboard analytics page.
   */
  const query = useQuery({
    queryKey: [
      "analytics",
      businessId,
      days,
    ],
    queryFn: () =>
      getBusinessAnalytics(
        businessId as string,
        days,
        10
      ),
    enabled: Boolean(businessId),
  });

  const data = query.data ?? null;

  const overview = data?.overview ?? {};

  /*
   * KPI values.
   */
  const totalScans = toNumber(
    overview.totalScans
  );

  const uniqueVisitors = toNumber(
    overview.uniqueVisitors
  );

  const activeQRCodes = toNumber(
    overview.activeQrCodes
  );

  const totalQRCodes = toNumber(
    overview.totalQrCodes
  );

  const percentageChange = toNumber(
    overview.percentageChange
  );

  const changePositive =
    percentageChange >= 0;

  const changeLabel = `${
    changePositive ? "+" : ""
  }${percentageChange.toFixed(1)}%`;

  const activeShare =
    totalQRCodes > 0
      ? Math.round(
          (activeQRCodes / totalQRCodes) *
            100
        )
      : 0;

  /*
   * Scan trend series.
   */
  const scanSeries = useMemo(
    () =>
      (data?.scansByDay ?? []).map(
        (row) => ({
          day: dayLabel(
            row.date,
            period
          ),
          scans: toNumber(row.scans),
        })
      ),
    [data, period]
  );

  const chartTotal = scanSeries.reduce(
    (total, item) => total + item.scans,
    0
  );

  const maxScans = scanSeries.length
    ? Math.max(
        ...scanSeries.map(
          (item) => item.scans
        )
      )
    : 0;

  const firstValue =
    scanSeries[0]?.scans ?? 0;

  const lastValue =
    scanSeries[scanSeries.length - 1]
      ?.scans ?? 0;

  const todaysScans = lastValue;

  const growth =
    firstValue > 0
      ? ((lastValue - firstValue) /
          firstValue) *
        100
      : 0;

  const growthPositive = growth >= 0;

  /*
   * Top QR leaderboard.
   */
  const topQrs = useMemo(() => {
    const rows = [
      ...(data?.qrPerformance ?? []),
    ];

    rows.sort(
      (a, b) =>
        toNumber(b.scanCount) -
        toNumber(a.scanCount)
    );

    const top = rows.slice(0, 5);

    const max = top.length
      ? Math.max(
          ...top.map((row) =>
            toNumber(row.scanCount)
          )
        )
      : 0;

    return top.map((row) => {
      const scans = toNumber(
        row.scanCount
      );

      return {
        name: row.name,
        scans,
        percentage:
          max > 0
            ? Math.round(
                (scans / max) * 100
              )
            : 0,
        status:
          (row.status ?? "")
            .toUpperCase() === "ACTIVE"
            ? "Active"
            : "Inactive",
      };
    });
  }, [data]);

  /*
   * Device breakdown rows.
   */
  const devices = useMemo(() => {
    const rows = data?.devices ?? [];

    const total = rows.reduce(
      (sum, row) =>
        sum + toNumber(row.scans),
      0
    );

    return rows
      .slice(0, 5)
      .map((row) => {
        const label =
          row.name ?? "Unknown";

        const pct =
          total > 0
            ? Math.round(
                (toNumber(row.scans) /
                  total) *
                  100
              )
            : 0;

        return {
          icon: deviceIcon(label),
          label,
          value: `${pct}%`,
        };
      });
  }, [data]);

  /*
   * Recent scans feed.
   */
  const qrNameById = useMemo(() => {
    const map = new Map<
      string,
      string
    >();

    for (const row of data?.qrPerformance ??
      []) {
      map.set(row.id, row.name);
    }

    return map;
  }, [data]);

  const recentScans = useMemo(
    () =>
      (data?.recentScans ?? [])
        .slice(0, 5)
        .map((scan) => ({
          id: scan.id,
          qr:
            qrNameById.get(
              scan.qrCodeId
            ) ?? "QR code",
          device:
            scan.device ||
            scan.browser ||
            "Unknown device",
          location:
            [
              scan.city,
              scan.country,
            ]
              .filter(Boolean)
              .join(", ") ||
            "Unknown location",
          time: relativeTime(
            scan.scannedAt
          ),
        })),
    [data, qrNameById]
  );

  const insight =
    topQrs.length > 0
      ? `Your ${topQrs[0].name} QR is currently your strongest performer with ${formatCount(topQrs[0].scans)} scans in the selected period.`
      : "Share your QR codes to start collecting live scan analytics.";

  /*
   * LOADING
   */
  if (query.isLoading) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View style={styles.loader}>
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
          />

          <Text
            style={styles.loaderText}
          >
            Loading analytics...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /*
   * ERROR / NO BUSINESS
   */
  if (query.isError || !businessId) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View style={styles.loader}>
          <Text
            style={styles.errorTitle}
          >
            Unable to load analytics
          </Text>

          <Text
            style={styles.errorText}
          >
            {!businessId
              ? "Create a business to see analytics."
              : "Check your connection and try again."}
          </Text>

          <Text
            style={styles.retry}
            onPress={() =>
              void query.refetch()
            }
          >
            Tap to retry
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
            value={formatCount(totalScans)}
            change={changeLabel}
            positive={changePositive}
          />

          <KpiCard
            icon="people-outline"
            title="Unique Visitors"
            value={formatCount(
              uniqueVisitors
            )}
            change={changeLabel}
            positive={changePositive}
          />

          <KpiCard
            icon="flash-outline"
            title="Today's Scans"
            value={formatCount(todaysScans)}
            change={`${
              growthPositive ? "+" : ""
            }${growth.toFixed(1)}%`}
            positive={growthPositive}
          />

          <KpiCard
            icon="qr-code-outline"
            title="Active QR Codes"
            value={String(activeQRCodes)}
            change={`${activeShare}%`}
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
                name={
                  growthPositive
                    ? "trending-up"
                    : "trending-down"
                }
                size={14}
                color={
                  growthPositive
                    ? "#15803D"
                    : "#B91C1C"
                }
              />

              <Text style={styles.growthText}>
                {growthPositive ? "+" : ""}
                {growth.toFixed(1)}%
              </Text>
            </View>
          </View>

          <View style={styles.chartSummary}>
            <Text style={styles.chartTotal}>
              {formatCount(chartTotal)}
            </Text>

            <Text style={styles.chartTotalLabel}>
              scans
            </Text>
          </View>

          <View style={styles.chart}>
            {scanSeries.map((item, index) => {
              const height =
                maxScans > 0
                  ? (item.scans / maxScans) * 180
                  : 0;

              const isHighest =
                item.scans === maxScans &&
                maxScans > 0;

              return (
                <View
                  key={`${item.day}-${index}`}
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
              {topQrs.length === 0 ? (
                <Text
                  style={styles.emptySection}
                >
                  No QR performance data yet.
                </Text>
              ) : (
                topQrs.map((item, index) => (
                  <View
                    key={`${item.name}-${index}`}
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
                ))
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

            {devices.length === 0 ? (
              <Text
                style={styles.emptySection}
              >
                No device data yet.
              </Text>
            ) : (
              devices.map((device) => (
                <DeviceRow
                  key={device.label}
                  icon={device.icon}
                  label={device.label}
                  value={device.value}
                />
              ))
            )}
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
              {insight}
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
            {recentScans.length === 0 ? (
              <Text
                style={styles.emptySection}
              >
                No recent scans.
              </Text>
            ) : (
              recentScans.map((scan) => (
                <View
                  key={scan.id}
                  style={styles.activityRow}
                >
                  <View
                    style={styles.activityIcon}
                  >
                    <Ionicons
                      name="phone-portrait-outline"
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

                  <Text
                    style={styles.activityTime}
                  >
                    {scan.time}
                  </Text>
                </View>
              ))
            )}
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
            Live analytics from your TapQR
            business.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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

  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  loaderText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  errorTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
  },

  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
  },

  retry: {
    marginTop: 16,
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.primary,
  },

  emptySection: {
    fontSize: 13,
    color: COLORS.textSecondary,
    paddingVertical: 8,
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