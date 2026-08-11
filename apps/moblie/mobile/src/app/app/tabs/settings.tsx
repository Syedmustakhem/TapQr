import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { COLORS } from "../../../constants/colors";
import { SPACING } from "../../../constants/spacing";

type ModalType =
  | "business"
  | "account"
  | "notifications"
  | "appearance"
  | "security"
  | "help"
  | "privacy"
  | "terms"
  | null;

const SETTINGS_KEY = "@tapqr_settings";

type SettingsData = {
  businessName: string;
  category: string;
  phone: string;
  address: string;

  userName: string;
  email: string;

  notifications: boolean;
  marketingNotifications: boolean;

  appearance: "SYSTEM" | "LIGHT" | "DARK";
};

const DEFAULT_SETTINGS: SettingsData = {
  businessName: "My Business",
  category: "Business",
  phone: "",
  address: "",

  userName: "TapQR User",
  email: "",

  notifications: true,
  marketingNotifications: false,

  appearance: "SYSTEM",
};

export default function SettingsScreen() {
  const [settings, setSettings] =
    useState<SettingsData>(DEFAULT_SETTINGS);

  const [modal, setModal] =
    useState<ModalType>(null);

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored =
        await AsyncStorage.getItem(
          SETTINGS_KEY
        );

      if (stored) {
        setSettings({
          ...DEFAULT_SETTINGS,
          ...JSON.parse(stored),
        });
      }
    } catch (error) {
      console.error(
        "Failed to load settings:",
        error
      );
    }
  };

  const saveSettings = async (
    updates: Partial<SettingsData>
  ) => {
    try {
      setSaving(true);

      const updated = {
        ...settings,
        ...updates,
      };

      setSettings(updated);

      await AsyncStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify(updated)
      );

      setModal(null);
    } catch (error) {
      console.error(
        "Failed to save settings:",
        error
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Log out",
      "Are you sure you want to log out of TapQR?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Log out",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                "@tapqr_user",
                "@tapqr_token",
              ]);

              router.replace(
                "/(auth)/login"
              );
            } catch (error) {
              console.error(
                "Logout failed:",
                error
              );
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}

        <View style={styles.header}>
          <View>
            <Text style={styles.title}>
              Settings
            </Text>

            <Text style={styles.subtitle}>
              Manage your TapQR account and
              preferences.
            </Text>
          </View>
        </View>

        {/* Profile */}

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {getInitials(
                settings.userName
              )}
            </Text>
          </View>

          <View style={styles.profileContent}>
            <Text style={styles.profileName}>
              {settings.userName}
            </Text>

            <Text style={styles.profileEmail}>
              {settings.email ||
                "Add your email address"}
            </Text>

            <View style={styles.businessBadge}>
              <Ionicons
                name="business-outline"
                size={13}
                color={COLORS.primary}
              />

              <Text
                style={styles.businessBadgeText}
              >
                {settings.businessName}
              </Text>
            </View>
          </View>
        </View>

        {/* Business */}

        <SectionTitle title="Business" />

        <SettingsCard>
          <SettingsRow
            icon="business-outline"
            title="Business Profile"
            subtitle={
              settings.businessName
            }
            onPress={() =>
              setModal("business")
            }
          />

          <Divider />

          <SettingsRow
            icon="person-outline"
            title="Account"
            subtitle={
              settings.email ||
              "Manage your account"
            }
            onPress={() =>
              setModal("account")
            }
          />
        </SettingsCard>

        {/* Preferences */}

        <SectionTitle title="Preferences" />

        <SettingsCard>
          <SettingsRow
            icon="notifications-outline"
            title="Notifications"
            subtitle={
              settings.notifications
                ? "Enabled"
                : "Disabled"
            }
            right={
              <Switch
                value={
                  settings.notifications
                }
                onValueChange={(value) =>
                  saveSettings({
                    notifications: value,
                  })
                }
                trackColor={{
                  false: COLORS.border,
                  true: COLORS.primary,
                }}
              />
            }
          />

          <Divider />

          <SettingsRow
            icon="color-palette-outline"
            title="Appearance"
            subtitle={formatAppearance(
              settings.appearance
            )}
            onPress={() =>
              setModal("appearance")
            }
          />
        </SettingsCard>

        {/* Security */}

        <SectionTitle title="Security" />

        <SettingsCard>
          <SettingsRow
            icon="lock-closed-outline"
            title="Security"
            subtitle="Password and account security"
            onPress={() =>
              setModal("security")
            }
          />
        </SettingsCard>

        {/* Support */}

        <SectionTitle title="Support" />

        <SettingsCard>
          <SettingsRow
            icon="help-circle-outline"
            title="Help & Support"
            subtitle="Get help with TapQR"
            onPress={() =>
              setModal("help")
            }
          />

          <Divider />

          <SettingsRow
            icon="shield-checkmark-outline"
            title="Privacy Policy"
            subtitle="How we handle your information"
            onPress={() =>
              setModal("privacy")
            }
          />

          <Divider />

          <SettingsRow
            icon="document-text-outline"
            title="Terms of Service"
            subtitle="TapQR terms and conditions"
            onPress={() =>
              setModal("terms")
            }
          />
        </SettingsCard>

        {/* Logout */}

        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            pressed &&
              styles.logoutButtonPressed,
          ]}
          onPress={handleLogout}
        >
          <Ionicons
            name="log-out-outline"
            size={21}
            color={COLORS.text}
          />

          <Text style={styles.logoutText}>
            Log out
          </Text>
        </Pressable>

        {/* Version */}

        <Text style={styles.version}>
          TapQR
          {"\n"}
          Version 1.0.0
        </Text>
      </ScrollView>

      {/* Modal */}

      <SettingsModal
        type={modal}
        settings={settings}
        saving={saving}
        onClose={() => setModal(null)}
        onSave={saveSettings}
      />
    </SafeAreaView>
  );
}

/* -------------------------------- */
/* Section */
/* -------------------------------- */

function SectionTitle({
  title,
}: {
  title: string;
}) {
  return (
    <Text style={styles.sectionTitle}>
      {title}
    </Text>
  );
}

/* -------------------------------- */
/* Settings Card */
/* -------------------------------- */

function SettingsCard({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <View style={styles.settingsCard}>
      {children}
    </View>
  );
}

/* -------------------------------- */
/* Settings Row */
/* -------------------------------- */

function SettingsRow({
  icon,
  title,
  subtitle,
  onPress,
  right,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: React.ReactNode;
}) {
  const content = (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons
          name={icon}
          size={21}
          color={COLORS.primary}
        />
      </View>

      <View style={styles.rowContent}>
        <Text style={styles.rowTitle}>
          {title}
        </Text>

        {subtitle && (
          <Text
            style={styles.rowSubtitle}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {right ? (
        right
      ) : (
        <Ionicons
          name="chevron-forward"
          size={19}
          color={COLORS.textMuted}
        />
      )}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        pressed && styles.rowPressed,
      ]}
    >
      {content}
    </Pressable>
  );
}

/* -------------------------------- */
/* Divider */
/* -------------------------------- */

function Divider() {
  return <View style={styles.divider} />;
}

/* -------------------------------- */
/* Modal */
/* -------------------------------- */

function SettingsModal({
  type,
  settings,
  saving,
  onClose,
  onSave,
}: {
  type: ModalType;
  settings: SettingsData;
  saving: boolean;
  onClose: () => void;
  onSave: (
    updates: Partial<SettingsData>
  ) => Promise<void>;
}) {
  if (!type) {
    return null;
  }

  return (
    <Modal
      visible={!!type}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {getModalTitle(type)}
            </Text>

            <Pressable
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons
                name="close"
                size={22}
                color={COLORS.text}
              />
            </Pressable>
          </View>

          {type === "business" && (
            <BusinessForm
              settings={settings}
              saving={saving}
              onSave={onSave}
            />
          )}

          {type === "account" && (
            <AccountForm
              settings={settings}
              saving={saving}
              onSave={onSave}
            />
          )}

          {type === "notifications" && (
            <NotificationSettings
              settings={settings}
              saving={saving}
              onSave={onSave}
            />
          )}

          {type === "appearance" && (
            <AppearanceSettings
              settings={settings}
              onSave={onSave}
            />
          )}

          {type === "security" && (
            <InfoContent
              icon="lock-closed-outline"
              title="Account Security"
              text="Your account security settings will be connected to the TapQR backend when authentication is integrated."
            />
          )}

          {type === "help" && (
            <InfoContent
              icon="help-circle-outline"
              title="How can we help?"
              text="For support, contact the TapQR support team. Support features will be connected to the backend later."
            />
          )}

          {type === "privacy" && (
            <InfoContent
              icon="shield-checkmark-outline"
              title="Privacy Policy"
              text="TapQR will use your account and business information to provide QR code management, analytics and related services."
            />
          )}

          {type === "terms" && (
            <InfoContent
              icon="document-text-outline"
              title="Terms of Service"
              text="By using TapQR, you agree to use the platform responsibly and comply with applicable laws and regulations."
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

/* -------------------------------- */
/* Business Form */
/* -------------------------------- */

function BusinessForm({
  settings,
  saving,
  onSave,
}: {
  settings: SettingsData;
  saving: boolean;
  onSave: (
    updates: Partial<SettingsData>
  ) => Promise<void>;
}) {
  const [businessName, setBusinessName] =
    useState(settings.businessName);

  const [category, setCategory] =
    useState(settings.category);

  const [phone, setPhone] =
    useState(settings.phone);

  const [address, setAddress] =
    useState(settings.address);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Field
        label="Business name"
        value={businessName}
        onChangeText={setBusinessName}
        placeholder="Your business name"
      />

      <Field
        label="Category"
        value={category}
        onChangeText={setCategory}
        placeholder="Restaurant, Retail, Salon..."
      />

      <Field
        label="Phone"
        value={phone}
        onChangeText={setPhone}
        placeholder="Phone number"
        keyboardType="phone-pad"
      />

      <Field
        label="Address"
        value={address}
        onChangeText={setAddress}
        placeholder="Business address"
        multiline
      />

      <ModalButton
        title="Save Changes"
        loading={saving}
        onPress={() =>
          onSave({
            businessName:
              businessName.trim(),
            category: category.trim(),
            phone: phone.trim(),
            address: address.trim(),
          })
        }
      />
    </ScrollView>
  );
}

/* -------------------------------- */
/* Account Form */
/* -------------------------------- */

function AccountForm({
  settings,
  saving,
  onSave,
}: {
  settings: SettingsData;
  saving: boolean;
  onSave: (
    updates: Partial<SettingsData>
  ) => Promise<void>;
}) {
  const [name, setName] =
    useState(settings.userName);

  const [email, setEmail] =
    useState(settings.email);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Field
        label="Name"
        value={name}
        onChangeText={setName}
        placeholder="Your name"
      />

      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
      />

      <ModalButton
        title="Save Changes"
        loading={saving}
        onPress={() =>
          onSave({
            userName: name.trim(),
            email: email.trim(),
          })
        }
      />
    </ScrollView>
  );
}

/* -------------------------------- */
/* Notifications */
/* -------------------------------- */

function NotificationSettings({
  settings,
  onSave,
}: {
  settings: SettingsData;
  saving: boolean;
  onSave: (
    updates: Partial<SettingsData>
  ) => Promise<void>;
}) {
  return (
    <View>
      <ToggleRow
        title="Push notifications"
        subtitle="Receive important TapQR updates"
        value={settings.notifications}
        onValueChange={(value) =>
          onSave({
            notifications: value,
          })
        }
      />

      <ToggleRow
        title="Marketing notifications"
        subtitle="Receive product updates and offers"
        value={
          settings.marketingNotifications
        }
        onValueChange={(value) =>
          onSave({
            marketingNotifications: value,
          })
        }
      />
    </View>
  );
}

/* -------------------------------- */
/* Appearance */
/* -------------------------------- */

function AppearanceSettings({
  settings,
  onSave,
}: {
  settings: SettingsData;
  onSave: (
    updates: Partial<SettingsData>
  ) => Promise<void>;
}) {
  const options: SettingsData["appearance"][] =
    [
      "SYSTEM",
      "LIGHT",
      "DARK",
    ];

  return (
    <View>
      <Text style={styles.optionDescription}>
        Choose how TapQR should appear on
        your device.
      </Text>

      {options.map((option) => {
        const selected =
          settings.appearance === option;

        return (
          <Pressable
            key={option}
            onPress={() =>
              onSave({
                appearance: option,
              })
            }
            style={[
              styles.optionRow,
              selected &&
                styles.optionRowSelected,
            ]}
          >
            <View>
              <Text
                style={
                  styles.optionTitle
                }
              >
                {formatAppearance(
                  option
                )}
              </Text>

              <Text
                style={
                  styles.optionSubtitle
                }
              >
                {getAppearanceDescription(
                  option
                )}
              </Text>
            </View>

            {selected && (
              <Ionicons
                name="checkmark-circle"
                size={23}
                color={COLORS.primary}
              />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

/* -------------------------------- */
/* Toggle */
/* -------------------------------- */

function ToggleRow({
  title,
  subtitle,
  value,
  onValueChange,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (
    value: boolean
  ) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleContent}>
        <Text style={styles.toggleTitle}>
          {title}
        </Text>

        <Text style={styles.toggleSubtitle}>
          {subtitle}
        </Text>
      </View>

      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: COLORS.border,
          true: COLORS.primary,
        }}
      />
    </View>
  );
}

/* -------------------------------- */
/* Info */
/* -------------------------------- */

function InfoContent({
  icon,
  title,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  text: string;
}) {
  return (
    <View style={styles.infoContent}>
      <View style={styles.infoIcon}>
        <Ionicons
          name={icon}
          size={28}
          color={COLORS.primary}
        />
      </View>

      <Text style={styles.infoTitle}>
        {title}
      </Text>

      <Text style={styles.infoDescription}>
        {text}
      </Text>
    </View>
  );
}

/* -------------------------------- */
/* Field */
/* -------------------------------- */

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (
    value: string
  ) => void;
  placeholder?: string;
  keyboardType?: any;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={
          COLORS.textMuted
        }
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={
          multiline ? "top" : "center"
        }
        style={[
          styles.input,
          multiline &&
            styles.multilineInput,
        ]}
      />
    </View>
  );
}

/* -------------------------------- */
/* Modal Button */
/* -------------------------------- */

function ModalButton({
  title,
  loading,
  onPress,
}: {
  title: string;
  loading: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.modalButton,
        pressed &&
          styles.modalButtonPressed,
        loading &&
          styles.modalButtonDisabled,
      ]}
    >
      <Text style={styles.modalButtonText}>
        {loading ? "Saving..." : title}
      </Text>
    </Pressable>
  );
}

/* -------------------------------- */
/* Helpers */
/* -------------------------------- */

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "T";
  }

  if (parts.length === 1) {
    return parts[0]
      .substring(0, 2)
      .toUpperCase();
  }

  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();
}

function formatAppearance(
  appearance: SettingsData["appearance"]
) {
  switch (appearance) {
    case "LIGHT":
      return "Light";

    case "DARK":
      return "Dark";

    default:
      return "System";
  }
}

function getAppearanceDescription(
  appearance: SettingsData["appearance"]
) {
  switch (appearance) {
    case "LIGHT":
      return "Always use light mode";

    case "DARK":
      return "Always use dark mode";

    default:
      return "Follow your device settings";
  }
}

function getModalTitle(
  type: Exclude<ModalType, null>
) {
  switch (type) {
    case "business":
      return "Business Profile";

    case "account":
      return "Account";

    case "notifications":
      return "Notifications";

    case "appearance":
      return "Appearance";

    case "security":
      return "Security";

    case "help":
      return "Help & Support";

    case "privacy":
      return "Privacy Policy";

    case "terms":
      return "Terms of Service";

    default:
      return "Settings";
  }
}

/* -------------------------------- */
/* Styles */
/* -------------------------------- */

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
    marginBottom: SPACING.xxl,
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: COLORS.text,
  },

  subtitle: {
    marginTop: SPACING.sm,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textSecondary,
  },

  profileCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "800",
  },

  profileContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },

  profileName: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.text,
  },

  profileEmail: {
    marginTop: 3,
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  businessBadge: {
    marginTop: 8,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#DBEAFE",
  },

  businessBadgeText: {
    marginLeft: 5,
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
  },

  sectionTitle: {
    marginTop: SPACING.xxl,
    marginBottom: SPACING.md,
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },

  settingsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },

  row: {
    minHeight: 72,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
  },

  rowPressed: {
    opacity: 0.65,
  },

  rowIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },

  rowContent: {
    flex: 1,
    marginLeft: SPACING.md,
    marginRight: SPACING.sm,
  },

  rowTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },

  rowSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 70,
  },

  logoutButton: {
    height: 54,
    marginTop: SPACING.xxl,
    borderRadius: 15,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: "#FECACA",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  logoutButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },

  logoutText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },

  version: {
    marginTop: SPACING.xxl,
    marginBottom: SPACING.xl,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 19,
    color: COLORS.textMuted,
  },

  /* Modal */

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },

  modalContainer: {
    maxHeight: "90%",
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: SPACING.xl,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.xl,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text,
  },

  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  field: {
    marginBottom: SPACING.lg,
  },

  fieldLabel: {
    marginBottom: 7,
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
  },

  input: {
    minHeight: 50,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    fontSize: 15,
    color: COLORS.text,
  },

  multilineInput: {
    minHeight: 95,
    paddingTop: SPACING.md,
  },

  modalButton: {
    height: 52,
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  modalButtonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },

  modalButtonDisabled: {
    opacity: 0.55,
  },

  modalButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.white,
  },

  toggleRow: {
    minHeight: 72,
    paddingVertical: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  toggleContent: {
    flex: 1,
    paddingRight: SPACING.md,
  },

  toggleTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },

  toggleSubtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textSecondary,
  },

  optionDescription: {
    marginBottom: SPACING.md,
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },

  optionRow: {
    minHeight: 68,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  optionRowSelected: {
    borderColor: COLORS.primary,
  },

  optionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },

  optionSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  infoContent: {
    alignItems: "center",
    paddingVertical: SPACING.xl,
  },

  infoIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },

  infoTitle: {
    marginTop: SPACING.lg,
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
  },

  infoDescription: {
    marginTop: SPACING.sm,
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
});