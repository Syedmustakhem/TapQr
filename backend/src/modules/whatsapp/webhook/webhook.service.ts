import { prisma } from "../../../config/prisma";
import {
  ConversationStatus,
  WhatsAppMessageDirection,
  WhatsAppMessageStatus,
  WhatsAppMessageType,
} from "@prisma/client";
import { whatsappAutomationService } from "../automation/automation.service";

export class WhatsAppWebhookService {
  verifyWebhook(
    mode?: string,
    token?: string,
    challenge?: string,
  ): string {
    const verifyToken =
      process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN?.trim();

    if (!verifyToken) {
      throw new Error(
        "WHATSAPP_WEBHOOK_VERIFY_TOKEN is not configured",
      );
    }

    if (mode !== "subscribe") {
      throw new Error("Invalid webhook mode");
    }

    if (!token || token.trim() !== verifyToken) {
      throw new Error("Invalid webhook verify token");
    }

    if (!challenge) {
      throw new Error("Missing webhook challenge");
    }

    console.log(
      "[WHATSAPP WEBHOOK] Verification successful",
    );

    return challenge;
  }

  async processWebhook(body: any): Promise<void> {
    console.log(
      "[WHATSAPP WEBHOOK] Incoming event:",
      JSON.stringify(body, null, 2),
    );

    if (
      body?.object !==
      "whatsapp_business_account"
    ) {
      console.log(
        "[WHATSAPP WEBHOOK] Ignoring unknown object",
      );
      return;
    }

    const entries = body?.entry ?? [];

    for (const entry of entries) {
      const changes = entry?.changes ?? [];

      for (const change of changes) {
        const value = change?.value;

        if (!value) {
          continue;
        }

        const messages = value?.messages ?? [];

        for (const message of messages) {
          await this.processIncomingMessage(
            value,
            message,
          );
        }

        const statuses = value?.statuses ?? [];

        for (const status of statuses) {
          await this.processMessageStatus(status);
        }
      }
    }
  }

  private async processIncomingMessage(
    value: any,
    message: any,
  ): Promise<void> {
    const phoneNumberId =
      value?.metadata?.phone_number_id;

    const customerPhone = message?.from;

    const whatsappMessageId = message?.id;

    if (
      !phoneNumberId ||
      !customerPhone ||
      !whatsappMessageId
    ) {
      console.warn(
        "[WHATSAPP WEBHOOK] Missing message information",
      );
      return;
    }

    const whatsappAccount =
      await prisma.whatsAppBusinessAccount.findUnique({
        where: {
          phoneNumberId,
        },
      });

    if (!whatsappAccount) {
      console.warn(
        "[WHATSAPP WEBHOOK] WhatsApp account not mapped",
        {
          phoneNumberId,
        },
      );
      return;
    }

    if (!whatsappAccount.isActive) {
      console.warn(
        "[WHATSAPP WEBHOOK] WhatsApp account inactive",
        {
          phoneNumberId,
        },
      );
      return;
    }

    const businessId =
      whatsappAccount.businessId;

    const profileName =
      value?.contacts?.[0]?.profile?.name ??
      null;

    const contact =
      await prisma.whatsAppContact.upsert({
        where: {
          businessId_phoneNumber: {
            businessId,
            phoneNumber: customerPhone,
          },
        },

        create: {
          businessId,
          phoneNumber: customerPhone,
          profileName,
          displayName: profileName,
          lastSeenAt: new Date(),
        },

        update: {
          ...(profileName
            ? {
                profileName,
                displayName: profileName,
              }
            : {}),

          lastSeenAt: new Date(),
        },
      });

    let conversation =
      await prisma.conversation.findFirst({
        where: {
          businessId,
          contactId: contact.id,
          status: {
            in: [
              ConversationStatus.OPEN,
              ConversationStatus.PENDING,
            ],
          },
        },

        orderBy: {
          updatedAt: "desc",
        },
      });

    if (!conversation) {
      conversation =
        await prisma.conversation.create({
          data: {
            businessId,
            contactId: contact.id,
            status: ConversationStatus.OPEN,
            lastMessageAt: new Date(),
          },
        });

      console.log(
        "[WHATSAPP] Conversation created",
        {
          conversationId:
            conversation.id,
          contactId: contact.id,
          businessId,
        },
      );
    }

    const existingMessage =
      await prisma.whatsAppMessage.findUnique({
        where: {
          whatsappMessageId,
        },
      });

    if (existingMessage) {
      console.log(
        "[WHATSAPP] Duplicate message ignored",
        {
          whatsappMessageId,
        },
      );

      return;
    }

    const messageType =
      this.getMessageType(message?.type);

    const text =
      this.extractText(message);

    const mediaId =
      this.extractMediaId(message);

    const savedMessage =
      await prisma.whatsAppMessage.create({
        data: {
          businessId,
          conversationId:
            conversation.id,
          whatsappMessageId,
          direction:
            WhatsAppMessageDirection.INBOUND,
          type: messageType,
          text,
          mediaId,
          status:
            WhatsAppMessageStatus.RECEIVED,
          metadata: message,
        },
      });

    await prisma.conversation.update({
      where: {
        id: conversation.id,
      },

      data: {
        lastMessageAt: new Date(),
        status: ConversationStatus.OPEN,
      },
    });

    console.log(
      "[WHATSAPP] Message persisted successfully",
      {
        messageId: savedMessage.id,
        whatsappMessageId,
        conversationId:
          conversation.id,
        contactId: contact.id,
        businessId,
        handlingMode:
          conversation.handlingMode,
      },
    );

    /*
     * Send the persisted inbound message
     * to the automation layer.
     *
     * The automation service decides whether
     * the conversation is controlled by AI
     * or a human agent.
     */
    await whatsappAutomationService.processIncomingMessage(
      conversation,
      savedMessage,
    );
  }

  private getMessageType(
    type?: string,
  ): WhatsAppMessageType {
    switch (type) {
      case "text":
        return WhatsAppMessageType.TEXT;

      case "image":
        return WhatsAppMessageType.IMAGE;

      case "video":
        return WhatsAppMessageType.VIDEO;

      case "audio":
        return WhatsAppMessageType.AUDIO;

      case "document":
        return WhatsAppMessageType.DOCUMENT;

      case "location":
        return WhatsAppMessageType.LOCATION;

      case "contacts":
      case "contact":
        return WhatsAppMessageType.CONTACT;

      case "interactive":
        return WhatsAppMessageType.INTERACTIVE;

      case "template":
        return WhatsAppMessageType.TEMPLATE;

      default:
        return WhatsAppMessageType.UNKNOWN;
    }
  }

  private extractText(
    message: any,
  ): string | null {
    if (message?.type === "text") {
      return message?.text?.body ?? null;
    }

    return null;
  }

  private extractMediaId(
    message: any,
  ): string | null {
    const type = message?.type;

    if (
      type === "image" ||
      type === "video" ||
      type === "audio" ||
      type === "document"
    ) {
      return message?.[type]?.id ?? null;
    }

    return null;
  }

  private async processMessageStatus(
    status: any,
  ): Promise<void> {
    console.log(
      "[WHATSAPP] Message status",
      {
        messageId: status?.id,
        status: status?.status,
        recipientId:
          status?.recipient_id,
      },
    );
  }
}

export const whatsappWebhookService =
  new WhatsAppWebhookService();