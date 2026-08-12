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

const COLOR_OPTIONS = [
  "#111827",
  "#2563EB",
  "#7C3AED",
  "#DB2777",
  "#059669",
  "#EA580C",
];

const BACKGROUND_OPTIONS = [
  "#FFFFFF",
  "#F8FAFC",
  "#EFF6FF",
  "#F5F3FF",
];

const FRAME_OPTIONS = [
  "None",
  "Scan Me",
  "Scan Here",
  "Tap to Scan",
];

export default function QRDesignScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    destination?: string;
  }>();

  const [qrColor, setQrColor] = useState("#111827");
  const [backgroundColor, setBackgroundColor] =
    useState("#FFFFFF");

  const [frame, setFrame] = useState("None");

  const destination =
    params.destination?.toString() ||
    "https://tapqr.app";

  const qrSize = useMemo(() => {
    return 220;
  }, []);

  const handleContinue = () => {
    router.push({
      pathname: "/app/qr-preview",
      params: {
        id: params.id || "",
        name: params.name || "My QR Code",
        destination,
        qrColor,
        backgroundColor,
        frame,
      },
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
            QR Design
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        {/* Intro */}

        <View style={styles.intro}>
          <Text style={styles.title}>
            Customize your QR
          </Text>

          <Text style={styles.subtitle}>
            Make your QR code match your brand.
          </Text>
        </View>

        {/* QR Preview */}

        <View
          style={[
            styles.previewCard,
            {
              backgroundColor,
            },
          ]}
        >
          {frame === "None" ? (
            <QRCode
              value={destination}
              size={qrSize}
              color={qrColor}
              backgroundColor={backgroundColor}
            />
          ) : (
            <View style={styles.framedQr}>
              <QRCode
                value={destination}
                size={qrSize}
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
                <Text style={styles.frameLabelText}>
                  {frame}
                </Text>
              </View>
            </View>
          )}

          <Text
            style={[
              styles.previewName,
              { color: qrColor },
            ]}
          >
            {params.name || "My QR Code"}
          </Text>
        </View>

        {/* QR Color */}

        <Text style={styles.sectionTitle}>
          QR Color
        </Text>

        <View style={styles.colorRow}>
          {COLOR_OPTIONS.map((color) => {
            const selected = qrColor === color;

            return (
              <Pressable
                key={color}
                onPress={() => setQrColor(color)}
                style={[
                  styles.colorButton,
                  {
                    backgroundColor: color,
                  },
                  selected && styles.selectedColor,
                ]}
              >
                {selected && (
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color="#FFFFFF"
                  />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Background */}

        <Text style={styles.sectionTitle}>
          Background
        </Text>

        <View style={styles.backgroundRow}>
          {BACKGROUND_OPTIONS.map((color) => {
            const selected =
              backgroundColor === color;

            return (
              <Pressable
                key={color}
                onPress={() =>
                  setBackgroundColor(color)
                }
                style={[
                  styles.backgroundButton,
                  {
                    backgroundColor: color,
                  },
                  selected &&
                    styles.selectedBackground,
                ]}
              >
                {selected && (
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={qrColor}
                  />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Frame */}

        <Text style={styles.sectionTitle}>
          QR Frame
        </Text>

        <View style={styles.frameOptions}>
          {FRAME_OPTIONS.map((option) => {
            const selected = frame === option;

            return (
              <Pressable
                key={option}
                onPress={() => setFrame(option)}
                style={[
                  styles.frameOption,
                  selected && {
                    borderColor: qrColor,
                    backgroundColor:
                      backgroundColor === "#FFFFFF"
                        ? "#F8FAFC"
                        : backgroundColor,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.frameOptionText,
                    selected && {
                      color: qrColor,
                      fontWeight: "800",
                    },
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Continue */}

        <Pressable
          onPress={handleContinue}
          style={({ pressed }) => [
            styles.continueButton,
            {
              backgroundColor: qrColor,
            },
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.continueText}>
            Continue
          </Text>

          <Ionicons
            name="arrow-forward"
            size={20}
            color="#FFFFFF"
          />
        </Pressable>
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

  framedQr: {
    alignItems: "center",
  },

  frameLabel: {
    marginTop: -2,
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 8,
  },

  frameLabelText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  previewName: {
    marginTop: SPACING.lg,
    fontSize: 15,
    fontWeight: "800",
  },

  sectionTitle: {
    marginTop: SPACING.xxl,
    marginBottom: SPACING.md,
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.text,
  },

  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },

  colorButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "transparent",
  },

  selectedColor: {
    borderColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },

  backgroundRow: {
    flexDirection: "row",
    gap: 14,
  },

  backgroundButton: {
    width: 54,
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  selectedBackground: {
    borderWidth: 2,
  },

  frameOptions: {
    gap: 10,
  },

  frameOption: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.lg,
  },

  frameOptionText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "600",
  },

  continueButton: {
    height: 54,
    borderRadius: 15,
    marginTop: SPACING.xxxl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  continueText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
});