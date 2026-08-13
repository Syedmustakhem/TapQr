import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
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
import { saveQR } from "../../services/qrStorage";
type QRType = "DYNAMIC" | "STATIC";

export default function QRPreviewScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    destination?: string;
    type?: string;
    destinationType?: string;
    qrColor?: string;
    backgroundColor?: string;
    frame?: string;
  }>();

  const name =
    params.name?.toString().trim() || "My QR Code";

  const destination =
    params.destination?.toString().trim() ||
    "https://tapqr.app";

  const qrType: QRType =
    params.type === "STATIC"
      ? "STATIC"
      : "DYNAMIC";

  const destinationType =
    params.destinationType?.toString() ||
    "WEBSITE";

  const qrColor =
    params.qrColor?.toString() || "#111827";

  const backgroundColor =
    params.backgroundColor?.toString() || "#FFFFFF";

  const frame =
    params.frame?.toString() || "None";

  /*
   * --------------------------------------------------
   * EDIT
   * --------------------------------------------------
   */

  const handleEdit = () => {
    router.back();
  };

  /*
   * --------------------------------------------------
   * SHARE
   * --------------------------------------------------
   */

  const handleShare = async () => {
    try {
      await Share.share({
        title: `Share ${name}`,
        message:
          `${name}\n\n` +
          `Destination:\n${destination}`,
      });
    } catch (error) {
      console.error("Share QR error:", error);

      Alert.alert(
        "Unable to Share",
        "We couldn't share this QR code right now."
      );
    }
  };

  /*
   * --------------------------------------------------
   * SAVE
   * --------------------------------------------------
   *
   * Frontend stage:
   * We don't save to the backend yet.
   * That will be connected after the preview flow
   * is completely stable.
   */

 const handleSave = async () => {
  try {
    const qrId =
      params.id?.toString() ||
      `qr_${Date.now()}`;

    const qr = {
      id: qrId,
      name,
      destination,
      type: qrType,
      destinationType,
      qrColor,
      backgroundColor,
      frame,
      createdAt: new Date().toISOString(),
    };

    await saveQR(qr);

    Alert.alert(
      "QR Saved",
      `${name} has been saved successfully.`,
      [
        {
          text: "OK",
          onPress: () =>
            router.replace("/app/tabs"),
        },
      ]
    );
  } catch (error) {
    console.error("Save QR error:", error);

    Alert.alert(
      "Save Failed",
      "Unable to save this QR code. Please try again."
    );
  }
};

  /*
   * --------------------------------------------------
   * DESTINATION ICON
   * --------------------------------------------------
   */

  const getDestinationIcon =
    (): keyof typeof Ionicons.glyphMap => {
      switch (destinationType) {
        case "MENU":
          return "restaurant-outline";

        case "SOCIAL":
          return "share-social-outline";

        case "WHATSAPP":
          return "logo-whatsapp";

        case "CUSTOM":
          return "link-outline";

        default:
          return "globe-outline";
      }
    };

  /*
   * --------------------------------------------------
   * PREVIEW
   * --------------------------------------------------
   */

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
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

          <Text style={styles.headerTitle}>
            QR Preview
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        {/* INTRO */}

        <View style={styles.intro}>
          <Text style={styles.title}>
            Your QR is ready
          </Text>

          <Text style={styles.subtitle}>
            Review your QR information before saving
            or sharing it.
          </Text>
        </View>

        {/* QR PREVIEW */}

        <View
          style={[
            styles.previewContainer,
            {
              backgroundColor,
            },
          ]}
        >
          <View style={styles.previewCard}>
            {/* QR PLACEHOLDER */}

            <View
              style={[
                styles.qrPlaceholder,
                {
                  backgroundColor:
                    backgroundColor,
                },
              ]}
            >
              <View
                style={[
                  styles.qrPattern,
                  {
                    borderColor: qrColor,
                  },
                ]}
              >
                <View
                  style={[
                    styles.qrCorner,
                    styles.qrCornerTopLeft,
                    {
                      borderColor: qrColor,
                    },
                  ]}
                />

                <View
                  style={[
                    styles.qrCorner,
                    styles.qrCornerTopRight,
                    {
                      borderColor: qrColor,
                    },
                  ]}
                />

                <View
                  style={[
                    styles.qrCorner,
                    styles.qrCornerBottomLeft,
                    {
                      borderColor: qrColor,
                    },
                  ]}
                />

                <View
                  style={[
                    styles.qrDots,
                    {
                      backgroundColor: qrColor,
                    },
                  ]}
                />

                <View
                  style={[
                    styles.qrDotsSmall,
                    {
                      backgroundColor: qrColor,
                    },
                  ]}
                />

                <View
                  style={[
                    styles.qrDotsSmallTwo,
                    {
                      backgroundColor: qrColor,
                    },
                  ]}
                />
              </View>
            </View>

            {/* FRAME */}

            {frame !== "None" && (
              <View
                style={[
                  styles.frameLabel,
                  {
                    backgroundColor: qrColor,
                  },
                ]}
              >
                <Text style={styles.frameText}>
                  {frame}
                </Text>
              </View>
            )}

            {/* QR NAME */}

            <Text
              style={[
                styles.qrName,
                {
                  color: qrColor,
                },
              ]}
              numberOfLines={2}
            >
              {name}
            </Text>
          </View>
        </View>

        {/* QR TYPE */}

        <View style={styles.typeBadgeRow}>
          <View style={styles.typeBadge}>
            <Ionicons
              name={
                qrType === "DYNAMIC"
                  ? "flash-outline"
                  : "lock-closed-outline"
              }
              size={15}
              color={COLORS.primary}
            />

            <Text style={styles.typeBadgeText}>
              {qrType === "DYNAMIC"
                ? "Dynamic QR"
                : "Static QR"}
            </Text>
          </View>
        </View>

        {/* DESTINATION */}

        <View style={styles.destinationCard}>
          <View
            style={[
              styles.destinationIcon,
              {
                backgroundColor: `${qrColor}15`,
              },
            ]}
          >
            <Ionicons
              name={getDestinationIcon()}
              size={20}
              color={qrColor}
            />
          </View>

          <View style={styles.destinationContent}>
            <Text style={styles.destinationLabel}>
              Destination
            </Text>

            <Text
              style={styles.destinationText}
              numberOfLines={3}
            >
              {destination}
            </Text>
          </View>
        </View>

        {/* DESIGN SUMMARY */}

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>
            QR Details
          </Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              QR type
            </Text>

            <Text style={styles.summaryValue}>
              {qrType === "DYNAMIC"
                ? "Dynamic"
                : "Static"}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Destination
            </Text>

            <Text
              style={styles.summaryValue}
              numberOfLines={1}
            >
              {destinationType}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              QR color
            </Text>

            <View style={styles.colorValue}>
              <View
                style={[
                  styles.colorDot,
                  {
                    backgroundColor: qrColor,
                  },
                ]}
              />

              <Text style={styles.summaryValue}>
                {qrColor}
              </Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Background
            </Text>

            <View style={styles.colorValue}>
              <View
                style={[
                  styles.colorDot,
                  {
                    backgroundColor,
                  },
                ]}
              />

              <Text style={styles.summaryValue}>
                {backgroundColor}
              </Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Frame
            </Text>

            <Text style={styles.summaryValue}>
              {frame}
            </Text>
          </View>
        </View>

        {/* EDIT */}

        <Pressable
          onPress={handleEdit}
          style={({ pressed }) => [
            styles.editButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="color-palette-outline"
            size={19}
            color={qrColor}
          />

          <Text
            style={[
              styles.editText,
              {
                color: qrColor,
              },
            ]}
          >
            Edit QR
          </Text>
        </Pressable>

        {/* ACTIONS */}

        <View style={styles.actions}>
          {/* SAVE */}

          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [
              styles.primaryButton,
              {
                backgroundColor: qrColor,
              },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="save-outline"
              size={20}
              color={COLORS.white}
            />

            <Text style={styles.primaryText}>
              Save QR
            </Text>
          </Pressable>

          {/* SHARE */}

          <Pressable
            onPress={handleShare}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="share-social-outline"
              size={20}
              color={qrColor}
            />

            <Text
              style={[
                styles.secondaryText,
                {
                  color: qrColor,
                },
              ]}
            >
              Share QR
            </Text>
          </Pressable>
        </View>

        {/* FRONTEND NOTE */}

        <View style={styles.note}>
          <Ionicons
            name="shield-checkmark-outline"
            size={17}
            color={COLORS.textSecondary}
          />

          <Text style={styles.noteText}>
            This preview is currently running in the
            TapQR frontend.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================================================== */
/* STYLES                                             */
/* ================================================== */

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
    fontWeight: "800",
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

  previewContainer: {
    minHeight: 390,
    borderRadius: 24,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  previewCard: {
    width: "100%",
    minHeight: 390,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
  },

  /*
   * Safe visual QR placeholder.
   *
   * Actual machine-readable QR rendering will be
   * connected separately after Web/native compatibility
   * is confirmed.
   */

  qrPlaceholder: {
    width: 250,
    height: 250,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },

  qrPattern: {
    width: 215,
    height: 215,
    borderWidth: 3,
    position: "relative",
    backgroundColor: "#FFFFFF",
  },

  qrCorner: {
    position: "absolute",
    width: 48,
    height: 48,
    borderWidth: 7,
  },

  qrCornerTopLeft: {
    top: 12,
    left: 12,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },

  qrCornerTopRight: {
    top: 12,
    right: 12,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },

  qrCornerBottomLeft: {
    bottom: 12,
    left: 12,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },

  qrDots: {
    position: "absolute",
    width: 65,
    height: 65,
    right: 38,
    bottom: 38,
    opacity: 0.9,
  },

  qrDotsSmall: {
    position: "absolute",
    width: 25,
    height: 25,
    left: 82,
    top: 82,
  },

  qrDotsSmallTwo: {
    position: "absolute",
    width: 15,
    height: 15,
    right: 28,
    top: 85,
  },

  frameLabel: {
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 9,
  },

  frameText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "800",
  },

  qrName: {
    marginTop: SPACING.lg,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },

  typeBadgeRow: {
    marginTop: SPACING.md,
    flexDirection: "row",
  },

  typeBadge: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#F5F3FF",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  typeBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.primary,
  },

  destinationCard: {
    marginTop: SPACING.xl,
    padding: SPACING.lg,
    borderRadius: 17,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
  },

  destinationIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  destinationContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },

  destinationLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },

  destinationText: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.text,
  },

  summaryCard: {
    marginTop: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: 17,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  summaryTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },

  summaryRow: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  summaryLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  summaryValue: {
    maxWidth: "60%",
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "right",
  },

  colorValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  colorDot: {
    width: 17,
    height: 17,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  editButton: {
    height: 48,
    marginTop: SPACING.lg,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  editText: {
    fontSize: 14,
    fontWeight: "800",
  },

  actions: {
    marginTop: SPACING.md,
    gap: SPACING.md,
  },

  primaryButton: {
    height: 54,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  primaryText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "800",
  },

  secondaryButton: {
    height: 54,
    borderRadius: 15,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  secondaryText: {
    fontSize: 15,
    fontWeight: "800",
  },

  note: {
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  noteText: {
    marginLeft: 7,
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
  },

  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
});