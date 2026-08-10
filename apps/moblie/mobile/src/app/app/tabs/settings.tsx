import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import { COLORS } from "../../../constants/colors";

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Settings
      </Text>

      <Text style={styles.subtitle}>
        Manage your TapQR account and preferences.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 24,
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: COLORS.text,
  },

  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: COLORS.textSecondary,
  },
});