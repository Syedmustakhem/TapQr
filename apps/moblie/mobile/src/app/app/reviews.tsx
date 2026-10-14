import { Ionicons } from "@expo/vector-icons";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

import Input from "../../components/ui/Input";

import {
  Review,
  ReviewStatus,
  getReviewSummary,
  getReviews,
  respondToReview,
  setReviewStatus,
} from "../../api/reviewsApi";

import { COLORS } from "../../constants/colors";
import { SPACING } from "../../constants/spacing";

import { useCurrentBusiness } from "../../hooks/useCurrentBusiness";

/*
 * Mirrors app/dashboard/reviews on the web:
 * business switcher, stat cards, rating distribution,
 * reputation signal, review manager (status pills,
 * private-feedback toggle, search, rating/verified
 * filters), pagination, respond modal and confirm
 * dialogs for hide/reject. API paths match the audit
 * map verbatim.
 */

const BUSINESS_STORAGE_KEY =
  "tapqr_current_business_id";

const PAGE_SIZE = 20;

type StatusFilter =
  | "ALL"
  | ReviewStatus;

const STATUS_PILLS: {
  value: StatusFilter;
  label: string;
}[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "PUBLISHED", label: "Published" },
  { value: "HIDDEN", label: "Hidden" },
  { value: "REJECTED", label: "Rejected" },
];

const RATING_PILLS = [
  { value: "ALL", label: "All ratings" },
  { value: "5", label: "5★" },
  { value: "4", label: "4★" },
  { value: "3", label: "3★" },
  { value: "2", label: "2★" },
  { value: "1", label: "1★" },
];

const VERIFIED_PILLS = [
  { value: "ALL", label: "All" },
  { value: "true", label: "Verified" },
  { value: "false", label: "Unverified" },
];

const STATUS_STYLE: Record<
  ReviewStatus,
  { label: string; color: string; bg: string }
> = {
  PENDING: {
    label: "Pending",
    color: "#B45309",
    bg: "#FEF3C7",
  },
  PUBLISHED: {
    label: "Published",
    color: "#15803D",
    bg: "#DCFCE7",
  },
  HIDDEN: {
    label: "Hidden",
    color: "#64748B",
    bg: "#F1F5F9",
  },
  REJECTED: {
    label: "Rejected",
    color: "#B91C1C",
    bg: "#FEE2E2",
  },
};

function initials(
  name?: string | null
): string {
  const value = name?.trim() ?? "";
  if (!value) return "C";
  const parts = value
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${
    parts[parts.length - 1][0]
  }`.toUpperCase();
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function canPublish(status: ReviewStatus): boolean {
  return (
    status === "PENDING" || status === "HIDDEN"
  );
}

export default function ReviewsScreen() {
  const {
    businesses,
    businessId: defaultBusinessId,
    isLoading: businessesLoading,
  } = useCurrentBusiness();

  const queryClient = useQueryClient();

  /*
   * Business switcher — local selection, seeded from the
   * shared current-business hook and persisted under the
   * same AsyncStorage key so it stays in sync app-wide.
   */
  const [selectedId, setSelectedId] = useState<
    string | null
  >(null);

  const [switcherOpen, setSwitcherOpen] =
    useState(false);

  useEffect(() => {
    if (!selectedId && defaultBusinessId) {
      setSelectedId(defaultBusinessId);
    }
  }, [defaultBusinessId, selectedId]);

  const selectBusiness = (id: string) => {
    setSelectedId(id);
    setSwitcherOpen(false);
    setPage(1);
    AsyncStorage.setItem(
      BUSINESS_STORAGE_KEY,
      id
    ).catch(() => {
      // Persistence is best-effort.
    });
  };

  /* ---------- manager filters ---------- */

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");
  const [privateOnly, setPrivateOnly] =
    useState(false);
  const [ratingFilter, setRatingFilter] =
    useState("ALL");
  const [verifiedFilter, setVerifiedFilter] =
    useState("ALL");
  const [search, setSearch] = useState("");

  const [debouncedSearch, setDebouncedSearch] =
    useState("");

  /* debounced search, like the web page's 250ms timer */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const resetPage = () => setPage(1);

  /* ---------- data ---------- */

  /*
   * GET /reviews/businesses/:businessId/summary
   */
  const summaryQuery = useQuery({
    queryKey: [
      "reviews",
      "summary",
      selectedId,
    ],
    queryFn: () =>
      getReviewSummary(selectedId as string),
    enabled: Boolean(selectedId),
  });

  /*
   * GET /reviews/businesses/:businessId/manage?page=&limit=&status=&rating=&verified=&search=
   */
  const reviewsQuery = useQuery({
    queryKey: [
      "reviews",
      "manage",
      selectedId,
      page,
      statusFilter,
      ratingFilter,
      verifiedFilter,
      debouncedSearch,
    ],
    queryFn: () =>
      getReviews(selectedId as string, {
        page,
        limit: PAGE_SIZE,
        status: statusFilter,
        rating: ratingFilter,
        verified: verifiedFilter,
        search: debouncedSearch || undefined,
      }),
    enabled: Boolean(selectedId),
  });

  const summary = summaryQuery.data ?? null;

  const allReviews = reviewsQuery.data?.reviews ?? [];

  /*
   * "Private feedback" is a client-side filter on the
   * web page (isPrivateFeedback flag) — same here.
   */
  const reviews = privateOnly
    ? allReviews.filter(
        (r) => r.isPrivateFeedback
      )
    : allReviews;

  const total = reviewsQuery.data?.total ?? 0;
  const totalPages =
    reviewsQuery.data?.totalPages ?? 1;

  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: ["reviews"],
    });
  };

  /* ---------- mutations ---------- */

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const flashSuccess = (message: string) => {
    setSuccess(message);
    setError("");
    setTimeout(() => setSuccess(""), 2500);
  };

  const flashError = (message: string) => {
    setError(message);
    setSuccess("");
  };

  /*
   * PATCH /reviews/:reviewId/status
   */
  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: ReviewStatus;
    }) => setReviewStatus(id, status),
    onSuccess: (_data, vars) => {
      invalidate();
      flashSuccess(
        vars.status === "PUBLISHED"
          ? "Review published."
          : vars.status === "HIDDEN"
            ? "Review hidden."
            : "Review rejected."
      );
    },
    onError: (err) => {
      flashError(
        err instanceof Error
          ? err.message
          : "Could not update the review."
      );
    },
  });

  const confirmStatus = (
    review: Review,
    status: ReviewStatus,
    title: string,
    message: string
  ) => {
    Alert.alert(title, message, [
      { text: "Back", style: "cancel" },
      {
        text: title,
        style:
          status === "PUBLISHED"
            ? "default"
            : "destructive",
        onPress: () =>
          statusMutation.mutate({
            id: review.id,
            status,
          }),
      },
    ]);
  };

  /* ---------- respond modal ---------- */

  const [responseReview, setResponseReview] =
    useState<Review | null>(null);

  const [responseText, setResponseText] =
    useState("");

  /*
   * PATCH /reviews/:reviewId/response
   */
  const respondMutation = useMutation({
    mutationFn: () =>
      respondToReview(
        (responseReview as Review).id,
        responseText.trim()
      ),
    onSuccess: () => {
      invalidate();
      setResponseReview(null);
      setResponseText("");
      flashSuccess("Response saved.");
    },
    onError: (err) => {
      flashError(
        err instanceof Error
          ? err.message
          : "Could not save your response."
      );
    },
  });

  const openRespond = (review: Review) => {
    setResponseReview(review);
    setResponseText(review.ownerResponse ?? "");
  };

  /* ---------- derived ---------- */

  const selectedBusiness =
    businesses.find((b) => b.id === selectedId) ??
    null;

  const avg =
    summary?.averageRating ?? 0;

  const pendingCount =
    statusFilter === "PENDING" ? total : null;

  const distribution = [5, 4, 3, 2, 1].map(
    (star) => {
      const count =
        summary?.distribution.find(
          (d) => d.rating === star
        )?.count ?? 0;
      const totalPublished =
        summary?.totalReviews ?? 0;
      return {
        star,
        count,
        pct:
          totalPublished > 0
            ? Math.round(
                (count / totalPublished) * 100
              )
            : 0,
      };
    }
  );

  /* ---------- loading / empty-business ---------- */

  if (businessesLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
          />
          <Text style={styles.centerText}>
            Loading…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!selectedId || !selectedBusiness) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Ionicons
            name="star-outline"
            size={40}
            color={COLORS.textMuted}
          />
          <Text style={styles.centerTitle}>
            Reviews need a business
          </Text>
          <Text style={styles.centerText}>
            Create or select a business to
            manage customer reviews.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const loadingData =
    reviewsQuery.isLoading || summaryQuery.isLoading;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={styles.backButton}
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color={COLORS.text}
            />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>
              REPUTATION
            </Text>
            <Text style={styles.title}>
              Reviews
            </Text>
          </View>
        </View>

        {/* BUSINESS SWITCHER */}
        <Pressable
          onPress={() =>
            setSwitcherOpen((o) => !o)
          }
          style={styles.switcher}
        >
          <View style={styles.switcherAvatar}>
            <Text
              style={styles.switcherAvatarText}
            >
              {initials(
                selectedBusiness.name
              )}
            </Text>
          </View>
          <Text
            style={styles.switcherName}
            numberOfLines={1}
          >
            {selectedBusiness.name}
          </Text>
          <Ionicons
            name={
              switcherOpen
                ? "chevron-up"
                : "chevron-down"
            }
            size={18}
            color={COLORS.textSecondary}
          />
        </Pressable>

        {switcherOpen ? (
          <View style={styles.switcherMenu}>
            {businesses.map((b) => {
              const active = b.id === selectedId;
              return (
                <Pressable
                  key={b.id}
                  onPress={() =>
                    selectBusiness(b.id)
                  }
                  style={[
                    styles.switcherItem,
                    active &&
                      styles.switcherItemActive,
                  ]}
                >
                  <View
                    style={[
                      styles.switcherAvatar,
                      active &&
                        styles.switcherAvatarActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.switcherAvatarText,
                        active &&
                          styles.switcherAvatarTextActive,
                      ]}
                    >
                      {initials(b.name)}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.switcherName,
                      active &&
                        styles.switcherNameActive,
                    ]}
                    numberOfLines={1}
                  >
                    {b.name}
                  </Text>
                  {active ? (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={COLORS.primary}
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {/* NOTICES */}
        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons
              name="alert-circle-outline"
              size={18}
              color={COLORS.danger}
            />
            <Text style={styles.errorText}>
              {error}
            </Text>
          </View>
        ) : null}

        {success ? (
          <View style={styles.successBanner}>
            <Ionicons
              name="checkmark-circle-outline"
              size={18}
              color="#15803D"
            />
            <Text style={styles.successText}>
              {success}
            </Text>
          </View>
        ) : null}

        {/* STAT CARDS */}
        <View style={styles.statGrid}>
          <StatTile
            icon="star"
            label="Avg rating"
            value={avg.toFixed(1)}
            tint="#FEF3C7"
            iconColor="#D97706"
            loading={summaryQuery.isLoading}
          />
          <StatTile
            icon="chatbubble-outline"
            label="Total"
            value={String(
              summary?.totalReviews ?? 0
            )}
            tint="#DBEAFE"
            iconColor="#2563EB"
            loading={summaryQuery.isLoading}
          />
          <StatTile
            icon="shield-checkmark-outline"
            label="Verified"
            value={String(
              summary?.verifiedReviews ?? 0
            )}
            tint="#DCFCE7"
            iconColor="#15803D"
            loading={summaryQuery.isLoading}
          />
          <StatTile
            icon="time-outline"
            label="Pending"
            value={
              pendingCount === null
                ? "—"
                : String(pendingCount)
            }
            helper={
              pendingCount === null
                ? "Filter Pending to count"
                : "Current filter"
            }
            tint="#F3E8FF"
            iconColor="#7C3AED"
            loading={summaryQuery.isLoading}
          />
        </View>

        {/* DISTRIBUTION + REPUTATION SIGNAL */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Rating distribution
          </Text>
          <Text style={styles.cardSubtitle}>
            Published reviews across each star
            rating.
          </Text>
          <View style={styles.distList}>
            {distribution.map((d) => (
              <View
                key={d.star}
                style={styles.distRow}
              >
                <View style={styles.distStar}>
                  <Text style={styles.distStarText}>
                    {d.star}
                  </Text>
                  <Ionicons
                    name="star"
                    size={12}
                    color="#F59E0B"
                  />
                </View>
                <View
                  style={styles.distBarBg}
                >
                  <View
                    style={[
                      styles.distBar,
                      { width: `${d.pct}%` },
                    ]}
                  />
                </View>
                <Text style={styles.distCount}>
                  {d.count}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.reputationCard}>
          <Text style={styles.reputationEyebrow}>
            REPUTATION SIGNAL
          </Text>
          <View style={styles.reputationRow}>
            <Text
              style={styles.reputationScore}
            >
              {avg.toFixed(1)}
            </Text>
            <View>
              <StarRow
                rating={avg}
                size={16}
                filled="#F59E0B"
                empty="rgba(255,255,255,0.25)"
              />
              <Text
                style={styles.reputationLabel}
              >
                Customer rating
              </Text>
            </View>
          </View>
          <Text style={styles.reputationNote}>
            Reply to published reviews
            quickly and use feedback to improve
            the customer experience. Only
            published reviews are visible
            publicly.
          </Text>
        </View>

        {/* REVIEW MANAGER */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Review manager
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            style={styles.pillScroll}
            contentContainerStyle={
              styles.pillContent
            }
          >
            {STATUS_PILLS.map((p) => {
              const selected =
                statusFilter === p.value;
              return (
                <Pressable
                  key={p.value}
                  onPress={() => {
                    setStatusFilter(p.value);
                    resetPage();
                  }}
                  style={[
                    styles.pill,
                    selected &&
                      styles.pillSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      selected &&
                        styles.pillTextSelected,
                    ]}
                  >
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
            <Pressable
              onPress={() =>
                setPrivateOnly((v) => !v)
              }
              style={[
                styles.pill,
                privateOnly &&
                  styles.privatePillSelected,
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  privateOnly &&
                    styles.pillTextSelected,
                ]}
              >
                🔒 Private feedback
              </Text>
            </Pressable>
          </ScrollView>

          <Input
            value={search}
            onChangeText={setSearch}
            placeholder="Search reviews…"
            returnKeyType="search"
          />

          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>
              Rating
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.pillContentSmall
              }
            >
              {RATING_PILLS.map((p) => {
                const selected =
                  ratingFilter === p.value;
                return (
                  <Pressable
                    key={p.value}
                    onPress={() => {
                      setRatingFilter(p.value);
                      resetPage();
                    }}
                    style={[
                      styles.pillSmall,
                      selected &&
                        styles.pillSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillSmallText,
                        selected &&
                          styles.pillTextSelected,
                      ]}
                    >
                      {p.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>
              Verified
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.pillContentSmall
              }
            >
              {VERIFIED_PILLS.map((p) => {
                const selected =
                  verifiedFilter === p.value;
                return (
                  <Pressable
                    key={p.value}
                    onPress={() => {
                      setVerifiedFilter(p.value);
                      resetPage();
                    }}
                    style={[
                      styles.pillSmall,
                      selected &&
                        styles.pillSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillSmallText,
                        selected &&
                          styles.pillTextSelected,
                      ]}
                    >
                      {p.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* REVIEW LIST */}
          {loadingData ? (
            <View style={styles.listLoader}>
              <ActivityIndicator
                size="large"
                color={COLORS.primary}
              />
            </View>
          ) : reviews.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons
                name="chatbubble-outline"
                size={36}
                color={COLORS.textMuted}
              />
              <Text style={styles.emptyTitle}>
                No reviews found
              </Text>
              <Text style={styles.emptyText}>
                Try adjusting your filters or
                wait for customers to submit
                feedback.
              </Text>
            </View>
          ) : (
            reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                acting={statusMutation.isPending}
                onPublish={() =>
                  confirmStatus(
                    review,
                    "PUBLISHED",
                    "Publish",
                    "Publish this review? It will become visible on the public TapQR review experience."
                  )
                }
                onHide={() =>
                  confirmStatus(
                    review,
                    "HIDDEN",
                    "Hide",
                    "Hide this review? It will no longer appear publicly, but will remain stored."
                  )
                }
                onReject={() =>
                  confirmStatus(
                    review,
                    "REJECTED",
                    "Reject",
                    "Reject this review? It will be marked rejected and stay unavailable publicly."
                  )
                }
                onRespond={() =>
                  openRespond(review)
                }
              />
            ))
          )}

          {/* PAGINATION */}
          <View style={styles.pagination}>
            <Text style={styles.paginationText}>
              Page {page} of{" "}
              {Math.max(1, totalPages)} ·{" "}
              {total} reviews
            </Text>
            <View style={styles.paginationBtns}>
              <Pressable
                onPress={() =>
                  setPage((p) =>
                    Math.max(1, p - 1)
                  )
                }
                disabled={page <= 1}
                hitSlop={10}
                style={styles.pageBtn}
              >
                <Ionicons
                  name="chevron-back"
                  size={20}
                  color={
                    page <= 1
                      ? COLORS.textMuted
                      : COLORS.text
                  }
                />
              </Pressable>
              <Pressable
                onPress={() =>
                  setPage((p) =>
                    Math.min(totalPages, p + 1)
                  )
                }
                disabled={page >= totalPages}
                hitSlop={10}
                style={styles.pageBtn}
              >
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={
                    page >= totalPages
                      ? COLORS.textMuted
                      : COLORS.text
                  }
                />
              </Pressable>
            </View>
          </View>
        </View>

        {/* MODERATION NOTE */}
        <View style={styles.infoCard}>
          <Ionicons
            name="shield-checkmark-outline"
            size={20}
            color={COLORS.primary}
          />
          <View style={styles.infoText}>
            <Text style={styles.infoTitle}>
              Moderation & privacy
            </Text>
            <Text style={styles.infoBody}>
              Only published reviews appear on
              the public experience. Customer
              contact details stay out of the
              public review list.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* RESPOND MODAL */}
      <Modal
        visible={responseReview !== null}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!respondMutation.isPending) {
            setResponseReview(null);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Respond to review
              </Text>
              <Pressable
                onPress={() =>
                  setResponseReview(null)
                }
                disabled={
                  respondMutation.isPending
                }
                hitSlop={10}
              >
                <Ionicons
                  name="close"
                  size={22}
                  color={COLORS.textSecondary}
                />
              </Pressable>
            </View>
            <Text style={styles.modalSub}>
              Your response will be visible
              below this review.
            </Text>

            {responseReview ? (
              <View style={styles.modalQuote}>
                <StarRow
                  rating={
                    responseReview.rating
                  }
                  size={14}
                  filled="#F59E0B"
                  empty="#E2E8F0"
                />
                <Text
                  style={styles.modalQuoteTitle}
                  numberOfLines={2}
                >
                  {responseReview.title ||
                    "Customer review"}
                </Text>
                <Text
                  style={styles.modalQuoteBody}
                  numberOfLines={4}
                >
                  {responseReview.comment ||
                    "No written comment."}
                </Text>
              </View>
            ) : null}

            <TextInput
              value={responseText}
              onChangeText={setResponseText}
              multiline
              maxLength={2000}
              placeholder="Write a professional response…"
              placeholderTextColor={
                COLORS.textMuted
              }
              style={styles.modalInput}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>
              {responseText.length}/2000
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() =>
                  setResponseReview(null)
                }
                disabled={
                  respondMutation.isPending
                }
                style={styles.modalCancel}
              >
                <Text
                  style={styles.modalCancelText}
                >
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={() =>
                  respondMutation.mutate()
                }
                disabled={
                  respondMutation.isPending ||
                  !responseText.trim()
                }
                style={[
                  styles.modalSave,
                  (respondMutation.isPending ||
                    !responseText.trim()) &&
                    styles.modalSaveDisabled,
                ]}
              >
                {respondMutation.isPending ? (
                  <ActivityIndicator
                    size="small"
                    color={COLORS.white}
                  />
                ) : (
                  <Text
                    style={styles.modalSaveText}
                  >
                    Save response
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ================================================= */
/* STAT TILE                                         */
/* ================================================= */

function StatTile({
  icon,
  label,
  value,
  helper,
  tint,
  iconColor,
  loading,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  helper?: string;
  tint: string;
  iconColor: string;
  loading: boolean;
}) {
  return (
    <View style={styles.statTile}>
      <View style={styles.statTop}>
        <Text style={styles.statLabel}>
          {label}
        </Text>
        <View
          style={[
            styles.statIcon,
            { backgroundColor: tint },
          ]}
        >
          <Ionicons
            name={icon}
            size={18}
            color={iconColor}
          />
        </View>
      </View>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={COLORS.primary}
          style={styles.statSpinner}
        />
      ) : (
        <Text style={styles.statValue}>
          {value}
        </Text>
      )}
      {helper ? (
        <Text style={styles.statHelper}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

/* ================================================= */
/* STAR ROW                                          */
/* ================================================= */

function StarRow({
  rating,
  size,
  filled,
  empty,
}: {
  rating: number;
  size: number;
  filled: string;
  empty: string;
}) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={
            star <= Math.round(rating)
              ? "star"
              : "star-outline"
          }
          size={size}
          color={
            star <= Math.round(rating)
              ? filled
              : empty
          }
        />
      ))}
    </View>
  );
}

/* ================================================= */
/* REVIEW CARD                                       */
/* ================================================= */

function ReviewCard({
  review,
  acting,
  onPublish,
  onHide,
  onReject,
  onRespond,
}: {
  review: Review;
  acting: boolean;
  onPublish: () => void;
  onHide: () => void;
  onReject: () => void;
  onRespond: () => void;
}) {
  const meta = STATUS_STYLE[review.status];

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHead}>
        <View style={styles.reviewAvatar}>
          <Text style={styles.reviewAvatarText}>
            {initials(review.reviewerName)}
          </Text>
        </View>
        <View style={styles.reviewHeadInfo}>
          <View style={styles.reviewNameRow}>
            <Text
              style={styles.reviewName}
              numberOfLines={1}
            >
              {review.reviewerName ||
                "Customer"}
            </Text>
            {review.isVerified ? (
              <View
                style={styles.verifiedBadge}
              >
                <Ionicons
                  name="shield-checkmark"
                  size={11}
                  color="#15803D"
                />
                <Text
                  style={
                    styles.verifiedBadgeText
                  }
                >
                  Verified
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.reviewDate}>
            {formatDate(review.createdAt)}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: meta.bg },
          ]}
        >
          <Text
            style={[
              styles.statusBadgeText,
              { color: meta.color },
            ]}
          >
            {meta.label}
          </Text>
        </View>
      </View>

      {review.isPrivateFeedback ? (
        <View style={styles.privateBadge}>
          <Text style={styles.privateBadgeText}>
            🔒 Private feedback — never shown
            publicly
          </Text>
        </View>
      ) : null}

      <View style={styles.reviewStars}>
        <StarRow
          rating={review.rating}
          size={15}
          filled="#F59E0B"
          empty="#E2E8F0"
        />
      </View>

      {review.title ? (
        <Text style={styles.reviewTitle}>
          {review.title}
        </Text>
      ) : null}

      <Text style={styles.reviewComment}>
        {review.comment || "No written comment."}
      </Text>

      {review.moderationNote ? (
        <View style={styles.moderationBox}>
          <Text style={styles.moderationLabel}>
            MODERATION NOTE
          </Text>
          <Text style={styles.moderationText}>
            {review.moderationNote}
          </Text>
        </View>
      ) : null}

      {review.ownerResponse ? (
        <View style={styles.responseBox}>
          <View style={styles.responseHead}>
            <Ionicons
              name="chatbubble-outline"
              size={14}
              color={COLORS.primary}
            />
            <Text style={styles.responseLabel}>
              BUSINESS RESPONSE
            </Text>
            {review.respondedAt ? (
              <Text style={styles.responseDate}>
                {formatDate(review.respondedAt)}
              </Text>
            ) : null}
          </View>
          <Text style={styles.responseText}>
            {review.ownerResponse}
          </Text>
        </View>
      ) : null}

      <View style={styles.reviewActions}>
        {canPublish(review.status) ? (
          <Pressable
            onPress={onPublish}
            disabled={acting}
            style={[
              styles.actionBtn,
              styles.actionPublish,
              acting && styles.actionDisabled,
            ]}
          >
            <Ionicons
              name="checkmark"
              size={14}
              color="#15803D"
            />
            <Text
              style={[
                styles.actionBtnText,
                styles.actionPublishText,
              ]}
            >
              Publish
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={onRespond}
          disabled={acting}
          style={[
            styles.actionBtn,
            styles.actionGhost,
            acting && styles.actionDisabled,
          ]}
        >
          <Ionicons
            name="chatbubble-outline"
            size={14}
            color={COLORS.textSecondary}
          />
          <Text
            style={[
              styles.actionBtnText,
              styles.actionGhostText,
            ]}
          >
            Respond
          </Text>
        </Pressable>
        {review.status === "PUBLISHED" ? (
          <Pressable
            onPress={onHide}
            disabled={acting}
            style={[
              styles.actionBtn,
              styles.actionHide,
              acting && styles.actionDisabled,
            ]}
          >
            <Ionicons
              name="eye-off-outline"
              size={14}
              color="#B45309"
            />
            <Text
              style={[
                styles.actionBtnText,
                styles.actionHideText,
              ]}
            >
              Hide
            </Text>
          </Pressable>
        ) : null}
        {review.status !== "REJECTED" ? (
          <Pressable
            onPress={onReject}
            disabled={acting}
            style={[
              styles.actionBtn,
              styles.actionReject,
              acting && styles.actionDisabled,
            ]}
          >
            <Ionicons
              name="close"
              size={14}
              color={COLORS.danger}
            />
            <Text
              style={[
                styles.actionBtnText,
                styles.actionRejectText,
              ]}
            >
              Reject
            </Text>
          </Pressable>
        ) : null}
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

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
  },

  centerTitle: {
    marginTop: SPACING.md,
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
  },

  centerText: {
    marginTop: SPACING.sm,
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },

  headerText: {
    flex: 1,
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    color: COLORS.primary,
  },

  title: {
    marginTop: 2,
    fontSize: 26,
    fontWeight: "900",
    color: COLORS.text,
  },

  switcher: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },

  switcherAvatar: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: COLORS.text,
    alignItems: "center",
    justifyContent: "center",
  },

  switcherAvatarActive: {
    backgroundColor: COLORS.primary,
  },

  switcherAvatarText: {
    fontSize: 11,
    fontWeight: "900",
    color: COLORS.white,
  },

  switcherAvatarTextActive: {
    color: COLORS.white,
  },

  switcherName: {
    flex: 1,
    marginLeft: SPACING.md,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },

  switcherNameActive: {
    color: COLORS.primary,
  },

  switcherMenu: {
    marginBottom: SPACING.md,
    padding: SPACING.sm,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  switcherItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.sm,
    borderRadius: 10,
  },

  switcherItemActive: {
    backgroundColor: "#EFF6FF",
  },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    borderRadius: 14,
    backgroundColor: "#FEE2E2",
    marginBottom: SPACING.md,
  },

  errorText: {
    marginLeft: SPACING.sm,
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.danger,
  },

  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    borderRadius: 14,
    backgroundColor: "#DCFCE7",
    marginBottom: SPACING.md,
  },

  successText: {
    marginLeft: SPACING.sm,
    fontSize: 13,
    fontWeight: "700",
    color: "#15803D",
  },

  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },

  statTile: {
    flexGrow: 1,
    flexBasis: "45%",
    minHeight: 120,
    padding: SPACING.lg,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  statTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  statLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  statValue: {
    marginTop: SPACING.md,
    fontSize: 30,
    fontWeight: "900",
    color: COLORS.text,
  },

  statSpinner: {
    marginTop: SPACING.md,
    alignSelf: "flex-start",
  },

  statHelper: {
    marginTop: 3,
    fontSize: 11,
    color: COLORS.textMuted,
  },

  card: {
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },

  cardSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  distList: {
    marginTop: SPACING.lg,
  },

  distRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
  },

  distStar: {
    flexDirection: "row",
    alignItems: "center",
    width: 36,
  },

  distStarText: {
    marginRight: 3,
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.textSecondary,
  },

  distBarBg: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    overflow: "hidden",
    marginHorizontal: SPACING.md,
  },

  distBar: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#F59E0B",
  },

  distCount: {
    width: 32,
    textAlign: "right",
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },

  reputationCard: {
    marginBottom: SPACING.lg,
    padding: SPACING.xl,
    borderRadius: 20,
    backgroundColor: "#0F172A",
  },

  reputationEyebrow: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.5)",
  },

  reputationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.md,
    gap: SPACING.lg,
  },

  reputationScore: {
    fontSize: 52,
    fontWeight: "900",
    color: COLORS.white,
  },

  reputationLabel: {
    marginTop: 6,
    fontSize: 11,
    color: "rgba(255,255,255,0.55)",
  },

  reputationNote: {
    marginTop: SPACING.lg,
    fontSize: 12,
    lineHeight: 19,
    color: "rgba(255,255,255,0.6)",
  },

  pillScroll: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },

  pillContent: {
    gap: SPACING.sm,
    paddingRight: SPACING.xl,
  },

  pill: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 999,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  pillSelected: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
  },

  privatePillSelected: {
    backgroundColor: "#D97706",
    borderColor: "#D97706",
  },

  pillText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },

  pillTextSelected: {
    color: COLORS.white,
  },

  filterRow: {
    marginBottom: SPACING.md,
  },

  filterLabel: {
    marginBottom: SPACING.sm,
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  pillContentSmall: {
    gap: SPACING.sm,
    paddingRight: SPACING.lg,
  },

  pillSmall: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  pillSmallText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },

  listLoader: {
    paddingVertical: SPACING.xxl,
    alignItems: "center",
  },

  empty: {
    alignItems: "center",
    paddingVertical: SPACING.xxl,
  },

  emptyTitle: {
    marginTop: SPACING.md,
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
  },

  emptyText: {
    marginTop: SPACING.sm,
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: SPACING.xl,
  },

  reviewCard: {
    marginTop: SPACING.md,
    padding: SPACING.lg,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  reviewHead: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  reviewAvatar: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: COLORS.text,
    alignItems: "center",
    justifyContent: "center",
  },

  reviewAvatarText: {
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.white,
  },

  reviewHeadInfo: {
    flex: 1,
    marginLeft: SPACING.md,
    marginRight: SPACING.sm,
  },

  reviewNameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },

  reviewName: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
    maxWidth: 150,
  },

  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "#DCFCE7",
  },

  verifiedBadgeText: {
    marginLeft: 3,
    fontSize: 9,
    fontWeight: "800",
    color: "#15803D",
  },

  reviewDate: {
    marginTop: 3,
    fontSize: 11,
    color: COLORS.textMuted,
  },

  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    borderRadius: 999,
  },

  statusBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },

  privateBadge: {
    alignSelf: "flex-start",
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#FEF3C7",
  },

  privateBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#B45309",
  },

  reviewStars: {
    marginTop: SPACING.md,
  },

  starRow: {
    flexDirection: "row",
    gap: 2,
  },

  reviewTitle: {
    marginTop: SPACING.sm,
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
  },

  reviewComment: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },

  moderationBox: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: 12,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },

  moderationLabel: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
    color: "#B45309",
  },

  moderationText: {
    marginTop: 4,
    fontSize: 12,
    color: "#92400E",
    lineHeight: 17,
  },

  responseBox: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  responseHead: {
    flexDirection: "row",
    alignItems: "center",
  },

  responseLabel: {
    marginLeft: 6,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
    color: COLORS.textSecondary,
  },

  responseDate: {
    marginLeft: "auto",
    fontSize: 10,
    color: COLORS.textMuted,
  },

  responseText: {
    marginTop: SPACING.sm,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textSecondary,
  },

  reviewActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },

  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: 9,
    borderRadius: 11,
    borderWidth: 1,
  },

  actionBtnText: {
    marginLeft: 5,
    fontSize: 12,
    fontWeight: "800",
  },

  actionDisabled: {
    opacity: 0.5,
  },

  actionPublish: {
    backgroundColor: "#DCFCE7",
    borderColor: "#BBF7D0",
  },

  actionPublishText: {
    color: "#15803D",
  },

  actionGhost: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },

  actionGhostText: {
    color: COLORS.textSecondary,
  },

  actionHide: {
    backgroundColor: "#FEF3C7",
    borderColor: "#FDE68A",
  },

  actionHideText: {
    color: "#B45309",
  },

  actionReject: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FECACA",
  },

  actionRejectText: {
    color: COLORS.danger,
  },

  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: SPACING.xl,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  paginationText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },

  paginationBtns: {
    flexDirection: "row",
    gap: 4,
  },

  pageBtn: {
    padding: SPACING.sm,
  },

  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: SPACING.lg,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    marginBottom: SPACING.lg,
  },

  infoText: {
    flex: 1,
    marginLeft: SPACING.md,
  },

  infoTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.text,
  },

  infoBody: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textSecondary,
  },

  /* respond modal */

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
  },

  modalCard: {
    width: "100%",
    maxHeight: "90%",
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    padding: SPACING.xl,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  modalTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.text,
  },

  modalSub: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  modalQuote: {
    marginTop: SPACING.lg,
    padding: SPACING.md,
    borderRadius: 12,
    backgroundColor: COLORS.background,
  },

  modalQuoteTitle: {
    marginTop: SPACING.sm,
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.text,
  },

  modalQuoteBody: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textSecondary,
  },

  modalInput: {
    marginTop: SPACING.md,
    minHeight: 120,
    maxHeight: 220,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: SPACING.md,
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },

  charCount: {
    marginTop: 6,
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: "right",
  },

  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },

  modalCancel: {
    height: 46,
    paddingHorizontal: SPACING.xl,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  modalCancelText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.textSecondary,
  },

  modalSave: {
    height: 46,
    paddingHorizontal: SPACING.xl,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  modalSaveDisabled: {
    opacity: 0.5,
  },

  modalSaveText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.white,
  },
});
