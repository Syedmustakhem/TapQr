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

export default function QRPreviewScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}

        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={COLORS.text}
            />
          </Pressable>

          <Text style={styles.headerTitle}>
            QR Preview
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        {/* Intro */}

        <View style={styles.intro}>
          <Text style={styles.title}>
            Your QR Code
          </Text>

          <Text style={styles.subtitle}>
            Preview your QR code before saving it.
          </Text>
        </View>

        {/* QR Preview */}

        <View style={styles.previewCard}>
         <View style={styles.qrPlaceholder}>
  <QRCode
    value="https://example.com/menu"
    size={180}
    backgroundColor={COLORS.white}
    color={COLORS.black}
  />
</View>

          <Text style={styles.qrName}>
            Restaurant Menu
          </Text>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              DYNAMIC QR
            </Text>
          </View>
        </View>

        {/* Destination */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Destination
          </Text>

          <View style={styles.destinationCard}>
            <View style={styles.destinationIcon}>
              <Ionicons
                name="globe-outline"
                size={22}
                color={COLORS.primary}
              />
            </View>

            <View style={styles.destinationContent}>
              <Text style={styles.destinationTitle}>
                Website
              </Text>

              <Text
                style={styles.destinationValue}
                numberOfLines={1}
              >
                https://example.com/menu
              </Text>
            </View>
          </View>
        </View>

        {/* Info */}

        <View style={styles.infoBox}>
          <Ionicons
            name="information-circle-outline"
            size={22}
            color={COLORS.primary}
          />

          <Text style={styles.infoText}>
            Dynamic QR codes can be updated later
            without printing a new QR code.
          </Text>
        </View>

        {/* Actions */}

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.back()}
          >
            <Text style={styles.secondaryText}>
              Edit
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => {
              console.log("QR saved");
            }}
          >
            <Ionicons
              name="checkmark"
              size={20}
              color={COLORS.white}
            />

            <Text style={styles.primaryText}>
              Save QR Code
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
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

  intro: {
    marginTop: SPACING.xxxl,
    marginBottom: SPACING.xxl,
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: COLORS.text,
  },

  subtitle: {
    marginTop: SPACING.sm,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textSecondary,
  },

  previewCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xxl,
    alignItems: "center",
  },

  qrPlaceholder: {
    width: 220,
    height: 220,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  qrName: {
    marginTop: SPACING.xl,
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
  },

  badge: {
    marginTop: SPACING.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#DBEAFE",
  },

  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
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

  destinationCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
  },

  destinationIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },

  destinationContent: {
    flex: 1,
  },

  destinationTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },

  destinationValue: {
    marginTop: 4,
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  infoBox: {
    marginTop: SPACING.xxl,
    padding: SPACING.lg,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    flexDirection: "row",
    alignItems: "flex-start",
  },

  infoText: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },

  actions: {
    flexDirection: "row",
    gap: SPACING.md,
    marginTop: SPACING.xxxl,
  },

  secondaryButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryButton: {
    flex: 1.5,
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  secondaryText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },

  primaryText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.white,
  },

  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
});