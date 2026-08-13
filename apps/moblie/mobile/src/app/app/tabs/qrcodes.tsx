import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

import { COLORS } from "../../../constants/colors";
import { SPACING } from "../../../constants/spacing";

type QRType = "DYNAMIC" | "STATIC";

type QRCodeItem = {
  id: string;
  name: string;
  destination: string;
  type: QRType;
  scans: number;
  active: boolean;
  createdAt: string;
};

const INITIAL_QR_CODES: QRCodeItem[] = [
  {
    id: "1",
    name: "Restaurant Menu",
    destination: "https://tapqr.app/menu",
    type: "DYNAMIC",
    scans: 428,
    active: true,
    createdAt: "Today",
  },
  {
    id: "2",
    name: "Google Reviews",
    destination: "https://google.com/reviews",
    type: "DYNAMIC",
    scans: 312,
    active: true,
    createdAt: "Yesterday",
  },
  {
    id: "3",
    name: "Instagram",
    destination: "https://instagram.com/tapqr",
    type: "STATIC",
    scans: 184,
    active: true,
    createdAt: "3 days ago",
  },
  {
    id: "4",
    name: "Business Website",
    destination: "https://tapqr.app",
    type: "DYNAMIC",
    scans: 156,
    active: false,
    createdAt: "1 week ago",
  },
  {
    id: "5",
    name: "WhatsApp",
    destination: "https://wa.me/919999999999",
    type: "STATIC",
    scans: 98,
    active: true,
    createdAt: "2 weeks ago",
  },
];

type Filter = "ALL" | "DYNAMIC" | "STATIC" | "ACTIVE";

export default function QRCodesScreen() {
  const [qrCodes, setQrCodes] =
    useState<QRCodeItem[]>(INITIAL_QR_CODES);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");

  const filteredQRs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return qrCodes.filter((qr) => {
      const matchesSearch =
        !query ||
        qr.name.toLowerCase().includes(query) ||
        qr.destination.toLowerCase().includes(query);

      let matchesFilter = true;

      if (filter === "DYNAMIC") {
        matchesFilter = qr.type === "DYNAMIC";
      }

      if (filter === "STATIC") {
        matchesFilter = qr.type === "STATIC";
      }

      if (filter === "ACTIVE") {
        matchesFilter = qr.active;
      }

      return matchesSearch && matchesFilter;
    });
  }, [qrCodes, search, filter]);

  const activeCount = qrCodes.filter(
    (qr) => qr.active
  ).length;

  const totalScans = qrCodes.reduce(
    (total, qr) => total + qr.scans,
    0
  );

  const handleCreate = () => {
    router.push("/app/create-qr");
  };

  const handleEdit = (qr: QRCodeItem) => {
    router.push({
      pathname: "/app/edit-qr",
      params: {
        id: qr.id,
        name: qr.name,
        destination: qr.destination,
        type: qr.type,
        destinationType: "WEBSITE",
      },
    });
  };

  const handleView = (qr: QRCodeItem) => {
    router.push({
      pathname: "/app/qr-details",
      params: {
        id: qr.id,
        name: qr.name,
        destination: qr.destination,
        type: qr.type,
        scans: qr.scans.toString(),
        active: qr.active ? "true" : "false",
      },
    });
  };

  const handleToggleActive = (id: string) => {
    setQrCodes((current) =>
      current.map((qr) =>
        qr.id === id
          ? {
              ...qr,
              active: !qr.active,
            }
          : qr
      )
    );
  };

  const handleDelete = (qr: QRCodeItem) => {
    Alert.alert(
      "Delete QR Code",
      `Are you sure you want to delete "${qr.name}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setQrCodes((current) =>
              current.filter(
                (item) => item.id !== qr.id
              )
            );
          },
        },
      ]
    );
  };

  const handleShare = (qr: QRCodeItem) => {
    Alert.alert(
      "Share QR",
      `Sharing "${qr.name}" will be connected to the native share flow.`,
      [
        {
          text: "OK",
        },
      ]
    );
  };

  const handleDownload = (qr: QRCodeItem) => {
    Alert.alert(
      "Download QR",
      `"${qr.name}" will be saved to your device when the QR export flow is connected.`,
      [
        {
          text: "OK",
        },
      ]
    );
  };

  const renderHeader = () => (
    <>
      {/* Header */}

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>
            My QR Codes
          </Text>

          <Text style={styles.subtitle}>
            Create and manage all your QR codes.
          </Text>
        </View>

        <Pressable
          onPress={handleCreate}
          style={({ pressed }) => [
            styles.headerAddButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="add"
            size={25}
            color={COLORS.white}
          />
        </Pressable>
      </View>

      {/* Overview */}

      <View style={styles.overview}>
        <View style={styles.overviewItem}>
          <Text style={styles.overviewValue}>
            {qrCodes.length}
          </Text>

          <Text style={styles.overviewLabel}>
            Total QR
          </Text>
        </View>

        <View style={styles.overviewDivider} />

        <View style={styles.overviewItem}>
          <Text style={styles.overviewValue}>
            {activeCount}
          </Text>

          <Text style={styles.overviewLabel}>
            Active
          </Text>
        </View>

        <View style={styles.overviewDivider} />

        <View style={styles.overviewItem}>
          <Text style={styles.overviewValue}>
            {totalScans.toLocaleString()}
          </Text>

          <Text style={styles.overviewLabel}>
            Scans
          </Text>
        </View>
      </View>

      {/* Search */}

      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={20}
          color={COLORS.textMuted}
        />

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search QR codes..."
          placeholderTextColor={COLORS.textMuted}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {search.length > 0 && (
          <Pressable
            onPress={() => setSearch("")}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={COLORS.textMuted}
            />
          </Pressable>
        )}
      </View>

      {/* Filters */}

      <View style={styles.filters}>
        <FilterButton
          label="All"
          active={filter === "ALL"}
          onPress={() => setFilter("ALL")}
        />

        <FilterButton
          label="Dynamic"
          active={filter === "DYNAMIC"}
          onPress={() => setFilter("DYNAMIC")}
        />

        <FilterButton
          label="Static"
          active={filter === "STATIC"}
          onPress={() => setFilter("STATIC")}
        />

        <FilterButton
          label="Active"
          active={filter === "ACTIVE"}
          onPress={() => setFilter("ACTIVE")}
        />
      </View>

      {/* Section */}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Your QR Codes
        </Text>

        <Text style={styles.resultCount}>
          {filteredQRs.length} results
        </Text>
      </View>
    </>
  );

  const renderItem = ({
    item,
  }: {
    item: QRCodeItem;
  }) => (
    <QRCodeCard
      qr={item}
      onPress={() => handleView(item)}
      onEdit={() => handleEdit(item)}
      onShare={() => handleShare(item)}
      onDownload={() => handleDownload(item)}
      onDelete={() => handleDelete(item)}
      onToggle={() =>
        handleToggleActive(item.id)
      }
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredQRs}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <EmptyState
            search={search}
            onCreate={handleCreate}
          />
        }
        contentContainerStyle={[
          styles.listContent,
          filteredQRs.length === 0 &&
            styles.emptyList,
        ]}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Create Button */}

      <Pressable
        onPress={handleCreate}
        style={({ pressed }) => [
          styles.fab,
          pressed && styles.fabPressed,
        ]}
      >
        <Ionicons
          name="add"
          size={25}
          color={COLORS.white}
        />

        <Text style={styles.fabText}>
          Create QR
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

function FilterButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterButton,
        active && styles.filterButtonActive,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.filterText,
          active && styles.filterTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function QRCodeCard({
  qr,
  onPress,
  onEdit,
  onShare,
  onDownload,
  onDelete,
  onToggle,
}: {
  qr: QRCodeItem;
  onPress: () => void;
  onEdit: () => void;
  onShare: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.qrCard,
        pressed && styles.cardPressed,
      ]}
    >
      {/* Top */}

      <View style={styles.cardTop}>
        <View style={styles.qrPreview}>
          <QRCode
            value={qr.destination}
            size={72}
            color="#111827"
            backgroundColor="#FFFFFF"
          />
        </View>

        <View style={styles.qrInfo}>
          <View style={styles.nameRow}>
            <Text
              style={styles.qrName}
              numberOfLines={1}
            >
              {qr.name}
            </Text>

            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: qr.active
                    ? "#16A34A"
                    : "#9CA3AF",
                },
              ]}
            />
          </View>

          <Text
            style={styles.destination}
            numberOfLines={2}
          >
            {qr.destination}
          </Text>

          <View style={styles.badges}>
            <View
              style={[
                styles.typeBadge,
                qr.type === "DYNAMIC" &&
                  styles.dynamicBadge,
              ]}
            >
              <Text
                style={[
                  styles.typeText,
                  qr.type === "DYNAMIC" &&
                    styles.dynamicText,
                ]}
              >
                {qr.type === "DYNAMIC"
                  ? "Dynamic"
                  : "Static"}
              </Text>
            </View>

            <View
              style={[
                styles.activeBadge,
                !qr.active &&
                  styles.inactiveBadge,
              ]}
            >
              <Text
                style={[
                  styles.activeText,
                  !qr.active &&
                    styles.inactiveText,
                ]}
              >
                {qr.active
                  ? "Active"
                  : "Paused"}
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          onPress={onPress}
          hitSlop={10}
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={COLORS.textMuted}
          />
        </Pressable>
      </View>

      {/* Stats */}

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Ionicons
            name="scan-outline"
            size={16}
            color={COLORS.primary}
          />

          <Text style={styles.statValue}>
            {qr.scans.toLocaleString()}
          </Text>

          <Text style={styles.statLabel}>
            scans
          </Text>
        </View>

        <View style={styles.stat}>
          <Ionicons
            name="time-outline"
            size={16}
            color={COLORS.textMuted}
          />

          <Text style={styles.statLabel}>
            {qr.createdAt}
          </Text>
        </View>
      </View>

      {/* Actions */}

      <View style={styles.actions}>
        <ActionButton
          icon="create-outline"
          label="Edit"
          onPress={onEdit}
        />

        <ActionButton
          icon="share-social-outline"
          label="Share"
          onPress={onShare}
        />

        <ActionButton
          icon="download-outline"
          label="Save"
          onPress={onDownload}
        />

        <ActionButton
          icon={
            qr.active
              ? "pause-outline"
              : "play-outline"
          }
          label={qr.active ? "Pause" : "Activate"}
          onPress={onToggle}
        />

        <Pressable
          onPress={onDelete}
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="trash-outline"
            size={17}
            color="#DC2626"
          />
        </Pressable>
      </View>
    </Pressable>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        pressed && styles.pressed,
      ]}
    >
      <Ionicons
        name={icon}
        size={17}
        color={COLORS.textSecondary}
      />

      <Text style={styles.actionText}>
        {label}
      </Text>
    </Pressable>
  );
}

function EmptyState({
  search,
  onCreate,
}: {
  search: string;
  onCreate: () => void;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons
          name={
            search
              ? "search-outline"
              : "qr-code-outline"
          }
          size={34}
          color={COLORS.primary}
        />
      </View>

      <Text style={styles.emptyTitle}>
        {search
          ? "No QR codes found"
          : "Create your first QR code"}
      </Text>

      <Text style={styles.emptyText}>
        {search
          ? "Try a different search term or change your filter."
          : "Create a QR code and start sharing your business with customers."}
      </Text>

      {!search && (
        <Pressable
          onPress={onCreate}
          style={({ pressed }) => [
            styles.emptyButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="add"
            size={19}
            color={COLORS.white}
          />

          <Text style={styles.emptyButtonText}>
            Create QR Code
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  listContent: {
    padding: SPACING.xl,
    paddingBottom: 120,
  },

  emptyList: {
    flexGrow: 1,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.xl,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.text,
  },

  subtitle: {
    marginTop: 5,
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  headerAddButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  overview: {
    minHeight: 92,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: SPACING.lg,
  },

  overviewItem: {
    flex: 1,
    alignItems: "center",
  },

  overviewValue: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
  },

  overviewLabel: {
    marginTop: 4,
    fontSize: 11,
    color: COLORS.textSecondary,
  },

  overviewDivider: {
    width: 1,
    height: 42,
    backgroundColor: COLORS.border,
  },

  searchContainer: {
    height: 50,
    borderRadius: 15,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
  },

  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: 14,
    color: COLORS.text,
  },

  filters: {
    flexDirection: "row",
    gap: 8,
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },

  filterButton: {
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  filterText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },

  filterTextActive: {
    color: COLORS.white,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
  },

  resultCount: {
    fontSize: 12,
    color: COLORS.textMuted,
  },

  qrCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },

  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.995 }],
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  qrPreview: {
    width: 88,
    height: 88,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  qrInfo: {
    flex: 1,
    marginLeft: SPACING.md,
    marginRight: SPACING.sm,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  qrName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 6,
  },

  destination: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.textSecondary,
  },

  badges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },

  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: "#F3F4F6",
  },

  dynamicBadge: {
    backgroundColor: "#EEF2FF",
  },

  typeText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textSecondary,
  },

  dynamicText: {
    color: COLORS.primary,
  },

  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: "#DCFCE7",
  },

  inactiveBadge: {
    backgroundColor: "#F3F4F6",
  },

  activeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#15803D",
  },

  inactiveText: {
    color: COLORS.textMuted,
  },

  statsRow: {
    minHeight: 42,
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },

  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  statValue: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.text,
  },

  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  actions: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  actionButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 4,
  },

  actionText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },

  deleteButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
  },

  fab: {
    position: "absolute",
    right: 22,
    bottom: 22,
    height: 54,
    paddingHorizontal: 19,
    borderRadius: 27,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    elevation: 5,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },

  fabText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "800",
  },

  fabPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },

  emptyState: {
    flex: 1,
    minHeight: 420,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.xl,
  },

  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    marginTop: SPACING.lg,
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
  },

  emptyText: {
    marginTop: SPACING.sm,
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textSecondary,
    textAlign: "center",
  },

  emptyButton: {
    marginTop: SPACING.xl,
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  emptyButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "800",
  },

  pressed: {
    opacity: 0.75,
  },
});