import { router } from "expo-router";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

import { COLORS } from "../../constants/colors";
import { SPACING } from "../../constants/spacing";

export default function BusinessScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View>
          <Text style={styles.title}>
            Your business
          </Text>

          <Text style={styles.subtitle}>
            Set up your business information.
          </Text>

          <View style={styles.form}>
            <Input
              label="Business name"
              placeholder="Enter business name"
            />

            <Input
              label="Business email"
              placeholder="business@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="Phone number"
              placeholder="+91 XXXXX XXXXX"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <Button
          title="Save Business"
          onPress={() =>
            router.replace("/app/business")
          }
        />
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
    padding: SPACING.xxxl,
    justifyContent: "space-between",
  },

  title: {
    fontSize: 32,
    fontWeight: "700",
    color: COLORS.text,
  },

  subtitle: {
    marginTop: SPACING.sm,
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.textSecondary,
  },

  form: {
    marginTop: SPACING.xxxl,
  },
});