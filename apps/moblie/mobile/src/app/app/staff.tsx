import {
  useEffect,
  useState,
} from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { COLORS } from "../../constants/colors";
import { SPACING } from "../../constants/spacing";

import {
  cancelInvitation,
  getStaffInvitations,
  getStaffMembers,
  inviteStaffMember,
  removeMember,
  resendInvitation,
  updateMemberRole,
  updateMemberStatus,
  type StaffInvitation,
  type StaffMember,
} from "../../api/staffApi";

import { fetchMe } from "../../api/settingsApi";

import StatCard from "../../components/dashboard/StatCard";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import EmptyState from "../../components/common/EmptyState";

import { useCurrentBusiness } from "../../hooks/useCurrentBusiness";

const CURRENT_BUSINESS_KEY =
  "tapqr_current_business_id";

const PAGE_SIZE = 20;

type StaffTab = "members" | "invitations";

const MEMBER_ROLES = [
  "MANAGER",
  "STAFF",
] as const;

function roleLabel(role: string) {
  const lower = role.toLowerCase();

  return (
    role.charAt(0) +
    lower.slice(1)
  );
}

function statusLabel(status: string) {
  const lower = status.toLowerCase();

  return (
    status.charAt(0) +
    lower.slice(1)
  );
}

function initials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "?";

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

function memberDisplayName(
  member: StaffMember
) {
  return (
    member.user?.fullName ||
    member.user?.email ||
    member.user?.phone ||
    "Team member"
  );
}

export default function StaffScreen() {
  const queryClient = useQueryClient();

  const {
    businesses,
    business,
    businessId: hookBusinessId,
  } = useCurrentBusiness();

  /*
   * useCurrentBusiness does not expose a setter, so the
   * switcher keeps a local override and persists it under
   * the same AsyncStorage key for other screens.
   */
  const [businessOverride, setBusinessOverride] =
    useState<string | null>(null);

  const businessId =
    businessOverride ?? hookBusinessId;

  const selectedBusiness =
    businesses.find(
      (item) => item.id === businessId
    ) ??
    business;

  const [tab, setTab] =
    useState<StaffTab>("members");

  const [membersPage, setMembersPage] =
    useState(1);

  const [invitationsPage, setInvitationsPage] =
    useState(1);

  const [search, setSearch] = useState("");

  const [switcherOpen, setSwitcherOpen] =
    useState(false);

  const [inviteOpen, setInviteOpen] =
    useState(false);

  const invalidateStaff = () => {
    void queryClient.invalidateQueries({
      queryKey: ["staff-members", businessId],
    });

    void queryClient.invalidateQueries({
      queryKey: ["staff-invitations", businessId],
    });
  };

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    staleTime: 5 * 60 * 1000,
  });

  const membersQuery = useQuery({
    queryKey: [
      "staff-members",
      businessId,
      membersPage,
      search,
    ],
    queryFn: () =>
      getStaffMembers(businessId as string, {
        page: membersPage,
        limit: PAGE_SIZE,
        search: search.trim() || undefined,
      }),
    enabled: Boolean(businessId),
  });

  const invitationsQuery = useQuery({
    queryKey: [
      "staff-invitations",
      businessId,
      invitationsPage,
    ],
    queryFn: () =>
      getStaffInvitations(
        businessId as string,
        {
          page: invitationsPage,
          limit: PAGE_SIZE,
        }
      ),
    enabled: Boolean(businessId),
  });

  /*
   * Reset pagination when the business changes.
   */
  useEffect(() => {
    setMembersPage(1);
    setInvitationsPage(1);
  }, [businessId]);

  const members = membersQuery.data;

  const invitations = invitationsQuery.data;

  const me = meQuery.data;

  /*
   * Your role: membership record first, falling back to
   * the /auth/me role — mirrors the web dashboard.
   */
  const myRole =
    members?.members.find(
      (member) =>
        member.userId === me?.id
    )?.role ??
    me?.role ??
    "—";

  const pendingInvites =
    invitations?.invitations.filter(
      (item) => item.status === "PENDING"
    ).length ?? 0;

  const inviteMutation = useMutation({
    mutationFn: ({
      email,
      role,
    }: {
      email: string;
      role: "MANAGER" | "STAFF";
    }) =>
      inviteStaffMember(businessId as string, {
        email,
        role,
      }),
    onSuccess: () => {
      setInviteOpen(false);
      setInvitationsPage(1);
      invalidateStaff();
    },
    onError: (error) => {
      Alert.alert(
        "Invite failed",
        error instanceof Error
          ? error.message
          : "Could not send the invitation."
      );
    },
  });

  const roleMutation = useMutation({
    mutationFn: ({
      memberId,
      role,
    }: {
      memberId: string;
      role: "MANAGER" | "STAFF";
    }) =>
      updateMemberRole(
        businessId as string,
        memberId,
        role
      ),
    onSuccess: invalidateStaff,
    onError: (error) => {
      Alert.alert(
        "Role change failed",
        error instanceof Error
          ? error.message
          : "Could not update the role."
      );
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({
      memberId,
      status,
    }: {
      memberId: string;
      status: "ACTIVE" | "SUSPENDED";
    }) =>
      updateMemberStatus(
        businessId as string,
        memberId,
        status
      ),
    onSuccess: invalidateStaff,
    onError: (error) => {
      Alert.alert(
        "Status change failed",
        error instanceof Error
          ? error.message
          : "Could not update the status."
      );
    },
  });

  const removeMutation = useMutation({
    mutationFn: (memberId: string) =>
      removeMember(
        businessId as string,
        memberId
      ),
    onSuccess: invalidateStaff,
    onError: (error) => {
      Alert.alert(
        "Remove failed",
        error instanceof Error
          ? error.message
          : "Could not remove the member."
      );
    },
  });

  const resendMutation = useMutation({
    mutationFn: (invitationId: string) =>
      resendInvitation(
        businessId as string,
        invitationId
      ),
    onSuccess: invalidateStaff,
    onError: (error) => {
      Alert.alert(
        "Resend failed",
        error instanceof Error
          ? error.message
          : "Could not resend the invitation."
      );
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (invitationId: string) =>
      cancelInvitation(
        businessId as string,
        invitationId
      ),
    onSuccess: invalidateStaff,
    onError: (error) => {
      Alert.alert(
        "Revoke failed",
        error instanceof Error
          ? error.message
          : "Could not revoke the invitation."
      );
    },
  });

  const handleSwitchBusiness = (
    id: string
  ) => {
    setBusinessOverride(id);
    setSwitcherOpen(false);

    try {
      void AsyncStorage.setItem(
        CURRENT_BUSINESS_KEY,
        id
      );
    } catch {
      // Selection persistence is best-effort.
    }
  };

  const confirmRemove = (
    member: StaffMember
  ) => {
    Alert.alert(
      "Remove member",
      `Remove ${memberDisplayName(member)} from ${selectedBusiness?.name ?? "this business"}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: () =>
            removeMutation.mutate(member.id),
        },
      ]
    );
  };

  const confirmRevoke = (
    invitation: StaffInvitation
  ) => {
    Alert.alert(
      "Revoke invitation",
      `Revoke the pending invitation to ${invitation.email}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Revoke",
          style: "destructive",
          onPress: () =>
            cancelMutation.mutate(
              invitation.id
            ),
        },
      ]
    );
  };

  const isLoading =
    membersQuery.isLoading ||
    invitationsQuery.isLoading;

  const isError =
    membersQuery.isError ||
    invitationsQuery.isError;

  /*
   * LOADING / ERROR / NO BUSINESS
   */
  if (isLoading || !businessId) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View style={styles.centered}>
          {!businessId &&
          !isLoading ? (
            <>
              <Text
                style={styles.errorTitle}
              >
                No business selected
              </Text>

              <Text
                style={styles.errorText}
              >
                Create a business to manage
                team access.
              </Text>
            </>
          ) : (
            <>
              <ActivityIndicator
                size="large"
                color={COLORS.primary}
              />

              <Text
                style={styles.loaderText}
              >
                Loading team...
              </Text>
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>
            Unable to load team
          </Text>

          <Text style={styles.errorText}>
            Check your connection and try
            again.
          </Text>

          <Text
            style={styles.retry}
            onPress={() => {
              void membersQuery.refetch();
              void invitationsQuery.refetch();
            }}
          >
            Tap to retry
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* HEADER */}

        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>
              TEAM ACCESS
            </Text>

            <Text style={styles.title}>
              Staff & Access
            </Text>

            <Text style={styles.subtitle}>
              Invite teammates and control
              who can manage your business.
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Ionicons
              name="people-outline"
              size={22}
              color={COLORS.primary}
            />
          </View>
        </View>

        {/* BUSINESS SWITCHER */}

        <Pressable
          onPress={() =>
            setSwitcherOpen(true)
          }
          style={({ pressed }) => [
            styles.switcher,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.switcherIcon}>
            <Ionicons
              name="business-outline"
              size={18}
              color={COLORS.primary}
            />
          </View>

          <Text
            numberOfLines={1}
            style={styles.switcherName}
          >
            {selectedBusiness?.name ??
              "Select business"}
          </Text>

          <Ionicons
            name="chevron-down"
            size={18}
            color={COLORS.textSecondary}
          />
        </Pressable>

        {/* SUMMARY CARDS */}

        <View style={styles.summaryGrid}>
          <StatCard
            title="Members"
            value={members?.total ?? 0}
            subtitle="Team members"
            icon="people-outline"
          />

          <StatCard
            title="Pending invites"
            value={pendingInvites}
            subtitle="Awaiting acceptance"
            icon="mail-unread-outline"
          />

          <View style={styles.roleCard}>
            <View style={styles.roleIcon}>
              <Ionicons
                name="shield-checkmark-outline"
                size={21}
                color={COLORS.primary}
              />
            </View>

            <Text style={styles.roleTitle}>
              YOUR ROLE
            </Text>

            <Text style={styles.roleValue}>
              {roleLabel(String(myRole))}
            </Text>

            <Text style={styles.roleSubtitle}>
              Your access level
            </Text>
          </View>
        </View>

        {/* INVITE BUTTON */}

        <Button
          title="Invite team member"
          onPress={() =>
            setInviteOpen(true)
          }
        />

        {/* TABS */}

        <View style={styles.tabBar}>
          {(["members", "invitations"] as const).map(
            (value) => {
              const selected =
                tab === value;

              return (
                <Pressable
                  key={value}
                  onPress={() => setTab(value)}
                  style={[
                    styles.tabButton,
                    selected &&
                      styles.tabButtonSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      selected &&
                        styles.tabTextSelected,
                    ]}
                  >
                    {value === "members"
                      ? `Members (${members?.total ?? 0})`
                      : `Invitations (${invitations?.total ?? 0})`}
                  </Text>
                </Pressable>
              );
            }
          )}
        </View>

        {/* MEMBERS TAB */}

        {tab === "members" && (
          <>
            <Input
              placeholder="Search team members..."
              value={search}
              onChangeText={(
                value: string
              ) => {
                setSearch(value);
                setMembersPage(1);
              }}
              returnKeyType="search"
            />

            {membersQuery.isFetching && (
              <ActivityIndicator
                size="small"
                color={COLORS.primary}
                style={styles.inlineLoader}
              />
            )}

            {members?.members.length ===
            0 ? (
              <EmptyState
                title="No members found"
                message={
                  search.trim()
                    ? "No team members match your search."
                    : "Invite your first team member to get started."
                }
              />
            ) : (
              members?.members.map(
                (member) => (
                  <MemberRow
                    key={member.id}
                    member={member}
                    isSelf={
                      member.userId ===
                      me?.id
                    }
                    onRoleChange={(role) =>
                      roleMutation.mutate({
                        memberId: member.id,
                        role,
                      })
                    }
                    onToggleStatus={() =>
                      statusMutation.mutate({
                        memberId: member.id,
                        status:
                          member.status ===
                          "SUSPENDED"
                            ? "ACTIVE"
                            : "SUSPENDED",
                      })
                    }
                    onRemove={() =>
                      confirmRemove(member)
                    }
                  />
                )
              )
            )}

            <PageNav
              page={members?.page ?? 1}
              totalPages={
                members?.totalPages ?? 0
              }
              onPrev={() =>
                setMembersPage((page) =>
                  Math.max(1, page - 1)
                )
              }
              onNext={() =>
                setMembersPage((page) =>
                  page + 1
                )
              }
            />
          </>
        )}

        {/* INVITATIONS TAB */}

        {tab === "invitations" && (
          <>
            {invitations?.invitations.length ===
            0 ? (
              <EmptyState
                title="No invitations"
                message="Invitations you send will appear here."
              />
            ) : (
              invitations?.invitations.map(
                (invitation) => (
                  <InvitationRow
                    key={invitation.id}
                    invitation={invitation}
                    onResend={() =>
                      resendMutation.mutate(
                        invitation.id
                      )
                    }
                    onRevoke={() =>
                      confirmRevoke(invitation)
                    }
                  />
                )
              )
            )}

            <PageNav
              page={invitations?.page ?? 1}
              totalPages={
                invitations?.totalPages ?? 0
              }
              onPrev={() =>
                setInvitationsPage((page) =>
                  Math.max(1, page - 1)
                )
              }
              onNext={() =>
                setInvitationsPage((page) =>
                  page + 1
                )
              }
            />
          </>
        )}
      </ScrollView>

      {/* BUSINESS SWITCHER MODAL */}

      <Modal
        visible={switcherOpen}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setSwitcherOpen(false)
        }
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select business
              </Text>

              <Pressable
                onPress={() =>
                  setSwitcherOpen(false)
                }
                style={styles.closeButton}
              >
                <Ionicons
                  name="close"
                  size={22}
                  color={COLORS.text}
                />
              </Pressable>
            </View>

            {businesses.map((item) => {
              const selected =
                item.id === businessId;

              return (
                <Pressable
                  key={item.id}
                  onPress={() =>
                    handleSwitchBusiness(
                      item.id
                    )
                  }
                  style={[
                    styles.businessRow,
                    selected &&
                      styles.businessRowSelected,
                  ]}
                >
                  <View>
                    <Text
                      style={
                        styles.businessName
                      }
                    >
                      {item.name}
                    </Text>
                  </View>

                  {selected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color={COLORS.primary}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>

      {/* INVITE DIALOG */}

      <InviteDialog
        visible={inviteOpen}
        loading={inviteMutation.isPending}
        onClose={() =>
          setInviteOpen(false)
        }
        onInvite={(email, role) =>
          inviteMutation.mutate({
            email,
            role,
          })
        }
      />
    </SafeAreaView>
  );
}

/* ================================================= */
/* MEMBER ROW                                        */
/* ================================================= */

function MemberRow({
  member,
  isSelf,
  onRoleChange,
  onToggleStatus,
  onRemove,
}: {
  member: StaffMember;
  isSelf: boolean;
  onRoleChange: (
    role: "MANAGER" | "STAFF"
  ) => void;
  onToggleStatus: () => void;
  onRemove: () => void;
}) {
  const name = memberDisplayName(member);

  const isOwner = member.role === "OWNER";

  const isSuspended =
    member.status === "SUSPENDED";

  return (
    <View style={styles.card}>
      <View style={styles.memberTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {initials(name)}
          </Text>
        </View>

        <View style={styles.memberInfo}>
          <Text
            numberOfLines={1}
            style={styles.memberName}
          >
            {name}
            {isSelf ? " (you)" : ""}
          </Text>

          {!!member.user?.email && (
            <Text
              numberOfLines={1}
              style={styles.memberMeta}
            >
              {member.user.email}
            </Text>
          )}

          <View style={styles.pillRow}>
            <View
              style={[
                styles.pill,
                isOwner && styles.pillOwner,
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  isOwner &&
                    styles.pillTextOwner,
                ]}
              >
                {roleLabel(member.role)}
              </Text>
            </View>

            <View
              style={[
                styles.pill,
                isSuspended
                  ? styles.pillSuspended
                  : styles.pillActive,
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  isSuspended
                    ? styles.pillTextSuspended
                    : styles.pillTextActive,
                ]}
              >
                {statusLabel(member.status)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* OWNER rows are read-only — only owners/managers
          see actions, matching the web dashboard. */}
      {!isOwner && (
        <View style={styles.memberActions}>
          <View style={styles.rolePicker}>
            {MEMBER_ROLES.map((role) => {
              const selected =
                member.role === role;

              return (
                <Pressable
                  key={role}
                  onPress={() => {
                    if (!selected) {
                      onRoleChange(role);
                    }
                  }}
                  style={[
                    styles.roleOption,
                    selected &&
                      styles.roleOptionSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.roleOptionText,
                      selected &&
                        styles.roleOptionTextSelected,
                    ]}
                  >
                    {roleLabel(role)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.actionRow}>
            <Pressable
              onPress={onToggleStatus}
              style={[
                styles.actionButton,
                styles.statusButton,
              ]}
            >
              <Ionicons
                name={
                  isSuspended
                    ? "play-outline"
                    : "pause-outline"
                }
                size={14}
                color={COLORS.primary}
              />

              <Text
                style={styles.actionButtonText}
              >
                {isSuspended
                  ? "Reactivate"
                  : "Suspend"}
              </Text>
            </Pressable>

            <Pressable
              onPress={onRemove}
              style={[
                styles.actionButton,
                styles.removeButton,
              ]}
            >
              <Ionicons
                name="trash-outline"
                size={14}
                color={COLORS.danger}
              />

              <Text
                style={[
                  styles.actionButtonText,
                  styles.removeButtonText,
                ]}
              >
                Remove
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

/* ================================================= */
/* INVITATION ROW                                    */
/* ================================================= */

function InvitationRow({
  invitation,
  onResend,
  onRevoke,
}: {
  invitation: StaffInvitation;
  onResend: () => void;
  onRevoke: () => void;
}) {
  const pending =
    invitation.status === "PENDING";

  return (
    <View style={styles.card}>
      <View style={styles.memberTop}>
        <View style={styles.avatar}>
          <Ionicons
            name="mail-outline"
            size={18}
            color={COLORS.primary}
          />
        </View>

        <View style={styles.memberInfo}>
          <Text
            numberOfLines={1}
            style={styles.memberName}
          >
            {invitation.email}
          </Text>

          <Text style={styles.memberMeta}>
            Invited as {roleLabel(invitation.role)}
          </Text>

          <View style={styles.pillRow}>
            <View
              style={[
                styles.pill,
                pending
                  ? styles.pillPending
                  : styles.pillExpired,
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  pending
                    ? styles.pillTextPending
                    : styles.pillTextExpired,
                ]}
              >
                {statusLabel(invitation.status)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {pending && (
        <View style={styles.actionRow}>
          <Pressable
            onPress={onResend}
            style={[
              styles.actionButton,
              styles.statusButton,
            ]}
          >
            <Ionicons
              name="refresh-outline"
              size={14}
              color={COLORS.primary}
            />

            <Text
              style={styles.actionButtonText}
            >
              Resend
            </Text>
          </Pressable>

          <Pressable
            onPress={onRevoke}
            style={[
              styles.actionButton,
              styles.removeButton,
            ]}
          >
            <Ionicons
              name="close-outline"
              size={14}
              color={COLORS.danger}
            />

            <Text
              style={[
                styles.actionButtonText,
                styles.removeButtonText,
              ]}
            >
              Revoke
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

/* ================================================= */
/* INVITE DIALOG                                     */
/* ================================================= */

function InviteDialog({
  visible,
  loading,
  onClose,
  onInvite,
}: {
  visible: boolean;
  loading: boolean;
  onClose: () => void;
  onInvite: (
    email: string,
    role: "MANAGER" | "STAFF"
  ) => void;
}) {
  const [email, setEmail] = useState("");

  const [role, setRole] =
    useState<"MANAGER" | "STAFF">(
      "STAFF"
    );

  useEffect(() => {
    if (visible) {
      setEmail("");
      setRole("STAFF");
    }
  }, [visible]);

  const trimmed = email.trim();

  const emailValid =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      trimmed
    );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Invite team member
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

          <ScrollView
            showsVerticalScrollIndicator={
              false
            }
            keyboardShouldPersistTaps="handled"
          >
            <Input
              label="Email address"
              placeholder="teammate@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              error={
                email.length > 0 &&
                !emailValid
                  ? "Enter a valid email address."
                  : undefined
              }
            />

            <Text style={styles.fieldLabel}>
              Role
            </Text>

            {(
              ["MANAGER", "STAFF"] as const
            ).map((option) => {
              const selected =
                role === option;

              return (
                <Pressable
                  key={option}
                  onPress={() =>
                    setRole(option)
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
                      {roleLabel(option)}
                    </Text>

                    <Text
                      style={
                        styles.optionSubtitle
                      }
                    >
                      {option === "MANAGER"
                        ? "Can manage team, QR codes and settings"
                        : "Can create and edit QR codes"}
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

            <View
              style={styles.inviteButton}
            >
              <Button
                title={
                  loading
                    ? "Sending..."
                    : "Send invitation"
                }
                loading={loading}
                disabled={!emailValid}
                onPress={() =>
                  onInvite(trimmed, role)
                }
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/* ================================================= */
/* PAGE NAV                                          */
/* ================================================= */

function PageNav({
  page,
  totalPages,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <View style={styles.pageNav}>
      <Pressable
        onPress={onPrev}
        disabled={page <= 1}
        style={({ pressed }) => [
          styles.pageButton,
          page <= 1 && styles.pageButtonDisabled,
          pressed &&
            page > 1 &&
            styles.pressed,
        ]}
      >
        <Ionicons
          name="chevron-back"
          size={16}
          color={
            page <= 1
              ? COLORS.textMuted
              : COLORS.primary
          }
        />

        <Text
          style={[
            styles.pageButtonText,
            page <= 1 &&
              styles.pageButtonTextDisabled,
          ]}
        >
          Prev
        </Text>
      </Pressable>

      <Text style={styles.pageLabel}>
        Page {page} of {totalPages}
      </Text>

      <Pressable
        onPress={onNext}
        disabled={page >= totalPages}
        style={({ pressed }) => [
          styles.pageButton,
          page >= totalPages &&
            styles.pageButtonDisabled,
          pressed &&
            page < totalPages &&
            styles.pressed,
        ]}
      >
        <Text
          style={[
            styles.pageButtonText,
            page >= totalPages &&
              styles.pageButtonTextDisabled,
          ]}
        >
          Next
        </Text>

        <Ionicons
          name="chevron-forward"
          size={16}
          color={
            page >= totalPages
              ? COLORS.textMuted
              : COLORS.primary
          }
        />
      </Pressable>
    </View>
  );
}

/* ================================================= */
/* STYLES                                            */
/* ================================================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    padding: SPACING.xl,
    paddingBottom: SPACING.huge,
  },

  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  loaderText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  errorTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
  },

  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
  },

  retry: {
    marginTop: 16,
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.primary,
  },

  inlineLoader: {
    marginVertical: SPACING.sm,
  },

  pressed: {
    opacity: 0.7,
  },

  /* Header */

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.xl,
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    color: COLORS.primary,
    marginBottom: 5,
  },

  title: {
    fontSize: 30,
    fontWeight: "900",
    color: COLORS.text,
  },

  subtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.textSecondary,
  },

  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Business switcher */

  switcher: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.xl,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  switcherIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  switcherName: {
    flex: 1,
    marginHorizontal: SPACING.md,
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },

  /* Summary cards */

  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: SPACING.xl,
  },

  roleCard: {
    flex: 1,
    minWidth: 150,
    minHeight: 155,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    justifyContent: "space-between",
  },

  roleIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  roleTitle: {
    marginTop: SPACING.md,
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
  },

  roleValue: {
    marginTop: SPACING.xs,
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.text,
  },

  roleSubtitle: {
    marginTop: SPACING.xs,
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  /* Tabs */

  tabBar: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
    alignSelf: "flex-start",
    flexDirection: "row",
    padding: 4,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  tabButton: {
    minWidth: 120,
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  tabButtonSelected: {
    backgroundColor: COLORS.primary,
  },

  tabText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },

  tabTextSelected: {
    color: COLORS.white,
  },

  /* Member / invitation cards */

  card: {
    marginBottom: 12,
    padding: SPACING.lg,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  memberTop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.primary,
  },

  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },

  memberName: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
  },

  memberMeta: {
    marginTop: 3,
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  pillRow: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },

  pill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
  },

  pillText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textSecondary,
  },

  pillOwner: {
    backgroundColor: "#FEF3C7",
  },

  pillTextOwner: {
    color: "#B45309",
  },

  pillActive: {
    backgroundColor: "#DCFCE7",
  },

  pillTextActive: {
    color: "#15803D",
  },

  pillSuspended: {
    backgroundColor: "#FEE2E2",
  },

  pillTextSuspended: {
    color: "#B91C1C",
  },

  pillPending: {
    backgroundColor: "#FEF3C7",
  },

  pillTextPending: {
    color: "#B45309",
  },

  pillExpired: {
    backgroundColor: "#F1F5F9",
  },

  pillTextExpired: {
    color: COLORS.textSecondary,
  },

  memberActions: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  rolePicker: {
    flexDirection: "row",
    padding: 3,
    borderRadius: 12,
    backgroundColor: COLORS.background,
  },

  roleOption: {
    flex: 1,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  roleOptionSelected: {
    backgroundColor: COLORS.primary,
  },

  roleOptionText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },

  roleOptionTextSelected: {
    color: COLORS.white,
  },

  actionRow: {
    marginTop: 10,
    flexDirection: "row",
    gap: 10,
  },

  actionButton: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
  },

  statusButton: {
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
  },

  actionButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
  },

  removeButton: {
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
  },

  removeButtonText: {
    color: COLORS.danger,
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

  businessRow: {
    minHeight: 58,
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

  businessRowSelected: {
    borderColor: COLORS.primary,
  },

  businessName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },

  fieldLabel: {
    marginBottom: 7,
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
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

  inviteButton: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },

  /* Page nav */

  pageNav: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  pageButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },

  pageButtonDisabled: {
    opacity: 0.5,
  },

  pageButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
  },

  pageButtonTextDisabled: {
    color: COLORS.textMuted,
  },

  pageLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
});

