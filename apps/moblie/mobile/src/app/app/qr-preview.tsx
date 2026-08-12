import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
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
import QRCode from "react-native-qrcode-svg";
import ViewShot from "react-native-view-shot";

import { COLORS } from "../../constants/colors";
import { SPACING } from "../../constants/spacing";

export default function QRPreviewScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    destination?: string;
    qrColor?: string;
    backgroundColor?: string;
    frame?: string;
  }>();

  const [saving, setSaving] = useState(false);

  const qrRef = useRef<ViewShot>(null);

  const name =
    params.name?.toString() || "My QR Code";

  const destination =
    params.destination?.toString() ||
    "https://tapqr.app";

  const qrColor =
    params.qrColor?.toString() || "#111827";

  const backgroundColor =
    params.backgroundColor?.toString() || "#FFFFFF";

  const frame =
    params.frame?.toString() || "None";

  const captureQR = async () => {
    if (!qrRef.current) {
      throw new Error("QR preview is not ready.");
    }

    const uri = await qrRef.current.capture?.();

    if (!uri) {
      throw new Error("Unable to capture QR code.");
    }

    return uri;
  };

  const handleShare = async () => {
    try {
      const uri = await captureQR();

      await Share.share({
        title: `Share ${name}`,
        message:
          `Scan this QR code or visit:\n${destination}\n\nQR image: ${uri}`,
      });
    } catch (error) {
      console.error("Share QR error:", error);

      Alert.alert(
        "Unable to share",
        "Please try again."
      );
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      /*
       * Frontend stage:
       * We capture the QR image here.
       *
       * Gallery permission and MediaLibrary saving
       * will be connected in the next step.
       */
      await captureQR();

      Alert.alert(
        "QR Ready",
        "Your QR code has been generated successfully. Gallery saving will be connected next."
      );
    } catch (error) {
      console.error("Save QR error:", error);

      Alert.alert(
        "Unable to save",
        "Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    router.back();
  };

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

        {/* Intro */}

        <View style={styles.intro}>
          <Text style={styles.title}>
            Your QR is ready
          </Text>

          <Text style={styles.subtitle}>
            Review your design before saving or
            sharing it.
          </Text>
        </View>

        {/* QR Capture Area */}

        <ViewShot
          ref={qrRef}
          options={{
            format: "png",
            quality: 1,
          }}
          style={[
            styles.captureContainer,
            {
              backgroundColor,
            },
          ]}
        >
          <View style={styles.qrCard}>
            {frame === "None" ? (
              <QRCode
                value={destination}
                size={240}
                color={qrColor}
                backgroundColor={backgroundColor}
              />
            ) : (
              <View style={styles.framedQR}>
                <QRCode
                  value={destination}
                  size={240}
                  color={qrColor}
                  backgroundColor={backgroundColor}
                />

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
              </View>
            )}

            <Text
              style={[
                styles.qrName,
                {
                  color: qrColor,
                },
              ]}
            >
              {name}
            </Text>
          </View>
        </ViewShot>

        {/* Destination */}

        <View style={styles.destinationCard}>
          <View style={styles.destinationIcon}>
            <Ionicons
              name="link-outline"
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
              numberOfLines={2}
            >
              {destination}
            </Text>
          </View>
        </View>

        {/* Design Summary */}

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>
            Design
          </Text>

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
                Custom
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
                    backgroundColor:
                      backgroundColor,
                  },
                ]}
              />

              <Text style={styles.summaryValue}>
                Custom
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

        {/* Edit */}

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
            Edit Design
          </Text>
        </Pressable>

        {/* Actions */}

        <View style={styles.actions}>
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={({ pressed }) => [
              styles.primaryButton,
              {
                backgroundColor: qrColor,
              },
              pressed && styles.pressed,
              saving && styles.disabled,
            ]}
          >
            <Ionicons
              name="download-outline"
              size={20}
              color="#FFFFFF"
            />

            <Text style={styles.primaryText}>
              {saving ? "Preparing..." : "Save QR"}
            </Text>
          </Pressable>

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

  captureContainer: {
    borderRadius: 24,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },

  qrCard: {
    width: "100%",
    minHeight: 340,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
  },

  framedQR: {
    alignItems: "center",
  },

  frameLabel: {
    marginTop: 6,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 9,
  },

  frameText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  qrName: {
    marginTop: SPACING.lg,
    fontSize: 16,
    fontWeight: "800",
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
    backgroundColor: "#EFF6FF",
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
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
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
    color: "#FFFFFF",
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

  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },

  disabled: {
    opacity: 0.6,
  },
});