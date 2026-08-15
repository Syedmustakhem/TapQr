import React from "react";

import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  colors,
  spacing,
} from "../../constants/theme";

import SlideUp from "../../components/animations/SlideUp";
import ProfileAvatar from "../../components/profile/ProfileAvatar";
import ProfileRow from "../../components/profile/ProfileRow";
import ProfileSection from "../../components/profile/ProfileSection";
import ScreenLoader from "../../components/loaders/ScreenLoader";
import EmptyState from "../../components/common/EmptyState";

import { useProfile } from "../../hooks/useProfile";

export default function ProfileScreen() {
  const {
    profile,
    loading,
    error,
    refresh,
  } = useProfile();

  if (loading) {
    return <ScreenLoader />;
  }

  if (error || !profile) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          title="Unable to load profile"
          message={
            error ||
            "Something went wrong."
          }
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
          />
        }
        contentContainerStyle={
          styles.content
        }
      >
        <SlideUp>
          <View style={styles.header}>
            <ProfileAvatar
              name={profile.fullName}
              image={profile.avatar}
              size={92}
            />

            <Text style={styles.name}>
              {profile.fullName}
            </Text>

            <Text style={styles.email}>
              {profile.email}
            </Text>

            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>
                {profile.role}
              </Text>
            </View>
          </View>
        </SlideUp>

        <SlideUp delay={100}>
          <ProfileSection title="Personal Information">
            <ProfileRow
              label="Full Name"
              value={profile.fullName}
            />

            <ProfileRow
              label="Email"
              value={profile.email}
            />

            <ProfileRow
              label="Phone"
              value={
                profile.phone ||
                "Not provided"
              }
            />
          </ProfileSection>
        </SlideUp>

        {profile.business && (
          <SlideUp delay={180}>
            <ProfileSection title="Business Information">
              <ProfileRow
                label="Business Name"
                value={
                  profile.business.name
                }
              />

              <ProfileRow
                label="Category"
                value={
                  profile.business.category
                }
              />

              <ProfileRow
                label="Email"
                value={
                  profile.business.email
                }
              />

              <ProfileRow
                label="Phone"
                value={
                  profile.business.phone
                }
              />

              <ProfileRow
                label="Address"
                value={
                  profile.business.address
                }
              />
            </ProfileSection>
          </SlideUp>
        )}

        {profile.business?.description && (
          <SlideUp delay={260}>
            <ProfileSection title="About Business">
              <Text style={styles.description}>
                {profile.business.description}
              </Text>
            </ProfileSection>
          </SlideUp>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },

  header: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },

  name: {
    marginTop: spacing.md,
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
  },

  email: {
    marginTop: 4,
    fontSize: 14,
    color: colors.textSecondary,
  },

  roleBadge: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },

  roleText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
  },

  description: {
    paddingVertical: spacing.lg,
    fontSize: 15,
    lineHeight: 23,
    color: colors.textSecondary,
  },
});