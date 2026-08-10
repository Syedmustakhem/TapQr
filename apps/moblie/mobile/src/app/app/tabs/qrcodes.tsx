import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { COLORS } from "../../../constants/colors";
import { SPACING } from "../../../constants/spacing";

type QRCode = {
  id: string;
  name: string;
  type: "STATIC" | "DYNAMIC";
  status: "ACTIVE" | "PAUSED";
  scans: number;
};

const MOCK_QR_CODES: QRCode[] = [
  {
    id: "1",
    name: "Restaurant Menu",
    type: "DYNAMIC",
    status: "ACTIVE",
    scans: 482,
  },
  {
    id: "2",
    name: "Google Reviews",
    type: "DYNAMIC",
    status: "ACTIVE",
    scans: 316,
  },
  {
    id: "3",
    name: "Instagram Profile",
    type: "STATIC",
    status: "ACTIVE",
    scans: 185,
  },
  {
    id: "4",
    name: "WhatsApp",
    type: "STATIC",
    status: "PAUSED",
    scans: 94,
  },
];

export default function QRCodesScreen() {
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
      >
        <View style={styles.qrIcon}>
          <Ionicons
            name="qr-code-outline"
            size={28}
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

  return (
    <View style={styles.container}>
      <FlatList
        data={MOCK_QR_CODES}
        keyExtractor={(item) => item.id}
        renderItem={renderQRCode}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
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
                  pressed && styles.createButtonPressed,
                ]}
                onPress={() =>
                  router.push("/app/create-qr")
                }
              >
                <Ionicons
                  name="add"
                  size={22}
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
                  {MOCK_QR_CODES.length}
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
          </>
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
});