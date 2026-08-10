import { router } from "expo-router";
import { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const QR_TYPES = [
  "WEBSITE",
  "MENU",
  "REVIEW",
  "SOCIAL",
];

export default function CreateQRScreen() {
  const [name, setName] = useState("");
  const [type, setType] = useState("WEBSITE");
  const [destination, setDestination] = useState("");

  const handleCreate = () => {
    console.log({
      name,
      type,
      destination,
    });

    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>
          Create QR Code
        </Text>

        <Text style={styles.subtitle}>
          Create a QR code for your business.
        </Text>

        <Text style={styles.label}>
          QR Name
        </Text>

        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Restaurant Menu"
          placeholderTextColor="#9CA3AF"
        />

        <Text style={styles.label}>
          QR Type
        </Text>

        <View style={styles.typeContainer}>
          {QR_TYPES.map((item) => {
            const selected = item === type;

            return (
              <TouchableOpacity
                key={item}
                style={[
                  styles.typeButton,
                  selected && styles.selectedType,
                ]}
                onPress={() => setType(item)}
              >
                <Text
                  style={[
                    styles.typeText,
                    selected &&
                      styles.selectedTypeText,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>
          Destination
        </Text>

        <TextInput
          style={[
            styles.input,
            styles.destinationInput,
          ]}
          value={destination}
          onChangeText={setDestination}
          placeholder="https://example.com"
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />

        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreate}
        >
          <Text style={styles.createButtonText}>
            Create QR Code
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#111827",
  },

  subtitle: {
    marginTop: 6,
    marginBottom: 30,
    fontSize: 14,
    color: "#6B7280",
  },

  label: {
    marginBottom: 8,
    marginTop: 18,
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },

  input: {
    height: 52,
    paddingHorizontal: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
    fontSize: 15,
    color: "#111827",
  },

  destinationInput: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 15,
  },

  typeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  typeButton: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
  },

  selectedType: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },

  typeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
  },

  selectedTypeText: {
    color: "#FFFFFF",
  },

  createButton: {
    marginTop: 32,
    height: 54,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111827",
  },

  createButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});