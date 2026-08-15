import { router } from "expo-router";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import StatCard from "../../components/dashboard/StatCard";
import QuickAction from "../../components/dashboard/QuickAction";

export default function DashboardScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>
              TapQR
            </Text>

            <Text style={styles.title}>
              Good morning 👋
            </Text>

            <Text style={styles.subtitle}>
              Here's your business overview.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Overview
        </Text>

        <View style={styles.row}>
          <StatCard
            title="QR Codes"
            value={12}
            subtitle="Total created"
          />

          <StatCard
            title="Total Scans"
            value="1,248"
            subtitle="All time"
          />
        </View>

        <View style={styles.row}>
          <StatCard
            title="Active"
            value={10}
            subtitle="Currently active"
          />

          <StatCard
            title="Customers"
            value={486}
            subtitle="Engaged users"
          />
        </View>

        <Text style={styles.sectionTitle}>
          Quick Actions
        </Text>

        <QuickAction
          title="+ Create QR Code"
          subtitle="Create a new QR code for your business"
          onPress={() => {
            console.log("Create QR");
          }}
        />

        <QuickAction
          title="▣ View QR Codes"
          subtitle="Manage your existing QR codes"
          onPress={() => {
            console.log("View QR codes");
          }}
        />

        <QuickAction
          title="Analytics"
          subtitle="See scans and customer activity"
          onPress={() => {
            console.log("Analytics");
          }}
        />

        <Text style={styles.sectionTitle}>
          Recent Activity
        </Text>

        <View style={styles.activityCard}>
          <Text style={styles.activityTitle}>
            QR code scanned
          </Text>

          <Text style={styles.activityTime}>
            2 minutes ago
          </Text>

          <View style={styles.divider} />

          <Text style={styles.activityTitle}>
            New QR code created
          </Text>

          <Text style={styles.activityTime}>
            1 hour ago
          </Text>
        </View>
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

  header: {
    marginBottom: 28,
  },

  brand: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 18,
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#111827",
  },

  subtitle: {
    marginTop: 6,
    fontSize: 15,
    color: "#6B7280",
  },

  sectionTitle: {
    marginTop: 24,
    marginBottom: 14,
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },

  activityCard: {
    padding: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  activityTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },

  activityTime: {
    marginTop: 4,
    fontSize: 12,
    color: "#6B7280",
  },

  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 16,
  },
});