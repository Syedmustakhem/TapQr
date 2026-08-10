import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { COLORS } from "../../../constants/colors";
import { SPACING } from "../../../constants/spacing";

export default function HomeScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.logo}>
          TapQR
        </Text>

        <Text style={styles.greeting}>
          Good morning 👋
        </Text>

        <Text style={styles.subtitle}>
          Here's your business overview.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>
        Overview
      </Text>

      <View style={styles.grid}>
        <StatCard
          title="QR Codes"
          value="12"
          subtitle="Total created"
        />

        <StatCard
          title="Total Scans"
          value="1,248"
          subtitle="All time"
        />

        <StatCard
          title="Active"
          value="10"
          subtitle="Currently active"
        />

        <StatCard
          title="Customers"
          value="486"
          subtitle="Engaged users"
        />
      </View>

      <Text style={styles.sectionTitle}>
        Quick Actions
      </Text>

      <ActionCard
        icon="+"
        title="Create QR Code"
        description="Create a new QR code for your business"
      />

      <ActionCard
        icon="▣"
        title="View QR Codes"
        description="Manage your existing QR codes"
      />

      <ActionCard
        icon="↗"
        title="View Analytics"
        description="Track scans and customer activity"
      />
    </ScrollView>
  );
}

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statTitle}>
        {title}
      </Text>

      <Text style={styles.statValue}>
        {value}
      </Text>

      <Text style={styles.statSubtitle}>
        {subtitle}
      </Text>
    </View>
  );
}

function ActionCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.actionCard}>
      <View style={styles.actionIcon}>
        <Text style={styles.actionIconText}>
          {icon}
        </Text>
      </View>

      <View style={styles.actionContent}>
        <Text style={styles.actionTitle}>
          {title}
        </Text>

        <Text style={styles.actionDescription}>
          {description}
        </Text>
      </View>
    </View>
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
    marginBottom: SPACING.xxxl,
  },

  logo: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: SPACING.xxl,
  },

  greeting: {
    fontSize: 30,
    fontWeight: "800",
    color: COLORS.text,
  },

  subtitle: {
    marginTop: SPACING.sm,
    fontSize: 15,
    color: COLORS.textSecondary,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.md,
    marginTop: SPACING.lg,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
  },

  statCard: {
    width: "48%",
    minHeight: 145,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  statTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
  },

  statValue: {
    fontSize: 30,
    fontWeight: "800",
    color: COLORS.text,
    marginTop: SPACING.md,
  },

  statSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },

  actionCard: {
    minHeight: 88,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },

  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },

  actionIconText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "700",
  },

  actionContent: {
    flex: 1,
  },

  actionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },

  actionDescription: {
    marginTop: 4,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});