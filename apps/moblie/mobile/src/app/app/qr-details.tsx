import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { COLORS } from "../../constants/colors";
import { SPACING } from "../../constants/spacing";

export default function QRDetailsScreen() {
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
              router.replace("/app/tabs/qrcodes")
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

          <View style={styles.headerSpacer} />
        </View>

        {/* Success */}

        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons
              name="checkmark"
              size={28}
              color={COLORS.white}
            />
          </View>

          <Text style={styles.successTitle}>
            QR Code Created
          </Text>

          <Text style={styles.successText}>
            Your QR code is ready to use.
          </Text>
        </View>

        {/* QR */}

        <View style={styles.qrCard}>
          <QRCode
            value="https://example.com/menu"
            size={190}
            backgroundColor={COLORS.white}
            color={COLORS.black}
          />

          <Text style={styles.qrName}>
            Restaurant Menu
          </Text>

          <View style={styles.activeBadge}>
            <View style={styles.activeDot} />

            <Text style={styles.activeText}>
              Active
            </Text>
          </View>
        </View>

        {/* Details */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            QR Information
          </Text>

          <View style={styles.infoCard}>
            <InfoRow
              label="Type"
              value="Dynamic QR"
            />

            <InfoRow
              label="Name"
              value="Restaurant Menu"
            />

            <InfoRow
              label="Destination"
              value="https://example.com/menu"
            />

            <InfoRow
              label="Status"
              value="Active"
              last
            />
          </View>
        </View>

        {/* Actions */}

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.pressed,
            ]}
            onPress={() => {
              console.log("Download QR");
            }}
          >
            <Ionicons
              name="download-outline"
              size={21}
              color={COLORS.text}
            />

            <Text style={styles.actionText}>
              Download
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.pressed,
            ]}
            onPress={() => {
              console.log("Share QR");
            }}
          >
            <Ionicons
              name="share-social-outline"
              size={21}
              color={COLORS.text}
            />

            <Text style={styles.actionText}>
              Share
            </Text>
          </Pressable>
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
            <Text style={styles.analyticsTitle}>
              Scan Analytics
            </Text>

            <Text style={styles.analyticsText}>
              0 scans so far
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color={COLORS.textMuted}
          />
        </View>
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
        numberOfLines={2}
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

  headerSpacer: {
    width: 44,
  },

  successContainer: {
    alignItems: "center",
    marginTop: SPACING.xxxl,
  },

  successIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.success,
    alignItems: "center",
    justifyContent: "center",
  },

  successTitle: {
    marginTop: SPACING.md,
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.text,
  },

  successText: {
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
  },

  activeBadge: {
    marginTop: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#DCFCE7",
  },

  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: 6,
  },

  activeText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.success,
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

  actions: {
    flexDirection: "row",
    gap: SPACING.md,
    marginTop: SPACING.xxl,
  },

  actionButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  actionText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },

  pressed: {
    opacity: 0.7,
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
});