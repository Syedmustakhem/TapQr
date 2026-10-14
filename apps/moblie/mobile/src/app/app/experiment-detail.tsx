// src/app/app/experiment-detail.tsx
//
// Experiment monitor — mirrors
// /dashboard/qr/experiments/[experimentId] on the
// web dashboard.
//
// Header with Start/Pause/Complete, metric cards
// (participants, conversions, rate, variants),
// variant rows with inline editing, Save variant
// (PATCH), Leading-variant badge, delete variant.

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
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

import {
  completeQRExperiment,
  deleteQRExperimentVariant,
  getQRExperiment,
  pauseQRExperiment,
  QRExperimentStatus,
  QRExperimentVariant,
  startQRExperiment,
  updateQRExperimentVariant,
} from "../../api/qrExperimentsApi";

import type { QRRuleActionType } from "../../api/qrRulesApi";

import { toNumber } from "../../api/utils";

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

const ACTION_OPTIONS: Array<{
  value: QRRuleActionType;
  label: string;
}> = [
  { value: "EXPERIENCE", label: "Experience" },
  { value: "REDIRECT", label: "Redirect" },
  { value: "CATALOG", label: "Catalog" },
  { value: "MENU", label: "Menu" },
  { value: "SERVICES", label: "Services" },
  { value: "PRODUCTS", label: "Products" },
  { value: "CONTACT", label: "Contact" },
  { value: "CAMPAIGN", label: "Campaign" },
  { value: "CUSTOM", label: "Custom" },
];

function statusTone(
  status: QRExperimentStatus
): StatusTone {
  switch (status) {
    case "RUNNING":
      return "success";
    case "PAUSED":
      return "warning";
    case "COMPLETED":
      return "info";
    case "DRAFT":
      return "muted";
    default:
      return "muted";
  }
}

function variantRate(
  variant: QRExperimentVariant
): number {
  const participants = toNumber(
    variant.participantCount
  );

  if (participants <= 0) {
    return 0;
  }

  return (
    (toNumber(variant.conversionCount) /
      participants) *
    100
  );
}

/* ============================================================
   Variant row with inline editing
============================================================ */

type VariantRowProps = {
  experimentId: string;
  variant: QRExperimentVariant;
  isLeading: boolean;
  onChanged: () => void;
};

function VariantRow({
  experimentId,
  variant,
  isLeading,
  onChanged,
}: VariantRowProps) {
  const [editing, setEditing] =
    useState(false);

  const [name, setName] = useState(
    variant.name
  );

  const [allocation, setAllocation] =
    useState(String(variant.allocation ?? ""));

  const [actionType, setActionType] =
    useState<QRRuleActionType>(
      variant.actionType
    );

  const [actionValue, setActionValue] =
    useState(variant.actionValue ?? "");

  const [saving, setSaving] = useState(false);

  function resetDraft() {
    setName(variant.name);
    setAllocation(
      String(variant.allocation ?? "")
    );
    setActionType(variant.actionType);
    setActionValue(variant.actionValue ?? "");
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert(
        "Missing name",
        "The variant needs a name."
      );

      return;
    }

    const parsedAllocation = Number(
      allocation
    );

    if (
      !Number.isFinite(parsedAllocation) ||
      parsedAllocation <= 0
    ) {
      Alert.alert(
        "Invalid allocation",
        "Allocation must be a number greater than 0."
      );

      return;
    }

    if (!actionValue.trim()) {
      Alert.alert(
        "Missing action value",
        "The variant needs an action value."
      );

      return;
    }

    setSaving(true);

    try {
      await updateQRExperimentVariant(
        experimentId,
        variant.id,
        {
          name: name.trim(),
          allocation: parsedAllocation,
          actionType,
          actionValue: actionValue.trim(),
        }
      );

      setEditing(false);
      onChanged();
    } catch (error) {
      Alert.alert(
        "Save failed",
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    Alert.alert(
      "Delete variant",
      `Delete variant "${variant.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteQRExperimentVariant(
                experimentId,
                variant.id
              );

              onChanged();
            } catch (error) {
              Alert.alert(
                "Delete failed",
                error instanceof Error
                  ? error.message
                  : "Something went wrong."
              );
            }
          },
        },
      ]
    );
  }

  return (
    <View style={styles.variantCard}>
      <View style={styles.cardRow}>
        <View style={styles.variantTitleRow}>
          <Text
            style={styles.variantName}
            numberOfLines={1}
          >
            {variant.name}
          </Text>

          {isLeading && (
            <View style={styles.leadingBadge}>
              <Ionicons
                name="trophy"
                size={12}
                color="#B45309"
              />

              <Text
                style={
                  styles.leadingBadgeText
                }
              >
                Leading
              </Text>
            </View>
          )}
        </View>

        <StatusPill
          label={`${variant.allocation}%`}
          tone="info"
        />
      </View>

      <Text style={styles.variantMeta}>
        {variant.actionType}
        {variant.actionValue
          ? ` → ${variant.actionValue}`
          : ""}
      </Text>

      <Text style={styles.variantMeta}>
        {toNumber(
          variant.participantCount
        ).toLocaleString()}{" "}
        participants ·{" "}
        {toNumber(
          variant.conversionCount
        ).toLocaleString()}{" "}
        conversions · {variantRate(variant).toFixed(1)}%
      </Text>

      {!editing ? (
        <View style={styles.variantActions}>
          <Pressable
            style={styles.actionButton}
            onPress={() => {
              resetDraft();
              setEditing(true);
            }}
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
      ) : (
        <View style={styles.editBox}>
          <Input
            label="Name"
            value={name}
            onChangeText={setName}
          />

          <Input
            label="Allocation (%)"
            keyboardType="numeric"
            value={allocation}
            onChangeText={setAllocation}
          />

          <Text style={styles.fieldLabel}>
            Action type
          </Text>

          <View style={styles.chipGrid}>
            {ACTION_OPTIONS.map((option) => {
              const selected =
                actionType === option.value;

              return (
                <Pressable
                  key={option.value}
                  onPress={() =>
                    setActionType(option.value)
                  }
                  style={[
                    styles.chip,
                    selected && styles.chipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selected &&
                        styles.chipTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Input
            label="Action value"
            value={actionValue}
            onChangeText={setActionValue}
            autoCapitalize="none"
          />

          <View style={styles.editActions}>
            <Pressable
              style={styles.backButton}
              onPress={() => {
                resetDraft();
                setEditing(false);
              }}
            >
              <Text
                style={styles.backButtonText}
              >
                Cancel
              </Text>
            </Pressable>

            <View style={styles.saveWrap}>
              <Button
                title="Save variant"
                onPress={handleSave}
                loading={saving}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

/* ============================================================
   Screen
============================================================ */

export default function ExperimentDetailScreen() {
  const params = useLocalSearchParams<{
    id?: string;
  }>();

  const experimentId = params.id
    ? String(params.id)
    : null;

  const [busy, setBusy] = useState(false);

  const experimentQuery = useQuery({
    queryKey: ["qr-experiment", experimentId],
    queryFn: () =>
      getQRExperiment(experimentId as string),
    enabled: Boolean(experimentId),
  });

  const experiment =
    experimentQuery.data ?? null;

  const variants = useMemo(
    () => experiment?.variants ?? [],
    [experiment]
  );

  /*
   * Leading variant: highest conversion rate among
   * variants with at least one participant.
   */
  const leadingVariantId = useMemo(() => {
    let bestId: string | null = null;
    let bestRate = 0;

    for (const variant of variants) {
      const participants = toNumber(
        variant.participantCount
      );

      if (participants <= 0) {
        continue;
      }

      const rate = variantRate(variant);

      if (rate > bestRate) {
        bestRate = rate;
        bestId = variant.id;
      }
    }

    return bestId;
  }, [variants]);

  const participants = toNumber(
    experiment?.participantCount
  );

  const conversions = toNumber(
    experiment?.conversionCount
  );

  const conversionRate =
    participants > 0
      ? (conversions / participants) * 100
      : 0;

  async function runAction(
    action: () => Promise<unknown>
  ) {
    if (!experimentId) {
      return;
    }

    setBusy(true);

    try {
      await action();

      await queryClient.invalidateQueries({
        queryKey: ["qr-experiment", experimentId],
      });

      await queryClient.invalidateQueries({
        queryKey: ["qr-experiments"],
      });
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

  async function refresh() {
    await experimentQuery.refetch();
  }

  if (experimentQuery.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenLoader />
      </SafeAreaView>
    );
  }

  if (!experiment) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          title="Experiment not found"
          message="This experiment could not be loaded."
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
              experimentQuery.isFetching
            }
            onRefresh={() => {
              void refresh();
            }}
          />
        }
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.title}>
              {experiment.name}
            </Text>

            {experiment.description ? (
              <Text style={styles.subtitle}>
                {experiment.description}
              </Text>
            ) : null}
          </View>

          <StatusPill
            label={experiment.status}
            tone={statusTone(experiment.status)}
          />
        </View>

        {/* Header actions */}
        <View style={styles.headerActions}>
          {(experiment.status === "DRAFT" ||
            experiment.status ===
              "PAUSED") && (
            <Pressable
              style={styles.actionButton}
              disabled={busy}
              onPress={() =>
                void runAction(() =>
                  startQRExperiment(experiment.id)
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
                Start
              </Text>
            </Pressable>
          )}

          {experiment.status ===
            "RUNNING" && (
            <Pressable
              style={styles.actionButton}
              disabled={busy}
              onPress={() =>
                void runAction(() =>
                  pauseQRExperiment(experiment.id)
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

          {(experiment.status ===
            "RUNNING" ||
            experiment.status ===
              "PAUSED") && (
            <Pressable
              style={styles.actionButton}
              disabled={busy}
              onPress={() =>
                void runAction(() =>
                  completeQRExperiment(
                    experiment.id
                  )
                )
              }
            >
              <Ionicons
                name="checkmark-done-outline"
                size={16}
                color={COLORS.primary}
              />

              <Text
                style={styles.actionButtonText}
              >
                Complete
              </Text>
            </Pressable>
          )}
        </View>

        {/* Metric cards */}
        <View style={styles.statRow}>
          <StatCard
            title="Participants"
            value={participants}
            subtitle="total visitors"
            icon="people-outline"
          />

          <StatCard
            title="Conversions"
            value={conversions}
            subtitle="total"
            icon="checkmark-circle-outline"
          />
        </View>

        <View style={styles.statRow}>
          <StatCard
            title="Conv. rate"
            value={Number(
              conversionRate.toFixed(1)
            )}
            subtitle="percent"
            icon="analytics-outline"
          />

          <StatCard
            title="Variants"
            value={variants.length}
            subtitle={experiment.allocationType}
            icon="flask-outline"
          />
        </View>

        {/* Schedule */}
        {(experiment.startsAt ||
          experiment.endsAt) && (
          <View style={styles.card}>
            {experiment.startsAt && (
              <Text style={styles.scheduleText}>
                Starts: {experiment.startsAt}
              </Text>
            )}

            {experiment.endsAt && (
              <Text style={styles.scheduleText}>
                Ends: {experiment.endsAt}
              </Text>
            )}
          </View>
        )}

        {/* Variants */}
        <Text style={styles.sectionLabel}>
          Variants
        </Text>

        {variants.length === 0 ? (
          <EmptyState
            title="No variants"
            message="This experiment has no variants yet."
          />
        ) : (
          variants.map((variant) => (
            <VariantRow
              key={variant.id}
              experimentId={experiment.id}
              variant={variant}
              isLeading={
                variant.id ===
                leadingVariantId
              }
              onChanged={() => {
                void refresh();
              }}
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

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginTop: SPACING.md,
  },

  scheduleText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
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

  variantCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
  },

  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.sm,
  },

  variantTitleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },

  variantName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },

  leadingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF3C7",
    borderRadius: 999,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },

  leadingBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#B45309",
    textTransform: "uppercase",
  },

  variantMeta: {
    marginTop: 4,
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  variantActions: {
    flexDirection: "row",
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.lg,
  },

  editBox: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },

  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },

  chip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    marginRight: SPACING.xs,
    marginBottom: SPACING.xs,
  },

  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
  },

  chipTextActive: {
    color: COLORS.white,
  },

  editActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },

  backButton: {
    height: 52,
    paddingHorizontal: SPACING.xl,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },

  saveWrap: {
    flex: 1,
  },
});
