import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { COLORS } from "../../../constants/colors";
import { SPACING } from "../../../constants/spacing";

type QRType = "STATIC" | "DYNAMIC";
type QRStatus = "ACTIVE" | "PAUSED";

type QRCodeItem = {
  id: string;
  name: string;
  type: QRType;
  status: QRStatus;
  scans: number;
  destination: string;
  destinationType: string;
  createdAt: string;
};

type Filter =
  | "ALL"
  | "ACTIVE"
  | "PAUSED"
  | "DYNAMIC"
  | "STATIC";

const STORAGE_KEY = "@tapqr_qr_codes";

export default function QRCodesScreen() {
  const [qrCodes, setQrCodes] = useState<QRCodeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");

  /*
   * LOAD QR CODES
   */
  const loadQRCodes = useCallback(async () => {
    try {
      const stored =
        await AsyncStorage.getItem(STORAGE_KEY);

      if (!stored) {
        setQrCodes([]);
        return;
      }

      const parsed = JSON.parse(stored);

      if (Array.isArray(parsed)) {
        setQrCodes(parsed);
      } else {
        setQrCodes([]);
      }
    } catch (error) {
      console.error(
        "Failed to load QR codes:",
        error
      );

      setQrCodes([]);

      Alert.alert(
        "Error",
        "Could not load your QR codes."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /*
   * INITIAL LOAD
   */
  useEffect(() => {
    loadQRCodes();
  }, [loadQRCodes]);

  /*
   * REFRESH
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadQRCodes();
  };

  /*
   * FILTER + SEARCH
   */
  const filteredQRCodes = useMemo(() => {
    const query = search.trim().toLowerCase();

    return qrCodes.filter((qr) => {
      const matchesSearch =
        !query ||
        qr.name.toLowerCase().includes(query) ||
        qr.destination
          .toLowerCase()
          .includes(query) ||
        qr.destinationType
          .toLowerCase()
          .includes(query);

      let matchesFilter = true;

      switch (filter) {
        case "ACTIVE":
          matchesFilter = qr.status === "ACTIVE";
          break;

        case "PAUSED":
          matchesFilter = qr.status === "PAUSED";
          break;

        case "DYNAMIC":
          matchesFilter = qr.type === "DYNAMIC";
          break;

        case "STATIC":
          matchesFilter = qr.type === "STATIC";
          break;

        case "ALL":
        default:
          matchesFilter = true;
          break;
      }

      return matchesSearch && matchesFilter;
    });
  }, [qrCodes, search, filter]);

  /*
   * COUNTS
   */
  const totalCount = qrCodes.length;

  const activeCount = qrCodes.filter(
    (qr) => qr.status === "ACTIVE"
  ).length;

  const pausedCount = qrCodes.filter(
    (qr) => qr.status === "PAUSED"
  ).length;

  const totalScans = qrCodes.reduce(
    (total, qr) =>
      total + Number(qr.scans || 0),
    0
  );

  /*
   * SAVE QR CODES
   */
  const saveQRCodes = async (
    updatedQRCodes: QRCodeItem[]
  ) => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updatedQRCodes)
    );

    setQrCodes(updatedQRCodes);
  };

  /*
   * OPEN QR DETAILS
   */
  const handleOpenDetails = (
    qr: QRCodeItem
  ) => {
    router.push({
      pathname: "/app/qr-details",
      params: {
        id: qr.id,
        name: qr.name,
        destination: qr.destination,
        qrType: qr.type,
        destinationType:
          qr.destinationType,
        status: qr.status,
      },
    });
  };

  /*
   * EDIT QR
   */
  const handleEdit = (
    qr: QRCodeItem
  ) => {
    router.push({
      pathname: "/app/edit-qr",
      params: {
        id: qr.id,
        name: qr.name,
        destination: qr.destination,
        type: qr.type,
        destinationType:
          qr.destinationType,
      },
    });
  };

  /*
   * PAUSE / ACTIVATE
   */
  const handleToggleStatus = (
    qr: QRCodeItem
  ) => {
    const nextStatus: QRStatus =
      qr.status === "ACTIVE"
        ? "PAUSED"
        : "ACTIVE";

    const action =
      nextStatus === "ACTIVE"
        ? "activate"
        : "pause";

    Alert.alert(
      nextStatus === "ACTIVE"
        ? "Activate QR Code"
        : "Pause QR Code",
      `Are you sure you want to ${action} "${qr.name}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text:
            nextStatus === "ACTIVE"
              ? "Activate"
              : "Pause",
          onPress: async () => {
            try {
              const updated =
                qrCodes.map((item) =>
                  item.id === qr.id
                    ? {
                        ...item,
                        status: nextStatus,
                      }
                    : item
                );

              await saveQRCodes(updated);
            } catch (error) {
              console.error(
                "Failed to update QR status:",
                error
              );

              Alert.alert(
                "Update failed",
                "Could not update the QR code status."
              );
            }
          },
        },
      ]
    );
  };

  /*
   * DELETE QR
   */
  const handleDelete = (
    qr: QRCodeItem
  ) => {
    Alert.alert(
      "Delete QR Code?",
      `Are you sure you want to delete "${qr.name}"? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const updated =
                qrCodes.filter(
                  (item) =>
                    item.id !== qr.id
                );

              await saveQRCodes(updated);
            } catch (error) {
              console.error(
                "Failed to delete QR:",
                error
              );

              Alert.alert(
                "Delete failed",
                "Could not delete this QR code."
              );
            }
          },
        },
      ]
    );
  };

  /*
   * CREATE QR
   */
  const handleCreateQR = () => {
    router.push("/app/create-qr");
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
            color={COLORS.primary}
          />

          <Text style={styles.loaderText}>
            Loading QR codes...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /*
   * FILTER BUTTON
   */
  const FilterButton = ({
    value,
    label,
  }: {
    value: Filter;
    label: string;
  }) => {
    const selected =
      filter === value;

    return (
      <Pressable
        onPress={() =>
          setFilter(value)
        }
        style={[
          styles.filterButton,
          selected &&
            styles.filterButtonActive,
        ]}
      >
        <Text
          style={[
            styles.filterText,
            selected &&
              styles.filterTextActive,
          ]}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  /*
   * QR CARD
   */
  const renderQRCode = ({
    item,
  }: {
    item: QRCodeItem;
  }) => {
    const isActive =
      item.status === "ACTIVE";

    return (
      <View style={styles.qrCard}>
        {/* QR PREVIEW */}
        <Pressable
          onPress={() =>
            handleOpenDetails(item)
          }
          style={styles.qrPreview}
        >
          <QRCode
            value={
              item.destination ||
              "https://tapqr.app"
            }
            size={82}
            backgroundColor={
              COLORS.white
            }
            color="#111111"
          />
        </Pressable>

        {/* DETAILS */}
        <View style={styles.qrInfo}>
          <View
            style={styles.titleRow}
          >
            <Text
              style={styles.qrName}
              numberOfLines={1}
            >
              {item.name}
            </Text>

            <View
              style={[
                styles.statusBadge,
                isActive
                  ? styles.activeBadge
                  : styles.pausedBadge,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  isActive
                    ? styles.activeText
                    : styles.pausedText,
                ]}
              >
                {isActive
                  ? "ACTIVE"
                  : "PAUSED"}
              </Text>
            </View>
          </View>

          {/* TYPE */}
          <View
            style={styles.metaRow}
          >
            <View
              style={styles.typeBadge}
            >
              <Ionicons
                name={
                  item.type ===
                  "DYNAMIC"
                    ? "flash-outline"
                    : "lock-closed-outline"
                }
                size={13}
                color={
                  COLORS.primary
                }
              />

              <Text
                style={
                  styles.typeText
                }
              >
                {item.type}
              </Text>
            </View>

            <View
              style={
                styles.scanContainer
              }
            >
              <Ionicons
                name="scan-outline"
                size={14}
                color={
                  COLORS.textSecondary
                }
              />

              <Text
                style={
                  styles.scanText
                }
              >
                {Number(
                  item.scans || 0
                )}{" "}
                scans
              </Text>
            </View>
          </View>

          {/* DESTINATION */}
          <Text
            style={
              styles.destination
            }
            numberOfLines={1}
          >
            {item.destination}
          </Text>

          {/* ACTIONS */}
          <View
            style={styles.actionRow}
          >
            <Pressable
              onPress={() =>
                handleOpenDetails(
                  item
                )
              }
              style={
                styles.actionButton
              }
            >
              <Ionicons
                name="eye-outline"
                size={16}
                color={
                  COLORS.text
                }
              />

              <Text
                style={
                  styles.actionText
                }
              >
                View
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                handleEdit(item)
              }
              style={
                styles.actionButton
              }
            >
              <Ionicons
                name="create-outline"
                size={16}
                color={
                  COLORS.text
                }
              />

              <Text
                style={
                  styles.actionText
                }
              >
                Edit
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                handleToggleStatus(
                  item
                )
              }
              style={
                styles.actionButton
              }
            >
              <Ionicons
                name={
                  isActive
                    ? "pause-outline"
                    : "play-outline"
                }
                size={16}
                color={
                  COLORS.text
                }
              />

              <Text
                style={
                  styles.actionText
                }
              >
                {isActive
                  ? "Pause"
                  : "Activate"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                handleDelete(item)
              }
              style={[
                styles.actionButton,
                styles.deleteAction,
              ]}
            >
              <Ionicons
                name="trash-outline"
                size={16}
                color="#DC2626"
              />

              <Text
                style={[
                  styles.actionText,
                  styles.deleteText,
                ]}
              >
                Delete
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  /*
   * EMPTY STATE
   */
  const renderEmpty = () => {
    const hasSearch =
      search.trim().length > 0;

    const hasFilter =
      filter !== "ALL";

    if (
      hasSearch ||
      hasFilter
    ) {
      return (
        <View
          style={
            styles.emptyContainer
          }
        >
          <View
            style={
              styles.emptyIcon
            }
          >
            <Ionicons
              name="search-outline"
              size={34}
              color={
                COLORS.primary
              }
            />
          </View>

          <Text
            style={styles.emptyTitle}
          >
            No QR codes found
          </Text>

          <Text
            style={
              styles.emptySubtitle
            }
          >
            Try changing your
            search or filter.
          </Text>

          <Pressable
            onPress={() => {
              setSearch("");
              setFilter("ALL");
            }}
            style={
              styles.clearButton
            }
          >
            <Text
              style={
                styles.clearButtonText
              }
            >
              Clear Filters
            </Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View
        style={
          styles.emptyContainer
        }
      >
        <View
          style={styles.emptyIcon}
        >
          <Ionicons
            name="qr-code-outline"
            size={38}
            color={
              COLORS.primary
            }
          />
        </View>

        <Text
          style={styles.emptyTitle}
        >
          No QR codes yet
        </Text>

        <Text
          style={styles.emptySubtitle}
        >
          Create your first QR
          code to start managing
          your TapQR links.
        </Text>

        <Pressable
          onPress={handleCreateQR}
          style={
            styles.emptyCreateButton
          }
        >
          <Ionicons
            name="add"
            size={20}
            color={
              COLORS.white
            }
          />

          <Text
            style={
              styles.emptyCreateText
            }
          >
            Create QR Code
          </Text>
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={styles.container}
    >
      {/* HEADER */}
      <View
        style={styles.header}
      >
        <View>
          <Text
            style={styles.headerTitle}
          >
            QR Codes
          </Text>

          <Text
            style={
              styles.headerSubtitle
            }
          >
            Manage all your QR
            codes
          </Text>
        </View>

        <Pressable
          onPress={handleCreateQR}
          style={styles.addButton}
        >
          <Ionicons
            name="add"
            size={22}
            color={
              COLORS.white
            }
          />

          <Text
            style={
              styles.addButtonText
            }
          >
            Create
          </Text>
        </Pressable>
      </View>

      {/* SUMMARY */}
      <View
        style={styles.summaryRow}
      >
        <View
          style={styles.summaryCard}
        >
          <Text
            style={
              styles.summaryValue
            }
          >
            {totalCount}
          </Text>

          <Text
            style={
              styles.summaryLabel
            }
          >
            Total
          </Text>
        </View>

        <View
          style={styles.summaryCard}
        >
          <Text
            style={[
              styles.summaryValue,
              styles.activeSummary,
            ]}
          >
            {activeCount}
          </Text>

          <Text
            style={
              styles.summaryLabel
            }
          >
            Active
          </Text>
        </View>

        <View
          style={styles.summaryCard}
        >
          <Text
            style={[
              styles.summaryValue,
              styles.pausedSummary,
            ]}
          >
            {pausedCount}
          </Text>

          <Text
            style={
              styles.summaryLabel
            }
          >
            Paused
          </Text>
        </View>

        <View
          style={styles.summaryCard}
        >
          <Text
            style={
              styles.summaryValue
            }
          >
            {totalScans}
          </Text>

          <Text
            style={
              styles.summaryLabel
            }
          >
            Scans
          </Text>
        </View>
      </View>

      {/* SEARCH */}
      <View
        style={
          styles.searchContainer
        }
      >
        <Ionicons
          name="search-outline"
          size={20}
          color={
            COLORS.textSecondary
          }
        />

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search QR codes..."
          placeholderTextColor={
            COLORS.textSecondary
          }
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {search.length > 0 && (
          <Pressable
            onPress={() =>
              setSearch("")
            }
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={
                COLORS.textSecondary
              }
            />
          </Pressable>
        )}
      </View>

      {/* FILTERS */}
      <View
        style={styles.filterContainer}
      >
        <FilterButton
          value="ALL"
          label="All"
        />

        <FilterButton
          value="ACTIVE"
          label="Active"
        />

        <FilterButton
          value="PAUSED"
          label="Paused"
        />

        <FilterButton
          value="DYNAMIC"
          label="Dynamic"
        />

        <FilterButton
          value="STATIC"
          label="Static"
        />
      </View>

      {/* LIST */}
      <FlatList
        data={filteredQRCodes}
        keyExtractor={(item) =>
          item.id
        }
        renderItem={renderQRCode}
        ListEmptyComponent={
          renderEmpty
        }
        contentContainerStyle={[
          styles.listContent,
          filteredQRCodes.length ===
            0 &&
            styles.emptyListContent,
        ]}
        showsVerticalScrollIndicator={
          false
        }
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={
              handleRefresh
            }
            tintColor={
              COLORS.primary
            }
          />
        }
      />

      {/* FLOATING CREATE BUTTON */}
      {filteredQRCodes.length >
        0 && (
        <Pressable
          onPress={handleCreateQR}
          style={({ pressed }) => [
            styles.fab,
            pressed &&
              styles.fabPressed,
          ]}
        >
          <Ionicons
            name="add"
            size={28}
            color={
              COLORS.white
            }
          />
        </Pressable>
      )}
    </SafeAreaView>
  );
}

/*
 * STYLES
 */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:
      COLORS.background,
  },

  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loaderText: {
    marginTop: SPACING.md,
    fontSize: 14,
    color:
      COLORS.textSecondary,
  },

  header: {
    paddingHorizontal:
      SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.text,
  },

  headerSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color:
      COLORS.textSecondary,
  },

  addButton: {
    height: 42,
    paddingHorizontal:
      SPACING.md,
    borderRadius: 12,
    backgroundColor:
      COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  addButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.white,
  },

  summaryRow: {
    paddingHorizontal:
      SPACING.xl,
    flexDirection: "row",
    gap: 8,
    marginBottom:
      SPACING.md,
  },

  summaryCard: {
    flex: 1,
    minHeight: 72,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor:
      COLORS.surface,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    alignItems: "center",
    justifyContent:
      "center",
  },

  summaryValue: {
    fontSize: 19,
    fontWeight: "800",
    color: COLORS.text,
  },

  activeSummary: {
    color: "#16A34A",
  },

  pausedSummary: {
    color: "#DC2626",
  },

  summaryLabel: {
    marginTop: 3,
    fontSize: 10,
    fontWeight: "600",
    color:
      COLORS.textSecondary,
  },

  searchContainer: {
    marginHorizontal:
      SPACING.xl,
    height: 48,
    paddingHorizontal:
      SPACING.md,
    borderRadius: 14,
    backgroundColor:
      COLORS.surface,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    flexDirection: "row",
    alignItems: "center",
  },

  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: COLORS.text,
  },

  filterContainer: {
    paddingHorizontal:
      SPACING.xl,
    paddingVertical:
      SPACING.md,
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },

  filterButton: {
    paddingHorizontal: 13,
    height: 34,
    borderRadius: 999,
    backgroundColor:
      COLORS.surface,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    alignItems: "center",
    justifyContent:
      "center",
  },

  filterButtonActive: {
    backgroundColor:
      COLORS.primary,
    borderColor:
      COLORS.primary,
  },

  filterText: {
    fontSize: 12,
    fontWeight: "700",
    color:
      COLORS.textSecondary,
  },

  filterTextActive: {
    color: COLORS.white,
  },

  listContent: {
    paddingHorizontal:
      SPACING.xl,
    paddingBottom: 110,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  qrCard: {
    marginBottom:
      SPACING.md,
    padding: SPACING.md,
    borderRadius: 18,
    backgroundColor:
      COLORS.surface,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    flexDirection: "row",
  },

  qrPreview: {
    width: 94,
    height: 94,
    borderRadius: 14,
    backgroundColor:
      COLORS.white,
    alignItems: "center",
    justifyContent:
      "center",
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  qrInfo: {
    flex: 1,
    marginLeft: SPACING.md,
    minWidth: 0,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  qrName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
    marginRight: 8,
  },

  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 999,
  },

  activeBadge: {
    backgroundColor:
      "#DCFCE7",
  },

  pausedBadge: {
    backgroundColor:
      "#FEE2E2",
  },

  statusText: {
    fontSize: 9,
    fontWeight: "900",
  },

  activeText: {
    color: "#15803D",
  },

  pausedText: {
    color: "#B91C1C",
  },

  metaRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  typeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor:
      "#EEF2FF",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  typeText: {
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.primary,
  },

  scanContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  scanText: {
    fontSize: 11,
    color:
      COLORS.textSecondary,
  },

  destination: {
    marginTop: 8,
    fontSize: 11,
    color:
      COLORS.textSecondary,
  },

  actionRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  actionButton: {
    minHeight: 30,
    paddingHorizontal: 7,
    borderRadius: 8,
    backgroundColor:
      COLORS.background,
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "center",
    gap: 3,
  },

  actionText: {
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.text,
  },

  deleteAction: {
    backgroundColor:
      "#FEF2F2",
  },

  deleteText: {
    color: "#DC2626",
  },

  emptyContainer: {
    flex: 1,
    paddingHorizontal:
      SPACING.xl,
    alignItems: "center",
    justifyContent:
      "center",
  },

  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor:
      "#EEF2FF",
    alignItems: "center",
    justifyContent:
      "center",
  },

  emptyTitle: {
    marginTop: SPACING.lg,
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
  },

  emptySubtitle: {
    marginTop: SPACING.sm,
    maxWidth: 300,
    fontSize: 13,
    lineHeight: 20,
    color:
      COLORS.textSecondary,
    textAlign: "center",
  },

  clearButton: {
    marginTop: SPACING.lg,
    paddingHorizontal:
      SPACING.xl,
    height: 44,
    borderRadius: 12,
    backgroundColor:
      COLORS.primary,
    alignItems: "center",
    justifyContent:
      "center",
  },

  clearButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.white,
  },

  emptyCreateButton: {
    marginTop: SPACING.xl,
    height: 48,
    paddingHorizontal:
      SPACING.xl,
    borderRadius: 13,
    backgroundColor:
      COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "center",
    gap: 6,
  },

  emptyCreateText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.white,
  },

  fab: {
    position: "absolute",
    right: 22,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor:
      COLORS.primary,
    alignItems: "center",
    justifyContent:
      "center",
    elevation: 8,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },

  fabPressed: {
    opacity: 0.75,
    transform: [
      {
        scale: 0.95,
      },
    ],
  },
});