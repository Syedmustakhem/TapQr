import { router } from "expo-router";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Button from "../../components/ui/Button";
import { COLORS } from "../../constants/colors";
import { SPACING } from "../../constants/spacing";

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View>
          <Text style={styles.logo}>TapQR</Text>

          <Text style={styles.title}>
            Welcome to TapQR
          </Text>

          <Text style={styles.subtitle}>
            Manage your QR-powered business
            from one simple app.
          </Text>
        </View>

        <View>
          <Button
            title="Create Account"
            onPress={() => router.push("/(auth)/register")}
          />

          <View style={{ height: SPACING.md }} />

          <Button
            title="I Already Have an Account"
            onPress={() => router.push("/(auth)/login")}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    flex: 1,
    justifyContent: "space-between",
    padding: SPACING.xxxl,
    paddingBottom: SPACING.huge,
  },

  logo: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: SPACING.huge,
    color: COLORS.primary,
  },

  title: {
    fontSize: 32,
    fontWeight: "700",
    color: COLORS.text,
  },

  subtitle: {
    marginTop: SPACING.md,
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.textSecondary,
  },
});