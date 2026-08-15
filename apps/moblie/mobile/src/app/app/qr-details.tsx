import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { COLORS } from "../../constants/colors";
import { SPACING } from "../../constants/spacing";

type QRType = "STATIC" | "DYNAMIC";

export default function QRDetailsScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    destination?: string;
    type?: string;
    status?: string;
    scans?: string;
    destinationType?: string;
    createdAt?: string;
  }>();

  const [loading, setLoading] = React.useState(false);

  const qrId = params.id || "";
  const name = params.name || "Untitled QR";
  const destination = params.destination || "No destination";
  const qrType: QRType =
    params.type === "STATIC" ? "STATIC" : "DYNAMIC";

  const status =
    params.status === "PAUSED" ? "PAUSED" : "ACTIVE";

  const scans = Number(params.scans || 0);

  const destinationType =
    params.destinationType || "WEBSITE";

  const createdAt =
    params.createdAt || "Not available";

  const isActive = status === "ACTIVE";

  const handleShare = async () => {
    try {
      setLoading(true);

      await Share.share({
        message:
          `Check out this QR code: ${name}\n\n` +
          `Destination: ${destination}`,
      });
    } catch (error) {
      Alert.alert(
        "Share failed",
        "Unable to share the QR code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push({
      pathname: "/app/edit-qr",
      params: {
        id: qrId,
        name,
        destination,
        type: qrType,
        destinationType,
      },
    });
  };

  const handleAnalytics = () => {
    router.push({
      pathname: "/app/tabs/analytics",
      params: {
        id: qrId,
        name,
      },
    });
  };

  const handleToggleStatus = () => {
    Alert.alert(
      isActive ? "Pause QR code?" : "Activate QR code?",
      isActive
        ? "This QR code will temporarily stop being active."
        : "This QR code will become active again.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: isActive ? "Pause" : "Activate",
          onPress: () => {
            Alert.alert(
              "Frontend preview",
              isActive
                ? "QR code marked as paused locally. Backend status syncing will be added later."
                : "QR code marked as active locally. Backend status syncing will be added later."
            );
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete QR code?",
      "This action will be connected to the backend later.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Frontend preview",
              "Delete functionality will be connected when the backend is implemented."
            );
          },
        },
      ]
    );
  };

  const handlePreview = () => {
    router.push({
      pathname: "/app/qr-preview",
      params: {
        id: qrId,
        name,
        destination,
        type: qrType,
        destinationType,
      },
    });
  };

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
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={COLORS.text}
            />
          </Pressable>

          <View style={styles.headerText}>
            <Text
              style={styles.headerTitle}
              numberOfLines={1}
            >
              QR Details
            </Text>

            <Text
              style={styles.headerSubtitle}
              numberOfLines={1}
            >
              Manage your QR code
            </Text>
          </View>

          <Pressable
            onPress={handleEdit}
            style={({ pressed }) => [
              styles.headerAction,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="create-outline"
              size={21}
              color={COLORS.primary}
            />
          </Pressable>
        </View>

        {/* QR PREVIEW CARD */}
        <View style={styles.previewCard}>
          <View style={styles.qrBox}>
            <QRVisual />
          </View>

          <Text style={styles.qrName}>
            {name}
          </Text>

          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusBadge,
                isActive
                  ? styles.activeBadge
                  : styles.pausedBadge,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  isActive
                    ? styles.activeDot
                    : styles.pausedDot,
                ]}
              />

              <Text
                style={[
                  styles.statusText,
                  isActive
                    ? styles.activeText
                    : styles.pausedText,
                ]}
              >
                {isActive ? "Active" : "Paused"}
              </Text>
            </View>

            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>
                {qrType}
              </Text>
            </View>
          </View>
        </View>

        {/* QUICK ACTIONS */}
        <Text style={styles.sectionTitle}>
          Quick Actions
        </Text>

        <View style={styles.actionsGrid}>
          <ActionButton
            icon="eye-outline"
            title="Preview"
            onPress={handlePreview}
          />

          <ActionButton
            icon="share-social-outline"
            title="Share"
            onPress={handleShare}
          />

          <ActionButton
            icon="create-outline"
            title="Edit"
            onPress={handleEdit}
          />

          <ActionButton
            icon="analytics-outline"
            title="Analytics"
            onPress={handleAnalytics}
          />
        </View>

        {/* INFORMATION */}
        <Text style={styles.sectionTitle}>
          QR Information
        </Text>

        <View style={styles.infoCard}>
          <InfoRow
            icon="link-outline"
            label="Destination"
            value={destination}
          />

          <Divider />

          <InfoRow
            icon="globe-outline"
            label="Destination type"
            value={destinationType}
          />

          <Divider />

          <InfoRow
            icon="scan-outline"
            label="QR type"
            value={qrType}
          />

          <Divider />

          <InfoRow
            icon="calendar-outline"
            label="Created"
            value={createdAt}
          />

          <Divider />

          <InfoRow
            icon="bar-chart-outline"
            label="Total scans"
            value={scans.toLocaleString()}
          />
        </View>

        {/* SCAN SUMMARY */}
        <Text style={styles.sectionTitle}>
          Scan Summary
        </Text>

        <View style={styles.scanCard}>
          <View style={styles.scanIcon}>
            <Ionicons
              name="scan-outline"
              size={25}
              color={COLORS.primary}
            />
          </View>

          <View style={styles.scanContent}>
            <Text style={styles.scanValue}>
              {scans.toLocaleString()}
            </Text>

            <Text style={styles.scanLabel}>
              Total scans
            </Text>
          </View>

          <Pressable
            onPress={handleAnalytics}
            style={({ pressed }) => [
              styles.smallButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.smallButtonText}>
              View
            </Text>

            <Ionicons
              name="arrow-forward"
              size={16}
              color={COLORS.primary}
            />
          </Pressable>
        </View>

        {/* STATUS ACTION */}
        <Text style={styles.sectionTitle}>
          QR Status
        </Text>

        <Pressable
          onPress={handleToggleStatus}
          style={({ pressed }) => [
            styles.statusAction,
            pressed && styles.pressed,
          ]}
        >
          <View
            style={[
              styles.statusActionIcon,
              isActive
                ? styles.pauseIcon
                : styles.playIcon,
            ]}
          >
            <Ionicons
              name={
                isActive
                  ? "pause"
                  : "play"
              }
              size={20}
              color={COLORS.white}
            />
          </View>

          <View style={styles.statusActionContent}>
            <Text style={styles.statusActionTitle}>
              {isActive
                ? "Pause QR Code"
                : "Activate QR Code"}
            </Text>

            <Text style={styles.statusActionDescription}>
              {isActive
                ? "Temporarily disable this QR code"
                : "Enable this QR code again"}
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color={COLORS.textSecondary}
          />
        </Pressable>

        {/* DANGER ZONE */}
        <Text style={styles.sectionTitle}>
          Danger Zone
        </Text>

        <Pressable
          onPress={handleDelete}
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="trash-outline"
            size={21}
            color="#DC2626"
          />

          <Text style={styles.deleteText}>
            Delete QR Code
          </Text>
        </Pressable>

        {/* SHARE LOADING */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator
              size="small"
              color={COLORS.primary}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ------------------------------------------------ */
/* QR VISUAL                                        */
/* ------------------------------------------------ */

function QRVisual() {
  const cells = Array.from(
    { length: 81 },
    (_, index) => index
  );

  return (
    <View style={styles.qrVisual}>
      {cells.map((cell) => {
        const row = Math.floor(cell / 9);
        const col = cell % 9;

        const isFinder =
          (row < 3 && col < 3) ||
          (row < 3 && col > 5) ||
          (row > 5 && col < 3);

        const pattern =
          (row * 7 + col * 11 + row * col) % 3 !== 0;

        const filled =
          isFinder || pattern;

        return (
          <View
            key={cell}
            style={[
              styles.qrCell,
              filled && styles.qrCellFilled,
            ]}
          />
        );
      })}
    </View>
  );
}

/* ------------------------------------------------ */
/* ACTION BUTTON                                    */
/* ------------------------------------------------ */

function ActionButton({
  icon,
  title,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
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
      <View style={styles.actionButtonIcon}>
        <Ionicons
          name={icon}
          size={22}
          color={COLORS.primary}
        />
      </View>

      <Text style={styles.actionButtonText}>
        {title}
      </Text>
    </Pressable>
  );
}

/* ------------------------------------------------ */
/* INFO ROW                                         */
/* ------------------------------------------------ */

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons
          name={icon}
          size={19}
          color={COLORS.primary}
        />
      </View>

      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>
          {label}
        </Text>

        <Text
          style={styles.infoValue}
          numberOfLines={2}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

/* ------------------------------------------------ */
/* DIVIDER                                          */
/* ------------------------------------------------ */

function Divider() {
  return <View style={styles.divider} />;
}

/* ------------------------------------------------ */
/* STYLES                                           */
/* ------------------------------------------------ */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    padding: SPACING.xl,
    paddingBottom: 60,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.xl,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  headerText: {
    flex: 1,
    marginLeft: SPACING.md,
  },

  headerTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: COLORS.text,
  },

  headerSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  headerAction: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  previewCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    alignItems: "center",
  },

  qrBox: {
    width: 210,
    height: 210,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },

  qrVisual: {
    width: "100%",
    height: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: COLORS.white,
  },

  qrCell: {
    width: "11.111%",
    height: "11.111%",
    backgroundColor: COLORS.white,
  },

  qrCellFilled: {
    backgroundColor: "#111827",
  },

  qrName: {
    marginTop: SPACING.xl,
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: SPACING.md,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  activeBadge: {
    backgroundColor: "#DCFCE7",
  },

  pausedBadge: {
    backgroundColor: "#FEF3C7",
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },

  activeDot: {
    backgroundColor: "#16A34A",
  },

  pausedDot: {
    backgroundColor: "#D97706",
  },

  statusText: {
    fontSize: 11,
    fontWeight: "800",
  },

  activeText: {
    color: "#15803D",
  },

  pausedText: {
    color: "#B45309",
  },

  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#EEF2FF",
  },

  typeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#4F46E5",
  },

  sectionTitle: {
    marginTop: SPACING.xxl,
    marginBottom: SPACING.md,
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
  },

  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
  },

  actionButton: {
    width: "47%",
    minHeight: 94,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    alignItems: "center",
    justifyContent: "center",
  },

  actionButtonIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  actionButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
  },

  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
  },

  infoRow: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
  },

  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },

  infoContent: {
    flex: 1,
  },

  infoLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
  },

  infoValue: {
    marginTop: 3,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },

  scanCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
  },

  scanIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },

  scanContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },

  scanValue: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text,
  },

  scanLabel: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  smallButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
  },

  smallButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.primary,
  },

  statusAction: {
    minHeight: 82,
    padding: SPACING.lg,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
  },

  statusActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  pauseIcon: {
    backgroundColor: "#F59E0B",
  },

  playIcon: {
    backgroundColor: COLORS.primary,
  },

  statusActionContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },

  statusActionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
  },

  statusActionDescription: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  deleteButton: {
    height: 54,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  deleteText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#DC2626",
  },

  loadingOverlay: {
    position: "absolute",
    top: 80,
    right: 24,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },

  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
});