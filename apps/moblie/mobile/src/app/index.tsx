import { router } from "expo-router";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Button from "../components/ui/Button";
import { COLORS } from "../constants/colors";
import { SPACING } from "../constants/spacing";

export default function Index() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        <View>
          <Text style={styles.logo}>TapQR</Text>

          <Text style={styles.title}>
            Everything your business needs,
            {"\n"}
            behind one QR code.
          </Text>

          <Text style={styles.subtitle}>
            Create QR codes, manage your business,
            and understand your customers.
          </Text>
        </View>

        <View>
          <Button
            title="Get Started"
            onPress={() => router.push("/welcome")}
          />

          <Text style={styles.loginText}>
            Already have an account?
          </Text>

          <Button
            title="Sign In"
            onPress={() => router.push("/login")}
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
    color: COLORS.primary,
    marginBottom: SPACING.huge,
  },

  title: {
    fontSize: 34,
    lineHeight: 42,
    fontWeight: "700",
    color: COLORS.text,
  },

  subtitle: {
    marginTop: SPACING.lg,
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.textSecondary,
  },

  loginText: {
    textAlign: "center",
    marginVertical: SPACING.md,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
});