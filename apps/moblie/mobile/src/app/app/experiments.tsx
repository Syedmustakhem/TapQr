// src/app/app/experiments.tsx
//
// A/B Experiments list — mirrors
// /dashboard/qr/experiments on the web dashboard.
//
// Stat cards, search + status pills + QR filter,
// rows with Start/Pause/Complete/Archive actions.
// QR dropdown uses GET /qrcodes/business/:businessId
// (qrcodeApi) — the web's same-origin
// /api/qr-codes/options does not exist on the API.

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
  completeQRExperiment,
  deleteQRExperiment,
  listQRExperiments,
  pauseQRExperiment,
  QRExperiment,
  QRExperimentStatus,
  startQRExperiment,
} from "../../api/qrExperimentsApi";

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
  "ALL" | QRExperimentStatus
> = [
  "ALL",
  "DRAFT",
  "RUNNING",
  "PAUSED",
  "COMPLETED",
  "ARCHIVED",
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

function conversionRate(
  experiment: QRExperiment
): number {
  const participants = toNumber(
    experiment.participantCount
  );

  if (participants <= 0) {
    return 0;
  }

  return (
    (toNumber(experiment.conversionCount) /
      participants) *
    100
  );
}

export default function ExperimentsScreen() {
  const {
    businessId,
    isLoading: businessLoading,
    isError: businessError,
    refetch: refetchBusinesses,
  } = useCurrentBusiness();

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<"ALL" | QRExperimentStatus>("ALL");

  const [qrFilterId, setQrFilterId] =
    useState<string | null>(null);

  const [busyExperimentId, setBusyExperimentId] =
    useState<string | null>(null);

  const qrcodesQuery = useQuery({
    queryKey: ["qrcodes", businessId],
    queryFn: () =>
      getQRCodes(businessId as string),
    enabled: Boolean(businessId),
  });

  const qrcodes = qrcodesQuery.data ?? [];

  const qrNameById = useMemo(() => {
    const map = new Map<string, string>();

    for (const qr of qrcodes) {
      map.set(qr.id, qr.name);
    }

    return map;
  }, [qrcodes]);

  const experimentsQuery = useQuery({
    queryKey: [
      "qr-experiments",
      qrFilterId ?? "all",
    ],
    queryFn: () =>
      listQRExperiments(
        qrFilterId ?? undefined
      ),
    enabled: Boolean(businessId),
  });

  const experiments =
    experimentsQuery.data ?? [];

  const stats = useMemo(() => {
    const running = experiments.filter(
      (exp) => exp.status === "RUNNING"
    ).length;

    const drafts = experiments.filter(
      (exp) => exp.status === "DRAFT"
    ).length;

    const participants = experiments.reduce(
      (sum, exp) =>
        sum + toNumber(exp.participantCount),
      0
    );

    const conversions = experiments.reduce(
      (sum, exp) =>
        sum + toNumber(exp.conversionCount),
      0
    );

    return {
      total: experiments.length,
      running,
      drafts,
      participants,
      conversions,
    };
  }, [experiments]);

  const filteredExperiments = useMemo(() => {
    const term = search.trim().toLowerCase();

    return experiments.filter((exp) => {
      if (
        statusFilter !== "ALL" &&
        exp.status !== statusFilter
      ) {
        return false;
      }

      if (!term) {
        return true;
      }

      const haystack =
        `${exp.name} ${exp.description ?? ""}`.toLowerCase();

      return haystack.includes(term);
    });
  }, [experiments, search, statusFilter]);

  const loading =
    businessLoading ||
    qrcodesQuery.isLoading ||
    experimentsQuery.isLoading;

  const handleRefresh = () => {
    refetchBusinesses();
    void qrcodesQuery.refetch();
    void experimentsQuery.refetch();
  };

  async function runExperimentAction(
    experiment: QRExperiment,
    action: () => Promise<unknown>
  ) {
    setBusyExperimentId(experiment.id);

    try {
      await action();

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
      setBusyExperimentId(null);
    }
  }

  function confirmArchive(
    experiment: QRExperiment
  ) {
    Alert.alert(
      "Archive experiment",
      `Archive "${experiment.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Archive",
          style: "destructive",
          onPress: () =>
            void runExperimentAction(
              experiment,
              () =>
                deleteQRExperiment(
                  experiment.id
                )
            ),
        },
      ]
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenLoader />
      </SafeAreaView>
    );
  }

  if (businessError || !businessId) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          title="No business found"
          message="Select or create a business to manage A/B experiments."
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
              experimentsQuery.isFetching
            }
            onRefresh={handleRefresh}
          />
        }
      >
        <Text style={styles.title}>
          A/B Experiments
        </Text>

        <Text style={styles.subtitle}>
          Test which destination converts best.
        </Text>

        {/* Stats */}
        <View style={styles.statRow}>
          <StatCard
            title="Experiments"
            value={stats.total}
            subtitle="total"
            icon="flask-outline"
          />

          <StatCard
            title="Running"
            value={stats.running}
            subtitle="live tests"
            icon="play-circle-outline"
          />
        </View>

        <View style={styles.statRow}>
          <StatCard
            title="Drafts"
            value={stats.drafts}
            subtitle="not started"
            icon="create-outline"
          />

          <StatCard
            title="Participants"
            value={stats.participants}
            subtitle={`${stats.conversions.toLocaleString()} conversions`}
            icon="people-outline"
          />
        </View>

        {/* Search */}
        <Input
          label="Search experiments"
          placeholder="Search by name..."
          value={search}
          onChangeText={setSearch}
        />

        {/* Status pills */}
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

        {/* QR filter */}
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
          <Pressable
            onPress={() =>
              setQrFilterId(null)
            }
            style={[
              styles.qrChip,
              qrFilterId === null &&
                styles.qrChipActive,
            ]}
          >
            <Text
              style={[
                styles.qrChipText,
                qrFilterId === null &&
                  styles.qrChipTextActive,
              ]}
            >
              All QRs
            </Text>
          </Pressable>

          {qrcodes.map((qr) => {
            const selected =
              qr.id === qrFilterId;

            return (
              <Pressable
                key={qr.id}
                onPress={() =>
                  setQrFilterId(qr.id)
                }
                style={[
                  styles.qrChip,
                  selected &&
                    styles.qrChipActive,
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

        {/* Rows */}
        {filteredExperiments.length === 0 ? (
          <EmptyState
            title="No experiments yet"
            message="Create an A/B experiment to split scan traffic between destinations."
          />
        ) : (
          filteredExperiments.map(
            (experiment) => {
              const busy =
                busyExperimentId ===
                experiment.id;

              const variantCount =
                experiment.variants?.length ??
                0;

              const participants = toNumber(
                experiment.participantCount
              );

              return (
                <Pressable
                  key={experiment.id}
                  style={styles.expCard}
                  onPress={() =>
                    router.push({
                      pathname:
                        "/app/experiment-detail",
                      params: {
                        id: experiment.id,
                      },
                    })
                  }
                >
                  <View
                    style={
                      styles.expCardHeader
                    }
                  >
                    <View
                      style={
                        styles.expNameRow
                      }
                    >
                      <Text
                        style={
                          styles.expName
                        }
                        numberOfLines={1}
                      >
                        {experiment.name}
                      </Text>

                      <Text
                        style={
                          styles.expMeta
                        }
                        numberOfLines={1}
                      >
                        {variantCount}{" "}
                        variant
                        {variantCount === 1
                          ? ""
                          : "s"}{" "}
                        ·{" "}
                        {participants.toLocaleString()}{" "}
                        participants ·{" "}
                        {conversionRate(
                          experiment
                        ).toFixed(1)}
                        % conversion ·{" "}
                        {qrNameById.get(
                          experiment.qrCodeId
                        ) ?? "QR"}
                      </Text>
                    </View>

                    <StatusPill
                      label={experiment.status}
                      tone={statusTone(
                        experiment.status
                      )}
                    />
                  </View>

                  <View
                    style={styles.expActions}
                  >
                    {(experiment.status ===
                      "DRAFT" ||
                      experiment.status ===
                        "PAUSED") && (
                      <Pressable
                        style={
                          styles.actionButton
                        }
                        disabled={busy}
                        onPress={() =>
                          void runExperimentAction(
                            experiment,
                            () =>
                              startQRExperiment(
                                experiment.id
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
                          Start
                        </Text>
                      </Pressable>
                    )}

                    {experiment.status ===
                      "RUNNING" && (
                      <Pressable
                        style={
                          styles.actionButton
                        }
                        disabled={busy}
                        onPress={() =>
                          void runExperimentAction(
                            experiment,
                            () =>
                              pauseQRExperiment(
                                experiment.id
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

                    {(experiment.status ===
                      "RUNNING" ||
                      experiment.status ===
                        "PAUSED") && (
                      <Pressable
                        style={
                          styles.actionButton
                        }
                        disabled={busy}
                        onPress={() =>
                          void runExperimentAction(
                            experiment,
                            () =>
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
                          style={
                            styles.actionButtonText
                          }
                        >
                          Complete
                        </Text>
                      </Pressable>
                    )}

                    <Pressable
                      style={
                        styles.actionButton
                      }
                      disabled={busy}
                      onPress={() =>
                        confirmArchive(experiment)
                      }
                    >
                      <Ionicons
                        name="archive-outline"
                        size={16}
                        color={COLORS.textSecondary}
                      />

                      <Text
                        style={
                          styles.actionButtonText
                        }
                      >
                        Archive
                      </Text>
                    </Pressable>
                  </View>
                </Pressable>
              );
            }
          )
        )}
      </ScrollView>

      {/* FAB → new experiment */}
      <Pressable
        style={styles.fab}
        onPress={() =>
          router.push(
            "/app/experiment-new"
          )
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

  statRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },

  sectionLabel: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: COLORS.textSecondary,
    textTransform: "uppercase",
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

  expCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
  },

  expCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.sm,
  },

  expNameRow: {
    flex: 1,
  },

  expName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },

  expMeta: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  expActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.lg,
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
