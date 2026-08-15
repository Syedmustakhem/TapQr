import { StyleSheet, Text, View } from "react-native";

export default function ExploreScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>TapQR</Text>
      <Text style={styles.subtitle}>
        Explore
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#111111",
  },

  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: "#6B7280",
  },
});