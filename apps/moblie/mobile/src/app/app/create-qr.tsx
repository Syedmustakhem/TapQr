import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { COLORS } from "../../constants/colors";
import { SPACING } from "../../constants/spacing";

type QRType = "DYNAMIC" | "STATIC";

type DestinationType =
  | "WEBSITE"
  | "WHATSAPP"
  | "INSTAGRAM"
  | "GOOGLE_REVIEW";

export default function CreateQRScreen() {
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [qrType, setQrType] =
    useState<QRType>("DYNAMIC");

  const [destinationType, setDestinationType] =
    useState<DestinationType>("WEBSITE");

  const [error, setError] = useState("");

  const handleContinue = () => {
    setError("");

    if (!name.trim()) {
      setError("Please enter a QR code name.");
      return;
    }

    if (!destination.trim()) {
      setError("Please enter a destination.");
      return;
    }

    router.push({
      pathname: "/app/qr-preview",
      params: {
        name: name.trim(),
        destination: destination.trim(),
        qrType,
        destinationType,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
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

          <View style={styles.headerContent}>
            <Text style={styles.title}>
              Create QR Code
            </Text>

            <Text style={styles.subtitle}>
              Create a QR code for your business.
            </Text>
          </View>
        </View>

        {/* QR Name */}

        <View style={styles.section}>
          <Text style={styles.label}>
            QR Code Name
          </Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Restaurant Menu"
            placeholderTextColor={COLORS.textMuted}
            style={styles.input}
          />
        </View>

        {/* QR Type */}

        <View style={styles.section}>
          <Text style={styles.label}>
            QR Type
          </Text>

          <View style={styles.typeRow}>
            <TypeCard
              title="Dynamic"
              description="Change destination later"
              icon="sync-outline"
              selected={qrType === "DYNAMIC"}
              onPress={() =>
                setQrType("DYNAMIC")
              }
            />

            <TypeCard
              title="Static"
              description="Destination cannot change"
              icon="lock-closed-outline"
              selected={qrType === "STATIC"}
              onPress={() =>
                setQrType("STATIC")
              }
            />
          </View>
        </View>

        {/* Destination */}

        <View style={styles.section}>
          <Text style={styles.label}>
            Destination
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={
              styles.destinationTypes
            }
          >
            <DestinationButton
              title="Website"
              icon="globe-outline"
              selected={
                destinationType === "WEBSITE"
              }
              onPress={() =>
                setDestinationType("WEBSITE")
              }
            />

            <DestinationButton
              title="WhatsApp"
              icon="logo-whatsapp"
              selected={
                destinationType === "WHATSAPP"
              }
              onPress={() =>
                setDestinationType("WHATSAPP")
              }
            />

            <DestinationButton
              title="Instagram"
              icon="logo-instagram"
              selected={
                destinationType === "INSTAGRAM"
              }
              onPress={() =>
                setDestinationType("INSTAGRAM")
              }
            />

            <DestinationButton
              title="Reviews"
              icon="star-outline"
              selected={
                destinationType === "GOOGLE_REVIEW"
              }
              onPress={() =>
                setDestinationType(
                  "GOOGLE_REVIEW"
                )
              }
            />
          </ScrollView>

          <TextInput
            value={destination}
            onChangeText={setDestination}
            placeholder={getPlaceholder(
              destinationType
            )}
            placeholderTextColor={COLORS.textMuted}
            style={[
              styles.input,
              styles.destinationInput,
            ]}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType={
              destinationType === "WEBSITE"
                ? "url"
                : "default"
            }
          />
        </View>

        {/* Error */}

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons
              name="alert-circle-outline"
              size={20}
              color={COLORS.danger}
            />

            <Text style={styles.errorText}>
              {error}
            </Text>
          </View>
        ) : null}

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

        {/* Continue */}

        <Pressable
          onPress={handleContinue}
          style={({ pressed }) => [
            styles.continueButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.continueText}>
            Continue
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

function TypeCard({
  title,
  description,
  icon,
  selected,
  onPress,
}: {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.typeCard,
        selected && styles.typeCardSelected,
      ]}
    >
      <View
        style={[
          styles.typeIcon,
          selected && styles.typeIconSelected,
        ]}
      >
        <Ionicons
          name={icon}
          size={21}
          color={
            selected
              ? COLORS.white
              : COLORS.primary
          }
        />
      </View>

      <Text style={styles.typeTitle}>
        {title}
      </Text>

      <Text style={styles.typeDescription}>
        {description}
      </Text>

      {selected ? (
        <View style={styles.selectedCheck}>
          <Ionicons
            name="checkmark"
            size={14}
            color={COLORS.white}
          />
        </View>
      ) : null}
    </Pressable>
  );
}

function DestinationButton({
  title,
  icon,
  selected,
  onPress,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.destinationButton,
        selected &&
          styles.destinationButtonSelected,
      ]}
    >
      <Ionicons
        name={icon}
        size={18}
        color={
          selected
            ? COLORS.white
            : COLORS.textSecondary
        }
      />

      <Text
        style={[
          styles.destinationButtonText,
          selected &&
            styles.destinationButtonTextSelected,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

function getPlaceholder(
  type: DestinationType
) {
  switch (type) {
    case "WHATSAPP":
      return "Enter WhatsApp number";

    case "INSTAGRAM":
      return "Enter Instagram profile URL";

    case "GOOGLE_REVIEW":
      return "Enter Google review URL";

    default:
      return "https://example.com";
  }
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
    marginRight: SPACING.md,
  },

  headerContent: {
    flex: 1,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.text,
  },

  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  section: {
    marginTop: SPACING.xxl,
  },

  label: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },

  input: {
    height: 54,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: SPACING.lg,
    fontSize: 15,
    color: COLORS.text,
  },

  destinationInput: {
    marginTop: SPACING.md,
  },

  typeRow: {
    flexDirection: "row",
    gap: SPACING.md,
  },

  typeCard: {
    flex: 1,
    minHeight: 145,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: SPACING.lg,
    position: "relative",
  },

  typeCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "#EFF6FF",
  },

  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },

  typeIconSelected: {
    backgroundColor: COLORS.primary,
  },

  typeTitle: {
    marginTop: SPACING.md,
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },

  typeDescription: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.textSecondary,
  },

  selectedCheck: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  destinationTypes: {
    gap: SPACING.sm,
  },

  destinationButton: {
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  destinationButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  destinationButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },

  destinationButtonTextSelected: {
    color: COLORS.white,
  },

  errorBox: {
    marginTop: SPACING.lg,
    padding: SPACING.md,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    flexDirection: "row",
    alignItems: "center",
  },

  errorText: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: 13,
    color: COLORS.danger,
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

  continueButton: {
    height: 54,
    marginTop: SPACING.xxl,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },

  continueText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.white,
  },

  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
});