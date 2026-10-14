import { Ionicons } from "@expo/vector-icons";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { COLORS } from "../../constants/colors";
import { SPACING } from "../../constants/spacing";

/*
 * ============================================================
 * ACTIVITY — stub page, faithful replica of the web
 * dashboard /dashboard/activity.
 * ============================================================
 *
 * The website page is a stub: header + empty state
 * ("No activity yet", "Activity tracking coming next")
 * with zero API calls. This screen mirrors it exactly —
 * no network requests here.
 */

export default function ActivityScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          styles.content
        }
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.badge}>
            <Ionicons
              name="pulse-outline"
              size={14}
              color={COLORS.primary}
            />

            <Text style={styles.badgeText}>
              Activity
            </Text>
          </View>

          <Text style={styles.title}>
            Activity
          </Text>

          <Text style={styles.subtitle}>
            Keep track of activity across
            your TapQR workspace.
          </Text>
        </View>

        {/* EMPTY STATE */}
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name="time-outline"
              size={28}
              color={COLORS.textSecondary}
            />
          </View>

          <Text style={styles.emptyTitle}>
            No activity yet
          </Text>

          <Text style={styles.emptyText}>
            Your TapQR activity will
            appear here once you start
            creating businesses, QR
            codes, and receiving scans.
          </Text>

          <View style={styles.comingSoon}>
            <Ionicons
              name="scan-outline"
              size={16}
              color={COLORS.textSecondary}
            />

            <Text
              style={styles.comingSoonText}
            >
              Activity tracking coming next
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scroll: {
    flex: 1,
  },

  content: {
    padding: SPACING.xl,
    paddingBottom: SPACING.huge,
  },

  header: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    borderRadius: 999,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    marginBottom: SPACING.md,
  },

  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: COLORS.primary,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: COLORS.text,
  },

  subtitle: {
    marginTop: SPACING.sm,
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.textSecondary,
  },

  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.huge,
    paddingHorizontal: SPACING.xl,
    alignItems: "center",
  },

  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
    marginBottom: SPACING.lg,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },

  emptyText: {
    marginTop: SPACING.sm,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.textSecondary,
  },

  comingSoon: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },

  comingSoonText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
});
