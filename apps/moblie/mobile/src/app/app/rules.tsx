// src/app/app/rules.tsx
//
// Smart Rules list — mirrors
// /dashboard/qr/rules on the web dashboard.
//
// QR selector → GET /qrcodes/business/:businessId
// (qrcodeApi). Rules → GET /qr-rules/qr/:qrCodeId.
// Row actions: Publish / Pause / Activate / Edit /
// Delete. FAB → /app/rule-builder.

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useQuery } from "@tanstack/react-query";

import { queryClient } from "../../api/query-client";

import { getQRCodes } from "../../api/qrcodeApi";

import {
  activateQRRule,
  deleteQRRule,
  listQRRules,
  pauseQRRule,
  publishQRRule,
  QRRule,
  QRRuleStatus,
} from "../../api/qrRulesApi";

import { toNumber } from "../../api/utils";

import { useCurrentBusiness } from "../../hooks/useCurrentBusiness";

import StatCard from "../../components/dashboard/StatCard";
import StatusPill, {
  StatusTone,
} from "../../components/dashboard/StatusPill";
import EmptyState from "../../components/common/EmptyState";
import ScreenLoader from "../../components/loaders/ScreenLoader";
import Input from "../../components/ui/Input";

import { COLORS } from "../../constants/colors";
import { SPACING } from "../../constants/spacing";

const STATUS_FILTERS: Array<
  "ALL" | QRRuleStatus
> = [
  "ALL",
  "DRAFT",
  "ACTIVE",
  "PAUSED",
  "EXPIRED",
  "ARCHIVED",
];

function statusTone(
  status: QRRuleStatus
): StatusTone {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "PAUSED":
      return "warning";
    case "EXPIRED":
      return "danger";
    case "DRAFT":
      return "info";
    default:
      return "muted";
  }
}

export default function SmartRulesScreen() {
  const {
    businessId,
    isLoading: businessLoading,
    isError: businessError,
    refetch: refetchBusinesses,
  } = useCurrentBusiness();

  const [selectedQrId, setSelectedQrId] =
    useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<"ALL" | QRRuleStatus>("ALL");

  const [busyRuleId, setBusyRuleId] =
    useState<string | null>(null);

  const qrcodesQuery = useQuery({
    queryKey: ["qrcodes", businessId],
    queryFn: () =>
      getQRCodes(businessId as string),
    enabled: Boolean(businessId),
  });

  const qrcodes = qrcodesQuery.data ?? [];

  /*
   * Default to the first QR once the list loads
   * (mirrors the web selector defaulting to a QR).
   */
  const activeQrId =
    selectedQrId ??
    (qrcodes.length > 0
      ? qrcodes[0].id
      : null);

  const rulesQuery = useQuery({
    queryKey: ["qr-rules", activeQrId],
    queryFn: () =>
      listQRRules(activeQrId as string),
    enabled: Boolean(activeQrId),
  });

  const rules = rulesQuery.data ?? [];

  const stats = useMemo(() => {
    const active = rules.filter(
      (rule) => rule.status === "ACTIVE"
    ).length;

    const drafts = rules.filter(
      (rule) => rule.status === "DRAFT"
    ).length;

    const matches = rules.reduce(
      (sum, rule) =>
        sum + toNumber(rule.matchCount),
      0
    );

    return {
      total: rules.length,
      active,
      drafts,
      matches,
    };
  }, [rules]);

  const filteredRules = useMemo(() => {
    const term = search.trim().toLowerCase();

    return rules.filter((rule) => {
      if (
        statusFilter !== "ALL" &&
        rule.status !== statusFilter
      ) {
        return false;
      }

      if (!term) {
        return true;
      }

      const haystack =
        `${rule.name} ${rule.description ?? ""}`.toLowerCase();

      return haystack.includes(term);
    });
  }, [rules, search, statusFilter]);

  const loading =
    businessLoading ||
    qrcodesQuery.isLoading ||
    rulesQuery.isLoading;

  const handleRefresh = () => {
    refetchBusinesses();
    void qrcodesQuery.refetch();
    void rulesQuery.refetch();
  };

  async function runRuleAction(
    rule: QRRule,
    action: () => Promise<unknown>
  ) {
    setBusyRuleId(rule.id);

    try {
      await action();

      await queryClient.invalidateQueries({
        queryKey: ["qr-rules", activeQrId],
      });
    } catch (error) {
      Alert.alert(
        "Action failed",
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setBusyRuleId(null);
    }
  }

  function confirmDelete(rule: QRRule) {
    Alert.alert(
      "Delete rule",
      `Delete "${rule.name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            void runRuleAction(rule, () =>
              deleteQRRule(rule.id)
            ),
        },
      ]
    );
  }

  /*
   * LOADING
   */
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenLoader />
      </SafeAreaView>
    );
  }

  /*
   * ERROR / NO BUSINESS
   */
  if (businessError || !businessId) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          title="No business found"
          message="Select or create a business to manage smart rules."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          styles.scrollContent
        }
        refreshControl={
          <RefreshControl
            refreshing={
              qrcodesQuery.isFetching ||
              rulesQuery.isFetching
            }
            onRefresh={handleRefresh}
          />
        }
      >
        <Text style={styles.title}>
          Smart Rules
        </Text>

        <Text style={styles.subtitle}>
          Conditional routing for your QR scans.
        </Text>

        {/* QR selector */}
        <Text style={styles.sectionLabel}>
          QR CODE
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.qrSelector}
          contentContainerStyle={
            styles.qrSelectorContent
          }
        >
          {qrcodes.map((qr) => {
            const selected =
              qr.id === activeQrId;

            return (
              <Pressable
                key={qr.id}
                onPress={() =>
                  setSelectedQrId(qr.id)
                }
                style={[
                  styles.qrChip,
                  selected && styles.qrChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.qrChipText,
                    selected &&
                      styles.qrChipTextActive,
                  ]}
                >
                  {qr.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Stats */}
        <View style={styles.statRow}>
          <StatCard
            title="Total"
            value={stats.total}
            subtitle="rules"
            icon="git-branch-outline"
          />

          <StatCard
            title="Active"
            value={stats.active}
            subtitle="live rules"
            icon="checkmark-circle-outline"
          />
        </View>

        <View style={styles.statRow}>
          <StatCard
            title="Drafts"
            value={stats.drafts}
            subtitle="not published"
            icon="create-outline"
          />

          <StatCard
            title="Matches"
            value={stats.matches}
            subtitle="total matches"
            icon="analytics-outline"
          />
        </View>

        {/* Search */}
        <Input
          label="Search rules"
          placeholder="Search by name..."
          value={search}
          onChangeText={setSearch}
        />

        {/* Status filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={
            styles.filterContent
          }
        >
          {STATUS_FILTERS.map((filter) => {
            const selected =
              filter === statusFilter;

            return (
              <Pressable
                key={filter}
                onPress={() =>
                  setStatusFilter(filter)
                }
                style={[
                  styles.filterChip,
                  selected &&
                    styles.filterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selected &&
                      styles.filterChipTextActive,
                  ]}
                >
                  {filter}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Rule rows */}
        {filteredRules.length === 0 ? (
          <EmptyState
            title="No rules yet"
            message="Create a smart rule to route scans based on device, time, location and more."
          />
        ) : (
          filteredRules.map((rule) => {
            const busy =
              busyRuleId === rule.id;

            const conditionCount =
              (rule.conditions ?? []).length +
              (rule.groups ?? []).reduce(
                (sum, group) =>
                  sum +
                  (group.conditions ?? [])
                    .length,
                0
              );

            return (
              <Pressable
                key={rule.id}
                style={styles.ruleCard}
                onPress={() =>
                  router.push({
                    pathname:
                      "/app/rule-detail",
                    params: { id: rule.id },
                  })
                }
              >
                <View
                  style={styles.ruleCardHeader}
                >
                  <View
                    style={
                      styles.priorityBadge
                    }
                  >
                    <Text
                      style={
                        styles.priorityText
                      }
                    >
                      P{rule.priority}
                    </Text>
                  </View>

                  <View style={styles.ruleNameRow}>
                    <Text
                      style={styles.ruleName}
                      numberOfLines={1}
                    >
                      {rule.name}
                    </Text>

                    <Text
                      style={styles.ruleMeta}
                      numberOfLines={1}
                    >
                      {conditionCount}{" "}
                      condition
                      {conditionCount === 1
                        ? ""
                        : "s"}{" "}
                      ·{" "}
                      {toNumber(
                        rule.matchCount
                      ).toLocaleString()}{" "}
                      matches
                    </Text>
                  </View>

                  <StatusPill
                    label={rule.status}
                    tone={statusTone(
                      rule.status
                    )}
                  />
                </View>

                <View
                  style={styles.ruleActions}
                >
                  {(rule.status ===
                    "DRAFT" ||
                    rule.status ===
                      "PAUSED") && (
                    <Pressable
                      style={
                        styles.actionButton
                      }
                      disabled={busy}
                      onPress={() =>
                        void runRuleAction(
                          rule,
                          () =>
                            publishQRRule(
                              rule.id
                            )
                        )
                      }
                    >
                      <Ionicons
                        name="rocket-outline"
                        size={16}
                        color={COLORS.success}
                      />

                      <Text
                        style={
                          styles.actionButtonText
                        }
                      >
                        Publish
                      </Text>
                    </Pressable>
                  )}

                  {rule.status ===
                    "ACTIVE" && (
                    <Pressable
                      style={
                        styles.actionButton
                      }
                      disabled={busy}
                      onPress={() =>
                        void runRuleAction(
                          rule,
                          () =>
                            pauseQRRule(
                              rule.id
                            )
                        )
                      }
                    >
                      <Ionicons
                        name="pause-outline"
                        size={16}
                        color={COLORS.warning}
                      />

                      <Text
                        style={
                          styles.actionButtonText
                        }
                      >
                        Pause
                      </Text>
                    </Pressable>
                  )}

                  {rule.status ===
                    "PAUSED" && (
                    <Pressable
                      style={
                        styles.actionButton
                      }
                      disabled={busy}
                      onPress={() =>
                        void runRuleAction(
                          rule,
                          () =>
                            activateQRRule(
                              rule.id
                            )
                        )
                      }
                    >
                      <Ionicons
                        name="play-outline"
                        size={16}
                        color={COLORS.success}
                      />

                      <Text
                        style={
                          styles.actionButtonText
                        }
                      >
                        Activate
                      </Text>
                    </Pressable>
                  )}

                  <Pressable
                    style={
                      styles.actionButton
                    }
                    disabled={busy}
                    onPress={() =>
                      router.push({
                        pathname:
                          "/app/rule-builder",
                        params: {
                          edit: rule.id,
                        },
                      })
                    }
                  >
                    <Ionicons
                      name="create-outline"
                      size={16}
                      color={COLORS.primary}
                    />

                    <Text
                      style={
                        styles.actionButtonText
                      }
                    >
                      Edit
                    </Text>
                  </Pressable>

                  <Pressable
                    style={
                      styles.actionButton
                    }
                    disabled={busy}
                    onPress={() =>
                      confirmDelete(rule)
                    }
                  >
                    <Ionicons
                      name="trash-outline"
                      size={16}
                      color={COLORS.danger}
                    />

                    <Text
                      style={
                        styles.actionButtonText
                      }
                    >
                      Delete
                    </Text>
                  </Pressable>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      {/* FAB → rule builder */}
      <Pressable
        style={styles.fab}
        onPress={() =>
          router.push({
            pathname: "/app/rule-builder",
            params: activeQrId
              ? { qrId: activeQrId }
              : undefined,
          })
        }
      >
        <Ionicons
          name="add"
          size={28}
          color={COLORS.white}
        />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.huge * 2,
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.text,
  },

  subtitle: {
    marginTop: SPACING.xs,
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  sectionLabel: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.xs,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: COLORS.textSecondary,
    textTransform: "uppercase",
  },

  qrSelector: {
    marginHorizontal: -SPACING.lg,
  },

  qrSelectorContent: {
    paddingHorizontal: SPACING.lg,
  },

  qrChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
  },

  qrChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  qrChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },

  qrChipTextActive: {
    color: COLORS.white,
  },

  statRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },

  filterRow: {
    marginHorizontal: -SPACING.lg,
    marginBottom: SPACING.sm,
  },

  filterContent: {
    paddingHorizontal: SPACING.lg,
  },

  filterChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    marginRight: SPACING.xs,
  },

  filterChipActive: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
  },

  filterChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },

  filterChipTextActive: {
    color: COLORS.white,
  },

  ruleCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
  },

  ruleCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  priorityBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },

  priorityText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.primary,
  },

  ruleNameRow: {
    flex: 1,
    marginHorizontal: SPACING.sm,
  },

  ruleName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },

  ruleMeta: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  ruleActions: {
    flexDirection: "row",
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.md,
  },

  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  actionButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
  },

  fab: {
    position: "absolute",
    right: SPACING.xl,
    bottom: SPACING.xxl,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
});
