import React from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Notification } from "../../types/notification";
import {
  colors,
  radius,
  spacing,
} from "../../theme";

import ScalePress from "../animations/ScalePress";

interface NotificationCardProps {
  notification: Notification;
  onPress: () => void;
}

function getIcon(type: Notification["type"]) {
  switch (type) {
    case "QR_SCAN":
      return "⌁";

    case "REVIEW":
      return "★";

    case "BUSINESS":
      return "◆";

    default:
      return "•";
  }
}

export default function NotificationCard({
  notification,
  onPress,
}: NotificationCardProps) {
  return (
    <ScalePress onPress={onPress}>
      <View
        style={[
          styles.container,
          !notification.read && styles.unread,
        ]}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>
            {getIcon(notification.type)}
          </Text>
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>
              {notification.title}
            </Text>

            {!notification.read && (
              <View style={styles.unreadDot} />
            )}
          </View>

          <Text style={styles.message}>
            {notification.message}
          </Text>

          <Text style={styles.time}>
            {notification.createdAt}
          </Text>
        </View>
      </View>
    </ScalePress>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },

  unread: {
    borderColor: "#BFDBFE",
    backgroundColor: "#F8FBFF",
  },

  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
    marginRight: spacing.md,
  },

  icon: {
    fontSize: 20,
    color: colors.primary,
  },

  content: {
    flex: 1,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
  },

  message: {
    marginTop: 5,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },

  time: {
    marginTop: 8,
    fontSize: 12,
    color: colors.textMuted,
  },
});