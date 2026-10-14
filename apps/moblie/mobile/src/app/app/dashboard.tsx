import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import StatCard from "../../components/dashboard/StatCard";
import QuickAction from "../../components/dashboard/QuickAction";

import {
  getBusinessAnalytics,
} from "../../api/analyticsApi";

import {
  relativeTime,
  toNumber,
} from "../../api/utils";

import { useCurrentBusiness } from "../../hooks/useCurrentBusiness";

export default function DashboardScreen() {
  const {
    business,
    businessId,
    isLoading: businessLoading,
    isError: businessError,
    refetch: refetchBusinesses,
  } = useCurrentBusiness();

  const analyticsQuery = useQuery({
    queryKey: [
      "analytics",
      businessId,
      30,
    ],
    queryFn: () =>
      getBusinessAnalytics(
        businessId as string,
        30,
        10
      ),
    enabled: Boolean(businessId),
  });

  const analytics =
    analyticsQuery.data ?? null;

  const overview =
    analytics?.overview ?? {};

  /*
   * KPI values from GET /analytics/business/:id.
   */
  const totalQRCodes = toNumber(
    overview.totalQrCodes
  );

  const totalScans = toNumber(
    overview.totalScans
  );

  const activeQRCodes = toNumber(
    overview.activeQrCodes
  );

  const uniqueVisitors = toNumber(
    overview.uniqueVisitors
  );

  /*
   * QR name lookup for the recent-scans feed.
   */
  const qrNames = useMemo(() => {
    const map = new Map<string, string>();

    for (const row of analytics?.qrPerformance ??
      []) {
      map.set(row.id, row.name);
    }

    return map;
  }, [analytics]);

  const recentScans = useMemo(
    () =>
      (analytics?.recentScans ?? []).slice(
        0,
        3
      ),
    [analytics]
  );

  const loading =
    businessLoading ||
    analyticsQuery.isLoading;

  const refreshing =
    analyticsQuery.isFetching &&
    !analyticsQuery.isLoading;

  const handleRefresh = () => {
    refetchBusinesses();
    void analyticsQuery.refetch();
  };

  /*
   * LOADING
   */
  if (loading) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View style={styles.loader}>
          <ActivityIndicator
            size="large"
            color="#2563EB"
          />

          <Text style={styles.loaderText}>
            Loading your dashboard...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /*
   * ERROR / NO BUSINESS
   */
  if (
    businessError ||
    analyticsQuery.isError ||
    !business
  ) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View style={styles.loader}>
          <Text style={styles.errorTitle}>
            Unable to load dashboard
          </Text>

          <Text style={styles.errorText}>
            {!business
              ? "Create a business to see your overview."
              : "Check your connection and try again."}
          </Text>

          <Text
            style={styles.retry}
            onPress={handleRefresh}
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
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>
              TapQR
            </Text>

            <Text style={styles.title}>
              Good morning 👋
            </Text>

            <Text style={styles.subtitle}>
              {business.name} — here&apos;s
              your business overview.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Overview
        </Text>

        <View style={styles.row}>
          <StatCard
            title="QR Codes"
            value={totalQRCodes}
            subtitle="Total created"
            icon="qr-code-outline"
          />

          <StatCard
            title="Total Scans"
            value={totalScans}
            subtitle="All time"
            icon="scan-outline"
          />
        </View>

        <View style={styles.row}>
          <StatCard
            title="Active"
            value={activeQRCodes}
            subtitle="Currently active"
            icon="checkmark-circle-outline"
          />

          <StatCard
            title="Visitors"
            value={uniqueVisitors}
            subtitle="Unique visitors"
            icon="people-outline"
          />
        </View>

        <Text style={styles.sectionTitle}>
          Quick Actions
        </Text>

        <QuickAction
          title="+ Create QR Code"
          subtitle="Create a new QR code for your business"
          onPress={() => {
            router.push("/app/create-qr");
          }}
        />

        <QuickAction
          title="▣ View QR Codes"
          subtitle="Manage your existing QR codes"
          onPress={() => {
            router.push("/app/tabs/qrcodes");
          }}
        />

        <QuickAction
          title="Analytics"
          subtitle="See scans and customer activity"
          onPress={() => {
            router.push("/app/tabs/analytics");
          }}
        />

        <Text style={styles.sectionTitle}>
          Recent Activity
        </Text>

        <View style={styles.activityCard}>
          {recentScans.length === 0 ? (
            <Text
              style={styles.activityEmpty}
            >
              No scans yet. Share your QR
              code to start seeing activity
              here.
            </Text>
          ) : (
            recentScans.map(
              (scan, index) => {
                const name =
                  qrNames.get(
                    scan.qrCodeId
                  ) ?? "QR code";

                const location =
                  [
                    scan.city,
                    scan.country,
                  ]
                    .filter(Boolean)
                    .join(", ");

                return (
                  <View
                    key={scan.id}
                  >
                    {index > 0 && (
                      <View
                        style={
                          styles.divider
                        }
                      />
                    )}

                    <Text
                      style={
                        styles.activityTitle
                      }
                    >
                      {name} scanned
                    </Text>

                    <Text
                      style={
                        styles.activityTime
                      }
                    >
                      {relativeTime(
                        scan.scannedAt
                      )}
                      {location
                        ? ` • ${location}`
                        : ""}
                      {scan.device
                        ? ` • ${scan.device}`
                        : ""}
                    </Text>
                  </View>
                );
              }
            )
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  content: {
    padding: 20,
    paddingBottom: 40,
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
    color: "#6B7280",
  },

  errorTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
  },

  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },

  retry: {
    marginTop: 16,
    fontSize: 15,
    fontWeight: "700",
    color: "#2563EB",
  },

  header: {
    marginBottom: 28,
  },

  brand: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 18,
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#111827",
  },

  subtitle: {
    marginTop: 6,
    fontSize: 15,
    color: "#6B7280",
  },

  sectionTitle: {
    marginTop: 24,
    marginBottom: 14,
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },

  activityCard: {
    padding: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  activityTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },

  activityTime: {
    marginTop: 4,
    fontSize: 12,
    color: "#6B7280",
  },

  activityEmpty: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },

  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 16,
  },
});
