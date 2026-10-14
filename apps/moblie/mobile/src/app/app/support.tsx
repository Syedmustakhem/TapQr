import {
  useEffect,
  useRef,
  useState,
} from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { COLORS } from "../../constants/colors";
import { SPACING } from "../../constants/spacing";

import {
  contactName,
  createConversation,
  getConversationMessages,
  getConversations,
  messageText,
  sendMessage,
  sendTemplate,
  updateConversationStatus,
  updateHandlingMode,
  type Conversation,
  type ConversationStatus,
  type HandlingMode,
  type WhatsAppMessage,
} from "../../api/supportApi";

import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import EmptyState from "../../components/common/EmptyState";

const CONVERSATIONS_KEY = "support-conversations";

const messagesKey = (conversationId: string) => [
  "support-messages",
  conversationId,
];

type StatusFilter =
  | "ALL"
  | ConversationStatus;

const STATUS_FILTERS: StatusFilter[] = [
  "ALL",
  "OPEN",
  "PENDING",
  "RESOLVED",
  "CLOSED",
];

const STATUSES: ConversationStatus[] = [
  "OPEN",
  "PENDING",
  "RESOLVED",
  "CLOSED",
];

function statusLabel(status: string) {
  return (
    status.charAt(0) +
    status.slice(1).toLowerCase()
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

function formatConversationTime(
  value?: string | null
) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();

  if (
    date.toDateString() ===
    now.toDateString()
  ) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
  });
}

function formatMessageTime(
  value?: string | null
) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SupportScreen() {
  const queryClient = useQueryClient();

  const [conversationId, setConversationId] =
    useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");

  const [newChatOpen, setNewChatOpen] =
    useState(false);

  const conversationsQuery = useQuery({
    queryKey: [CONVERSATIONS_KEY],
    queryFn: () => getConversations(1, 100),
    staleTime: 30 * 1000,
  });

  const conversations =
    conversationsQuery.data ?? [];

  /*
   * Client-side search + status filter, matching the
   * web dashboard's SupportInbox behavior.
   */
  const filtered = conversations.filter(
    (item) => {
      if (
        statusFilter !== "ALL" &&
        item.status !== statusFilter
      ) {
        return false;
      }

      const term = search
        .trim()
        .toLowerCase();

      if (!term) return true;

      const haystack = [
        contactName(item),
        item.contact?.phoneNumber ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    }
  );

  const counts = {
    open: conversations.filter(
      (item) => item.status === "OPEN"
    ).length,
    pending: conversations.filter(
      (item) => item.status === "PENDING"
    ).length,
    resolved: conversations.filter(
      (item) => item.status === "RESOLVED"
    ).length,
    closed: conversations.filter(
      (item) => item.status === "CLOSED"
    ).length,
  };

  const createMutation = useMutation({
    mutationFn: (phoneNumber: string) =>
      createConversation(phoneNumber),
    onSuccess: (conversation) => {
      void queryClient.invalidateQueries({
        queryKey: [CONVERSATIONS_KEY],
      });

      setNewChatOpen(false);
      setConversationId(conversation.id);
    },
    onError: (error) => {
      Alert.alert(
        "Could not start chat",
        error instanceof Error
          ? error.message
          : "Check the phone number and try again."
      );
    },
  });

  const selectedConversation =
    conversations.find(
      (item) => item.id === conversationId
    ) ?? null;

  /*
   * LIST / ERROR STATES
   */
  if (
    conversationsQuery.isLoading &&
    !conversationId
  ) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View style={styles.centered}>
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
          />

          <Text style={styles.loaderText}>
            Loading inbox...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (
    conversationsQuery.isError &&
    !conversationId
  ) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>
            Unable to load inbox
          </Text>

          <Text style={styles.errorText}>
            Check your connection and try
            again.
          </Text>

          <Text
            style={styles.retry}
            onPress={() =>
              void conversationsQuery.refetch()
            }
          >
            Tap to retry
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {conversationId ? (
        <ThreadView
          conversationId={conversationId}
          conversation={selectedConversation}
          onBack={() =>
            setConversationId(null)
          }
          onConversationChanged={() => {
            void queryClient.invalidateQueries(
              {
                queryKey: [
                  CONVERSATIONS_KEY,
                ],
              }
            );
          }}
        />
      ) : (
        <View style={styles.listWrap}>
          {/* HEADER */}

          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>
                WHATSAPP SUPPORT
              </Text>

              <Text style={styles.title}>
                Support inbox
              </Text>

              <Text style={styles.subtitle}>
                Customer conversations from
                WhatsApp.
              </Text>
            </View>

            <Pressable
              onPress={() =>
                setNewChatOpen(true)
              }
              style={({ pressed }) => [
                styles.newButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name="add"
                size={20}
                color={COLORS.white}
              />
            </Pressable>
          </View>

          {/* COUNT CARDS */}

          <View style={styles.countRow}>
            <CountChip
              label="Open"
              value={counts.open}
              dotColor="#10B981"
            />

            <CountChip
              label="Pending"
              value={counts.pending}
              dotColor="#F59E0B"
            />

            <CountChip
              label="Resolved"
              value={counts.resolved}
              dotColor="#3B82F6"
            />

            <CountChip
              label="Closed"
              value={counts.closed}
              dotColor="#94A3B8"
            />
          </View>

          {/* SEARCH + FILTER */}

          <Input
            placeholder="Search by name or phone..."
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />

          <View style={styles.filterRow}>
            {STATUS_FILTERS.map((filter) => {
              const selected =
                statusFilter === filter;

              return (
                <Pressable
                  key={filter}
                  onPress={() =>
                    setStatusFilter(filter)
                  }
                  style={[
                    styles.filterPill,
                    selected &&
                      styles.filterPillSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      selected &&
                        styles.filterTextSelected,
                    ]}
                  >
                    {statusLabel(filter)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* CONVERSATION LIST */}

          <FlatList
            data={filtered}
            keyExtractor={(item) =>
              item.id
            }
            showsVerticalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.listContent
            }
            refreshing={
              conversationsQuery.isFetching
            }
            onRefresh={() =>
              void conversationsQuery.refetch()
            }
            ListEmptyComponent={
              <EmptyState
                title="No conversations"
                message={
                  search.trim() ||
                  statusFilter !== "ALL"
                    ? "No conversations match your filters."
                    : "Start a new conversation to message a customer on WhatsApp."
                }
              />
            }
            renderItem={({ item }) => (
              <ConversationRow
                conversation={item}
                onPress={() =>
                  setConversationId(item.id)
                }
              />
            )}
          />
        </View>
      )}

      {/* NEW CONVERSATION DIALOG */}

      <NewConversationDialog
        visible={newChatOpen}
        loading={createMutation.isPending}
        onClose={() =>
          setNewChatOpen(false)
        }
        onStart={(phone) =>
          createMutation.mutate(phone)
        }
      />
    </SafeAreaView>
  );
}

/* ================================================= */
/* COUNT CHIP                                        */
/* ================================================= */

function CountChip({
  label,
  value,
  dotColor,
}: {
  label: string;
  value: number;
  dotColor: string;
}) {
  return (
    <View style={styles.countChip}>
      <View
        style={[
          styles.countDot,
          { backgroundColor: dotColor },
        ]}
      />

      <Text style={styles.countValue}>
        {value}
      </Text>

      <Text style={styles.countLabel}>
        {label}
      </Text>
    </View>
  );
}

/* ================================================= */
/* CONVERSATION ROW                                  */
/* ================================================= */

function ConversationRow({
  conversation,
  onPress,
}: {
  conversation: Conversation;
  onPress: () => void;
}) {
  const name = contactName(conversation);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.rowAvatar}>
        <Text style={styles.rowAvatarText}>
          {initials(name)}
        </Text>

        {conversation.status === "OPEN" && (
          <View style={styles.rowDot} />
        )}
      </View>

      <View style={styles.rowContent}>
        <View style={styles.rowTop}>
          <Text
            numberOfLines={1}
            style={styles.rowName}
          >
            {name}
          </Text>

          <Text style={styles.rowTime}>
            {formatConversationTime(
              conversation.lastMessageAt ??
                conversation.createdAt
            )}
          </Text>
        </View>

        <View style={styles.rowBottom}>
          <Text
            numberOfLines={1}
            style={styles.rowPhone}
          >
            {conversation.contact
              ?.phoneNumber ?? "WhatsApp"}
          </Text>

          <View
            style={[
              styles.statusPill,
              statusPillStyle(
                conversation.status
              ),
            ]}
          >
            <Text
              style={[
                styles.statusPillText,
                statusPillTextStyle(
                  conversation.status
                ),
              ]}
            >
              {statusLabel(conversation.status)}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function statusPillStyle(
  status: ConversationStatus
) {
  switch (status) {
    case "OPEN":
      return { backgroundColor: "#D1FAE5" };

    case "PENDING":
      return { backgroundColor: "#FEF3C7" };

    case "RESOLVED":
      return { backgroundColor: "#DBEAFE" };

    default:
      return { backgroundColor: "#F1F5F9" };
  }
}

function statusPillTextStyle(
  status: ConversationStatus
) {
  switch (status) {
    case "OPEN":
      return { color: "#047857" };

    case "PENDING":
      return { color: "#B45309" };

    case "RESOLVED":
      return { color: "#1D4ED8" };

    default:
      return { color: COLORS.textSecondary };
  }
}

/* ================================================= */
/* NEW CONVERSATION DIALOG                           */
/* ================================================= */

function NewConversationDialog({
  visible,
  loading,
  onClose,
  onStart,
}: {
  visible: boolean;
  loading: boolean;
  onClose: () => void;
  onStart: (phoneNumber: string) => void;
}) {
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (visible) {
      setPhone("");
    }
  }, [visible]);

  const trimmed = phone.trim();

  const phoneValid = trimmed.length >= 8;

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
              New conversation
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

          <Input
            label="Customer phone number"
            placeholder="+91 98765 43210"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            error={
              phone.length > 0 && !phoneValid
                ? "Enter a valid phone number."
                : undefined
            }
          />

          <View style={styles.dialogButton}>
            <Button
              title={
                loading
                  ? "Starting..."
                  : "Start conversation"
              }
              loading={loading}
              disabled={!phoneValid}
              onPress={() =>
                onStart(trimmed)
              }
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ================================================= */
/* THREAD VIEW                                       */
/* ================================================= */

function ThreadView({
  conversationId,
  conversation,
  onBack,
  onConversationChanged,
}: {
  conversationId: string;
  conversation: Conversation | null;
  onBack: () => void;
  onConversationChanged: () => void;
}) {
  const queryClient = useQueryClient();

  const [composer, setComposer] = useState("");

  const listRef = useRef<FlatList | null>(
    null
  );

  const key = messagesKey(conversationId);

  const messagesQuery = useQuery({
    queryKey: key,
    queryFn: () =>
      getConversationMessages(
        conversationId,
        1,
        200
      ),
    staleTime: 10 * 1000,
  });

  const messages = messagesQuery.data ?? [];

  /*
   * Auto-scroll to the newest message whenever the
   * thread grows.
   */
  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        listRef.current?.scrollToEnd({
          animated: true,
        });
      }, 100);

      return () => clearTimeout(timer);
    }

    return undefined;
  }, [messages.length]);

  const appendMessage = (
    message: WhatsAppMessage
  ) => {
    queryClient.setQueryData<
      WhatsAppMessage[]
    >(key, (current) => {
      const list = current ?? [];

      if (
        list.some(
          (item) => item.id === message.id
        )
      ) {
        return list;
      }

      return [...list, message];
    });
  };

  const sendMutation = useMutation({
    mutationFn: (text: string) =>
      sendMessage(conversationId, text),
    onMutate: async (text) => {
      await queryClient.cancelQueries({
        queryKey: key,
      });

      const previous =
        queryClient.getQueryData<
          WhatsAppMessage[]
        >(key);

      const optimistic: WhatsAppMessage = {
        id: `local-${Date.now()}`,
        direction: "OUTBOUND",
        text,
        status: "SENDING",
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<
        WhatsAppMessage[]
      >(key, [...(previous ?? []), optimistic]);

      return { previous };
    },
    onError: (error, _text, context) => {
      queryClient.setQueryData(
        key,
        context?.previous ?? []
      );

      Alert.alert(
        "Send failed",
        error instanceof Error
          ? error.message
          : "Could not send the message."
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: key,
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: ConversationStatus) =>
      updateConversationStatus(
        conversationId,
        status
      ),
    onSuccess: () => {
      onConversationChanged();
    },
    onError: (error) => {
      Alert.alert(
        "Status change failed",
        error instanceof Error
          ? error.message
          : "Could not update the status."
      );
    },
  });

  const modeMutation = useMutation({
    mutationFn: (mode: HandlingMode) =>
      updateHandlingMode(
        conversationId,
        mode
      ),
    onSuccess: () => {
      onConversationChanged();
    },
    onError: (error) => {
      Alert.alert(
        "Mode change failed",
        error instanceof Error
          ? error.message
          : "Could not update the handling mode."
      );
    },
  });

  const templateMutation = useMutation({
    mutationFn: () =>
      sendTemplate(conversationId),
    onSuccess: (message) => {
      if (message?.id) {
        appendMessage(message);
      }
    },
    onError: (error) => {
      Alert.alert(
        "Template send failed",
        error instanceof Error
          ? error.message
          : "Could not send the template."
      );
    },
  });

  const handleSend = () => {
    const text = composer.trim();

    if (!text || sendMutation.isPending) {
      return;
    }

    setComposer("");
    sendMutation.mutate(text);
  };

  const name = conversation
    ? contactName(conversation)
    : "Conversation";

  return (
    <KeyboardAvoidingView
      style={styles.threadWrap}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
      keyboardVerticalOffset={0}
    >
      {/* THREAD HEADER */}

      <View style={styles.threadHeader}>
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={COLORS.text}
          />
        </Pressable>

        <View style={styles.threadTitleWrap}>
          <Text
            numberOfLines={1}
            style={styles.threadTitle}
          >
            {name}
          </Text>

          <Text
            numberOfLines={1}
            style={styles.threadSubtitle}
          >
            {conversation?.contact
              ?.phoneNumber ??
              "WhatsApp customer"}
          </Text>
        </View>

        <Pressable
          onPress={() =>
            templateMutation.mutate()
          }
          disabled={
            templateMutation.isPending
          }
          style={({ pressed }) => [
            styles.templateButton,
            pressed && styles.pressed,
          ]}
          accessibilityLabel="Send template message"
        >
          <Ionicons
            name="document-text-outline"
            size={20}
            color={COLORS.primary}
          />
        </Pressable>
      </View>

      {/* CONTROLS */}

      <View style={styles.controls}>
        <View style={styles.controlRow}>
          <Text style={styles.controlLabel}>
            Status
          </Text>

          <View style={styles.statusRow}>
            {STATUSES.map((status) => {
              const selected =
                conversation?.status ===
                status;

              return (
                <Pressable
                  key={status}
                  onPress={() =>
                    statusMutation.mutate(status)
                  }
                  style={[
                    styles.statusOption,
                    selected &&
                      styles.statusOptionSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusOptionText,
                      selected &&
                        styles.statusOptionTextSelected,
                    ]}
                  >
                    {statusLabel(status)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.controlRow}>
          <Text style={styles.controlLabel}>
            Handled by
          </Text>

          <View style={styles.modePicker}>
            {(["AI", "HUMAN"] as const).map(
              (mode) => {
                const selected =
                  conversation?.handlingMode ===
                  mode;

                return (
                  <Pressable
                    key={mode}
                    onPress={() =>
                      modeMutation.mutate(mode)
                    }
                    style={[
                      styles.modeOption,
                      selected &&
                        styles.modeOptionSelected,
                    ]}
                  >
                    <Ionicons
                      name={
                        mode === "AI"
                          ? "sparkles-outline"
                          : "person-outline"
                      }
                      size={13}
                      color={
                        selected
                          ? COLORS.white
                          : COLORS.textSecondary
                      }
                    />

                    <Text
                      style={[
                        styles.modeOptionText,
                        selected &&
                          styles.modeOptionTextSelected,
                      ]}
                    >
                      {mode === "AI"
                        ? "AI"
                        : "Human"}
                    </Text>
                  </Pressable>
                );
              }
            )}
          </View>
        </View>
      </View>

      {/* MESSAGES */}

      {messagesQuery.isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
          />
        </View>
      ) : messagesQuery.isError ? (
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>
            Unable to load messages
          </Text>

          <Text
            style={styles.retry}
            onPress={() =>
              void messagesQuery.refetch()
            }
          >
            Tap to retry
          </Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.threadList
          }
          refreshing={
            messagesQuery.isFetching
          }
          onRefresh={() =>
            void messagesQuery.refetch()
          }
          ListEmptyComponent={
            <EmptyState
              title="No messages yet"
              message="Say hello to start the conversation."
            />
          }
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
            />
          )}
        />
      )}

      {/* COMPOSER */}

      <View style={styles.composer}>
        <TextInput
          style={styles.composerInput}
          placeholder="Type a message..."
          placeholderTextColor={
            COLORS.textMuted
          }
          value={composer}
          onChangeText={setComposer}
          multiline
          maxLength={4096}
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />

        <Pressable
          onPress={handleSend}
          disabled={
            !composer.trim() ||
            sendMutation.isPending
          }
          style={({ pressed }) => [
            styles.sendButton,
            (!composer.trim() ||
              sendMutation.isPending) &&
              styles.sendButtonDisabled,
            pressed && styles.pressed,
          ]}
        >
          {sendMutation.isPending ? (
            <ActivityIndicator
              size="small"
              color={COLORS.white}
            />
          ) : (
            <Ionicons
              name="send"
              size={18}
              color={COLORS.white}
            />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ================================================= */
/* MESSAGE BUBBLE                                    */
/* ================================================= */

function MessageBubble({
  message,
}: {
  message: WhatsAppMessage;
}) {
  const outbound =
    message.direction === "OUTBOUND";

  const body = messageText(message);

  return (
    <View
      style={[
        styles.bubbleRow,
        outbound
          ? styles.bubbleRowOutbound
          : styles.bubbleRowInbound,
      ]}
    >
      <View
        style={[
          styles.bubble,
          outbound
            ? styles.bubbleOutbound
            : styles.bubbleInbound,
        ]}
      >
        {!!message.templateName && (
          <Text
            style={[
              styles.bubbleTemplate,
              outbound
                ? styles.bubbleTextOutbound
                : styles.bubbleTextInbound,
            ]}
          >
            Template: {message.templateName}
          </Text>
        )}

        <Text
          style={
            outbound
              ? styles.bubbleTextOutbound
              : styles.bubbleTextInbound
          }
        >
          {body || "(no text)"}
        </Text>

        <Text
          style={[
            styles.bubbleTime,
            outbound
              ? styles.bubbleTimeOutbound
              : styles.bubbleTimeInbound,
          ]}
        >
          {formatMessageTime(
            message.createdAt
          )}
        </Text>
      </View>
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

  pressed: {
    opacity: 0.7,
  },

  /* List view */

  listWrap: {
    flex: 1,
    padding: SPACING.xl,
    paddingBottom: 0,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.lg,
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

  newButton: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  countRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: SPACING.lg,
  },

  countChip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },

  countDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 6,
  },

  countValue: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.text,
  },

  countLabel: {
    marginTop: 2,
    fontSize: 10,
    color: COLORS.textSecondary,
  },

  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: SPACING.md,
  },

  filterPill: {
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  filterPillSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  filterText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },

  filterTextSelected: {
    color: COLORS.white,
  },

  listContent: {
    paddingBottom: SPACING.huge,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    marginBottom: 10,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  rowAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },

  rowAvatarText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#15803D",
  },

  rowDot: {
    position: "absolute",
    right: -1,
    bottom: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: COLORS.surface,
  },

  rowContent: {
    flex: 1,
    marginLeft: 12,
  },

  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  rowName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
    marginRight: 8,
  },

  rowTime: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },

  rowBottom: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  rowPhone: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
    marginRight: 8,
  },

  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },

  statusPillText: {
    fontSize: 10,
    fontWeight: "800",
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

  dialogButton: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },

  /* Thread view */

  threadWrap: {
    flex: 1,
  },

  threadHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  threadTitleWrap: {
    flex: 1,
    marginHorizontal: 4,
  },

  threadTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },

  threadSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  templateButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  controls: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },

  controlRow: {
    marginTop: SPACING.sm,
  },

  controlLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: COLORS.textSecondary,
    marginBottom: 6,
    textTransform: "uppercase",
  },

  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },

  statusOption: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 999,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  statusOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  statusOptionText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },

  statusOptionTextSelected: {
    color: COLORS.white,
  },

  modePicker: {
    flexDirection: "row",
    padding: 3,
    borderRadius: 12,
    backgroundColor: COLORS.background,
  },

  modeOption: {
    flex: 1,
    height: 36,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  modeOptionSelected: {
    backgroundColor: COLORS.primary,
  },

  modeOptionText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },

  modeOptionTextSelected: {
    color: COLORS.white,
  },

  threadList: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    flexGrow: 1,
  },

  bubbleRow: {
    flexDirection: "row",
    marginBottom: 10,
  },

  bubbleRowOutbound: {
    justifyContent: "flex-end",
  },

  bubbleRowInbound: {
    justifyContent: "flex-start",
  },

  bubble: {
    maxWidth: "80%",
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 16,
  },

  bubbleOutbound: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },

  bubbleInbound: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderBottomLeftRadius: 4,
  },

  bubbleTemplate: {
    fontSize: 10,
    fontWeight: "800",
    marginBottom: 4,
    opacity: 0.75,
  },

  bubbleTextOutbound: {
    fontSize: 15,
    lineHeight: 21,
    color: COLORS.white,
  },

  bubbleTextInbound: {
    fontSize: 15,
    lineHeight: 21,
    color: COLORS.text,
  },

  bubbleTime: {
    marginTop: 5,
    fontSize: 9,
    textAlign: "right",
  },

  bubbleTimeOutbound: {
    color: "rgba(255,255,255,0.75)",
  },

  bubbleTimeInbound: {
    color: COLORS.textMuted,
  },

  /* Composer */

  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8,
  },

  composerInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
  },

  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  sendButtonDisabled: {
    opacity: 0.45,
  },
});
