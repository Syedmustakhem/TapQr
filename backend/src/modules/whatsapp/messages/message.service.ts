import { prisma } from "../../../config/prisma";
import { messageRepository } from "./message.repository";
import {
  WhatsAppMessageDirection,
  WhatsAppMessageStatus,
  WhatsAppMessageType,
} from "@prisma/client";

export class MessageService {
  async getMessages(
    businessId: string,
    conversationId: string,
    options?: {
      page?: number;
      limit?: number;
    },
  ) {
    return messageRepository.findByConversation(
      businessId,
      conversationId,
      options,
    );
  }

  async getMessage(
    businessId: string,
    messageId: string,
  ) {
    const message = await messageRepository.findById(
      businessId,
      messageId,
    );

    if (!message) {
      throw new Error("Message not found");
    }

    return message;
  }

  async sendTextMessage(
    businessId: string,
    conversationId: string,
    text: string,
  ) {
    if (!text?.trim()) {
      throw new Error("Message text is required");
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        businessId,
      },
      include: {
        contact: true,
      },
    });

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    const phoneNumberId =
      process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();

    const accessToken =
      process.env.WHATSAPP_ACCESS_TOKEN?.trim();

    const apiVersion =
      process.env.WHATSAPP_API_VERSION?.trim() || "v23.0";

    if (!phoneNumberId) {
      throw new Error(
        "WHATSAPP_PHONE_NUMBER_ID is not configured",
      );
    }

    if (!accessToken) {
      throw new Error(
        "WHATSAPP_ACCESS_TOKEN is not configured",
      );
    }

    const url =
      `https://graph.facebook.com/${apiVersion}/` +
      `${phoneNumberId}/messages`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: conversation.contact.phoneNumber,
        type: "text",
        text: {
          preview_url: false,
          body: text.trim(),
        },
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result?.error?.message ||
          "Failed to send WhatsApp message",
      );
    }

    const whatsappMessageId =
      result?.messages?.[0]?.id;

    if (!whatsappMessageId) {
      throw new Error(
        "WhatsApp API did not return a message ID",
      );
    }

    const savedMessage =
      await prisma.whatsAppMessage.create({
        data: {
          businessId,
          conversationId,
          whatsappMessageId,
          direction: WhatsAppMessageDirection.OUTBOUND,
          type: WhatsAppMessageType.TEXT,
          text: text.trim(),
          status: WhatsAppMessageStatus.SENT,
        },
      });

    await prisma.conversation.update({
      where: {
        id: conversationId,
      },
      data: {
        lastMessageAt: new Date(),
        status: "OPEN",
      },
    });

    return savedMessage;
  }
}

export const messageService = new MessageService();