import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

import { COLORS } from "../../constants/colors";
import { SPACING } from "../../constants/spacing";

const QR_COLORS = [
  "#111827",
  "#000000",
  "#2563EB",
  "#7C3AED",
  "#DB2777",
  "#DC2626",
  "#059669",
];

const BACKGROUND_COLORS = [
  "#FFFFFF",
  "#F8FAFC",
  "#F1F5F9",
  "#FEF3C7",
  "#DBEAFE",
  "#FCE7F3",
  "#DCFCE7",
];

const FRAMES = [
  "None",
  "Scan Me",
  "Tap to Scan",
  "Open Link",
];

export default function QRDesignScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    destination?: string;
  }>();

  const qrId = params.id?.toString() || "";

  const destination =
    params.destination?.toString() ||
    "https://tapqr.app";

  const initialName =
    params.name?.toString() ||
    "My QR Code";

  const [qrName, setQrName] =
    React.useState(initialName);

  const [qrColor, setQrColor] =
    React.useState("#111827");

  const [backgroundColor, setBackgroundColor] =
    React.useState("#FFFFFF");

  const [selectedFrame, setSelectedFrame] =
    React.useState("None");

  const handleReset = () => {
    setQrName(initialName);
    setQrColor("#111827");
    setBackgroundColor("#FFFFFF");
    setSelectedFrame("None");
  };

  const handlePreview = () => {
    router.push({
      pathname: "/app/qr-preview",
      params: {
        id: qrId,
        name: qrName,
        destination,
        qrColor,
        backgroundColor,
        frame: selectedFrame,
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

          <Text style={styles.headerTitle}>
            Design Studio
          </Text>

          <Pressable
            onPress={handleReset}
            style={({ pressed }) => [
              styles.resetButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.resetText}>
              Reset
            </Text>
          </Pressable>
        </View>

        {/* INTRO */}

        <View style={styles.intro}>
          <Text style={styles.title}>
            Customize your QR
          </Text>

          <Text style={styles.subtitle}>
            Create a QR design that matches your
            brand.
          </Text>
        </View>

        {/* LIVE PREVIEW */}

        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>
              Live Preview
            </Text>

            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />

              <Text style={styles.liveText}>
                LIVE
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.qrArea,
              {
                backgroundColor,
              },
            ]}
          >
            <View style={styles.qrWrapper}>
              <QRCode
                value={destination}
                size={190}
                color={qrColor}
                backgroundColor={backgroundColor}
              />
            </View>

            {selectedFrame !== "None" && (
              <View
                style={[
                  styles.frameBadge,
                  {
                    backgroundColor: qrColor,
                  },
                ]}
              >
                <Text style={styles.frameText}>
                  {selectedFrame}
                </Text>
              </View>
            )}

            <Text
              style={[
                styles.previewName,
                {
                  color: qrColor,
                },
              ]}
            >
              {qrName || "My QR Code"}
            </Text>
          </View>
        </View>

        {/* QR NAME */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            QR Name
          </Text>

          <Text style={styles.sectionSubtitle}>
            Give this QR code a recognizable name.
          </Text>

          <TextInput
            value={qrName}
            onChangeText={setQrName}
            placeholder="Enter QR name"
            placeholderTextColor={
              COLORS.textSecondary
            }
            style={styles.input}
            maxLength={40}
          />
        </View>

        {/* QR COLOR */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            QR Color
          </Text>

          <Text style={styles.sectionSubtitle}>
            Choose the main color of your QR code.
          </Text>

          <View style={styles.colorGrid}>
            {QR_COLORS.map((color) => {
              const selected =
                qrColor === color;

              return (
                <Pressable
                  key={color}
                  onPress={() =>
                    setQrColor(color)
                  }
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
                  />

                  {selected && (
                    <View style={styles.check}>
                      <Ionicons
                        name="checkmark"
                        size={13}
                        color="#FFFFFF"
                      />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* BACKGROUND */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Background
          </Text>

          <Text style={styles.sectionSubtitle}>
            Select a background that keeps your
            QR easy to scan.
          </Text>

          <View style={styles.colorGrid}>
            {BACKGROUND_COLORS.map((color) => {
              const selected =
                backgroundColor === color;

              return (
                <Pressable
                  key={color}
                  onPress={() =>
                    setBackgroundColor(color)
                  }
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
                  />

                  {selected && (
                    <View
                      style={[
                        styles.check,
                        {
                          backgroundColor:
                            qrColor,
                        },
                      ]}
                    >
                      <Ionicons
                        name="checkmark"
                        size={13}
                        color="#FFFFFF"
                      />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* FRAME */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Frame
          </Text>

          <Text style={styles.sectionSubtitle}>
            Add a simple call-to-action below
            your QR.
          </Text>

          <View style={styles.frameGrid}>
            {FRAMES.map((frame) => {
              const selected =
                selectedFrame === frame;

              return (
                <Pressable
                  key={frame}
                  onPress={() =>
                    setSelectedFrame(frame)
                  }
                  style={[
                    styles.frameOption,
                    selected && {
                      borderColor: qrColor,
                      backgroundColor: `${qrColor}10`,
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
                    {frame}
                  </Text>

                  {selected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={qrColor}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* INFO */}

        <View style={styles.infoBox}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={COLORS.primary}
          />

          <Text style={styles.infoText}>
            Keep strong contrast between the QR
            code and background for reliable
            scanning.
          </Text>
        </View>

        {/* PREVIEW BUTTON */}

        <Pressable
          onPress={handlePreview}
          style={({ pressed }) => [
            styles.previewButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.previewButtonText}>
            Continue to Preview
          </Text>

          <Ionicons
            name="arrow-forward"
            size={20}
            color={COLORS.white}
          />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================================================= */
/* STYLES                                            */
/* ================================================= */

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

  resetButton: {
    minWidth: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  resetText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
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
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },

  previewHeader: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  previewTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
  },

  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#DCFCE7",
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#16A34A",
    marginRight: 5,
  },

  liveText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#15803D",
  },

  qrArea: {
    minHeight: 330,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
  },

  qrWrapper: {
    padding: 13,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  frameBadge: {
    marginTop: 10,
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 8,
  },

  frameText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },

  previewName: {
    marginTop: SPACING.md,
    fontSize: 15,
    fontWeight: "800",
  },

  section: {
    marginTop: SPACING.xxl,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.text,
  },

  sectionSubtitle: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
  },

  input: {
    height: 52,
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 14,
    color: COLORS.text,
  },

  colorGrid: {
    marginTop: SPACING.md,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },

  colorOptionSelected: {
    borderColor: COLORS.primary,
  },

  colorCircle: {
    width: 31,
    height: 31,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },

  check: {
    position: "absolute",
    right: 2,
    top: 2,
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  frameGrid: {
    marginTop: SPACING.md,
    gap: 10,
  },

  frameOption: {
    minHeight: 50,
    paddingHorizontal: SPACING.lg,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  frameOptionText: {
    fontSize: 14,
    color: COLORS.text,
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
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textSecondary,
  },

  previewButton: {
    height: 54,
    marginTop: SPACING.xxl,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  previewButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.white,
  },

  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
});