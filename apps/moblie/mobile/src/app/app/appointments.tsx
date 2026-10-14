import { Ionicons } from "@expo/vector-icons";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { router } from "expo-router";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

import {
  Booking,
  BookingMode,
  BookingStatus,
  EventConfig,
  ServiceConfig,
  getAppointmentConfig,
  getBillingStatus,
  getBookings,
  updateAppointmentConfig,
  updateBookingStatus,
} from "../../api/appointmentsApi";

import { COLORS } from "../../constants/colors";
import { SPACING } from "../../constants/spacing";

import { useCurrentBusiness } from "../../hooks/useCurrentBusiness";

/*
 * Mirrors app/dashboard/appointments on the web:
 * Bookings tab (status filter + confirm/complete/cancel)
 * and Settings tab (6-mode picker, toggles, services,
 * events). API paths match the audit map verbatim.
 */

type Tab = "bookings" | "settings";

type StatusFilter =
  | "upcoming"
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED";

const STATUS_FILTERS: {
  value: StatusFilter;
  label: string;
}[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const MODES: {
  value: BookingMode;
  label: string;
  icon: string;
  hint: string;
}[] = [
  {
    value: "APPOINTMENT",
    label: "Appointment",
    icon: "📅",
    hint: "Clinic, salon — service + time slot",
  },
  {
    value: "TABLE",
    label: "Table+Food",
    icon: "🍽️",
    hint: "Restaurant — table + party size + food",
  },
  {
    value: "ORDER",
    label: "Product Order",
    icon: "🛍️",
    hint: "Shopkeeper — product cart + pickup",
  },
  {
    value: "TOKEN",
    label: "Queue Token",
    icon: "🎫",
    hint: "Clinic, office — token number for today",
  },
  {
    value: "EVENT",
    label: "Event seats",
    icon: "🎪",
    hint: "Workshop, class — event + seats",
  },
  {
    value: "RENTAL",
    label: "Rental",
    icon: "🔑",
    hint: "Cars, equipment — item + date range",
  },
];

const STATUS_STYLE: Record<
  BookingStatus,
  { label: string; color: string; bg: string }
> = {
  PENDING: {
    label: "Pending",
    color: "#B45309",
    bg: "#FEF3C7",
  },
  CONFIRMED: {
    label: "Confirmed",
    color: "#1D4ED8",
    bg: "#DBEAFE",
  },
  COMPLETED: {
    label: "Completed",
    color: "#15803D",
    bg: "#DCFCE7",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "#64748B",
    bg: "#F1F5F9",
  },
};

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(
    36
  )}${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

function todayKey(): string {
  const d = new Date();
  const pad = (n: number) =>
    String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(
    d.getMonth() + 1
  )}-${pad(d.getDate())}`;
}

function formatDate(
  dateKey?: string | null
): string {
  if (!dateKey) return "";
  const [y, m, d] = dateKey
    .split("-")
    .map(Number);
  if (!y || !m || !d) return dateKey;
  return new Date(y, m - 1, d).toLocaleDateString(
    "en-IN",
    {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

function formatSlot(
  start?: string | null,
  end?: string | null
): string {
  if (!start || !end) return "";
  const fmt = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${String(m).padStart(
      2,
      "0"
    )} ${ampm}`;
  };
  return `${fmt(start)} – ${fmt(end)}`;
}

function modeLabel(mode: string): string {
  return (
    MODES.find((m) => m.value === mode)
      ?.label ?? mode
  );
}

function bookingSummary(b: Booking): string {
  switch (b.mode) {
    case "TABLE":
      return `Table for ${
        b.partySize ?? "?"
      } · ${formatDate(b.date)} · ${formatSlot(
        b.startTime,
        b.endTime
      )}${
        b.items?.length
          ? ` · Pre-order: ${b.items
              .map(
                (i) =>
                  `${i.name} ×${i.quantity}`
              )
              .join(", ")}`
          : ""
      }`;
    case "ORDER":
      return `Order · ${
        b.items
          ?.map(
            (i) =>
              `${i.name} ×${i.quantity}`
          )
          .join(", ") ?? ""
      }`;
    case "TOKEN":
      return `Token #${
        b.tokenNumber ?? "?"
      } · ${formatDate(b.date)}`;
    case "EVENT":
      return `${formatDate(b.date)} · ${
        b.partySize ?? 1
      } seat${(b.partySize ?? 1) > 1 ? "s" : ""}`;
    case "RENTAL":
      return `${formatDate(
        b.date
      )} → ${formatDate(b.endDate)}`;
    default:
      return `${formatDate(b.date)} · ${formatSlot(
        b.startTime,
        b.endTime
      )}`;
  }
}

export default function AppointmentsScreen() {
  const { businessId, business, isLoading: businessLoading } =
    useCurrentBusiness();

  const queryClient = useQueryClient();

  const [tab, setTab] =
    useState<Tab>("bookings");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("upcoming");

  /*
   * GET /appointments/businesses/:businessId?limit=100&status=&from=
   * — "upcoming" passes from=<today>; any other filter
   * passes a concrete status (web dashboard behaviour).
   */
  const bookingsQuery = useQuery({
    queryKey: [
      "appointments",
      "bookings",
      businessId,
      statusFilter,
    ],
    queryFn: () =>
      getBookings(businessId as string, {
        ...(statusFilter === "upcoming"
          ? { from: todayKey() }
          : { status: statusFilter }),
      }),
    enabled: Boolean(businessId),
  });

  /*
   * GET /appointments/businesses/:businessId/config
   */
  const configQuery = useQuery({
    queryKey: [
      "appointments",
      "config",
      businessId,
    ],
    queryFn: () =>
      getAppointmentConfig(
        businessId as string
      ),
    enabled: Boolean(businessId),
  });

  /*
   * GET /billing/status — Pro badge only. Never blocks
   * the screen when it fails.
   */
  const billingQuery = useQuery({
    queryKey: ["billing", "status"],
    queryFn: getBillingStatus,
    retry: false,
  });

  const planCode =
    billingQuery.data ?? null;

  const isPro =
    planCode !== null && planCode !== "FREE";

  /* ---------- settings form state ---------- */

  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] =
    useState<BookingMode>("APPOINTMENT");
  const [services, setServices] = useState<
    ServiceConfig[]
  >([]);
  const [events, setEvents] = useState<
    EventConfig[]
  >([]);
  const [slotMinutes, setSlotMinutes] =
    useState("30");
  const [advanceDays, setAdvanceDays] =
    useState("14");
  const [maxPartySize, setMaxPartySize] =
    useState("12");
  const [maxTokens, setMaxTokens] =
    useState("100");
  const [saveSuccess, setSaveSuccess] =
    useState("");

  /* service draft */
  const [draftName, setDraftName] =
    useState("");
  const [draftDuration, setDraftDuration] =
    useState("30");
  const [draftPrice, setDraftPrice] =
    useState("");
  const [draftStaffMobile, setDraftStaffMobile] =
    useState("");

  /* event draft */
  const [draftEventName, setDraftEventName] =
    useState("");
  const [draftEventDate, setDraftEventDate] =
    useState("");
  const [draftEventSeats, setDraftEventSeats] =
    useState("50");
  const [draftEventPrice, setDraftEventPrice] =
    useState("");

  useEffect(() => {
    const c = configQuery.data;
    if (!c) return;
    setEnabled(c.appointmentBookingEnabled ?? false);
    setMode(
      c.appointmentBookingMode ?? "APPOINTMENT"
    );
    setServices(c.appointmentServices ?? []);
    setEvents(c.appointmentEvents ?? []);
    setSlotMinutes(
      String(c.appointmentSlotMinutes ?? 30)
    );
    setAdvanceDays(
      String(c.appointmentAdvanceDays ?? 14)
    );
    setMaxPartySize(
      String(c.appointmentMaxPartySize ?? 12)
    );
    setMaxTokens(
      String(c.appointmentMaxTokensPerDay ?? 100)
    );
    setSaveSuccess("");
  }, [configQuery.data]);

  const bookings = bookingsQuery.data ?? [];

  const bookingsKey = [
    "appointments",
    "bookings",
    businessId,
    statusFilter,
  ];

  const bookingMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: BookingStatus;
    }) =>
      updateBookingStatus(
        businessId as string,
        id,
        status
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: bookingsKey,
      });
    },
    onError: (error) => {
      Alert.alert(
        "Update failed",
        error instanceof Error
          ? error.message
          : "Could not update the booking. Please try again."
      );
    },
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      updateAppointmentConfig(
        businessId as string,
        {
          appointmentBookingEnabled: enabled,
          appointmentBookingMode: mode,
          appointmentServices: services,
          appointmentEvents: events,
          appointmentSlotMinutes:
            parseInt(slotMinutes, 10) || 30,
          appointmentAdvanceDays:
            parseInt(advanceDays, 10) || 14,
          appointmentMaxPartySize:
            parseInt(maxPartySize, 10) || 12,
          appointmentMaxTokensPerDay:
            parseInt(maxTokens, 10) || 100,
        }
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [
          "appointments",
          "config",
          businessId,
        ],
      });
      setSaveSuccess(
        "Settings saved successfully."
      );
    },
    onError: (error) => {
      Alert.alert(
        "Save failed",
        error instanceof Error
          ? error.message
          : "Could not save settings. Please try again."
      );
    },
  });

  const serviceLabel =
    mode === "TABLE"
      ? "Menu items"
      : mode === "ORDER"
        ? "Products"
        : mode === "RENTAL"
          ? "Rental items"
          : mode === "TOKEN"
            ? "Counters / departments"
            : "Services";

  const needsSlots =
    mode === "APPOINTMENT" || mode === "TABLE";

  const needsServices = mode !== "EVENT";

  const showAdvanceDays =
    mode !== "ORDER" && mode !== "TOKEN";

  const confirmBookingAction = (
    booking: Booking,
    status: BookingStatus,
    title: string,
    message: string
  ) => {
    Alert.alert(title, message, [
      { text: "Back", style: "cancel" },
      {
        text: title,
        style:
          status === "CANCELLED"
            ? "destructive"
            : "default",
        onPress: () =>
          bookingMutation.mutate({
            id: booking.id,
            status,
          }),
      },
    ]);
  };

  const addService = () => {
    const name = draftName.trim();
    const duration = parseInt(draftDuration, 10);
    const price = draftPrice.trim()
      ? parseFloat(draftPrice)
      : null;
    const staffMobile = draftStaffMobile.trim();

    if (!name) {
      Alert.alert(
        "Missing name",
        "Give the service a name first."
      );
      return;
    }

    if (!duration || duration < 5 || duration > 480) {
      Alert.alert(
        "Invalid duration",
        "Duration must be 5–480 minutes."
      );
      return;
    }

    if (
      staffMobile &&
      !/^\+[1-9]\d{6,14}$/.test(staffMobile)
    ) {
      Alert.alert(
        "Invalid mobile",
        "Staff mobile must be in E.164 format, e.g. +919121657235."
      );
      return;
    }

    setServices((prev) => [
      ...prev,
      {
        id: newId("svc"),
        name,
        durationMinutes: duration,
        price:
          price !== null && !isNaN(price)
            ? price
            : null,
        staffMobile: staffMobile || null,
      },
    ]);
    setDraftName("");
    setDraftDuration("30");
    setDraftPrice("");
    setDraftStaffMobile("");
  };

  const addEvent = () => {
    const name = draftEventName.trim();
    const seats = parseInt(draftEventSeats, 10);
    const price = draftEventPrice.trim()
      ? parseFloat(draftEventPrice)
      : null;

    if (!name) {
      Alert.alert(
        "Missing name",
        "Give the event a name first."
      );
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(draftEventDate)) {
      Alert.alert(
        "Invalid date",
        "Use the YYYY-MM-DD format, e.g. 2026-11-15."
      );
      return;
    }

    if (!seats || seats < 1) {
      Alert.alert(
        "Invalid seats",
        "Total seats must be at least 1."
      );
      return;
    }

    setEvents((prev) => [
      ...prev,
      {
        id: newId("evt"),
        name,
        date: draftEventDate,
        totalSeats: seats,
        price:
          price !== null && !isNaN(price)
            ? price
            : null,
      },
    ]);
    setDraftEventName("");
    setDraftEventDate("");
    setDraftEventSeats("50");
    setDraftEventPrice("");
  };

  const configReady = useMemo(
    () => !configQuery.isLoading,
    [configQuery.isLoading]
  );

  /* ---------- loading / empty-business states ---------- */

  if (businessLoading) {
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

  if (!businessId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Ionicons
            name="calendar-outline"
            size={40}
            color={COLORS.textMuted}
          />
          <Text style={styles.centerTitle}>
            No business selected
          </Text>
          <Text style={styles.centerText}>
            Create a business to manage bookings.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
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
            <View>
              <View style={styles.titleRow}>
                <Text style={styles.title}>
                  Bookings
                </Text>
                {isPro ? (
                  <View style={styles.proBadge}>
                    <Text
                      style={styles.proBadgeText}
                    >
                      PRO
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.subtitle}>
                {business?.name ??
                  "Appointments, tables, orders, tokens, events, rentals."}
              </Text>
            </View>
          </View>
        </View>

        {/* TABS */}
        <View style={styles.tabRow}>
          {(["bookings", "settings"] as Tab[]).map(
            (key) => {
              const selected = tab === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => setTab(key)}
                  style={[
                    styles.tab,
                    selected && styles.tabSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      selected &&
                        styles.tabTextSelected,
                    ]}
                  >
                    {key === "bookings"
                      ? "Bookings"
                      : "Settings"}
                  </Text>
                </Pressable>
              );
            }
          )}
        </View>

        {tab === "bookings" ? (
          <>
            {/* STATUS FILTER */}
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
              {STATUS_FILTERS.map((f) => {
                const selected =
                  statusFilter === f.value;
                return (
                  <Pressable
                    key={f.value}
                    onPress={() =>
                      setStatusFilter(f.value)
                    }
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
                      {f.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {bookingsQuery.isLoading ? (
              <View style={styles.center}>
                <ActivityIndicator
                  size="large"
                  color={COLORS.primary}
                />
                <Text style={styles.centerText}>
                  Loading bookings…
                </Text>
              </View>
            ) : bookingsQuery.isError ? (
              <View style={styles.center}>
                <Text style={styles.centerTitle}>
                  Couldn't load bookings
                </Text>
                <Text style={styles.centerText}>
                  Check your connection and try
                  again.
                </Text>
                <Pressable
                  onPress={() =>
                    void bookingsQuery.refetch()
                  }
                  style={styles.retryButton}
                >
                  <Text
                    style={styles.retryText}
                  >
                    Retry
                  </Text>
                </Pressable>
              </View>
            ) : bookings.length === 0 ? (
              <View style={styles.center}>
                <Ionicons
                  name="calendar-outline"
                  size={40}
                  color={COLORS.textMuted}
                />
                <Text style={styles.centerTitle}>
                  No bookings yet
                </Text>
                <Text style={styles.centerText}>
                  They'll appear here when
                  customers book through your QR.
                </Text>
              </View>
            ) : (
              bookings.map((b) => (
                <BookingCard
                  key={b.id}
                  booking={b}
                  acting={
                    bookingMutation.isPending
                  }
                  onConfirm={() =>
                    confirmBookingAction(
                      b,
                      "CONFIRMED",
                      "Confirm",
                      `Confirm this ${modeLabel(
                        b.mode
                      ).toLowerCase()} booking for ${b.customerName}?`
                    )
                  }
                  onComplete={() =>
                    confirmBookingAction(
                      b,
                      "COMPLETED",
                      "Mark completed",
                      `Mark this booking for ${b.customerName} as completed?`
                    )
                  }
                  onCancel={() =>
                    confirmBookingAction(
                      b,
                      "CANCELLED",
                      "Cancel",
                      `Cancel this booking for ${b.customerName}?`
                    )
                  }
                />
              ))
            )}
          </>
        ) : (
          <>
            {!configReady ? (
              <View style={styles.center}>
                <ActivityIndicator
                  size="large"
                  color={COLORS.primary}
                />
                <Text style={styles.centerText}>
                  Loading settings…
                </Text>
              </View>
            ) : (
              <>
                {saveSuccess ? (
                  <View
                    style={styles.successBanner}
                  >
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={18}
                      color="#15803D"
                    />
                    <Text
                      style={styles.successText}
                    >
                      {saveSuccess}
                    </Text>
                  </View>
                ) : null}

                {/* MODE PICKER */}
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>
                    Booking mode
                  </Text>
                  <Text
                    style={styles.cardSubtitle}
                  >
                    One engine, six business
                    types. Pick what fits you.
                  </Text>

                  <View style={styles.modeGrid}>
                    {MODES.map((m) => {
                      const selected =
                        mode === m.value;
                      return (
                        <Pressable
                          key={m.value}
                          onPress={() =>
                            setMode(m.value)
                          }
                          style={[
                            styles.modeCard,
                            selected &&
                              styles.modeCardSelected,
                          ]}
                        >
                          <Text
                            style={styles.modeIcon}
                          >
                            {m.icon}
                          </Text>
                          <Text
                            style={[
                              styles.modeLabel,
                              selected &&
                                styles.modeLabelSelected,
                            ]}
                          >
                            {m.label}
                          </Text>
                          <Text
                            style={[
                              styles.modeHint,
                              selected &&
                                styles.modeHintSelected,
                            ]}
                          >
                            {m.hint}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* ENABLE TOGGLE */}
                  <View
                    style={styles.enableRow}
                  >
                    <View
                      style={styles.enableText}
                    >
                      <Text
                        style={styles.enableTitle}
                      >
                        Enable booking
                      </Text>
                      <Text
                        style={styles.enableSub}
                      >
                        Scanners see the booking
                        button on your QR page.
                      </Text>
                    </View>
                    <Switch
                      value={enabled}
                      onValueChange={setEnabled}
                      trackColor={{
                        false: "#E2E8F0",
                        true: COLORS.primary,
                      }}
                    />
                  </View>

                  {/* NUMERIC INPUTS */}
                  <View
                    style={styles.inputGrid}
                  >
                    {needsSlots ? (
                      <View
                        style={styles.inputCell}
                      >
                        <Input
                          label="Slot length (min)"
                          value={slotMinutes}
                          onChangeText={
                            setSlotMinutes
                          }
                          keyboardType="numeric"
                        />
                      </View>
                    ) : null}
                    {showAdvanceDays ? (
                      <View
                        style={styles.inputCell}
                      >
                        <Input
                          label="Bookable days ahead"
                          value={advanceDays}
                          onChangeText={
                            setAdvanceDays
                          }
                          keyboardType="numeric"
                        />
                      </View>
                    ) : null}
                    {mode === "TABLE" ? (
                      <View
                        style={styles.inputCell}
                      >
                        <Input
                          label="Max party size"
                          value={maxPartySize}
                          onChangeText={
                            setMaxPartySize
                          }
                          keyboardType="numeric"
                        />
                      </View>
                    ) : null}
                    {mode === "TOKEN" ? (
                      <View
                        style={styles.inputCell}
                      >
                        <Input
                          label="Max tokens / day"
                          value={maxTokens}
                          onChangeText={
                            setMaxTokens
                          }
                          keyboardType="numeric"
                        />
                      </View>
                    ) : null}
                  </View>
                </View>

                {/* SERVICES */}
                {needsServices ? (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>
                      {serviceLabel}
                    </Text>
                    <Text
                      style={styles.cardSubtitle}
                    >
                      {mode === "TABLE"
                        ? "Dishes scanners can pre-order with their table."
                        : mode === "ORDER"
                          ? "Products scanners can add to their order."
                          : mode === "RENTAL"
                            ? "Items for rent (price = per day)."
                            : mode === "TOKEN"
                              ? "Each counter issues its own token queue."
                              : "Services scanners can book."}
                    </Text>

                    {services.map((s) => (
                      <View
                        key={s.id}
                        style={styles.listRow}
                      >
                        <View
                          style={styles.listInfo}
                        >
                          <Text
                            style={
                              styles.listName
                            }
                            numberOfLines={1}
                          >
                            {s.name}
                          </Text>
                          <Text
                            style={
                              styles.listMeta
                            }
                          >
                            {s.durationMinutes}{" "}
                            min
                            {typeof s.price ===
                              "number" &&
                            s.price > 0
                              ? ` · ₹${s.price}${
                                  mode === "RENTAL"
                                    ? "/day"
                                    : ""
                                }`
                              : ""}
                            {s.staffMobile
                              ? ` · ${s.staffMobile}`
                              : ""}
                          </Text>
                        </View>
                        <Pressable
                          onPress={() =>
                            setServices((prev) =>
                              prev.filter(
                                (x) =>
                                  x.id !== s.id
                              )
                            )
                          }
                          hitSlop={10}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={18}
                            color={COLORS.danger}
                          />
                        </Pressable>
                      </View>
                    ))}

                    <View
                      style={styles.addBox}
                    >
                      <Input
                        label="Name"
                        value={draftName}
                        onChangeText={
                          setDraftName
                        }
                        placeholder="e.g. Haircut"
                        maxLength={80}
                      />
                      <View
                        style={
                          styles.addRow
                        }
                      >
                        <View
                          style={
                            styles.addCell
                          }
                        >
                          <Input
                            label="Minutes"
                            value={
                              draftDuration
                            }
                            onChangeText={
                              setDraftDuration
                            }
                            keyboardType="numeric"
                          />
                        </View>
                        <View
                          style={
                            styles.addCell
                          }
                        >
                          <Input
                            label="₹ (optional)"
                            value={
                              draftPrice
                            }
                            onChangeText={
                              setDraftPrice
                            }
                            keyboardType="numeric"
                          />
                        </View>
                      </View>
                      <Input
                        label="Staff WhatsApp (optional)"
                        value={draftStaffMobile}
                        onChangeText={
                          setDraftStaffMobile
                        }
                        placeholder="+919121657235"
                        keyboardType="phone-pad"
                      />
                      <Pressable
                        onPress={addService}
                        style={
                          styles.addButton
                        }
                      >
                        <Ionicons
                          name="add-outline"
                          size={16}
                          color={COLORS.white}
                        />
                        <Text
                          style={
                            styles.addButtonText
                          }
                        >
                          Add{" "}
                          {serviceLabel ===
                          "Services"
                            ? "service"
                            : "item"}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : null}

                {/* EVENTS */}
                {mode === "EVENT" ? (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>
                      Events
                    </Text>
                    <Text
                      style={styles.cardSubtitle}
                    >
                      Workshops, classes,
                      shows — scanners pick an
                      event and seats.
                    </Text>

                    {events.map((e) => (
                      <View
                        key={e.id}
                        style={styles.listRow}
                      >
                        <View
                          style={styles.listInfo}
                        >
                          <Text
                            style={
                              styles.listName
                            }
                            numberOfLines={1}
                          >
                            {e.name}
                          </Text>
                          <Text
                            style={
                              styles.listMeta
                            }
                          >
                            {formatDate(e.date)}{" "}
                            · {e.totalSeats}{" "}
                            seats
                            {typeof e.price ===
                              "number" &&
                            e.price > 0
                              ? ` · ₹${e.price}`
                              : ""}
                          </Text>
                        </View>
                        <Pressable
                          onPress={() =>
                            setEvents((prev) =>
                              prev.filter(
                                (x) =>
                                  x.id !== e.id
                              )
                            )
                          }
                          hitSlop={10}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={18}
                            color={COLORS.danger}
                          />
                        </Pressable>
                      </View>
                    ))}

                    <View
                      style={styles.addBox}
                    >
                      <Input
                        label="Event name"
                        value={draftEventName}
                        onChangeText={
                          setDraftEventName
                        }
                        placeholder="e.g. Yoga workshop"
                        maxLength={80}
                      />
                      <Input
                        label="Date (YYYY-MM-DD)"
                        value={draftEventDate}
                        onChangeText={
                          setDraftEventDate
                        }
                        placeholder="2026-11-15"
                        maxLength={10}
                      />
                      <View
                        style={
                          styles.addRow
                        }
                      >
                        <View
                          style={
                            styles.addCell
                          }
                        >
                          <Input
                            label="Seats"
                            value={
                              draftEventSeats
                            }
                            onChangeText={
                              setDraftEventSeats
                            }
                            keyboardType="numeric"
                          />
                        </View>
                        <View
                          style={
                            styles.addCell
                          }
                        >
                          <Input
                            label="₹ (optional)"
                            value={
                              draftEventPrice
                            }
                            onChangeText={
                              setDraftEventPrice
                            }
                            keyboardType="numeric"
                          />
                        </View>
                      </View>
                      <Pressable
                        onPress={addEvent}
                        style={
                          styles.addButton
                        }
                      >
                        <Ionicons
                          name="add-outline"
                          size={16}
                          color={COLORS.white}
                        />
                        <Text
                          style={
                            styles.addButtonText
                          }
                        >
                          Add event
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : null}

                <Button
                  title={
                    saveMutation.isPending
                      ? "Saving…"
                      : "Save settings"
                  }
                  onPress={() =>
                    saveMutation.mutate()
                  }
                  loading={saveMutation.isPending}
                />
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================================================= */
/* BOOKING CARD                                      */
/* ================================================= */

function BookingCard({
  booking,
  acting,
  onConfirm,
  onComplete,
  onCancel,
}: {
  booking: Booking;
  acting: boolean;
  onConfirm: () => void;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const meta = STATUS_STYLE[booking.status];

  const title =
    booking.mode === "TOKEN"
      ? `Token #${booking.tokenNumber ?? "?"}`
      : booking.serviceName;

  return (
    <View style={styles.card}>
      <View style={styles.bookingTop}>
        <View style={styles.bookingTitleWrap}>
          <Text
            style={styles.bookingTitle}
            numberOfLines={2}
          >
            {title}
          </Text>
          <View style={styles.badgeRow}>
            <View style={styles.modeBadge}>
              <Text
                style={styles.modeBadgeText}
              >
                {modeLabel(booking.mode)}
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
                  styles.statusText,
                  { color: meta.color },
                ]}
              >
                {meta.label}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <Text style={styles.bookingSummary}>
        {bookingSummary(booking)}
      </Text>

      <Text style={styles.bookingCustomer}>
        {booking.customerName} ·{" "}
        {booking.customerPhone}
      </Text>

      {booking.note ? (
        <Text style={styles.bookingNote}>
          “{booking.note}”
        </Text>
      ) : null}

      {(booking.status === "PENDING" ||
        booking.status === "CONFIRMED") && (
        <View style={styles.actionRow}>
          {booking.status === "PENDING" ? (
            <Pressable
              onPress={onConfirm}
              disabled={acting}
              style={[
                styles.actionPrimary,
                acting && styles.actionDisabled,
              ]}
            >
              {acting ? (
                <ActivityIndicator
                  size="small"
                  color={COLORS.white}
                />
              ) : (
                <Text
                  style={
                    styles.actionPrimaryText
                  }
                >
                  Confirm
                </Text>
              )}
            </Pressable>
          ) : (
            <Pressable
              onPress={onComplete}
              disabled={acting}
              style={[
                styles.actionSuccess,
                acting && styles.actionDisabled,
              ]}
            >
              {acting ? (
                <ActivityIndicator
                  size="small"
                  color={COLORS.white}
                />
              ) : (
                <Text
                  style={
                    styles.actionPrimaryText
                  }
                >
                  Mark completed
                </Text>
              )}
            </Pressable>
          )}
          <Pressable
            onPress={onCancel}
            disabled={acting}
            style={[
              styles.actionGhost,
              acting && styles.actionDisabled,
            ]}
          >
            <Text style={styles.actionGhostText}>
              Cancel
            </Text>
          </Pressable>
        </View>
      )}
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

  retryButton: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },

  retryText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.white,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.lg,
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
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

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  title: {
    fontSize: 26,
    fontWeight: "900",
    color: COLORS.text,
  },

  subtitle: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  proBadge: {
    marginLeft: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#FEF3C7",
  },

  proBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
    color: "#B45309",
  },

  tabRow: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },

  tab: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  tabSelected: {
    backgroundColor: COLORS.primary,
  },

  tabText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },

  tabTextSelected: {
    color: COLORS.white,
  },

  pillScroll: {
    marginBottom: SPACING.lg,
  },

  pillContent: {
    gap: SPACING.sm,
    paddingRight: SPACING.xl,
  },

  pill: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  pillSelected: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
  },

  pillText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },

  pillTextSelected: {
    color: COLORS.white,
  },

  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    borderRadius: 14,
    backgroundColor: "#DCFCE7",
    marginBottom: SPACING.lg,
  },

  successText: {
    marginLeft: SPACING.sm,
    fontSize: 13,
    fontWeight: "700",
    color: "#15803D",
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
    lineHeight: 18,
  },

  /* booking cards */

  bookingTop: {
    marginBottom: SPACING.sm,
  },

  bookingTitleWrap: {
    flex: 1,
  },

  bookingTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },

  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },

  modeBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
  },

  modeBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: COLORS.textSecondary,
    textTransform: "uppercase",
  },

  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 999,
  },

  statusText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  bookingSummary: {
    marginTop: SPACING.xs,
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },

  bookingCustomer: {
    marginTop: SPACING.sm,
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
  },

  bookingNote: {
    marginTop: 4,
    fontSize: 12,
    fontStyle: "italic",
    color: COLORS.textMuted,
    lineHeight: 18,
  },

  actionRow: {
    flexDirection: "row",
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },

  actionPrimary: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  actionPrimaryText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.white,
  },

  actionSuccess: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.success,
    alignItems: "center",
    justifyContent: "center",
  },

  actionGhost: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },

  actionGhostText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.textSecondary,
  },

  actionDisabled: {
    opacity: 0.5,
  },

  /* settings: mode grid */

  modeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },

  modeCard: {
    flexGrow: 1,
    flexBasis: "47%",
    padding: SPACING.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },

  modeCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "#EFF6FF",
  },

  modeIcon: {
    fontSize: 24,
  },

  modeLabel: {
    marginTop: SPACING.sm,
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.text,
  },

  modeLabelSelected: {
    color: COLORS.primary,
  },

  modeHint: {
    marginTop: 3,
    fontSize: 10,
    color: COLORS.textMuted,
    lineHeight: 14,
  },

  modeHintSelected: {
    color: COLORS.textSecondary,
  },

  enableRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: SPACING.xl,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  enableText: {
    flex: 1,
    marginRight: SPACING.md,
  },

  enableTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
  },

  enableSub: {
    marginTop: 3,
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
  },

  inputGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },

  inputCell: {
    flexGrow: 1,
    flexBasis: "47%",
  },

  /* settings: lists */

  listRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: SPACING.sm,
    padding: SPACING.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },

  listInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },

  listName: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.text,
  },

  listMeta: {
    marginTop: 3,
    fontSize: 11,
    color: COLORS.textSecondary,
  },

  addBox: {
    marginTop: SPACING.lg,
    padding: SPACING.md,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: COLORS.border,
  },

  addRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },

  addCell: {
    flex: 1,
  },

  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.text,
  },

  addButtonText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.white,
  },
});
