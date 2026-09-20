import { prisma } from "../../../config/prisma";
import {
  ConversationStatus,
  WhatsAppMessageDirection,
  WhatsAppMessageStatus,
  WhatsAppMessageType,
} from "@prisma/client";

import { whatsappAutomationService } from "../automation/automation.service";
import { customerPriorityService } from "../priority/customer-priority.service";
import { whatsappQRAttributionService } from "../qr/whatsapp-qr-attribution.service";
import { qrConversationConversionService } from "../../qrcode/qr-conversation-conversion.service";

export class WhatsAppWebhookService {
  // ============================================================
  // META WEBHOOK VERIFICATION
  // ============================================================

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

  // ============================================================
  // WEBHOOK PROCESSOR
  // ============================================================

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

        // --------------------------------------------------------
        // INCOMING MESSAGES
        // --------------------------------------------------------

        const messages = value?.messages ?? [];

        for (const message of messages) {
          try {
            await this.processIncomingMessage(
              value,
              message,
            );
          } catch (error) {
            console.error(
              "[WHATSAPP INCOMING MESSAGE ERROR]",
              {
                messageId: message?.id,
                error,
              },
            );
          }
        }

        // --------------------------------------------------------
        // MESSAGE STATUS EVENTS
        // --------------------------------------------------------

        const statuses = value?.statuses ?? [];

        for (const status of statuses) {
          try {
            await this.processMessageStatus(
              value,
              status,
            );
          } catch (error) {
            console.error(
              "[WHATSAPP STATUS PROCESSING ERROR]",
              {
                messageId: status?.id,
                status: status?.status,
                error,
              },
            );
          }
        }
      }
    }
  }

  // ============================================================
  // INCOMING MESSAGE
  // ============================================================

  private async processIncomingMessage(
    value: any,
    message: any,
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
        "[WHATSAPP WEBHOOK] Missing message information",
      );

      return;
    }

    // ----------------------------------------------------------
    // FIND WHATSAPP BUSINESS ACCOUNT
    // ----------------------------------------------------------

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

    // ----------------------------------------------------------
    // CONTACT
    // ----------------------------------------------------------

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

    // ==========================================================
    // FEATURE #12
    // QR → WHATSAPP ATTRIBUTION
    // ==========================================================

    const rawText =
      typeof message?.text?.body === "string"
        ? message.text.body
        : null;

    const qrShortCode =
      whatsappQRAttributionService.extractShortCode(
        rawText,
      );

    const attributedQRCode =
      await whatsappQRAttributionService.resolveQRCode(
        businessId,
        qrShortCode,
      );

    const cleanedText =
      whatsappQRAttributionService.cleanCustomerText(
        rawText,
      );

    console.log(
      "[WHATSAPP QR ATTRIBUTION]",
      {
        businessId,
        customerPhone,
        qrShortCode,
        qrCodeId:
          attributedQRCode?.id ?? null,
      },
    );

    // ----------------------------------------------------------
    // FIND EXISTING OPEN/PENDING CONVERSATION
    // ----------------------------------------------------------

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

    // ----------------------------------------------------------
    // CREATE CONVERSATION
    // ----------------------------------------------------------

    if (!conversation) {
      conversation =
        await prisma.conversation.create({
          data: {
            businessId,
            contactId: contact.id,

            // Feature #12:
            // Store the QR that initiated the conversation.
            qrCodeId:
              attributedQRCode?.id ?? null,

            status:
              ConversationStatus.OPEN,

            lastMessageAt: new Date(),
          },
        });

      console.log(
        "[WHATSAPP] Conversation created",
        {
          conversationId:
            conversation.id,

          contactId:
            contact.id,

          businessId,

          qrCodeId:
            conversation.qrCodeId ?? null,
        },
      );
    }

    // ----------------------------------------------------------
    // ATTACH QR TO EXISTING CONVERSATION
    // ----------------------------------------------------------

    if (
      attributedQRCode &&
      !conversation.qrCodeId
    ) {
      conversation =
        await prisma.conversation.update({
          where: {
            id: conversation.id,
          },

          data: {
            qrCodeId:
              attributedQRCode.id,
          },
        });

      console.log(
        "[WHATSAPP QR ATTRIBUTION] QR attached to existing conversation",
        {
          conversationId:
            conversation.id,

          qrCodeId:
            attributedQRCode.id,
        },
      );
    }

    // ----------------------------------------------------------
    // DUPLICATE MESSAGE PROTECTION
    // ----------------------------------------------------------

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

    // ----------------------------------------------------------
    // MESSAGE TYPE / CONTENT
    // ----------------------------------------------------------

    const messageType =
      this.getMessageType(
        message?.type,
      );

    const text =
      rawText !== null
        ? cleanedText
        : this.extractText(message);

    const mediaId =
      this.extractMediaId(message);

    // ----------------------------------------------------------
    // SAVE INBOUND MESSAGE
    // ----------------------------------------------------------

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
            WhatsAppMessageStatus.PENDING,

          metadata: {
            rawMessage: message,

            qrAttribution:
              attributedQRCode
                ? {
                    shortCode:
                      attributedQRCode.shortCode,

                    qrCodeId:
                      attributedQRCode.id,

                    campaignId:
                      attributedQRCode.campaignId ??
                      null,

                    campaignName:
                      attributedQRCode.campaignName ??
                      null,

                    sourceType:
                      attributedQRCode.sourceType ??
                      null,

                    placementLabel:
                      attributedQRCode.placementLabel ??
                      null,

                    locationLabel:
                      attributedQRCode.locationLabel ??
                      null,
                  }
                : null,

            media: mediaId
              ? {
                  id: mediaId,

                  mimeType:
                    message?.[
                      message?.type
                    ]?.mime_type ??
                    null,

                  caption:
                    message?.[
                      message?.type
                    ]?.caption ??
                    null,

                  filename:
                    message?.[
                      message?.type
                    ]?.filename ??
                    null,

                  sha256:
                    message?.[
                      message?.type
                    ]?.sha256 ??
                    null,
                }
              : null,
          },
        },
      });

    // ==========================================================
    // CUSTOMER PRIORITY ENGINE
    // ==========================================================

    const conversationMessageCount =
      await prisma.whatsAppMessage.count({
        where: {
          conversationId:
            conversation.id,
        },
      });

    const priorityResult =
      customerPriorityService.evaluate({
        message: savedMessage,

        conversationMessageCount,

        previousPriority:
          conversation.priority,
      });

    conversation =
      await prisma.conversation.update({
        where: {
          id: conversation.id,
        },

        data: {
          lastMessageAt:
            new Date(),

          status:
            ConversationStatus.OPEN,

          priority:
            priorityResult.priority,
        },
      });

    console.log(
      "[WHATSAPP PRIORITY]",
      {
        conversationId:
          conversation.id,

        priority:
          priorityResult.priority,

        score:
          priorityResult.score,

        reasons:
          priorityResult.reasons,
      },
    );

    // ==========================================================
    // FEATURE #12
    // QR → CONVERSATION → CONVERSION
    // ==========================================================

    if (conversation.qrCodeId) {
      try {
        const conversion =
          await qrConversationConversionService
            .recordWhatsAppConversationConversion({
              qrCodeId:
                conversation.qrCodeId,

              conversationId:
                conversation.id,
            });

        console.log(
          "[WHATSAPP QR CONVERSION]",
          {
            conversationId:
              conversation.id,

            qrCodeId:
              conversation.qrCodeId,

            conversionId:
              conversion.conversion.id,

            duplicate:
              conversion.duplicate,
          },
        );
      } catch (conversionError) {
        // Conversion attribution must never
        // break WhatsApp message processing.
        console.error(
          "[WHATSAPP QR CONVERSION ERROR]",
          conversionError,
        );
      }
    }

    // ----------------------------------------------------------
    // MESSAGE PERSISTED
    // ----------------------------------------------------------

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

        qrCodeId:
          conversation.qrCodeId ?? null,

        handlingMode:
          conversation.handlingMode,
      },
    );

    // ----------------------------------------------------------
    // AUTOMATION
    // ----------------------------------------------------------

    await whatsappAutomationService.processIncomingMessage(
      conversation,
      savedMessage,
    );
  }

  // ============================================================
  // MESSAGE TYPE
  // ============================================================

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

  // ============================================================
  // TEXT EXTRACTION
  // ============================================================

  private extractText(
    message: any,
  ): string | null {
    if (message?.type === "text") {
      return message?.text?.body ?? null;
    }

    return null;
  }

  // ============================================================
  // MEDIA EXTRACTION
  // ============================================================

  private extractMediaId(
    message: any,
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

  // ============================================================
  // MESSAGE STATUS MAPPING
  // ============================================================

  private mapMessageStatus(
    status?: string,
  ): WhatsAppMessageStatus | null {
    switch (status) {
      case "sent":
        return WhatsAppMessageStatus.SENT;

      case "delivered":
        return WhatsAppMessageStatus.DELIVERED;

      case "read":
        return WhatsAppMessageStatus.READ;

      case "failed":
        return WhatsAppMessageStatus.FAILED;

      default:
        return null;
    }
  }

  // ============================================================
  // STATUS ERROR EXTRACTION
  // ============================================================

  private extractStatusError(
    status: any,
  ): {
    errorCode: string | null;
    errorMessage: string | null;
  } {
    const error =
      status?.errors?.[0];

    if (!error) {
      return {
        errorCode: null,
        errorMessage: null,
      };
    }

    const parts = [
      error?.title,
      error?.message,
      error?.error_data?.details,
    ].filter(Boolean);

    return {
      errorCode:
        error?.code != null
          ? String(error.code)
          : null,

      errorMessage:
        parts.length > 0
          ? parts.join(" | ")
          : "WhatsApp message failed",
    };
  }

  // ============================================================
  // MESSAGE STATUS PROCESSING
  // ============================================================

  private async processMessageStatus(
    value: any,
    status: any,
  ): Promise<void> {
    const whatsappMessageId =
      status?.id;

    const rawStatus =
      status?.status;

    if (
      !whatsappMessageId ||
      !rawStatus
    ) {
      console.warn(
        "[WHATSAPP] Invalid message status payload",
        {
          status,
        },
      );

      return;
    }

    console.log(
      "[WHATSAPP] Message status",
      {
        messageId:
          whatsappMessageId,

        status:
          rawStatus,

        recipientId:
          status?.recipient_id,
      },
    );

    const mappedStatus =
      this.mapMessageStatus(
        rawStatus,
      );

    if (!mappedStatus) {
      console.log(
        "[WHATSAPP] Unsupported message status",
        {
          messageId:
            whatsappMessageId,

          status:
            rawStatus,
        },
      );

      return;
    }

    const {
      errorCode,
      errorMessage,
    } =
      this.extractStatusError(
        status,
      );

    // ----------------------------------------------------------
    // UPDATE EXISTING MESSAGE
    // ----------------------------------------------------------

    const existingMessage =
      await prisma.whatsAppMessage.findUnique({
        where: {
          whatsappMessageId,
        },
      });

    if (existingMessage) {
      await prisma.whatsAppMessage.update({
        where: {
          id: existingMessage.id,
        },

        data: {
          status:
            mappedStatus,

          errorCode,

          errorMessage,

          metadata:
            status,
        },
      });

      await prisma.conversation.update({
        where: {
          id:
            existingMessage.conversationId,
        },

        data: {
          lastMessageAt:
            new Date(),
        },
      });

      console.log(
        "[WHATSAPP] Message status updated",
        {
          messageId:
            existingMessage.id,

          whatsappMessageId,

          status:
            mappedStatus,

          errorCode,
        },
      );

      return;
    }

    // ----------------------------------------------------------
    // FALLBACK STATUS MESSAGE
    //
    // Meta can send a status event before the local
    // outbound message has finished being persisted.
    // ----------------------------------------------------------

    const phoneNumberId =
      value?.metadata?.phone_number_id;

    const recipientPhone =
      status?.recipient_id;

    if (
      !phoneNumberId ||
      !recipientPhone
    ) {
      console.warn(
        "[WHATSAPP] Cannot create fallback status message",
        {
          whatsappMessageId,

          phoneNumberId,

          recipientPhone,
        },
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
        "[WHATSAPP] WhatsApp account not found for status",
        {
          phoneNumberId,

          whatsappMessageId,
        },
      );

      return;
    }

    const businessId =
      whatsappAccount.businessId;

    const contact =
      await prisma.whatsAppContact.findUnique({
        where: {
          businessId_phoneNumber: {
            businessId,

            phoneNumber:
              recipientPhone,
          },
        },
      });

    if (!contact) {
      console.warn(
        "[WHATSAPP] Contact not found for status",
        {
          businessId,

          recipientPhone,

          whatsappMessageId,
        },
      );

      return;
    }

    const conversation =
      await prisma.conversation.findFirst({
        where: {
          businessId,

          contactId:
            contact.id,
        },

        orderBy: {
          updatedAt:
            "desc",
        },
      });

    if (!conversation) {
      console.warn(
        "[WHATSAPP] Conversation not found for status",
        {
          businessId,

          contactId:
            contact.id,

          whatsappMessageId,
        },
      );

      return;
    }

    try {
      const fallbackMessage =
        await prisma.whatsAppMessage.create({
          data: {
            businessId,

            conversationId:
              conversation.id,

            whatsappMessageId,

            direction:
              WhatsAppMessageDirection.OUTBOUND,

            type:
              WhatsAppMessageType.TEXT,

            status:
              mappedStatus,

            errorCode,

            errorMessage,

            metadata:
              status,
          },
        });

      console.log(
        "[WHATSAPP] Fallback status message created",
        {
          messageId:
            fallbackMessage.id,

          whatsappMessageId,

          status:
            mappedStatus,

          errorCode,
        },
      );
    } catch (error: any) {
      // --------------------------------------------------------
      // P2002 = another webhook/request already persisted it
      // --------------------------------------------------------

      if (error?.code === "P2002") {
        console.log(
          "[WHATSAPP] Status message already persisted",
          {
            whatsappMessageId,
          },
        );

        const racedMessage =
          await prisma.whatsAppMessage.findUnique({
            where: {
              whatsappMessageId,
            },
          });

        if (racedMessage) {
          await prisma.whatsAppMessage.update({
            where: {
              id:
                racedMessage.id,
            },

            data: {
              status:
                mappedStatus,

              errorCode,

              errorMessage,

              metadata:
                status,
            },
          });
        }

        return;
      }

      throw error;
    }
  }
}

export const whatsappWebhookService =
  new WhatsAppWebhookService();