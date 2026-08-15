import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

import { COLORS } from "../../constants/colors";
import { SPACING } from "../../constants/spacing";

const QR_COLORS = [
  "#111827",
  "#2563EB",
  "#7C3AED",
  "#059669",
  "#DC2626",
];

const BACKGROUNDS = [
  {
    name: "White",
    color: "#FFFFFF",
  },
  {
    name: "Soft",
    color: "#F3F4F6",
  },
  {
    name: "Warm",
    color: "#FFF7ED",
  },
];

const QR_STYLES = [
  {
    id: "classic",
    name: "Classic",
    description: "Clean and reliable",
  },
  {
    id: "rounded",
    name: "Rounded",
    description: "Modern appearance",
  },
];

export default function QRCustomizeScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    destination?: string;
    type?: string;
  }>();

  const [qrColor, setQrColor] = useState(
    QR_COLORS[0]
  );

  const [background, setBackground] = useState(
    BACKGROUNDS[0].color
  );

  const [selectedStyle, setSelectedStyle] =
    useState("classic");

  const destination = useMemo(
    () =>
      params.destination?.toString() ||
      "https://example.com",
    [params.destination]
  );

  const qrSize = 210;

  const handleSave = () => {
    router.replace({
      pathname: "/app/qr-details",
      params: {
        id: params.id || "",
        name: params.name || "Untitled QR",
        destination,
        type: params.type || "DYNAMIC",
        scans: "0",
        active: "true",
        qrColor,
        background,
        qrStyle: selectedStyle,
      },
    });
  };

  const handlePremiumLogo = () => {
    router.push({
      pathname: "/app/plans",
    });
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
            Customize QR
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        {/* Intro */}
        <View style={styles.intro}>
          <Text style={styles.title}>
            Make it yours
          </Text>

          <Text style={styles.subtitle}>
            Customize the appearance of your QR
            code while keeping it easy to scan.
          </Text>
        </View>

        {/* QR Preview */}
        <View
          style={[
            styles.previewCard,
            {
              backgroundColor: background,
            },
          ]}
        >
          <View
            style={[
              styles.qrWrapper,
              {
                backgroundColor: background,
              },
            ]}
          >
            <QRCode
              value={destination}
              size={qrSize}
              color={qrColor}
              backgroundColor={background}
            />
          </View>

          <Text style={styles.previewLabel}>
            Live Preview
          </Text>

          <Text
            style={styles.previewName}
            numberOfLines={1}
          >
            {params.name || "Your QR Code"}
          </Text>
        </View>

        {/* QR Color */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            QR Color
          </Text>

          <Text style={styles.sectionDescription}>
            Choose a color for the QR pattern.
          </Text>

          <View style={styles.colorRow}>
            {QR_COLORS.map((color) => {
              const selected =
                qrColor === color;

              return (
                <Pressable
                  key={color}
                  onPress={() => setQrColor(color)}
                  style={[
                    styles.colorOption,
                    selected &&
                      styles.colorOptionSelected,
                  ]}
                >
                  <View
                    style={[
                      styles.colorCircle,
                      {
                        backgroundColor: color,
                      },
                    ]}
                  >
                    {selected && (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color="#FFFFFF"
                      />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Background */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Background
          </Text>

          <Text style={styles.sectionDescription}>
            Select a background that gives the QR
            enough contrast.
          </Text>

          <View style={styles.optionRow}>
            {BACKGROUNDS.map((item) => {
              const selected =
                background === item.color;

              return (
                <Pressable
                  key={item.name}
                  onPress={() =>
                    setBackground(item.color)
                  }
                  style={[
                    styles.backgroundOption,
                    selected &&
                      styles.optionSelected,
                  ]}
                >
                  <View
                    style={[
                      styles.backgroundPreview,
                      {
                        backgroundColor:
                          item.color,
                      },
                    ]}
                  />

                  <Text
                    style={[
                      styles.optionText,
                      selected &&
                        styles.optionTextSelected,
                    ]}
                  >
                    {item.name}
                  </Text>

                  {selected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={COLORS.primary}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* QR Style */}
        <View style={styles.section}>
          <View style={styles.titleRow}>
            <View>
              <Text style={styles.sectionTitle}>
                QR Style
              </Text>

              <Text style={styles.sectionDescription}>
                Choose the visual style of your QR.
              </Text>
            </View>

            <View style={styles.safeBadge}>
              <Ionicons
                name="shield-checkmark-outline"
                size={15}
                color="#15803D"
              />

              <Text style={styles.safeBadgeText}>
                Scan safe
              </Text>
            </View>
          </View>

          <View style={styles.styleList}>
            {QR_STYLES.map((style) => {
              const selected =
                selectedStyle === style.id;

              return (
                <Pressable
                  key={style.id}
                  onPress={() =>
                    setSelectedStyle(style.id)
                  }
                  style={[
                    styles.styleCard,
                    selected &&
                      styles.styleCardSelected,
                  ]}
                >
                  <View
                    style={[
                      styles.styleIcon,
                      selected &&
                        styles.styleIconSelected,
                    ]}
                  >
                    <Ionicons
                      name="grid-outline"
                      size={20}
                      color={
                        selected
                          ? COLORS.white
                          : COLORS.primary
                      }
                    />
                  </View>

                  <View
                    style={styles.styleContent}
                  >
                    <Text
                      style={[
                        styles.styleTitle,
                        selected &&
                          styles.styleTitleSelected,
                      ]}
                    >
                      {style.name}
                    </Text>

                    <Text
                      style={styles.styleDescription}
                    >
                      {style.description}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.radio,
                      selected &&
                        styles.radioSelected,
                    ]}
                  >
                    {selected && (
                      <View
                        style={styles.radioDot}
                      />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Premium Logo */}
        <View style={styles.section}>
          <View style={styles.premiumCard}>
            <View style={styles.premiumIcon}>
              <Ionicons
                name="image-outline"
                size={22}
                color="#7C3AED"
              />
            </View>

            <View style={styles.premiumContent}>
              <View style={styles.premiumTitleRow}>
                <Text style={styles.premiumTitle}>
                  Add your logo
                </Text>

                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>
                    PRO
                  </Text>
                </View>
              </View>

              <Text style={styles.premiumDescription}>
                Put your business logo in the center
                of your QR code.
              </Text>
            </View>

            <Pressable
              onPress={handlePremiumLogo}
              style={styles.unlockButton}
            >
              <Ionicons
                name="lock-closed-outline"
                size={17}
                color={COLORS.primary}
              />
            </Pressable>
          </View>
        </View>

        {/* Save */}
        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [
            styles.saveButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.saveButtonText}>
            Save Design
          </Text>

          <Ionicons
            name="checkmark"
            size={20}
            color={COLORS.white}
          />
        </Pressable>

        <Text style={styles.footerText}>
          Keep strong contrast between the QR and
          its background for reliable scanning.
        </Text>
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

  previewCard: {
    minHeight: 330,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
  },

  qrWrapper: {
    padding: 14,
    borderRadius: 18,
  },

  previewLabel: {
    marginTop: SPACING.lg,
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },

  previewName: {
    marginTop: 5,
    maxWidth: "80%",
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
  },

  section: {
    marginTop: SPACING.xxxl,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
  },

  sectionDescription: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
  },

  colorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    marginTop: SPACING.lg,
  },

  colorOption: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },

  colorOptionSelected: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },

  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  optionRow: {
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },

  backgroundOption: {
    minHeight: 58,
    paddingHorizontal: SPACING.md,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
  },

  optionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "#EFF6FF",
  },

  backgroundPreview: {
    width: 34,
    height: 34,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  optionText: {
    flex: 1,
    marginLeft: SPACING.md,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },

  optionTextSelected: {
    color: COLORS.primary,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: SPACING.sm,
  },

  safeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#DCFCE7",
  },

  safeBadgeText: {
    marginLeft: 4,
    fontSize: 10,
    fontWeight: "800",
    color: "#15803D",
  },

  styleList: {
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },

  styleCard: {
    minHeight: 74,
    padding: SPACING.md,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
  },

  styleCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "#EFF6FF",
  },

  styleIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  styleIconSelected: {
    backgroundColor: COLORS.primary,
  },

  styleContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },

  styleTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
  },

  styleTitleSelected: {
    color: COLORS.primary,
  },

  styleDescription: {
    marginTop: 3,
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  radioSelected: {
    borderColor: COLORS.primary,
  },

  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },

  premiumCard: {
    padding: SPACING.lg,
    borderRadius: 18,
    backgroundColor: "#F5F3FF",
    borderWidth: 1,
    borderColor: "#DDD6FE",
    flexDirection: "row",
    alignItems: "center",
  },

  premiumIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: "#EDE9FE",
    alignItems: "center",
    justifyContent: "center",
  },

  premiumContent: {
    flex: 1,
    marginLeft: SPACING.md,
    marginRight: SPACING.sm,
  },

  premiumTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  premiumTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
  },

  proBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    backgroundColor: "#7C3AED",
  },

  proBadgeText: {
    fontSize: 8,
    fontWeight: "900",
    color: COLORS.white,
  },

  premiumDescription: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.textSecondary,
  },

  unlockButton: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },

  saveButton: {
    height: 54,
    marginTop: SPACING.xxxl,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  saveButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.white,
  },

  footerText: {
    marginTop: SPACING.md,
    fontSize: 11,
    lineHeight: 17,
    color: COLORS.textSecondary,
    textAlign: "center",
  },

  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
});