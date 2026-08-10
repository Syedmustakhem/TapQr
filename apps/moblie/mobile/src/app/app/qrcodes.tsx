import { router } from "expo-router";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type QRCode = {
  id: string;
  name: string;
  type: string;
  scans: number;
  status: "ACTIVE" | "PAUSED";
};

const mockQRCodes: QRCode[] = [
  {
    id: "1",
    name: "Restaurant Menu",
    type: "MENU",
    scans: 482,
    status: "ACTIVE",
  },
  {
    id: "2",
    name: "Google Review",
    type: "REVIEW",
    scans: 316,
    status: "ACTIVE",
  },
  {
    id: "3",
    name: "Instagram",
    type: "SOCIAL",
    scans: 198,
    status: "PAUSED",
  },
];

export default function QRCodesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>
              QR Codes
            </Text>

            <Text style={styles.subtitle}>
              Create and manage your QR codes.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.createButton}
            onPress={() =>
              router.push("/app/create-qr")
            }
          >
            <Text style={styles.createButtonText}>
              + Create
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>
            Your QR codes
          </Text>

          <Text style={styles.summaryCount}>
            {mockQRCodes.length} codes
          </Text>
        </View>

        {mockQRCodes.map((qr) => (
          <TouchableOpacity
            key={qr.id}
            style={styles.card}
            activeOpacity={0.8}
            onPress={() =>
              router.push(`/app/qr/${qr.id}`)
            }
          >
            <View style={styles.qrIcon}>
              <Text style={styles.qrIconText}>
                QR
              </Text>
            </View>

            <View style={styles.info}>
              <Text style={styles.name}>
                {qr.name}
              </Text>

              <Text style={styles.type}>
                {qr.type}
              </Text>

              <Text style={styles.scans}>
                {qr.scans} scans
              </Text>
            </View>

            <View
              style={[
                styles.status,
                qr.status === "ACTIVE"
                  ? styles.active
                  : styles.paused,
              ]}
            >
              <Text style={styles.statusText}>
                {qr.status}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#111827",
  },

  subtitle: {
    marginTop: 5,
    fontSize: 14,
    color: "#6B7280",
  },

  createButton: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: "#111827",
  },

  createButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  summary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  summaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  summaryCount: {
    fontSize: 13,
    color: "#6B7280",
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 12,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  qrIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
  },

  qrIconText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
  },

  info: {
    flex: 1,
    marginLeft: 14,
  },

  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },

  type: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
  },

  scans: {
    marginTop: 7,
    fontSize: 12,
    color: "#6B7280",
  },

  status: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },

  active: {
    backgroundColor: "#DCFCE7",
  },

  paused: {
    backgroundColor: "#FEF3C7",
  },

  statusText: {
    fontSize: 10,
    fontWeight: "800",
  },
});