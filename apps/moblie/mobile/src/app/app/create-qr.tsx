import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
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
  | "MENU"
  | "SOCIAL"
  | "WHATSAPP"
  | "CUSTOM";

const DESTINATIONS: {
  type: DestinationType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    type: "WEBSITE",
    label: "Website",
    icon: "globe-outline",
  },
  {
    type: "MENU",
    label: "Menu",
    icon: "restaurant-outline",
  },
  {
    type: "SOCIAL",
    label: "Social",
    icon: "share-social-outline",
  },
  {
    type: "WHATSAPP",
    label: "WhatsApp",
    icon: "logo-whatsapp",
  },
  {
    type: "CUSTOM",
    label: "Custom",
    icon: "link-outline",
  },
];

export default function CreateQRScreen() {
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [qrType, setQrType] = useState<QRType>("DYNAMIC");
  const [destinationType, setDestinationType] =
    useState<DestinationType>("WEBSITE");

  const [showErrors, setShowErrors] = useState(false);

  const nameError =
    showErrors && name.trim().length === 0;

  const destinationError =
    showErrors && destination.trim().length === 0;

  const isValid = useMemo(() => {
    return (
      name.trim().length > 0 &&
      destination.trim().length > 0
    );
  }, [name, destination]);

  const getPlaceholder = () => {
    switch (destinationType) {
      case "MENU":
        return "https://yourbusiness.com/menu";

      case "SOCIAL":
        return "https://instagram.com/yourbusiness";

      case "WHATSAPP":
        return "https://wa.me/919999999999";

      case "CUSTOM":
        return "Enter your destination URL";

      default:
        return "https://yourwebsite.com";
    }
  };

  const handleCreate = () => {
    if (!isValid) {
      setShowErrors(true);
      return;
    }

    router.push({
      pathname: "/app/qr-preview",
      params: {
        name: name.trim(),
        destination: destination.trim(),
        type: qrType,
        destinationType,
      },
    });
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}

          <View style={styles.header}>
            <Pressable
              onPress={handleBack}
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

            <View style={styles.headerText}>
              <Text style={styles.title}>
                Create QR Code
              </Text>

              <Text style={styles.subtitle}>
                Create a QR code for your business.
              </Text>
            </View>
          </View>

          {/* QR TYPE */}

          <Text style={styles.sectionTitle}>
            QR Type
          </Text>

          <View style={styles.typeContainer}>
            <TypeButton
              icon="flash-outline"
              title="Dynamic"
              description="Edit destination later"
              active={qrType === "DYNAMIC"}
              onPress={() =>
                setQrType("DYNAMIC")
              }
            />

            <TypeButton
              icon="lock-closed-outline"
              title="Static"
              description="Destination is permanent"
              active={qrType === "STATIC"}
              onPress={() =>
                setQrType("STATIC")
              }
            />
          </View>

          {/* QR NAME */}

          <Text style={styles.sectionTitle}>
            QR Code Name
          </Text>

          <View
            style={[
              styles.inputContainer,
              nameError && styles.inputError,
            ]}
          >
            <Ionicons
              name="pricetag-outline"
              size={19}
              color={
                nameError
                  ? "#DC2626"
                  : COLORS.textMuted
              }
            />

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Example: Restaurant Menu"
              placeholderTextColor={
                COLORS.textMuted
              }
              style={styles.input}
              maxLength={60}
            />
          </View>

          {nameError && (
            <Text style={styles.errorText}>
              Enter a name for your QR code.
            </Text>
          )}

          {/* DESTINATION TYPE */}

          <Text style={styles.sectionTitle}>
            Destination
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={
              styles.destinationScroll
            }
          >
            {DESTINATIONS.map((item) => (
              <DestinationButton
                key={item.type}
                icon={item.icon}
                label={item.label}
                active={
                  destinationType === item.type
                }
                onPress={() => {
                  setDestinationType(
                    item.type
                  );
                  setDestination("");
                }}
              />
            ))}
          </ScrollView>

          {/* DESTINATION INPUT */}

          <View
            style={[
              styles.inputContainer,
              styles.destinationInput,
              destinationError &&
                styles.inputError,
            ]}
          >
            <Ionicons
              name={
                destinationType ===
                "WHATSAPP"
                  ? "logo-whatsapp"
                  : "link-outline"
              }
              size={19}
              color={
                destinationError
                  ? "#DC2626"
                  : COLORS.textMuted
              }
            />

            <TextInput
              value={destination}
              onChangeText={setDestination}
              placeholder={getPlaceholder()}
              placeholderTextColor={
                COLORS.textMuted
              }
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
          </View>

          {destinationError && (
            <Text style={styles.errorText}>
              Enter a destination for your QR
              code.
            </Text>
          )}

          {/* INFO */}

          <View style={styles.infoBox}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={COLORS.primary}
            />

            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>
                {qrType === "DYNAMIC"
                  ? "Dynamic QR"
                  : "Static QR"}
              </Text>

              <Text style={styles.infoText}>
                {qrType === "DYNAMIC"
                  ? "You can change the destination later without printing a new QR code."
                  : "The destination is embedded directly into the QR code and cannot be changed later."}
              </Text>
            </View>
          </View>

          {/* PREVIEW SUMMARY */}

          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Ionicons
                name="qr-code-outline"
                size={25}
                color={COLORS.primary}
              />
            </View>

            <View style={styles.summaryContent}>
              <Text style={styles.summaryTitle}>
                Ready to create
              </Text>

              <Text
                style={styles.summaryText}
                numberOfLines={2}
              >
                {name.trim() ||
                  "Your QR code name"}
              </Text>

              <Text
                style={styles.summaryDestination}
                numberOfLines={1}
              >
                {destination.trim() ||
                  "Your destination will appear here"}
              </Text>
            </View>
          </View>

          {/* CREATE */}

          <Pressable
            onPress={handleCreate}
            style={({ pressed }) => [
              styles.createButton,
              !isValid &&
                styles.createButtonDisabled,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="qr-code-outline"
              size={20}
              color={COLORS.white}
            />

            <Text style={styles.createButtonText}>
              Continue to Preview
            </Text>

            <Ionicons
              name="arrow-forward"
              size={19}
              color={COLORS.white}
            />
          </Pressable>

          <Text style={styles.footerText}>
            You can review your QR before saving
            it.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* -------------------------------------------------- */
/* TYPE BUTTON */
/* -------------------------------------------------- */

function TypeButton({
  icon,
  title,
  description,
  active,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.typeButton,
        active && styles.typeButtonActive,
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.typeIcon,
          active && styles.typeIconActive,
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={
            active
              ? COLORS.white
              : COLORS.textSecondary
          }
        />
      </View>

      <View style={styles.typeContent}>
        <Text
          style={[
            styles.typeTitle,
            active && styles.typeTitleActive,
          ]}
        >
          {title}
        </Text>

        <Text style={styles.typeDescription}>
          {description}
        </Text>
      </View>

      <View
        style={[
          styles.radio,
          active && styles.radioActive,
        ]}
      >
        {active && (
          <View style={styles.radioInner} />
        )}
      </View>
    </Pressable>
  );
}

/* -------------------------------------------------- */
/* DESTINATION BUTTON */
/* -------------------------------------------------- */

function DestinationButton({
  icon,
  label,
  active,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.destinationButton,
        active &&
          styles.destinationButtonActive,
        pressed && styles.pressed,
      ]}
    >
      <Ionicons
        name={icon}
        size={18}
        color={
          active
            ? COLORS.primary
            : COLORS.textSecondary
        }
      />

      <Text
        style={[
          styles.destinationButtonText,
          active &&
            styles.destinationButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/* -------------------------------------------------- */
/* STYLES */
/* -------------------------------------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  keyboard: {
    flex: 1,
  },

  content: {
    padding: SPACING.xl,
    paddingBottom: SPACING.huge,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.xxl,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },

  headerText: {
    flex: 1,
  },

  title: {
    fontSize: 27,
    fontWeight: "800",
    color: COLORS.text,
  },

  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  sectionTitle: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.text,
  },

  typeContainer: {
    gap: SPACING.md,
  },

  typeButton: {
    minHeight: 82,
    padding: SPACING.md,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    flexDirection: "row",
    alignItems: "center",
  },

  typeButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: "#F5F3FF",
  },

  typeIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },

  typeIconActive: {
    backgroundColor: COLORS.primary,
  },

  typeContent: {
    flex: 1,
  },

  typeTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
  },

  typeTitleActive: {
    color: COLORS.primary,
  },

  typeDescription: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
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

  radioActive: {
    borderColor: COLORS.primary,
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },

  inputContainer: {
    minHeight: 54,
    paddingHorizontal: SPACING.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    flexDirection: "row",
    alignItems: "center",
  },

  inputError: {
    borderColor: "#DC2626",
  },

  input: {
    flex: 1,
    marginLeft: SPACING.sm,
    paddingVertical: 0,
    fontSize: 14,
    color: COLORS.text,
  },

  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: "#DC2626",
  },

  destinationScroll: {
    paddingBottom: 4,
    gap: SPACING.sm,
  },

  destinationButton: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  destinationButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: "#F5F3FF",
  },

  destinationButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },

  destinationButtonTextActive: {
    color: COLORS.primary,
  },

  destinationInput: {
    marginTop: SPACING.sm,
  },

  infoBox: {
    marginTop: SPACING.xxl,
    padding: SPACING.lg,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    flexDirection: "row",
    alignItems: "flex-start",
  },

  infoContent: {
    flex: 1,
    marginLeft: SPACING.sm,
  },

  infoTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.text,
  },

  infoText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textSecondary,
  },

  summaryCard: {
    marginTop: SPACING.xxl,
    padding: SPACING.lg,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
  },

  summaryIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: "#F5F3FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },

  summaryContent: {
    flex: 1,
  },

  summaryTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.text,
  },

  summaryText: {
    marginTop: 3,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },

  summaryDestination: {
    marginTop: 3,
    fontSize: 11,
    color: COLORS.textSecondary,
  },

  createButton: {
    minHeight: 54,
    marginTop: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },

  createButtonDisabled: {
    opacity: 0.55,
  },

  createButtonText: {
    flex: 1,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.white,
  },

  footerText: {
    marginTop: SPACING.md,
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
  },

  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
});