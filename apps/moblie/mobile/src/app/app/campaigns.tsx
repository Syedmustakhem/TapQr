import { router } from "expo-router";

import { useMemo, useState } from "react";

import { Ionicons } from "@expo/vector-icons";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Button from "../../components/ui/Button";

import Input from "../../components/ui/Input";

import EmptyState from "../../components/common/EmptyState";

import ScreenLoader from "../../components/loaders/ScreenLoader";

import {
  Campaign,
  CampaignStatus,
  createCampaign,
  getCampaigns,
} from "../../api/campaignApi";

import { useCurrentBusiness } from "../../hooks/useCurrentBusiness";

import { COLORS } from "../../constants/colors";

import { SPACING } from "../../constants/spacing";

type StatusFilter = "ALL" | CampaignStatus;

const STATUS_FILTERS: StatusFilter[] = [
  "ALL",
  "DRAFT",
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "ARCHIVED",
];

const STATUS_LABELS: Record<
  StatusFilter,
  string
> = {
  ALL: "All",
  DRAFT: "Draft",
  ACTIVE: "Active",
  PAUSED: "Paused",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

const STATUS_COLORS: Record<
  CampaignStatus,
  { bg: string; fg: string }
> = {
  DRAFT: { bg: "#F1F5F9", fg: "#64748B" },
  ACTIVE: { bg: "#DCFCE7", fg: "#15803D" },
  PAUSED: { bg: "#FEF3C7", fg: "#B45309" },
  COMPLETED: { bg: "#DBEAFE", fg: "#1D4ED8" },
  ARCHIVED: { bg: "#F1F5F9", fg: "#94A3B8" },
};

const STATUS_UNKNOWN = {
  bg: "#F1F5F9",
  fg: "#64748B",
};

/*
 * Convert a free-text "YYYY-MM-DD" (or ISO) date input
 * into an ISO string for the API, or null when empty.
 * Mirrors the web dashboard's toISOStringOrNull.
 */
function toIsoOrNull(
  value: string
): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const normalized =
    trimmed.replace(" ", "T");

  const date = new Date(normalized);

  return Number.isNaN(date.getTime())
    ? null
    : date.toISOString();
}

function formatDate(
  value?: string | null
): string {
  if (!value) {
    return "Not scheduled";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusColors(
  status: string | null | undefined
) {
  if (!status) {
    return STATUS_UNKNOWN;
  }

  return (
    STATUS_COLORS[
      status as CampaignStatus
    ] ?? STATUS_UNKNOWN
  );
}

export default function CampaignsScreen() {
  const { businessId } =
    useCurrentBusiness();

  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");

  const [filter, setFilter] =
    useState<StatusFilter>("ALL");

  const [showCreate, setShowCreate] =
    useState(false);

  const [name, setName] = useState("");

  const [description, setDescription] =
    useState("");

  const [startsAt, setStartsAt] =
    useState("");

  const [endsAt, setEndsAt] = useState("");

  const [formError, setFormError] =
    useState("");

  /*
   * GET /campaign/business/:businessId/campaigns
   * — mirrors the web dashboard campaign library.
   */
  const query = useQuery({
    queryKey: ["campaigns", businessId],
    queryFn: () =>
      getCampaigns(businessId as string),
    enabled: Boolean(businessId),
  });

  const campaigns = useMemo(
    () =>
      (query.data ?? []).filter(
        (campaign) => {
          if (
            filter !== "ALL" &&
            campaign.status !== filter
          ) {
            return false;
          }

          const needle =
            search.trim().toLowerCase();

          if (!needle) {
            return true;
          }

          return (
            campaign.name
              .toLowerCase()
              .includes(needle) ||
            (campaign.description ?? "")
              .toLowerCase()
              .includes(needle)
          );
        }
      ),
    [query.data, filter, search]
  );

  const createMutation = useMutation({
    mutationFn: () => {
      const trimmed = name.trim();

      if (!trimmed) {
        throw new Error(
          "Campaign name is required."
        );
      }

      const startIso = toIsoOrNull(startsAt);
      const endIso = toIsoOrNull(endsAt);

      if (startsAt.trim() && !startIso) {
        throw new Error(
          "Start date is invalid. Use YYYY-MM-DD."
        );
      }

      if (endsAt.trim() && !endIso) {
        throw new Error(
          "End date is invalid. Use YYYY-MM-DD."
        );
      }

      if (
        startIso &&
        endIso &&
        new Date(endIso).getTime() <
          new Date(startIso).getTime()
      ) {
        throw new Error(
          "End date cannot be before the start date."
        );
      }

      /*
       * POST /campaign/business/:businessId/campaigns
       * — mirrors the web create-campaign form
       * ({ name, description, startsAt, endsAt }).
       */
      return createCampaign(
        businessId as string,
        {
          name: trimmed,
          description:
            description.trim() || null,
          startsAt: startIso,
          endsAt: endIso,
        }
      );
    },
    onSuccess: (created) => {
      void queryClient.invalidateQueries({
        queryKey: ["campaigns", businessId],
      });

      setShowCreate(false);
      setName("");
      setDescription("");
      setStartsAt("");
      setEndsAt("");
      setFormError("");

      // Mirror web: jump into the new campaign.
      router.push(
        `/app/campaign-detail?id=${created.id}`
      );
    },
    onError: (err) => {
      setFormError(
        err instanceof Error
          ? err.message
          : "Unable to create campaign."
      );
    },
  });

  const openCreate = () => {
    setName("");
    setDescription("");
    setStartsAt("");
    setEndsAt("");
    setFormError("");
    setShowCreate(true);
  };

  const renderItem = ({
    item,
  }: {
    item: Campaign;
  }) => {
    const colors = getStatusColors(
      item.status
    );

    return (
      <Pressable
        onPress={() =>
          router.push(
            `/app/campaign-detail?id=${item.id}`
          )
        }
        style={({ pressed }) => [
          styles.card,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardTitleWrap}>
            <Text
              style={styles.cardTitle}
              numberOfLines={1}
            >
              {item.name}
            </Text>

            {item.description ? (
              <Text
                style={styles.cardDescription}
                numberOfLines={2}
              >
                {item.description}
              </Text>
            ) : null}
          </View>

          <View
            style={[
              styles.badge,
              { backgroundColor: colors.bg },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: colors.fg },
              ]}
            >
              {
                STATUS_LABELS[
                  item.status as CampaignStatus
                ] ?? "Unknown"
              }
            </Text>
          </View>
        </View>

        <View style={styles.cardMeta}>
          <Ionicons
            name="calendar-outline"
            size={14}
            color={COLORS.textMuted}
          />

          <Text style={styles.cardMetaText}>
            {`${formatDate(item.startsAt)} — ${formatDate(item.endsAt)}`}
          </Text>

          <Ionicons
            name="chevron-forward-outline"
            size={16}
            color={COLORS.textMuted}
          />
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>
              Campaigns
            </Text>

            <Text style={styles.subtitle}>
              {query.data
                ? `${query.data.length} campaign${query.data.length === 1 ? "" : "s"}`
                : "Organize QR codes into campaigns"}
            </Text>
          </View>

          <Pressable
            onPress={openCreate}
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Create campaign"
          >
            <Ionicons
              name="add"
              size={24}
              color={COLORS.white}
            />
          </Pressable>
        </View>

        <Input
          placeholder="Search campaigns"
          value={search}
          onChangeText={setSearch}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={
            styles.filters
          }
          style={styles.filterScroll}
        >
          {STATUS_FILTERS.map((option) => {
            const active = filter === option;

            return (
              <Pressable
                key={option}
                onPress={() => setFilter(option)}
                style={[
                  styles.chip,
                  active && styles.chipActive,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    active && styles.chipTextActive,
                  ]}
                >
                  {STATUS_LABELS[option]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {!businessId ? (
          <EmptyState
            title="No business selected"
            message="Select a business workspace to view campaigns."
          />
        ) : query.isLoading ? (
          <ScreenLoader />
        ) : query.isError ? (
          <View style={styles.centerFill}>
            <EmptyState
              title="Unable to load campaigns"
              message="Check your connection and try again."
            />

            <View
              style={styles.retryButton}
            >
              <Button
                title="Retry"
                onPress={() =>
                  void query.refetch()
                }
              />
            </View>
          </View>
        ) : (
          <FlatList
            data={campaigns}
            keyExtractor={(item) =>
              item.id
            }
            renderItem={renderItem}
            contentContainerStyle={
              styles.list
            }
            ListEmptyComponent={
              <EmptyState
                title={
                  search || filter !== "ALL"
                    ? "No matching campaigns"
                    : "No campaigns yet"
                }
                message={
                  search || filter !== "ALL"
                    ? "Try a different search or status filter."
                    : "Create your first campaign to group QR codes together."
                }
              />
            }
          />
        )}

        {/* Create-campaign modal */}
        <Modal
          visible={showCreate}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() =>
            setShowCreate(false)
          }
        >
          <SafeAreaView style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                New campaign
              </Text>

              <Pressable
                onPress={() =>
                  setShowCreate(false)
                }
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Ionicons
                  name="close"
                  size={22}
                  color={COLORS.textSecondary}
                />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={
                styles.modalBody
              }
              keyboardShouldPersistTaps="handled"
            >
              <Input
                label="Campaign name"
                placeholder="e.g. Festive Sale 2026"
                value={name}
                onChangeText={setName}
              />

              <Input
                label="Description"
                placeholder="What is this campaign about?"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />

              <Input
                label="Start date (optional)"
                placeholder="YYYY-MM-DD"
                value={startsAt}
                onChangeText={setStartsAt}
              />

              <Input
                label="End date (optional)"
                placeholder="YYYY-MM-DD"
                value={endsAt}
                onChangeText={setEndsAt}
              />

              {formError ? (
                <Text style={styles.formError}>
                  {formError}
                </Text>
              ) : null}

              <View style={styles.modalFooter}>
                <Button
                  title="Create campaign"
                  onPress={() =>
                    createMutation.mutate()
                  }
                  loading={
                    createMutation.isPending
                  }
                  disabled={!businessId}
                />
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.lg,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
  },

  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },

  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  pressed: {
    opacity: 0.75,
  },

  filterScroll: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
    flexGrow: 0,
  },

  filters: {
    gap: SPACING.sm,
    paddingRight: SPACING.lg,
  },

  chip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },

  chipTextActive: {
    color: COLORS.white,
  },

  list: {
    paddingBottom: SPACING.huge,
  },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: SPACING.sm,
  },

  cardTitleWrap: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },

  cardDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },

  badge: {
    borderRadius: 12,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },

  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },

  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginTop: SPACING.md,
  },

  cardMetaText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textMuted,
  },

  centerFill: {
    flex: 1,
    justifyContent: "center",
  },

  retryButton: {
    marginTop: SPACING.lg,
  },

  modal: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  modalBody: {
    padding: SPACING.lg,
    paddingBottom: SPACING.huge,
  },

  modalFooter: {
    marginTop: SPACING.lg,
  },

  formError: {
    fontSize: 13,
    color: COLORS.danger,
    marginTop: SPACING.sm,
  },
});
