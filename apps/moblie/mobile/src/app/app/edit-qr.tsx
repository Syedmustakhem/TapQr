import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

import { COLORS } from "../../constants/colors";
import { SPACING } from "../../constants/spacing";

export default function EditQRScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    destination?: string;
    type?: string;
    destinationType?: string;
  }>();

  const [name, setName] = useState(
    params.name?.toString() || ""
  );

  const [destination, setDestination] = useState(
    params.destination?.toString() || ""
  );

  const [nameError, setNameError] = useState("");
  const [destinationError, setDestinationError] =
    useState("");

  const [loading, setLoading] = useState(false);

  const handleContinue = () => {
    setNameError("");
    setDestinationError("");

    let hasError = false;

    if (!name.trim()) {
      setNameError("QR code name is required.");
      hasError = true;
    }

    if (!destination.trim()) {
      setDestinationError("Destination is required.");
      hasError = true;
    }

    if (hasError) {
      return;
    }

    setLoading(true);

    router.push({
      pathname: "/app/edit-qr-preview",
      params: {
        id: params.id || "",
        name: name.trim(),
        destination: destination.trim(),
        type: params.type || "DYNAMIC",
        destinationType:
          params.destinationType || "WEBSITE",
      },
    });

    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}

        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={COLORS.text}
            />
          </Pressable>

          <Text style={styles.headerTitle}>
            Edit QR Code
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        {/* Intro */}

        <View style={styles.intro}>
          <Text style={styles.title}>
            Update your QR
          </Text>

          <Text style={styles.subtitle}>
            Change the information linked to this QR
            code.
          </Text>
        </View>

        {/* Form */}

        <View style={styles.form}>
          <Input
            label="QR name"
            value={name}
            onChangeText={setName}
            placeholder="Restaurant Menu"
            autoCapitalize="words"
            error={nameError}
          />

          <Input
            label="Destination"
            value={destination}
            onChangeText={setDestination}
            placeholder="https://example.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            error={destinationError}
          />
        </View>

        {/* QR Type */}

        <View style={styles.typeCard}>
          <View style={styles.typeIcon}>
            <Ionicons
              name="qr-code-outline"
              size={22}
              color={COLORS.primary}
            />
          </View>

          <View style={styles.typeContent}>
            <Text style={styles.typeTitle}>
              {params.type === "STATIC"
                ? "Static QR"
                : "Dynamic QR"}
            </Text>

            <Text style={styles.typeDescription}>
              QR type cannot be changed after creation.
            </Text>
          </View>
        </View>

        {/* Button */}

        <View style={styles.button}>
          <Button
            title="Preview Changes"
            onPress={handleContinue}
            loading={loading}
          />
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

  form: {
    marginTop: SPACING.md,
  },

  typeCard: {
    marginTop: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
  },

  typeIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },

  typeContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },

  typeTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },

  typeDescription: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textSecondary,
  },

  button: {
    marginTop: SPACING.xxxl,
  },

  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
});