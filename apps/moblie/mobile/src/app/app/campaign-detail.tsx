import {
  router,
  useLocalSearchParams,
} from "expo-router";

import { useMemo, useState } from "react";

import { Ionicons } from "@expo/vector-icons";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  ActivityIndicator,
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

import StatCard from "../../components/dashboard/StatCard";

import {
  attachQRCode,
  Campaign,
  CampaignQRCode,
  CampaignStatus,
  detachQRCode,
  getCampaignAnalytics,
  getCampaignAttribution,
  getCampaignQRPerformance,
  getCampaignQRCodes,
  getCampaigns,
  setCampaignStatus,
  updateCampaign,
} from "../../api/campaignApi";

import {
  getQRCodes,
  QRCodeRecord,
} from "../../api/qrcodeApi";

import {
  formatCount,
  toNumber,
} from "../../api/utils";

import { useCurrentBusiness } from "../../hooks/useCurrentBusiness";

import { COLORS } from "../../constants/colors";

import { SPACING } from "../../constants/spacing";

/*
 * Allowed status transitions — copied from the web
 * dashboard (app/dashboard/campaigns page).
 */
const STATUS_ACTIONS: Record<
  CampaignStatus,
  CampaignStatus[]
> = {
  DRAFT: ["ACTIVE", "ARCHIVED"],
  ACTIVE: ["PAUSED", "COMPLETED", "ARCHIVED"],
  PAUSED: ["ACTIVE", "ARCHIVED"],
  COMPLETED: ["ARCHIVED"],
  ARCHIVED: [],
};

const STATUS_LABELS: Record<
  CampaignStatus,
  string
> = {
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

const STATUS_ACTION_META: Record<
  CampaignStatus,
  { label: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  DRAFT: {
    label: "Reopen",
    icon: "play-outline",
  },
  ACTIVE: {
    label: "Activate",
    icon: "play-outline",
  },
  PAUSED: {
    label: "Pause",
    icon: "pause-outline",
  },
  COMPLETED: {
    label: "Mark complete",
    icon: "checkmark-done-outline",
  },
  ARCHIVED: {
    label: "Archive",
    icon: "archive-outline",
  },
};

const PERFORMANCE_PERIODS = [7, 30, 90];

const ANALYTICS_PERIODS = [7, 30, 90, 365];

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

function getStatusActions(
  status: string | null | undefined
): CampaignStatus[] {
  if (!status) {
    return [];
  }

  return (
    STATUS_ACTIONS[
      status as CampaignStatus
    ] ?? []
  );
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

/*
 * Convert an ISO datetime into "YYYY-MM-DD" for the
 * date inputs in the edit modal.
 */
function toDateInput(
  value?: string | null
): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/*
 * Convert a free-text "YYYY-MM-DD" (or ISO) date input
 * into an ISO string for the API, or null when empty.
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

type ChipOption<T> = {
  value: T;
  label: string;
};

function ChipRow<T>({
  options,
  selected,
  onSelect,
}: {
  options: ChipOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={
        styles.chips
      }
    >
      {options.map((option) => {
        const active =
          option.value === selected;

        return (
          <Pressable
            key={option.label}
            onPress={() =>
              onSelect(option.value)
            }
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
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export default function CampaignDetailScreen() {
  const { id } =
    useLocalSearchParams<{
      id: string;
    }>();

  const { businessId } =
    useCurrentBusiness();

  const queryClient = useQueryClient();

  const [showEdit, setShowEdit] =
    useState(false);

  const [showAttach, setShowAttach] =
    useState(false);

  const [performanceDays, setPerformanceDays] =
    useState(30);

  const [analyticsDays, setAnalyticsDays] =
    useState(30);

  const [name, setName] = useState("");

  const [description, setDescription] =
    useState("");

  const [startsAt, setStartsAt] =
    useState("");

  const [endsAt, setEndsAt] = useState("");

  const [formError, setFormError] =
    useState("");

  /*
   * The campaign record itself — mirrors the web
   * dashboard's selected campaign from the library.
   */
  const campaignQuery = useQuery({
    queryKey: ["campaigns", businessId],
    queryFn: () =>
      getCampaigns(businessId as string),
    enabled: Boolean(businessId),
  });

  const campaign: Campaign | undefined =
    useMemo(
      () =>
        (campaignQuery.data ?? []).find(
          (item) => item.id === id
        ),
      [campaignQuery.data, id]
    );

  /*
   * GET /campaign/business/:businessId/campaigns/:campaignId/qrcodes
   */
  const qrQuery = useQuery({
    queryKey: [
      "campaign-qrcodes",
      businessId,
      id,
    ],
    queryFn: () =>
      getCampaignQRCodes(
        businessId as string,
        id as string
      ),
    enabled: Boolean(businessId && id),
  });

  /*
   * GET /qrcodes/business/:businessId — reused from
   * qrcodeApi for the attach QR picker.
   */
  const allQrQuery = useQuery({
    queryKey: ["qrcodes", businessId],
    queryFn: () =>
      getQRCodes(businessId as string),
    enabled: Boolean(businessId),
  });

  /*
   * GET /analytics/business/:businessId/campaigns/:campaignId?days=
   */
  const analyticsQuery = useQuery({
    queryKey: [
      "campaign-analytics",
      businessId,
      id,
      analyticsDays,
    ],
    queryFn: () =>
      getCampaignAnalytics(
        businessId as string,
        id as string,
        analyticsDays
      ),
    enabled: Boolean(businessId && id),
  });

  /*
   * GET .../conversion-attribution?days=
   */
  const attributionQuery = useQuery({
    queryKey: [
      "campaign-attribution",
      businessId,
      id,
      analyticsDays,
    ],
    queryFn: () =>
      getCampaignAttribution(
        businessId as string,
        id as string,
        analyticsDays
      ),
    enabled: Boolean(businessId && id),
  });

  /*
   * GET .../qr-performance?days=
   */
  const performanceQuery = useQuery({
    queryKey: [
      "campaign-qr-performance",
      businessId,
      id,
      performanceDays,
    ],
    queryFn: () =>
      getCampaignQRPerformance(
        businessId as string,
        id as string,
        performanceDays
      ),
    enabled: Boolean(businessId && id),
  });

  const invalidateCampaign = () => {
    void queryClient.invalidateQueries({
      queryKey: ["campaigns", businessId],
    });

    void queryClient.invalidateQueries({
      queryKey: [
        "campaign-qrcodes",
        businessId,
        id,
      ],
    });

    void queryClient.invalidateQueries({
      queryKey: [
        "campaign-analytics",
        businessId,
        id,
      ],
    });

    void queryClient.invalidateQueries({
      queryKey: [
        "campaign-attribution",
        businessId,
        id,
      ],
    });

    void queryClient.invalidateQueries({
      queryKey: [
        "campaign-qr-performance",
        businessId,
        id,
      ],
    });
  };

  /*
   * PATCH /campaign/business/:businessId/campaigns/:campaignId
   */
  const editMutation = useMutation({
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

      return updateCampaign(
        businessId as string,
        id as string,
        {
          name: trimmed,
          description:
            description.trim() || null,
          startsAt: startIso,
          endsAt: endIso,
        }
      );
    },
    onSuccess: () => {
      invalidateCampaign();
      setShowEdit(false);
      setFormError("");
    },
    onError: (err) => {
      setFormError(
        err instanceof Error
          ? err.message
          : "Unable to update campaign."
      );
    },
  });

  /*
   * PATCH .../campaigns/:campaignId/status
   */
  const statusMutation = useMutation({
    mutationFn: (status: CampaignStatus) =>
      setCampaignStatus(
        businessId as string,
        id as string,
        status
      ),
    onSuccess: invalidateCampaign,
    onError: (err) => {
      Alert.alert(
        "Unable to update status",
        err instanceof Error
          ? err.message
          : "Please try again."
      );
    },
  });

  /*
   * POST .../campaigns/:campaignId/qrcodes/:qrCodeId
   */
  const attachMutation = useMutation({
    mutationFn: (qrCodeId: string) =>
      attachQRCode(
        businessId as string,
        id as string,
        qrCodeId
      ),
    onSuccess: () => {
      invalidateCampaign();
      setShowAttach(false);
    },
    onError: (err) => {
      Alert.alert(
        "Unable to attach QR code",
        err instanceof Error
          ? err.message
          : "Please try again."
      );
    },
  });

  /*
   * DELETE .../campaigns/:campaignId/qrcodes/:qrCodeId
   */
  const detachMutation = useMutation({
    mutationFn: (qrCodeId: string) =>
      detachQRCode(
        businessId as string,
        id as string,
        qrCodeId
      ),
    onSuccess: invalidateCampaign,
    onError: (err) => {
      Alert.alert(
        "Unable to remove QR code",
        err instanceof Error
          ? err.message
          : "Please try again."
      );
    },
  });

  const openEdit = () => {
    if (!campaign) {
      return;
    }

    setName(campaign.name ?? "");
    setDescription(
      campaign.description ?? ""
    );
    setStartsAt(
      toDateInput(campaign.startsAt)
    );
    setEndsAt(
      toDateInput(campaign.endsAt)
    );
    setFormError("");
    setShowEdit(true);
  };

  const confirmDetach = (
    qr: CampaignQRCode
  ) => {
    Alert.alert(
      "Remove QR code",
      `Remove "${qr.name}" from this campaign?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () =>
            detachMutation.mutate(qr.id),
        },
      ]
    );
  };

  const attachedIds = useMemo(
    () =>
      new Set(
        (qrQuery.data ?? []).map(
          (qr) => qr.id
        )
      ),
    [qrQuery.data]
  );

  const unattachedQrs = useMemo(
    () =>
      (allQrQuery.data ?? []).filter(
        (qr) => !attachedIds.has(qr.id)
      ),
    [allQrQuery.data, attachedIds]
  );

  const statusColors = getStatusColors(
    campaign?.status
  );

  const statusActions = getStatusActions(
    campaign?.status
  );

  const analyticsSummary =
    analyticsQuery.data?.summary;

  const attribution =
    attributionQuery.data;

  const attributionSummary =
    attribution?.summary;

  const maxConversionType = Math.max(
    1,
    ...(attribution?.conversionTypes ?? []).map(
      (row) => toNumber(row.conversions)
    )
  );

  const performanceRows =
    performanceQuery.data?.qrCodes ?? [];

  if (!businessId || campaignQuery.isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenLoader />
      </SafeAreaView>
    );
  }

  if (campaignQuery.isError || !campaign) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerFill}>
          <EmptyState
            title="Campaign not found"
            message="This campaign may have been deleted."
          />

          <View style={styles.centerButton}>
            <Button
              title="Back to campaigns"
              onPress={() => router.back()}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const renderAttachedQr = ({
    item,
  }: {
    item: CampaignQRCode;
  }) => (
    <View style={styles.qrRow}>
      <View style={styles.qrIcon}>
        <Ionicons
          name="qr-code-outline"
          size={20}
          color={COLORS.primary}
        />
      </View>

      <View style={styles.qrInfo}>
        <Text
          style={styles.qrName}
          numberOfLines={1}
        >
          {item.name}
        </Text>

        <Text style={styles.qrMeta}>
          {item.shortCode}
          {item.scanCount != null
            ? ` · ${formatCount(
                toNumber(item.scanCount)
              )} scans`
            : ""}
        </Text>
      </View>

      <Pressable
        onPress={() => confirmDetach(item)}
        disabled={
          detachMutation.isPending
        }
        style={styles.detachButton}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${item.name}`}
      >
        <Ionicons
          name="close"
          size={18}
          color={COLORS.danger}
        />
      </Pressable>
    </View>
  );

  const renderPickerQr = ({
    item,
  }: {
    item: QRCodeRecord;
  }) => (
    <Pressable
      onPress={() =>
        attachMutation.mutate(item.id)
      }
      disabled={attachMutation.isPending}
      style={({ pressed }) => [
        styles.qrRow,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.qrIcon}>
        <Ionicons
          name="qr-code-outline"
          size={20}
          color={COLORS.primary}
        />
      </View>

      <View style={styles.qrInfo}>
        <Text
          style={styles.qrName}
          numberOfLines={1}
        >
          {item.name}
        </Text>

        <Text style={styles.qrMeta}>
          {item.shortCode}
        </Text>
      </View>

      {attachMutation.isPending ? (
        <ActivityIndicator
          size="small"
          color={COLORS.primary}
        />
      ) : (
        <Ionicons
          name="add-circle-outline"
          size={22}
          color={COLORS.primary}
        />
      )}
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={
          styles.scroll
        }
      >
        {/* Header */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.badgeWrap}>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor:
                      statusColors.bg,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    {
                      color: statusColors.fg,
                    },
                  ]}
                >
                  {
                    STATUS_LABELS[
                      campaign.status as CampaignStatus
                    ] ?? "Unknown"
                  }
                </Text>
              </View>
            </View>

            <Pressable
              onPress={openEdit}
              style={({ pressed }) => [
                styles.editButton,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Edit campaign"
            >
              <Ionicons
                name="create-outline"
                size={18}
                color={COLORS.primary}
              />

              <Text style={styles.editButtonText}>
                Edit
              </Text>
            </Pressable>
          </View>

          <Text style={styles.campaignName}>
            {campaign.name}
          </Text>

          {campaign.description ? (
            <Text style={styles.campaignDescription}>
              {campaign.description}
            </Text>
          ) : null}

          <View style={styles.dateRow}>
            <Ionicons
              name="calendar-outline"
              size={14}
              color={COLORS.textMuted}
            />

            <Text style={styles.dateText}>
              {`${formatDate(campaign.startsAt)} — ${formatDate(campaign.endsAt)}`}
            </Text>
          </View>
        </View>

        {/* Status actions */}
        {statusActions.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Status actions
            </Text>

            <View style={styles.actionsRow}>
              {statusActions.map(
                (action) => {
                  const meta =
                    STATUS_ACTION_META[
                      action
                    ];

                  return (
                    <Pressable
                      key={action}
                      onPress={() =>
                        statusMutation.mutate(
                          action
                        )
                      }
                      disabled={
                        statusMutation.isPending
                      }
                      style={({ pressed }) => [
                        styles.actionButton,
                        pressed &&
                          styles.pressed,
                      ]}
                    >
                      {statusMutation.isPending ? (
                        <ActivityIndicator
                          size="small"
                          color={COLORS.primary}
                        />
                      ) : (
                        <>
                          <Ionicons
                            name={meta.icon}
                            size={18}
                            color={COLORS.primary}
                          />

                          <Text
                            style={
                              styles.actionLabel
                            }
                          >
                            {meta.label}
                          </Text>
                        </>
                      )}
                    </Pressable>
                  );
                }
              )}
            </View>
          </View>
        ) : null}

        {/* Attached QR codes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Attached QR codes
            </Text>

            <Pressable
              onPress={() =>
                setShowAttach(true)
              }
              style={({ pressed }) => [
                styles.attachButton,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Attach QR code"
            >
              <Ionicons
                name="link-outline"
                size={16}
                color={COLORS.white}
              />

              <Text
                style={styles.attachButtonText}
              >
                Attach
              </Text>
            </Pressable>
          </View>

          {qrQuery.isLoading ? (
            <ActivityIndicator
              color={COLORS.primary}
            />
          ) : (qrQuery.data ?? []).length ===
            0 ? (
            <Text style={styles.emptyHint}>
              No QR codes attached yet. Attach
              one to track it under this
              campaign.
            </Text>
          ) : (
            <FlatList
              data={qrQuery.data}
              keyExtractor={(item) =>
                item.id
              }
              renderItem={renderAttachedQr}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Analytics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Analytics
          </Text>

          <ChipRow<number>
            options={ANALYTICS_PERIODS.map(
              (days) => ({
                value: days,
                label:
                  days === 365
                    ? "1Y"
                    : `${days}d`,
              })
            )}
            selected={analyticsDays}
            onSelect={setAnalyticsDays}
          />

          {analyticsQuery.isLoading ? (
            <ActivityIndicator
              color={COLORS.primary}
            />
          ) : analyticsSummary ? (
            <>
              <View style={styles.statsGrid}>
                <StatCard
                  title="Scans"
                  value={Math.round(
                    toNumber(
                      analyticsSummary.totalScans
                    )
                  )}
                  subtitle={`${analyticsDays}d period`}
                  icon="scan-outline"
                />

                <StatCard
                  title="Visitors"
                  value={Math.round(
                    toNumber(
                      analyticsSummary.totalVisitors
                    )
                  )}
                  subtitle="Unique visitors"
                  icon="people-outline"
                />

                <StatCard
                  title="Conversions"
                  value={Math.round(
                    toNumber(
                      analyticsSummary.totalConversions
                    )
                  )}
                  subtitle={`${analyticsDays}d period`}
                  icon="checkmark-circle-outline"
                />
              </View>

              {/* Conversion value */}
              <View style={styles.valueCard}>
                <View style={styles.valueRow}>
                  <Text style={styles.valueLabel}>
                    Conversion value
                  </Text>

                  <Text
                    style={styles.valueAmount}
                  >
                    {formatCount(
                      toNumber(
                        analyticsSummary.totalConversionValue
                      )
                    )}
                  </Text>
                </View>

                {(
                  attribution?.conversionValue
                    ?.currencies ?? []
                ).map((row) => (
                  <View
                    key={row.currency ?? "total"}
                    style={styles.valueRow}
                  >
                    <Text
                      style={
                        styles.valueCurrency
                      }
                    >
                      {row.currency ??
                        "Unspecified"}
                    </Text>

                    <Text
                      style={
                        styles.valueCurrencyAmount
                      }
                    >
                      {formatCount(
                        toNumber(row.value)
                      )}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Attribution */}
              {attributionSummary ? (
                <View style={styles.attrCard}>
                  <Text
                    style={styles.attrTitle}
                  >
                    Conversion attribution
                  </Text>

                  <View style={styles.attrGrid}>
                    <View style={styles.attrCell}>
                      <Text
                        style={styles.attrValue}
                      >
                        {Math.round(
                          toNumber(
                            attributionSummary.totalConversions
                          )
                        )}
                      </Text>

                      <Text
                        style={styles.attrLabel}
                      >
                        Total
                      </Text>
                    </View>

                    <View style={styles.attrCell}>
                      <Text
                        style={styles.attrValue}
                      >
                        {Math.round(
                          toNumber(
                            attributionSummary.attributedConversions
                          )
                        )}
                      </Text>

                      <Text
                        style={styles.attrLabel}
                      >
                        Attributed
                      </Text>
                    </View>

                    <View style={styles.attrCell}>
                      <Text
                        style={styles.attrValue}
                      >
                        {Math.round(
                          toNumber(
                            attributionSummary.unattributedConversions
                          )
                        )}
                      </Text>

                      <Text
                        style={styles.attrLabel}
                      >
                        Unattributed
                      </Text>
                    </View>

                    <View style={styles.attrCell}>
                      <Text
                        style={styles.attrValue}
                      >
                        {`${Math.round(toNumber(attributionSummary.attributionRate))}%`}
                      </Text>

                      <Text
                        style={styles.attrLabel}
                      >
                        Rate
                      </Text>
                    </View>
                  </View>

                  {(attribution?.conversionTypes ??
                    []).length > 0 ? (
                    <View
                      style={
                        styles.typeList
                      }
                    >
                      <Text
                        style={
                          styles.typeTitle
                        }
                      >
                        Conversion types
                      </Text>

                      {(
                        attribution?.conversionTypes ??
                        []
                      ).map((row) => {
                        const conversions =
                          toNumber(
                            row.conversions
                          );

                        return (
                          <View
                            key={row.type}
                            style={
                              styles.typeRow
                            }
                          >
                            <Text
                              style={
                                styles.typeName
                              }
                              numberOfLines={1}
                            >
                              {row.type}
                            </Text>

                            <View
                              style={
                                styles.typeBarTrack
                              }
                            >
                              <View
                                style={[
                                  styles.typeBarFill,
                                  {
                                    width: `${Math.max(
                                      4,
                                      (conversions /
                                        maxConversionType) *
                                        100
                                    )}%`,
                                  },
                                ]}
                              />
                            </View>

                            <Text
                              style={
                                styles.typeValue
                              }
                            >
                              {Math.round(
                                conversions
                              )}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  ) : null}
                </View>
              ) : null}
            </>
          ) : (
            <EmptyState
              title="No analytics yet"
              message="Analytics will appear here once this campaign gets scans."
            />
          )}
        </View>

        {/* QR performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            QR performance
          </Text>

          <ChipRow<number>
            options={PERFORMANCE_PERIODS.map(
              (days) => ({
                value: days,
                label: `${days}d`,
              })
            )}
            selected={performanceDays}
            onSelect={setPerformanceDays}
          />

          {performanceQuery.isLoading ? (
            <ActivityIndicator
              color={COLORS.primary}
            />
          ) : performanceRows.length === 0 ? (
            <Text style={styles.emptyHint}>
              No QR performance data for this
              period.
            </Text>
          ) : (
            <FlatList
              data={performanceRows}
              keyExtractor={(item) =>
                item.id
              }
              renderItem={({ item }) => {
                const metrics =
                  item.metrics ?? {};

                const rate = toNumber(
                  metrics.conversionRate
                );

                return (
                  <View
                    style={styles.perfRow}
                  >
                    <Text
                      style={styles.perfRank}
                    >
                      {`#${item.rank}`}
                    </Text>

                    <View
                      style={styles.perfInfo}
                    >
                      <Text
                        style={styles.qrName}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>

                      <Text
                        style={styles.perfMeta}
                      >
                        {`${formatCount(toNumber(metrics.scans))} scans · ${formatCount(toNumber(metrics.uniqueVisitors))} visitors · ${Math.round(rate)}% conv.`}
                      </Text>
                    </View>

                    <Text
                      style={styles.perfValue}
                    >
                      {formatCount(
                        toNumber(
                          metrics.conversionValue
                        )
                      )}
                    </Text>
                  </View>
                );
              }}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>

      {/* Edit-campaign modal */}
      <Modal
        visible={showEdit}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() =>
          setShowEdit(false)
        }
      >
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Edit campaign
            </Text>

            <Pressable
              onPress={() =>
                setShowEdit(false)
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
                title="Save changes"
                onPress={() =>
                  editMutation.mutate()
                }
                loading={
                  editMutation.isPending
                }
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Attach QR picker modal */}
      <Modal
        visible={showAttach}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() =>
          setShowAttach(false)
        }
      >
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Attach QR code
            </Text>

            <Pressable
              onPress={() =>
                setShowAttach(false)
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

          <View style={styles.modalBody}>
            {allQrQuery.isLoading ? (
              <ActivityIndicator
                color={COLORS.primary}
              />
            ) : unattachedQrs.length === 0 ? (
              <EmptyState
                title="Nothing to attach"
                message="All your QR codes are already attached to this campaign."
              />
            ) : (
              <FlatList
                data={unattachedQrs}
                keyExtractor={(item) =>
                  item.id
                }
                renderItem={renderPickerQr}
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scroll: {
    padding: SPACING.lg,
    paddingBottom: SPACING.huge,
  },

  centerFill: {
    flex: 1,
    justifyContent: "center",
    padding: SPACING.lg,
  },

  centerButton: {
    marginTop: SPACING.lg,
  },

  pressed: {
    opacity: 0.75,
  },

  headerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
  },

  badgeWrap: {
    flexDirection: "row",
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

  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
  },

  editButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
  },

  campaignName: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
  },

  campaignDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },

  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },

  dateText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },

  section: {
    marginTop: SPACING.xxl,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },

  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },

  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },

  actionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
  },

  attachButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },

  attachButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.white,
  },

  emptyHint: {
    fontSize: 13,
    color: COLORS.textMuted,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
  },

  qrRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },

  qrIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  qrInfo: {
    flex: 1,
  },

  qrName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },

  qrMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  detachButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  chips: {
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingRight: SPACING.lg,
  },

  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },

  chipTextActive: {
    color: COLORS.white,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },

  valueCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: SPACING.lg,
    marginTop: SPACING.md,
  },

  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SPACING.xs,
  },

  valueLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  valueAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
  },

  valueCurrency: {
    fontSize: 13,
    color: COLORS.textMuted,
  },

  valueCurrencyAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },

  attrCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: SPACING.lg,
    marginTop: SPACING.md,
  },

  attrTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.md,
  },

  attrGrid: {
    flexDirection: "row",
  },

  attrCell: {
    flex: 1,
    alignItems: "center",
  },

  attrValue: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },

  attrLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  typeList: {
    marginTop: SPACING.lg,
  },

  typeTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },

  typeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },

  typeName: {
    width: 90,
    fontSize: 12,
    color: COLORS.text,
  },

  typeBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
    overflow: "hidden",
  },

  typeBarFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },

  typeValue: {
    width: 36,
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "right",
  },

  perfRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },

  perfRank: {
    width: 34,
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
  },

  perfInfo: {
    flex: 1,
  },

  perfMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  perfValue: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
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
