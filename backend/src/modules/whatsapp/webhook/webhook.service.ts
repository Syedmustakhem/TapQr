import { prisma } from "../../../config/prisma";
import {
  WhatsAppMessageDirection,
  WhatsAppMessageStatus,
  WhatsAppMessageType,
  ConversationStatus,
} from "@prisma/client";

export class WhatsAppWebhookService {
  /**
   * Process incoming Meta webhook.
   */
  async processWebhook(body: any): Promise<void> {
    console.log(
      "[WHATSAPP WEBHOOK] Incoming event:",
      JSON.stringify(body, null, 2)
    );

    if (
      body?.object !==
      "whatsapp_business_account"
    ) {
      console.warn(
        "[WHATSAPP WEBHOOK] Ignoring unknown object"
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

        /*
         * Incoming customer messages
         */
        const messages = value?.messages ?? [];

        for (const message of messages) {
          await this.processIncomingMessage(
            value,
            message
          );
        }

        /*
         * Delivery / read / failed statuses
         *
         * We will implement full status handling
         * in the next step.
         */
        const statuses = value?.statuses ?? [];

        for (const status of statuses) {
          await this.processMessageStatus(status);
        }
      }
    }
  }
verifyWebhook(
  mode?: string,
  token?: string,
  challenge?: string
): string {
  const verifyToken =
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN?.trim();

  if (!verifyToken) {
    console.error(
      "[WHATSAPP WEBHOOK] WHATSAPP_WEBHOOK_VERIFY_TOKEN is missing"
    );

    throw new Error(
      "WhatsApp webhook verify token is not configured"
    );
  }

  if (mode !== "subscribe") {
    throw new Error("Invalid webhook mode");
  }

  if (!token || token.trim() !== verifyToken) {
    console.error(
      "[WHATSAPP WEBHOOK] Invalid verify token"
    );

    throw new Error(
      "Invalid webhook verify token"
    );
  }

  if (!challenge) {
    throw new Error("Missing webhook challenge");
  }

  console.log(
    "[WHATSAPP WEBHOOK] Verification successful"
  );

  return challenge;
}
  /**
   * Process one incoming WhatsApp message.
   */
  private async processIncomingMessage(
    value: any,
    message: any
  ): Promise<void> {
    const phoneNumberId =
      value?.metadata?.phone_number_id;

    const customerPhone =
      message?.from;

    const whatsappMessageId =
      message?.id;

    if (
      !phoneNumberId ||
      !customerPhone ||
      !whatsappMessageId
    ) {
      console.warn(
        "[WHATSAPP WEBHOOK] Missing required message information"
      );

      return;
    }

    console.log(
      "[WHATSAPP WEBHOOK] Processing message",
      {
        phoneNumberId,
        customerPhone,
        whatsappMessageId,
        type: message?.type,
      }
    );

    /*
     * --------------------------------------------------
     * 1. Find the TapQR business
     * --------------------------------------------------
     */

    const whatsappAccount =
      await prisma.whatsAppBusinessAccount.findUnique({
        where: {
          phoneNumberId,
        },
      });

    if (!whatsappAccount) {
      console.error(
        "[WHATSAPP WEBHOOK] No business mapping found",
        {
          phoneNumberId,
        }
      );

      return;
    }

    if (!whatsappAccount.isActive) {
      console.warn(
        "[WHATSAPP WEBHOOK] WhatsApp account is inactive",
        {
          phoneNumberId,
          businessId:
            whatsappAccount.businessId,
        }
      );

      return;
    }

    const businessId =
      whatsappAccount.businessId;

    /*
     * --------------------------------------------------
     * 2. Get customer profile name
     * --------------------------------------------------
     */

    const profileName =
      value?.contacts?.[0]?.profile?.name ??
      null;

    /*
     * --------------------------------------------------
     * 3. Find or create WhatsApp contact
     * --------------------------------------------------
     */

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
                displayName:
                  profileName,
              }
            : {}),

          lastSeenAt: new Date(),
        },
      });

    /*
     * --------------------------------------------------
     * 4. Find an existing open conversation
     * --------------------------------------------------
     */

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

    /*
     * --------------------------------------------------
     * 5. Create conversation if needed
     * --------------------------------------------------
     */

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
          businessId,
          contactId:
            contact.id,
        }
      );
    }

    /*
     * --------------------------------------------------
     * 6. Prevent duplicate Meta webhook messages
     * --------------------------------------------------
     */

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
          messageId:
            existingMessage.id,
        }
      );

      return;
    }

    /*
     * --------------------------------------------------
     * 7. Convert Meta message type
     * --------------------------------------------------
     */

    const messageType =
      this.getMessageType(
        message?.type
      );

    /*
     * --------------------------------------------------
     * 8. Extract message content
     * --------------------------------------------------
     */

    const text =
      this.extractText(message);

    const mediaId =
      this.extractMediaId(message);

    /*
     * --------------------------------------------------
     * 9. Save message
     * --------------------------------------------------
     */

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

    /*
     * --------------------------------------------------
     * 10. Update conversation
     * --------------------------------------------------
     */

    await prisma.conversation.update({
      where: {
        id: conversation.id,
      },

      data: {
        lastMessageAt: new Date(),

        /*
         * If a customer replies to an old
         * conversation, reopen it.
         */
        status: ConversationStatus.OPEN,
      },
    });

    console.log(
      "[WHATSAPP] Message persisted successfully",
      {
        messageId:
          savedMessage.id,

        whatsappMessageId,

        conversationId:
          conversation.id,

        contactId:
          contact.id,

        businessId,
      }
    );
  }

  /**
   * Convert Meta message type
   * into our Prisma enum.
   */
  private getMessageType(
    type: string | undefined
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

  /**
   * Extract text from supported text messages.
   */
  private extractText(
    message: any
  ): string | null {
    if (message?.type === "text") {
      return (
        message?.text?.body ??
        null
      );
    }

    return null;
  }

  /**
   * Extract Meta media ID.
   */
  private extractMediaId(
    message: any
  ): string | null {
    const type =
      message?.type;

    if (
      type === "image" ||
      type === "video" ||
      type === "audio" ||
      type === "document"
    ) {
      return (
        message?.[type]?.id ??
        null
      );
    }

    return null;
  }

  /**
   * Message status handler.
   *
   * Full status update logic will be
   * implemented next.
   */
  private async processMessageStatus(
    status: any
  ): Promise<void> {
    console.log(
      "[WHATSAPP] Message status",
      {
        messageId:
          status?.id,

        status:
          status?.status,

        recipientId:
          status?.recipient_id,
      }
    );
  }
}

export const whatsappWebhookService =
  new WhatsAppWebhookService();