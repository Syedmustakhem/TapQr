// src/app/app/rule-detail.tsx
//
// Rule detail — mirrors
// /dashboard/qr/rules/[ruleId] on the web dashboard.
//
// Header (status + Edit/Publish/Pause/Activate),
// stat grid, conditions + routing action display,
// simulator (POST /qr-rules/simulate), matches table
// (GET /qr-rules/qr/:qrCodeId/matches?ruleId=&limit=25).
//
// Version history is deferred (per the replication
// audit it is never rendered on the web either).

import { Ionicons } from "@expo/vector-icons";
import {
  router,
  useLocalSearchParams,
} from "expo-router";
import { useState } from "react";
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

import {
  activateQRRule,
  deleteQRRule,
  getQRRule,
  getQRRuleMatches,
  pauseQRRule,
  publishQRRule,
  QRRuleCondition,
  QRRuleConditionGroup,
  QRRuleMatch,
  QRRuleSimulationResult,
  QRRuleStatus,
  simulateQRRule,
} from "../../api/qrRulesApi";

import {
  relativeTime,
  toNumber,
} from "../../api/utils";

import StatCard from "../../components/dashboard/StatCard";
import StatusPill, {
  StatusTone,
} from "../../components/dashboard/StatusPill";
import EmptyState from "../../components/common/EmptyState";
import ScreenLoader from "../../components/loaders/ScreenLoader";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

import { COLORS } from "../../constants/colors";
import { SPACING } from "../../constants/spacing";

const OPERATOR_LABELS: Record<string, string> = {
  EQUALS: "equals",
  NOT_EQUALS: "does not equal",
  GREATER_THAN: "greater than",
  GREATER_THAN_OR_EQUAL: "greater than or equal",
  LESS_THAN: "less than",
  LESS_THAN_OR_EQUAL: "less than or equal",
  IN: "is one of",
  NOT_IN: "is not one of",
  BETWEEN: "between",
  NOT_BETWEEN: "not between",
  CONTAINS: "contains",
  NOT_CONTAINS: "does not contain",
  STARTS_WITH: "starts with",
  ENDS_WITH: "ends with",
  EXISTS: "exists",
  NOT_EXISTS: "does not exist",
};

function conditionTypeLabel(
  type: string
): string {
  return type
    .split("_")
    .map(
      (word) =>
        word.charAt(0) +
        word.slice(1).toLowerCase()
    )
    .join(" ");
}

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

function ConditionText({
  condition,
}: {
  condition: QRRuleCondition;
}) {
  const value = String(
    condition.value ?? ""
  );

  const value2 = String(
    condition.value2 ?? ""
  );

  const shown =
    condition.operator === "BETWEEN" ||
    condition.operator === "NOT_BETWEEN"
      ? `${value} and ${value2}`
      : value;

  return (
    <Text style={styles.conditionText}>
      {conditionTypeLabel(condition.type)}{" "}
      <Text style={styles.conditionOperator}>
        {OPERATOR_LABELS[
          condition.operator
        ] ?? condition.operator}
      </Text>
      {shown ? (
        <>
          {" "}
          <Text style={styles.conditionValue}>
            "{shown}"
          </Text>
        </>
      ) : null}
    </Text>
  );
}

function GroupBlock({
  group,
  depth,
}: {
  group: QRRuleConditionGroup;
  depth: number;
}) {
  return (
    <View
      style={[
        styles.groupBlock,
        depth > 0 && styles.groupBlockNested,
      ]}
    >
      <Text style={styles.groupLogic}>
        {group.logic} (group)
      </Text>

      {group.conditions.map(
        (condition, index) => (
          <View
            key={index}
            style={styles.conditionRow}
          >
            <ConditionText
              condition={condition}
            />
          </View>
        )
      )}

      {(group.children ?? []).map(
        (child, index) => (
          <GroupBlock
            key={index}
            group={child}
            depth={depth + 1}
          />
        )
      )}
    </View>
  );
}

function MatchRow({
  match,
}: {
  match: QRRuleMatch;
}) {
  return (
    <View style={styles.matchRow}>
      <View style={styles.matchTop}>
        <Text
          style={styles.matchDevice}
          numberOfLines={1}
        >
          {[match.device, match.city, match.country]
            .filter(Boolean)
            .join(" · ") || "Unknown scan"}
        </Text>

        <StatusPill
          label={match.status}
          tone={
            match.status === "MATCHED"
              ? "success"
              : match.status === "FALLBACK"
                ? "warning"
                : "muted"
          }
        />
      </View>

      <Text style={styles.matchMeta}>
        {match.actionType
          ? `${match.actionType} · `
          : ""}
        {match.matchedAt
          ? relativeTime(match.matchedAt)
          : ""}
      </Text>
    </View>
  );
}

export default function RuleDetailScreen() {
  const params = useLocalSearchParams<{
    id?: string;
  }>();

  const ruleId = params.id
    ? String(params.id)
    : null;

  const [busy, setBusy] = useState(false);

  const [simDevice, setSimDevice] =
    useState("mobile");

  const [simCountry, setSimCountry] =
    useState("");

  const [simCity, setSimCity] = useState("");

  const [simBrowser, setSimBrowser] =
    useState("");

  const [simulating, setSimulating] =
    useState(false);

  const [
    simulation,
    setSimulation,
  ] = useState<QRRuleSimulationResult | null>(
    null
  );

  const ruleQuery = useQuery({
    queryKey: ["qr-rule", ruleId],
    queryFn: () =>
      getQRRule(ruleId as string),
    enabled: Boolean(ruleId),
  });

  const rule = ruleQuery.data ?? null;

  const matchesQuery = useQuery({
    queryKey: ["qr-rule-matches", ruleId],
    queryFn: () =>
      getQRRuleMatches(
        rule?.qrCodeId as string,
        { ruleId: ruleId as string, limit: 25 }
      ),
    enabled: Boolean(rule?.qrCodeId),
  });

  const matches = matchesQuery.data ?? [];

  async function runAction(
    action: () => Promise<unknown>,
    onDone?: () => void
  ) {
    if (!ruleId) {
      return;
    }

    setBusy(true);

    try {
      await action();

      await queryClient.invalidateQueries({
        queryKey: ["qr-rule", ruleId],
      });

      await queryClient.invalidateQueries({
        queryKey: ["qr-rules"],
      });

      onDone?.();
    } catch (error) {
      Alert.alert(
        "Action failed",
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setBusy(false);
    }
  }

  function confirmDelete() {
    if (!rule) {
      return;
    }

    Alert.alert(
      "Delete rule",
      `Delete "${rule.name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            void runAction(
              () => deleteQRRule(rule.id),
              () => router.back()
            ),
        },
      ]
    );
  }

  async function handleSimulate() {
    if (!rule) {
      return;
    }

    setSimulating(true);
    setSimulation(null);

    try {
      const result = await simulateQRRule({
        qrCodeId: rule.qrCodeId,
        ruleId: rule.id,
        device: simDevice.trim() || undefined,
        country: simCountry.trim() || undefined,
        city: simCity.trim() || undefined,
        browser: simBrowser.trim() || undefined,
      });

      setSimulation(result);
    } catch (error) {
      Alert.alert(
        "Simulation failed",
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setSimulating(false);
    }
  }

  if (ruleQuery.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenLoader />
      </SafeAreaView>
    );
  }

  if (!rule) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          title="Rule not found"
          message="This rule could not be loaded."
        />
      </SafeAreaView>
    );
  }

  const conditionCount =
    (rule.conditions ?? []).length +
    (rule.groups ?? []).reduce(
      (sum, group) =>
        sum + (group.conditions ?? []).length,
      0
    );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          styles.scrollContent
        }
        refreshControl={
          <RefreshControl
            refreshing={ruleQuery.isFetching}
            onRefresh={() => {
              void ruleQuery.refetch();
              void matchesQuery.refetch();
            }}
          />
        }
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.title}>
              {rule.name}
            </Text>

            {rule.description ? (
              <Text style={styles.subtitle}>
                {rule.description}
              </Text>
            ) : null}
          </View>

          <StatusPill
            label={rule.status}
            tone={statusTone(rule.status)}
          />
        </View>

        {/* Action buttons */}
        <View style={styles.headerActions}>
          {(rule.status === "DRAFT" ||
            rule.status === "PAUSED") && (
            <Pressable
              style={styles.actionButton}
              disabled={busy}
              onPress={() =>
                void runAction(() =>
                  publishQRRule(rule.id)
                )
              }
            >
              <Ionicons
                name="rocket-outline"
                size={16}
                color={COLORS.success}
              />

              <Text
                style={styles.actionButtonText}
              >
                Publish
              </Text>
            </Pressable>
          )}

          {rule.status === "ACTIVE" && (
            <Pressable
              style={styles.actionButton}
              disabled={busy}
              onPress={() =>
                void runAction(() =>
                  pauseQRRule(rule.id)
                )
              }
            >
              <Ionicons
                name="pause-outline"
                size={16}
                color={COLORS.warning}
              />

              <Text
                style={styles.actionButtonText}
              >
                Pause
              </Text>
            </Pressable>
          )}

          {rule.status === "PAUSED" && (
            <Pressable
              style={styles.actionButton}
              disabled={busy}
              onPress={() =>
                void runAction(() =>
                  activateQRRule(rule.id)
                )
              }
            >
              <Ionicons
                name="play-outline"
                size={16}
                color={COLORS.success}
              />

              <Text
                style={styles.actionButtonText}
              >
                Activate
              </Text>
            </Pressable>
          )}

          <Pressable
            style={styles.actionButton}
            disabled={busy}
            onPress={() =>
              router.push({
                pathname: "/app/rule-builder",
                params: { edit: rule.id },
              })
            }
          >
            <Ionicons
              name="create-outline"
              size={16}
              color={COLORS.primary}
            />

            <Text
              style={styles.actionButtonText}
            >
              Edit
            </Text>
          </Pressable>

          <Pressable
            style={styles.actionButton}
            disabled={busy}
            onPress={confirmDelete}
          >
            <Ionicons
              name="trash-outline"
              size={16}
              color={COLORS.danger}
            />

            <Text
              style={styles.actionButtonText}
            >
              Delete
            </Text>
          </Pressable>
        </View>

        {/* Stat grid */}
        <View style={styles.statRow}>
          <StatCard
            title="Matches"
            value={toNumber(rule.matchCount)}
            subtitle="total"
            icon="analytics-outline"
          />

          <StatCard
            title="Priority"
            value={rule.priority ?? 0}
            subtitle="lower runs first"
            icon="git-branch-outline"
          />
        </View>

        <View style={styles.statRow}>
          <StatCard
            title="Conditions"
            value={conditionCount}
            subtitle={`${rule.logic} logic`}
            icon="filter-outline"
          />

          <StatCard
            title="Version"
            value={toNumber(
              rule.publishedVersion
            )}
            subtitle="published"
            icon="layers-outline"
          />
        </View>

        {/* Conditions */}
        <Text style={styles.sectionLabel}>
          Conditions ({rule.logic})
        </Text>

        <View style={styles.card}>
          {(rule.conditions ?? []).length ===
            0 &&
          (rule.groups ?? []).length === 0 ? (
            <Text style={styles.emptyText}>
              No conditions on this rule.
            </Text>
          ) : (
            <>
              {(rule.conditions ?? []).map(
                (condition, index) => (
                  <View
                    key={index}
                    style={
                      styles.conditionRow
                    }
                  >
                    <ConditionText
                      condition={condition}
                    />
                  </View>
                )
              )}

              {(rule.groups ?? []).map(
                (group, index) => (
                  <GroupBlock
                    key={index}
                    group={group}
                    depth={0}
                  />
                )
              )}
            </>
          )}
        </View>

        {/* Routing action */}
        <Text style={styles.sectionLabel}>
          Routing action
        </Text>

        <View style={styles.card}>
          <Text style={styles.actionType}>
            {rule.actionType ?? "—"}
          </Text>

          {rule.actionValue ? (
            <Text style={styles.actionValue}>
              {rule.actionValue}
            </Text>
          ) : null}

          {rule.fallbackActionType ? (
            <View style={styles.fallbackBox}>
              <Text
                style={styles.fallbackLabel}
              >
                FALLBACK
              </Text>

              <Text style={styles.actionType}>
                {rule.fallbackActionType}
              </Text>

              {rule.fallbackActionValue ? (
                <Text
                  style={styles.actionValue}
                >
                  {rule.fallbackActionValue}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Simulator */}
        <Text style={styles.sectionLabel}>
          Simulate
        </Text>

        <View style={styles.card}>
          <Input
            label="Device"
            placeholder="mobile / desktop"
            value={simDevice}
            onChangeText={setSimDevice}
          />

          <Input
            label="Country"
            placeholder="e.g. India"
            value={simCountry}
            onChangeText={setSimCountry}
          />

          <Input
            label="City"
            placeholder="e.g. Bengaluru"
            value={simCity}
            onChangeText={setSimCity}
          />

          <Input
            label="Browser"
            placeholder="e.g. Chrome"
            value={simBrowser}
            onChangeText={setSimBrowser}
          />

          <Button
            title="Run simulation"
            onPress={handleSimulate}
            loading={simulating}
          />

          {simulation && (
            <View style={styles.simResult}>
              <View style={styles.simResultRow}>
                <Ionicons
                  name={
                    simulation.matched
                      ? "checkmark-circle"
                      : "close-circle"
                  }
                  size={20}
                  color={
                    simulation.matched
                      ? COLORS.success
                      : COLORS.danger
                  }
                />

                <Text
                  style={styles.simResultTitle}
                >
                  {simulation.matched
                    ? "Matched"
                    : "Not matched"}
                </Text>
              </View>

              {simulation.actionType ? (
                <Text
                  style={styles.simResultText}
                >
                  Action: {simulation.actionType}
                  {simulation.actionValue
                    ? ` → ${simulation.actionValue}`
                    : ""}
                </Text>
              ) : null}

              {simulation.fallback ? (
                <Text
                  style={styles.simResultText}
                >
                  Used the fallback action.
                </Text>
              ) : null}
            </View>
          )}
        </View>

        {/* Matches */}
        <Text style={styles.sectionLabel}>
          Recent matches
        </Text>

        {matches.length === 0 ? (
          <EmptyState
            title="No matches yet"
            message="Scans evaluated against this rule will appear here."
          />
        ) : (
          matches.map((match) => (
            <MatchRow
              key={match.id}
              match={match}
            />
          ))
        )}
      </ScrollView>
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

  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: SPACING.sm,
  },

  headerText: {
    flex: 1,
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

  headerActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.lg,
    marginTop: SPACING.md,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },

  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },

  statRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },

  sectionLabel: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: COLORS.textSecondary,
    textTransform: "uppercase",
  },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
  },

  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  conditionRow: {
    paddingVertical: SPACING.xs,
  },

  conditionText: {
    fontSize: 14,
    color: COLORS.text,
  },

  conditionOperator: {
    fontStyle: "italic",
    color: COLORS.textSecondary,
  },

  conditionValue: {
    fontWeight: "700",
    color: COLORS.primary,
  },

  groupBlock: {
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: SPACING.md,
    marginTop: SPACING.sm,
  },

  groupBlockNested: {
    marginTop: SPACING.sm,
  },

  groupLogic: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
    textTransform: "uppercase",
  },

  actionType: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },

  actionValue: {
    marginTop: SPACING.xs,
    fontSize: 14,
    color: COLORS.primary,
  },

  fallbackBox: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  fallbackLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },

  simResult: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  simResultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },

  simResultTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },

  simResultText: {
    marginTop: SPACING.xs,
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  matchRow: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.xs,
  },

  matchTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.sm,
  },

  matchDevice: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },

  matchMeta: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
