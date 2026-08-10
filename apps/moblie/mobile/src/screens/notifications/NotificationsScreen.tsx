import React from "react";
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  colors,
  spacing,
} from "../../constants/theme";

import SlideUp from "../../components/animations/SlideUp";
import NotificationCard from "../../components/cards/NotificationCard";
import EmptyState from "../../components/common/EmptyState";
import ScreenLoader from "../../components/loaders/ScreenLoader";

import { useNotifications } from "../../hooks/useNotifications";

export default function NotificationsScreen() {
  const {
    notifications,
    loading,
    error,
    refresh,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  if (loading) {
    return <ScreenLoader />;
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          title="Something went wrong"
          message={error}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>
            Notifications
          </Text>

          <Text style={styles.subtitle}>
            Stay updated with your business
          </Text>
        </View>

        {notifications.some(
          (notification) => !notification.read
        ) && (
          <Text
            style={styles.markAll}
            onPress={markAllAsRead}
          >
            Mark all
          </Text>
        )}
      </View>

      {notifications.length === 0 ? (
        <EmptyState
          title="You're all caught up"
          message="New notifications will appear here."
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refresh}
            />
          }
          renderItem={({ item, index }) => (
            <SlideUp
              delay={index * 70}
              duration={400}
            >
              <NotificationCard
                notification={item}
                onPress={() =>
                  markAsRead(item.id)
                }
              />
            </SlideUp>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
  },

  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: colors.textSecondary,
  },

  markAll: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },

  list: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
});