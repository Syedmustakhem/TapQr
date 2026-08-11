import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import { useState } from "react";

import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { COLORS } from "../../constants/colors";
import { SPACING } from "../../constants/spacing";
import { updateQRCode } from "../../services/qrStorage";

type QRType = "STATIC" | "DYNAMIC";

type DestinationType =
  | "WEBSITE"
  | "WHATSAPP"
  | "INSTAGRAM"
  | "GOOGLE_REVIEW";

export default function EditQRPreviewScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    destination?: string;
    type?: string;
    destinationType?: string;
  }>();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const id = params.id?.toString() || "";

  const name =
    params.name?.toString() ||
    "Untitled QR Code";

  const destination =
    params.destination?.toString() ||
    "https://example.com";

  const type: QRType =
    params.type === "STATIC"
      ? "STATIC"
      : "DYNAMIC";

  const destinationType: DestinationType =
    isDestinationType(
      params.destinationType
    )
      ? params.destinationType
      : "WEBSITE";

  const handleSaveChanges = async () => {
    if (!id) {
      setError(
        "QR code ID is missing."
      );
      return;
    }

    if (saving) {
      return;
    }

    try {
      setError("");
      setSaving(true);

      await updateQRCode(id, {
        name: name.trim(),
        destination: destination.trim(),
        type,
        destinationType,
      });

      console.log(
        "QR Code updated successfully"
      );

      router.replace({
        pathname: "/app/qr-details",
        params: {
          id,
          name: name.trim(),
          destination:
            destination.trim(),
          type,
          destinationType,
        },
      });
    } catch (error) {
      console.error(
        "Failed to update QR code:",
        error
      );

      setError(
        "Unable to update QR code. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* Header */}

        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              pressed &&
                styles.buttonPressed,
            ]}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={COLORS.text}
            />
          </Pressable>

          <Text
            style={styles.headerTitle}
          >
            Preview Changes
          </Text>

          <View
            style={styles.headerSpacer}
          />
        </View>

        {/* Intro */}

        <View style={styles.intro}>
          <Text style={styles.title}>
            Review your changes
          </Text>

          <Text style={styles.subtitle}>
            Make sure everything looks
            correct before saving.
          </Text>
        </View>

        {/* QR */}

        <View
          style={styles.previewCard}
        >
          <View
            style={styles.qrContainer}
          >
            <QRCode
              value={destination}
              size={190}
              backgroundColor={
                COLORS.white
              }
              color={COLORS.black}
            />
          </View>

          <Text style={styles.qrName}>
            {name}
          </Text>

          <View style={styles.badge}>
            <Text
              style={styles.badgeText}
            >
              {type} QR
            </Text>
          </View>
        </View>

        {/* Destination */}

        <View style={styles.section}>
          <Text
            style={styles.sectionTitle}
          >
            Destination
          </Text>

          <View
            style={styles.destinationCard}
          >
            <View
              style={styles.destinationIcon}
            >
              <Ionicons
                name={getDestinationIcon(
                  destinationType
                )}
                size={22}
                color={
                  COLORS.primary
                }
              />
            </View>

            <View
              style={
                styles.destinationContent
              }
            >
              <Text
                style={
                  styles.destinationTitle
                }
              >
                {formatDestinationType(
                  destinationType
                )}
              </Text>

              <Text
                style={
                  styles.destinationValue
                }
                numberOfLines={2}
              >
                {destination}
              </Text>
            </View>
          </View>
        </View>

        {/* Change information */}

        <View style={styles.infoBox}>
          <Ionicons
            name="information-circle-outline"
            size={22}
            color={COLORS.primary}
          />

          <Text
            style={styles.infoText}
          >
            {type === "DYNAMIC"
              ? "This dynamic QR will keep the same QR code while its destination is updated."
              : "This static QR will generate a new QR value when the destination changes."}
          </Text>
        </View>

        {/* Error */}

        {error ? (
          <View
            style={styles.errorBox}
          >
            <Ionicons
              name="alert-circle-outline"
              size={21}
              color={COLORS.danger}
            />

            <Text
              style={styles.errorText}
            >
              {error}
            </Text>
          </View>
        ) : null}

        {/* Actions */}

        <View style={styles.actions}>
          <Pressable
            disabled={saving}
            onPress={() =>
              router.back()
            }
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed &&
                styles.buttonPressed,
            ]}
          >
            <Text
              style={
                styles.secondaryText
              }
            >
              Edit Again
            </Text>
          </Pressable>

          <Pressable
            disabled={saving}
            onPress={handleSaveChanges}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed &&
                styles.buttonPressed,
              saving &&
                styles.primaryButtonDisabled,
            ]}
          >
            {saving ? (
              <ActivityIndicator
                size="small"
                color={COLORS.white}
              />
            ) : (
              <>
                <Ionicons
                  name="checkmark"
                  size={20}
                  color={COLORS.white}
                />

                <Text
                  style={
                    styles.primaryText
                  }
                >
                  Save Changes
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function isDestinationType(
  value?: string
): value is DestinationType {
  return (
    value === "WEBSITE" ||
    value === "WHATSAPP" ||
    value === "INSTAGRAM" ||
    value === "GOOGLE_REVIEW"
  );
}

function getDestinationIcon(
  type: DestinationType
): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case "WHATSAPP":
      return "logo-whatsapp";

    case "INSTAGRAM":
      return "logo-instagram";

    case "GOOGLE_REVIEW":
      return "star-outline";

    default:
      return "globe-outline";
  }
}

function formatDestinationType(
  type: DestinationType
) {
  switch (type) {
    case "WHATSAPP":
      return "WhatsApp";

    case "INSTAGRAM":
      return "Instagram";

    case "GOOGLE_REVIEW":
      return "Google Reviews";

    default:
      return "Website";
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:
      COLORS.background,
  },

  content: {
    padding: SPACING.xl,
    paddingBottom:
      SPACING.huge,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor:
      COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent:
      "center",
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
    marginTop:
      SPACING.xxxl,
    marginBottom:
      SPACING.xxl,
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: COLORS.text,
  },

  subtitle: {
    marginTop:
      SPACING.sm,
    fontSize: 15,
    lineHeight: 22,
    color:
      COLORS.textSecondary,
  },

  previewCard: {
    backgroundColor:
      COLORS.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    padding: SPACING.xxl,
    alignItems: "center",
  },

  qrContainer: {
    width: 220,
    height: 220,
    borderRadius: 18,
    backgroundColor:
      COLORS.white,
    alignItems: "center",
    justifyContent:
      "center",
  },

  qrName: {
    marginTop:
      SPACING.xl,
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
  },

  badge: {
    marginTop:
      SPACING.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor:
      "#DBEAFE",
  },

  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
  },

  section: {
    marginTop:
      SPACING.xxl,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom:
      SPACING.md,
  },

  destinationCard: {
    backgroundColor:
      COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    padding: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
  },

  destinationIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor:
      "#DBEAFE",
    alignItems: "center",
    justifyContent:
      "center",
    marginRight:
      SPACING.md,
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
    lineHeight: 19,
    color:
      COLORS.textSecondary,
  },

  infoBox: {
    marginTop:
      SPACING.xxl,
    padding: SPACING.lg,
    borderRadius: 16,
    backgroundColor:
      "#EFF6FF",
    flexDirection: "row",
    alignItems:
      "flex-start",
  },

  infoText: {
    flex: 1,
    marginLeft:
      SPACING.sm,
    fontSize: 13,
    lineHeight: 20,
    color:
      COLORS.textSecondary,
  },

  errorBox: {
    marginTop:
      SPACING.lg,
    padding: SPACING.md,
    borderRadius: 12,
    backgroundColor:
      "#FEF2F2",
    flexDirection: "row",
    alignItems: "center",
  },

  errorText: {
    flex: 1,
    marginLeft:
      SPACING.sm,
    fontSize: 13,
    color: COLORS.danger,
  },

  actions: {
    flexDirection: "row",
    gap: SPACING.md,
    marginTop:
      SPACING.xxxl,
  },

  secondaryButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    backgroundColor:
      COLORS.surface,
    alignItems: "center",
    justifyContent:
      "center",
  },

  primaryButton: {
    flex: 1.5,
    height: 52,
    borderRadius: 14,
    backgroundColor:
      COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "center",
    gap: 8,
  },

  primaryButtonDisabled: {
    opacity: 0.7,
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
    transform: [
      { scale: 0.98 },
    ],
  },
});