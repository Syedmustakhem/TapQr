import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import QRCode from "react-native-qrcode-svg";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { COLORS } from "../../constants/colors";
import { SPACING } from "../../constants/spacing";
import {
  getQRCodes,
  updateQRCode,
  deleteQRCode,
  type QRCode as StoredQRCode,
} from "../../services/qrStorage";

export default function QRDetailsScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    destination?: string;
    qrType?: string;
    destinationType?: string;
    status?: string;
  }>();

  const [qr, setQr] = useState<StoredQRCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadQRCode();
  }, [params.id]);

  const loadQRCode = async () => {
    try {
      setLoading(true);

      const allQRCodes = await getQRCodes();

      const found = allQRCodes.find(
        (item) => item.id === params.id
      );

      if (found) {
        setQr(found);
      } else {
        // Fallback for older navigation data
        setQr({
          id: params.id || Date.now().toString(),
          name: params.name || "Untitled QR Code",
          destination:
            params.destination || "https://example.com",
          type:
            params.qrType === "STATIC"
              ? "STATIC"
              : "DYNAMIC",
          status:
            params.status === "PAUSED"
              ? "PAUSED"
              : "ACTIVE",
          scans: 0,
          destinationType:
            params.destinationType || "WEBSITE",
          createdAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error(
        "Failed to load QR details:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!qr || updating) {
      return;
    }

    const newStatus =
      qr.status === "ACTIVE"
        ? "PAUSED"
        : "ACTIVE";

    try {
      setUpdating(true);

      const updated = await updateQRCode(
        qr.id,
        {
          status: newStatus,
        }
      );

      const updatedQR = updated.find(
        (item) => item.id === qr.id
      );

      if (updatedQR) {
        setQr(updatedQR);
      }
    } catch (error) {
      console.error(
        "Failed to update QR status:",
        error
      );

      Alert.alert(
        "Update failed",
        "Could not update the QR code status. Please try again."
      );
    } finally {
      setUpdating(false);
    }
  };
const handleDelete = () => {
  if (!qr || updating) {
    return;
  }

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
            setUpdating(true);

            await deleteQRCode(qr.id);

            router.replace("/app/tabs/qrcodes");
          } catch (error) {
            console.error(
              "Failed to delete QR code:",
              error
            );

            Alert.alert(
              "Delete failed",
              "Could not delete this QR code. Please try again."
            );
          } finally {
            setUpdating(false);
          }
        },
      },
    ]
  );
};
  const handleEdit = () => {
    if (!qr) {
      return;
    }

    router.push({
      pathname: "/app/edit-qr",
      params: {
        id: qr.id,
        name: qr.name,
        destination: qr.destination,
        type: qr.type,
        destinationType: qr.destinationType,
      },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loader}>
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
          />

          <Text style={styles.loaderText}>
            Loading QR code...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!qr) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons
            name="qr-code-outline"
            size={50}
            color={COLORS.textMuted}
          />

          <Text style={styles.emptyTitle}>
            QR code not found
          </Text>

          <Pressable
            style={styles.backToListButton}
            onPress={() =>
              router.replace(
                "/app/tabs/qrcodes"
              )
            }
          >
            <Text
              style={styles.backToListText}
            >
              Back to QR Codes
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isActive = qr.status === "ACTIVE";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}

        <View style={styles.header}>
          <Pressable
            onPress={() =>
              router.replace(
                "/app/tabs/qrcodes"
              )
            }
            style={styles.backButton}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={COLORS.text}
            />
          </Pressable>

          <Text style={styles.headerTitle}>
            QR Details
          </Text>

          <Pressable
            onPress={handleEdit}
            style={styles.editButton}
          >
            <Ionicons
              name="create-outline"
              size={21}
              color={COLORS.primary}
            />
          </Pressable>
        </View>

        {/* Status */}

        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusIcon,
              isActive
                ? styles.activeIcon
                : styles.pausedIcon,
            ]}
          >
            <Ionicons
              name={
                isActive
                  ? "checkmark"
                  : "pause"
              }
              size={28}
              color={COLORS.white}
            />
          </View>

          <Text style={styles.statusTitle}>
            {isActive
              ? "QR Code Active"
              : "QR Code Paused"}
          </Text>

          <Text style={styles.statusDescription}>
            {isActive
              ? "This QR code is currently active."
              : "This QR code is currently paused."}
          </Text>
        </View>

        {/* QR */}

        <View style={styles.qrCard}>
          <QRCode
            value={qr.destination}
            size={190}
            backgroundColor={COLORS.white}
            color={COLORS.black}
          />

          <Text style={styles.qrName}>
            {qr.name}
          </Text>

          <View
            style={[
              styles.badge,
              isActive
                ? styles.activeBadge
                : styles.pausedBadge,
            ]}
          >
            <View
              style={[
                styles.badgeDot,
                isActive
                  ? styles.activeDot
                  : styles.pausedDot,
              ]}
            />

            <Text
              style={[
                styles.badgeText,
                isActive
                  ? styles.activeText
                  : styles.pausedText,
              ]}
            >
              {qr.status}
            </Text>
          </View>
        </View>

        {/* Information */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            QR Information
          </Text>

          <View style={styles.infoCard}>
            <InfoRow
              label="Type"
              value={`${qr.type} QR`}
            />

            <InfoRow
              label="Name"
              value={qr.name}
            />

            <InfoRow
              label="Destination"
              value={qr.destination}
            />

            <InfoRow
              label="Scans"
              value={`${qr.scans.toLocaleString()} scans`}
            />

            <InfoRow
              label="Created"
              value={new Date(
                qr.createdAt
              ).toLocaleDateString()}
              last
            />
          </View>
        </View>

        {/* Pause / Activate */}

        <View style={styles.controlSection}>
          <Text style={styles.sectionTitle}>
            QR Status
          </Text>

          <Pressable
            disabled={updating}
            onPress={handleToggleStatus}
            style={({ pressed }) => [
              styles.statusButton,
              isActive
                ? styles.pauseButton
                : styles.activateButton,
              pressed &&
                !updating &&
                styles.buttonPressed,
            ]}
          >
            {updating ? (
              <ActivityIndicator
                color={COLORS.white}
              />
            ) : (
              <>
                <Ionicons
                  name={
                    isActive
                      ? "pause-circle-outline"
                      : "play-circle-outline"
                  }
                  size={22}
                  color={COLORS.white}
                />

                <Text
                  style={styles.statusButtonText}
                >
                  {isActive
                    ? "Pause QR Code"
                    : "Activate QR Code"}
                </Text>
              </>
            )}
          </Pressable>

          <Text style={styles.statusHelp}>
            {isActive
              ? "Pausing disables this QR code until you activate it again."
              : "Activating makes this QR code available again."}
          </Text>
        </View>

        {/* Analytics */}

        <View style={styles.analyticsCard}>
          <View style={styles.analyticsIcon}>
            <Ionicons
              name="bar-chart-outline"
              size={22}
              color={COLORS.primary}
            />
          </View>

          <View style={styles.analyticsContent}>
            <Text
              style={styles.analyticsTitle}
            >
              Scan Analytics
            </Text>

            <Text
              style={styles.analyticsText}
            >
              {qr.scans.toLocaleString()} scans
              so far
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color={COLORS.textMuted}
          />
        </View>
        <Pressable
  disabled={updating}
  onPress={handleDelete}
  style={({ pressed }) => [
    styles.deleteButton,
    pressed &&
      !updating &&
      styles.buttonPressed,
  ]}
>
  <Ionicons
    name="trash-outline"
    size={21}
    color={COLORS.danger}
  />

  <Text style={styles.deleteButtonText}>
    Delete QR Code
  </Text>
</Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.infoRow,
        !last && styles.infoRowBorder,
      ]}
    >
      <Text style={styles.infoLabel}>
        {label}
      </Text>

      <Text
        style={styles.infoValue}
        numberOfLines={3}
      >
        {value}
      </Text>
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

  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loaderText: {
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
    fontSize: 14,
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xxl,
  },

  emptyTitle: {
    marginTop: SPACING.lg,
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
  },

  backToListButton: {
    marginTop: SPACING.xxl,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    borderRadius: 14,
  },

  backToListText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },

  editButton: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  statusContainer: {
    alignItems: "center",
    marginTop: SPACING.xxxl,
  },

  statusIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
  },

  activeIcon: {
    backgroundColor: COLORS.success,
  },

  pausedIcon: {
    backgroundColor: COLORS.warning,
  },

  statusTitle: {
    marginTop: SPACING.md,
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.text,
  },

  statusDescription: {
    marginTop: SPACING.xs,
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  qrCard: {
    marginTop: SPACING.xxl,
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xxl,
    alignItems: "center",
  },

  qrName: {
    marginTop: SPACING.xl,
    fontSize: 19,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
  },

  badge: {
    marginTop: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },

  activeBadge: {
    backgroundColor: "#DCFCE7",
  },

  pausedBadge: {
    backgroundColor: "#FEF3C7",
  },

  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },

  activeDot: {
    backgroundColor: COLORS.success,
  },

  pausedDot: {
    backgroundColor: COLORS.warning,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },

  activeText: {
    color: COLORS.success,
  },

  pausedText: {
    color: COLORS.warning,
  },

  section: {
    marginTop: SPACING.xxl,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.md,
  },

  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },

  infoRow: {
    padding: SPACING.lg,
  },

  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  infoLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },

  infoValue: {
    marginTop: 5,
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
  },

  controlSection: {
    marginTop: SPACING.xxxl,
  },

  statusButton: {
    height: 54,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  pauseButton: {
    backgroundColor: COLORS.warning,
  },

  activateButton: {
    backgroundColor: COLORS.success,
  },

  statusButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "700",
  },

  statusHelp: {
    marginTop: SPACING.sm,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textSecondary,
    textAlign: "center",
  },

  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },

  analyticsCard: {
    marginTop: SPACING.xxl,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
  },

  analyticsIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },

  analyticsContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },

  analyticsTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },

  analyticsText: {
    marginTop: 3,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  deleteButton: {
  height: 52,
  marginTop: SPACING.xxl,
  borderRadius: 14,
  borderWidth: 1,
  borderColor: "#FECACA",
  backgroundColor: "#FEF2F2",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
},

deleteButtonText: {
  color: COLORS.danger,
  fontSize: 15,
  fontWeight: "700",
},
});