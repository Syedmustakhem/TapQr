import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { COLORS } from "../../../constants/colors";
import { SPACING } from "../../../constants/spacing";
import {
  getQRCodes,
  QRCode,
} from "../../../services/qrStorage";

export default function QRCodesScreen() {
  const [qrCodes, setQRCodes] = useState<QRCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadQRCodes = async () => {
    try {
      const data = await getQRCodes();
      setQRCodes(data);
    } catch (error) {
      console.error("Failed to load QR codes:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /*
   * Reload every time this screen becomes active.
   *
   * This means:
   * Create QR
   * Edit QR
   * Delete QR
   *
   * will all immediately appear in the list.
   */
  useFocusEffect(
    useCallback(() => {
      loadQRCodes();
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadQRCodes();
  };

  const openQRDetails = (item: QRCode) => {
    router.push({
      pathname: "/app/qr-details",
      params: {
        id: item.id,
        name: item.name,
        destination: item.destination,

        // IMPORTANT:
        // QR Details expects "type"
        type: item.type,

        destinationType: item.destinationType,
        status: item.status,
        scans: String(item.scans),
      },
    });
  };

  const renderQRCode = ({
    item,
  }: {
    item: QRCode;
  }) => {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.card,
          pressed && styles.cardPressed,
        ]}
        onPress={() => openQRDetails(item)}
      >
        <View style={styles.qrIcon}>
          <Ionicons
            name="qr-code-outline"
            size={25}
            color={COLORS.primary}
          />
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>
            {item.name}
          </Text>

          <View style={styles.metaRow}>
            <Text style={styles.type}>
              {item.type}
            </Text>

            <View style={styles.dot} />

            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  item.status === "ACTIVE"
                    ? styles.activeDot
                    : styles.pausedDot,
                ]}
              />

              <Text
                style={[
                  styles.statusText,
                  item.status === "ACTIVE"
                    ? styles.activeText
                    : styles.pausedText,
                ]}
              >
                {item.status}
              </Text>
            </View>
          </View>

          <Text style={styles.scans}>
            {item.scans.toLocaleString()} scans
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={20}
          color={COLORS.textMuted}
        />
      </Pressable>
    );
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />

        <Text style={styles.loadingText}>
          Loading QR codes...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={qrCodes}
        keyExtractor={(item) => item.id}
        renderItem={renderQRCode}
        contentContainerStyle={[
          styles.content,
          qrCodes.length === 0 &&
            styles.emptyContent,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>
                  QR Codes
                </Text>

                <Text style={styles.subtitle}>
                  Manage all your QR codes
                </Text>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.createButton,
                  pressed &&
                    styles.createButtonPressed,
                ]}
                onPress={() =>
                  router.push("/app/create-qr")
                }
              >
                <Ionicons
                  name="add"
                  size={24}
                  color={COLORS.white}
                />
              </Pressable>
            </View>

            <View style={styles.summaryCard}>
              <View>
                <Text style={styles.summaryLabel}>
                  Total QR Codes
                </Text>

                <Text style={styles.summaryValue}>
                  {qrCodes.length}
                </Text>
              </View>

              <View style={styles.summaryIcon}>
                <Ionicons
                  name="qr-code"
                  size={30}
                  color={COLORS.primary}
                />
              </View>
            </View>

            <Text style={styles.sectionTitle}>
              Your QR Codes
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="qr-code-outline"
                size={42}
                color={COLORS.primary}
              />
            </View>

            <Text style={styles.emptyTitle}>
              No QR codes yet
            </Text>

            <Text style={styles.emptyText}>
              Create your first QR code to start
              connecting customers with your
              business.
            </Text>

            <Pressable
              style={styles.emptyButton}
              onPress={() =>
                router.push("/app/create-qr")
              }
            >
              <Ionicons
                name="add"
                size={20}
                color={COLORS.white}
              />

              <Text style={styles.emptyButtonText}>
                Create QR Code
              </Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    padding: SPACING.xl,
    paddingBottom: SPACING.huge,
  },

  emptyContent: {
    flexGrow: 1,
  },

  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },

  loadingText: {
    marginTop: SPACING.md,
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.xxl,
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: COLORS.text,
  },

  subtitle: {
    marginTop: SPACING.xs,
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  createButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  createButtonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },

  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.xxl,
  },

  summaryLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  summaryValue: {
    marginTop: SPACING.xs,
    fontSize: 32,
    fontWeight: "800",
    color: COLORS.text,
  },

  summaryIcon: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.md,
  },

  card: {
    minHeight: 100,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
  },

  cardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },

  qrIcon: {
    width: 54,
    height: 54,
    borderRadius: 15,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },

  cardContent: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
  },

  type: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },

  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.textMuted,
    marginHorizontal: 7,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 5,
  },

  activeDot: {
    backgroundColor: COLORS.success,
  },

  pausedDot: {
    backgroundColor: COLORS.warning,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },

  activeText: {
    color: COLORS.success,
  },

  pausedText: {
    color: COLORS.warning,
  },

  scans: {
    marginTop: 6,
    fontSize: 12,
    color: COLORS.textMuted,
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xxxl,
  },

  emptyIcon: {
    width: 82,
    height: 82,
    borderRadius: 24,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    marginTop: SPACING.xl,
    fontSize: 21,
    fontWeight: "800",
    color: COLORS.text,
  },

  emptyText: {
    marginTop: SPACING.sm,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    color: COLORS.textSecondary,
  },

  emptyButton: {
    marginTop: SPACING.xl,
    height: 50,
    paddingHorizontal: SPACING.xl,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  emptyButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "700",
  },
});