// src/api/supportApi.ts
//
// WhatsApp support inbox endpoints, mirroring the TapQR
// web dashboard support page (components/dashboard/
// support-inbox.tsx calls these exact paths against
// https://api.tapqr.shop/api).
//
// Uses the shared authenticated axios instance from
// authApi.ts (Bearer token + 401 refresh interceptors).

import api from "./authApi";

export type ConversationStatus =
  | "OPEN"
  | "PENDING"
  | "RESOLVED"
  | "CLOSED";

export type HandlingMode =
  | "AI"
  | "HUMAN";

export type MessageDirection =
  | "INBOUND"
  | "OUTBOUND";

export type SupportContact = {
  id: string;
  phoneNumber?: string | null;
  displayName?: string | null;
  profileName?: string | null;
};

export type Conversation = {
  id: string;
  status: ConversationStatus;
  priority?: string | null;
  handlingMode: HandlingMode;
  lastMessageAt?: string | null;
  createdAt?: string;
  contact?: SupportContact | null;
  assignedTo?: {
    id: string;
    name?: string | null;
    email?: string | null;
  } | null;
};

export type WhatsAppMessage = {
  id: string;
  direction: MessageDirection;
  type?: string | null;
  text?: string | null;
  content?: string | null;
  status?: string | null;
  mediaId?: string | null;
  mediaUrl?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  metadata?: unknown;
  templateName?: string | null;
  createdAt: string;
};

type Envelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

/**
 * GET /whatsapp/conversations?limit=100&page=1
 */
export async function getConversations(
  page: number = 1,
  limit: number = 100
): Promise<Conversation[]> {
  const res =
    await api.get<
      Envelope<Conversation[]>
    >("/whatsapp/conversations", {
      params: { page, limit },
    });

  return res.data?.data ?? [];
}

/**
 * GET /whatsapp/conversations/:conversationId/messages?limit=200&page=1
 */
export async function getConversationMessages(
  conversationId: string,
  page: number = 1,
  limit: number = 200
): Promise<WhatsAppMessage[]> {
  const res =
    await api.get<
      Envelope<WhatsAppMessage[]>
    >(
      `/whatsapp/conversations/${conversationId}/messages`,
      {
        params: { page, limit },
      }
    );

  return res.data?.data ?? [];
}

/**
 * POST /whatsapp/conversations — start a new conversation.
 * The web dashboard sends { phoneNumber }.
 */
export async function createConversation(
  phoneNumber: string
): Promise<Conversation> {
  const res =
    await api.post<
      Envelope<Conversation>
    >("/whatsapp/conversations", {
      phoneNumber,
    });

  if (!res.data?.data) {
    throw new Error(
      res.data?.message ??
        "Unable to start the conversation."
    );
  }

  return res.data.data;
}

/**
 * POST /whatsapp/conversations/:conversationId/messages —
 * send a free-form message. The web dashboard sends
 * { text }.
 */
export async function sendMessage(
  conversationId: string,
  text: string
): Promise<WhatsAppMessage> {
  const res =
    await api.post<
      Envelope<WhatsAppMessage>
    >(
      `/whatsapp/conversations/${conversationId}/messages`,
      { text }
    );

  if (!res.data?.data) {
    throw new Error(
      res.data?.message ??
        "Unable to send the message."
    );
  }

  return res.data.data;
}

/**
 * POST /whatsapp/conversations/:conversationId/template —
 * send the default support template message (no body).
 */
export async function sendTemplate(
  conversationId: string
): Promise<WhatsAppMessage | null> {
  const res =
    await api.post<
      Envelope<WhatsAppMessage>
    >(
      `/whatsapp/conversations/${conversationId}/template`
    );

  return res.data?.data ?? null;
}

/**
 * PATCH /whatsapp/conversations/:conversationId/status —
 * move a conversation between OPEN / PENDING / RESOLVED /
 * CLOSED. The web dashboard sends { status }.
 */
export async function updateConversationStatus(
  conversationId: string,
  status: ConversationStatus
): Promise<Conversation> {
  const res =
    await api.patch<
      Envelope<Conversation>
    >(
      `/whatsapp/conversations/${conversationId}/status`,
      { status }
    );

  if (!res.data?.data) {
    throw new Error(
      res.data?.message ??
        "Unable to update the conversation status."
    );
  }

  return res.data.data;
}

/**
 * PATCH /whatsapp/conversations/:conversationId/handling-mode —
 * hand the conversation to the AI or to a human agent.
 * The web dashboard sends { handlingMode }.
 */
export async function updateHandlingMode(
  conversationId: string,
  handlingMode: HandlingMode
): Promise<Conversation> {
  const res =
    await api.patch<
      Envelope<Conversation>
    >(
      `/whatsapp/conversations/${conversationId}/handling-mode`,
      { handlingMode }
    );

  if (!res.data?.data) {
    throw new Error(
      res.data?.message ??
        "Unable to update the handling mode."
    );
  }

  return res.data.data;
}

/**
 * Display name for a conversation contact, matching the
 * web dashboard's getContactName helper.
 */
export function contactName(
  conversation: Conversation
): string {
  return (
    conversation.contact?.displayName ||
    conversation.contact?.profileName ||
    conversation.contact?.phoneNumber ||
    "Unknown customer"
  );
}

/**
 * Plain-text body of a WhatsApp message, matching the
 * web dashboard's messageText helper.
 */
export function messageText(
  message: WhatsAppMessage
): string {
  return (
    message.text || message.content || ""
  );
}
