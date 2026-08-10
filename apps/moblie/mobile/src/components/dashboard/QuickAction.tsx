import {
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";

type QuickActionProps = {
  title: string;
  subtitle?: string;
  onPress: () => void;
};

export default function QuickAction({
  title,
  subtitle,
  onPress,
}: QuickActionProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.title}>
        {title}
      </Text>

      {subtitle ? (
        <Text style={styles.subtitle}>
          {subtitle}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },

  subtitle: {
    marginTop: 5,
    fontSize: 13,
    color: "#6B7280",
  },
});