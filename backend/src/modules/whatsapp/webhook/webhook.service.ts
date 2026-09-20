import {
  ConversationStatus,
  WhatsAppMessageDirection,
  WhatsAppMessageStatus,
  WhatsAppMessageType,
} from "@prisma/client";

import { prisma } from "../../../config/prisma";

import {
  whatsappAutomationService,
} from "../automation/automation.service";

import {
  customerPriorityService,
} from "../priority/customer-priority.service";

import {
  whatsappQRAttributionService,
} from "../qr/whatsapp-qr-attribution.service";

import {
  qrConversationConversionService,
} from "../../qrcode/qr-conversation-conversion.service";

import {
  whatsappFlowService,
} from "../flows/whatsapp-flow.service";

import {
  whatsappInteractiveService,
} from "../interactive/whatsapp-interactive.service";

import {
  whatsappService,
} from "../whatsapp.service";

export class WhatsAppWebhookService {
  verifyWebhook(
    mode?: string,
    token?: string,
    challenge?: string,
  ): string {
    const verifyToken =
      process.env
        .WHATSAPP_WEBHOOK_VERIFY_TOKEN
        ?.trim();

    if (!verifyToken) {
      throw new Error(
        "WHATSAPP_WEBHOOK_VERIFY_TOKEN is not configured",
      );
    }

    if (mode !== "subscribe") {
      throw new Error(
        "Invalid webhook mode",
      );
    }

    if (
      !token ||
      token.trim() !== verifyToken
    ) {
      throw new Error(
        "Invalid webhook verify token",
      );
    }

    if (!challenge) {
      throw new Error(
        "Missing webhook challenge",
      );
    }

    console.log(
      "[WHATSAPP WEBHOOK] Verification successful",
    );

    return challenge;
  }

  async processWebhook(
    body: any,
  ): Promise<void> {
    console.log(
      "[WHATSAPP WEBHOOK] Incoming event:",
      JSON.stringify(
        body,
        null,
        2,
      ),
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

    const entries =
      body?.entry ?? [];

    for (
      const entry of entries
    ) {
      const changes =
        entry?.changes ?? [];

      for (
        const change of changes
      ) {
        const value =
          change?.value;

        if (!value) {
          continue;
        }

        const messages =
          value?.messages ?? [];

        for (
          const message of messages
        ) {
          try {
            await this.processIncomingMessage(
              value,
              message,
            );
          } catch (error) {
            console.error(
              "[WHATSAPP INCOMING MESSAGE ERROR]",
              {
                messageId:
                  message?.id,

                error,
              },
            );
          }
        }

        const statuses =
          value?.statuses ?? [];

        for (
          const status of statuses
        ) {
          try {
            await this.processMessageStatus(
              value,
              status,
            );
          } catch (error) {
            console.error(
              "[WHATSAPP STATUS PROCESSING ERROR]",
              {
                messageId:
                  status?.id,

                status:
                  status?.status,

                error,
              },
            );
          }
        }
      }
    }
  }

  private async processIncomingMessage(
    value: any,
    message: any,
  ): Promise<void> {
    const phoneNumberId =
      value?.metadata
        ?.phone_number_id;

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

    const whatsappAccount =
      await prisma.whatsAppBusinessAccount.findUnique(
        {
          where: {
            phoneNumberId,
          },
        },
      );

    if (!whatsappAccount) {
      console.warn(
        "[WHATSAPP WEBHOOK] WhatsApp account not mapped",
        {
          phoneNumberId,
        },
      );

      return;
    }

    if (
      !whatsappAccount.isActive
    ) {
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
      value?.contacts?.[0]
        ?.profile?.name ??
      null;

    const contact =
      await prisma.whatsAppContact.upsert(
        {
          where: {
            businessId_phoneNumber: {
              businessId,

              phoneNumber:
                customerPhone,
            },
          },

          create: {
            businessId,

            phoneNumber:
              customerPhone,

            profileName,

            displayName:
              profileName,

            lastSeenAt:
              new Date(),
          },

          update: {
            ...(profileName
              ? {
                  profileName,
                  displayName:
                    profileName,
                }
              : {}),

            lastSeenAt:
              new Date(),
          },
        },
      );

    /*
     * --------------------------------------------------
     * TEXT / INTERACTIVE EXTRACTION
     * --------------------------------------------------
     */

    const rawText =
      this.extractText(
        message,
      );

    /*
     * --------------------------------------------------
     * QR ATTRIBUTION
     * --------------------------------------------------
     */

    const qrShortCode =
      whatsappQRAttributionService
        .extractShortCode(
          rawText,
        );

    const attributedQRCode =
      await whatsappQRAttributionService
        .resolveQRCode(
          businessId,
          qrShortCode,
        );

    const cleanedText =
      whatsappQRAttributionService
        .cleanCustomerText(
          rawText,
        );

    /*
     * --------------------------------------------------
     * FIND / CREATE CONVERSATION
     * --------------------------------------------------
     */

    let conversation =
      await prisma.conversation.findFirst(
        {
          where: {
            businessId,

            contactId:
              contact.id,

            status: {
              in: [
                ConversationStatus.OPEN,
                ConversationStatus.PENDING,
              ],
            },
          },

          orderBy: {
            updatedAt:
              "desc",
          },
        },
      );

    if (!conversation) {
      conversation =
        await prisma.conversation.create(
          {
            data: {
              businessId,

              contactId:
                contact.id,

              qrCodeId:
                attributedQRCode?.id ??
                null,

              status:
                ConversationStatus.OPEN,

              lastMessageAt:
                new Date(),
            },
          },
        );

      console.log(
        "[WHATSAPP] Conversation created",
        {
          conversationId:
            conversation.id,

          contactId:
            contact.id,

          businessId,

          qrCodeId:
            attributedQRCode?.id ??
            null,
        },
      );
    } else if (
      !conversation.qrCodeId &&
      attributedQRCode
    ) {
      conversation =
        await prisma.conversation.update(
          {
            where: {
              id:
                conversation.id,
            },

            data: {
              qrCodeId:
                attributedQRCode.id,
            },
          },
        );
    }

    /*
     * --------------------------------------------------
     * DUPLICATE MESSAGE PROTECTION
     * --------------------------------------------------
     */

    const existingMessage =
      await prisma.whatsAppMessage.findUnique(
        {
          where: {
            whatsappMessageId,
          },
        },
      );

    if (existingMessage) {
      console.log(
        "[WHATSAPP] Duplicate message ignored",
        {
          whatsappMessageId,
        },
      );

      return;
    }

    /*
     * --------------------------------------------------
     * MESSAGE TYPE
     * --------------------------------------------------
     */

    const messageType =
      this.getMessageType(
        message?.type,
      );

    const mediaId =
      this.extractMediaId(
        message,
      );

    /*
     * IMPORTANT:
     *
     * For ordinary text:
     *   cleanedText is stored.
     *
     * For interactive replies:
     *   extractText() returns button/list
     *   ID so the Flow Engine can understand it.
     */

    const text =
      cleanedText ??
      rawText;

    /*
     * --------------------------------------------------
     * SAVE INBOUND MESSAGE
     * --------------------------------------------------
     */

    const savedMessage =
      await prisma.whatsAppMessage.create(
        {
          data: {
            businessId,

            conversationId:
              conversation.id,

            whatsappMessageId,

            direction:
              WhatsAppMessageDirection.INBOUND,

            type:
              messageType,

            text,

            mediaId,

            status:
              WhatsAppMessageStatus.PENDING,

            metadata: {
              rawMessage:
                message,

              qrAttribution:
                attributedQRCode
                  ? {
                      id:
                        attributedQRCode.id,

                      shortCode:
                        attributedQRCode.shortCode,

                      name:
                        attributedQRCode.name,

                      campaignId:
                        attributedQRCode.campaignId,

                      campaignName:
                        attributedQRCode.campaignName,

                      sourceType:
                        attributedQRCode.sourceType,

                      placementLabel:
                        attributedQRCode.placementLabel,

                      locationLabel:
                        attributedQRCode.locationLabel,
                    }
                  : null,

              interactive:
                message?.type ===
                "interactive"
                  ? message
                      ?.interactive ??
                    null
                  : null,

              media:
                mediaId
                  ? {
                      id:
                        mediaId,

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
        },
      );

    /*
     * --------------------------------------------------
     * CUSTOMER PRIORITY ENGINE
     * --------------------------------------------------
     */

    const conversationMessageCount =
      await prisma.whatsAppMessage.count(
        {
          where: {
            conversationId:
              conversation.id,
          },
        },
      );

    const priorityResult =
      customerPriorityService.evaluate(
        {
          message:
            savedMessage,

          conversationMessageCount,

          previousPriority:
            conversation.priority,
        },
      );

    conversation =
      await prisma.conversation.update(
        {
          where: {
            id:
              conversation.id,
          },

          data: {
            lastMessageAt:
              new Date(),

            status:
              ConversationStatus.OPEN,

            priority:
              priorityResult.priority,
          },
        },
      );

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

    /*
     * --------------------------------------------------
     * QR -> WHATSAPP CONVERSION
     * --------------------------------------------------
     */

    if (
      conversation.qrCodeId
    ) {
      try {
        const conversion =
          await qrConversationConversionService
            .recordWhatsAppConversationConversion(
              {
                qrCodeId:
                  conversation.qrCodeId,

                conversationId:
                  conversation.id,
              },
            );

        console.log(
          "[WHATSAPP QR CONVERSION]",
          {
            conversationId:
              conversation.id,

            qrCodeId:
              conversation.qrCodeId,

            conversionId:
              conversion
                .conversion.id,

            duplicate:
              conversion
                .duplicate,
          },
        );
      } catch (
        conversionError
      ) {
        console.error(
          "[WHATSAPP QR CONVERSION ERROR]",
          conversionError,
        );
      }
    }

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

        handlingMode:
          conversation.handlingMode,
      },
    );

    /*
     * --------------------------------------------------
     * FLOW ENGINE
     * --------------------------------------------------
     *
     * Flow Engine gets first chance.
     *
     * This allows:
     *
     * hello
     * account
     * orders
     * payments
     * QR support
     * interactive button IDs
     * interactive list IDs
     * human
     *
     * to be handled by the new
     * conversational state machine.
     */

    if (text?.trim()) {
      try {
        const flowResult =
          await whatsappFlowService
            .handleMessage(
              {
                businessId,

                conversationId:
                  conversation.id,

                customerPhone,

                text:
                  text.trim(),
              },
            );

        console.log(
          "[WHATSAPP FLOW]",
          {
            conversationId:
              conversation.id,

            state:
              flowResult.state,

            handled:
              flowResult.handled,

            handoff:
              flowResult.handoff ??
              false,

            requiresVerification:
              flowResult
                .requiresVerification ??
              false,

            hasInteractive:
              Boolean(
                flowResult.interactive,
              ),
          },
        );

        if (
          flowResult.handled
        ) {
          /*
           * Prefer interactive WhatsApp
           * messages when the Flow Engine
           * produced one.
           */
          if (
            flowResult.interactive
          ) {
            try {
              await whatsappInteractiveService
                .sendInteractive(
                  {
                    businessId,

                    conversationId:
                      conversation.id,

                    type:
                      flowResult
                        .interactive
                        .type,

                    body:
                      flowResult
                        .interactive
                        .body,

                    footer:
                      flowResult
                        .interactive
                        .footer,

                    buttons:
                      flowResult
                        .interactive
                        .buttons,

                    sections:
                      flowResult
                        .interactive
                        .sections,
                  },
                );

              return;
            } catch (
              interactiveError
            ) {
              /*
               * If interactive delivery
               * fails, fall back to text.
               *
               * This is especially useful
               * while the WhatsApp business
               * conversation window is being
               * tested.
               */
              console.error(
                "[WHATSAPP FLOW INTERACTIVE ERROR]",
                interactiveError,
              );
            }
          }

          if (
            flowResult.responseText
          ) {
            try {
              await whatsappService
                .sendAutomatedMessage(
                  businessId,
                  conversation.id,
                  flowResult
                    .responseText,
                );

              return;
            } catch (
              flowSendError
            ) {
              console.error(
                "[WHATSAPP FLOW TEXT SEND ERROR]",
                flowSendError,
              );

              /*
               * Do not run the old
               * automation again after
               * the Flow Engine already
               * handled the message.
               */
              return;
            }
          }

          return;
        }
      } catch (
        flowError
      ) {
        /*
         * Flow Engine failures must
         * not kill the webhook.
         *
         * Existing automation remains
         * the fallback.
         */
        console.error(
          "[WHATSAPP FLOW ERROR]",
          {
            conversationId:
              conversation.id,

            messageId:
              savedMessage.id,

            error:
              flowError,
          },
        );
      }
    }

    /*
     * --------------------------------------------------
     * EXISTING AUTOMATION ENGINE
     * --------------------------------------------------
     */

    await whatsappAutomationService
      .processIncomingMessage(
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
    /*
     * Normal WhatsApp text.
     */
    if (
      message?.type ===
      "text"
    ) {
      return (
        message?.text?.body ??
        null
      );
    }

    /*
     * Interactive reply:
     *
     * button_reply.id
     * button_reply.title
     *
     * list_reply.id
     * list_reply.title
     */

    if (
      message?.type ===
      "interactive"
    ) {
      const buttonReply =
        message?.interactive
          ?.button_reply;

      if (buttonReply) {
        return (
          buttonReply?.id ??
          buttonReply?.title ??
          null
        );
      }

      const listReply =
        message?.interactive
          ?.list_reply;

      if (listReply) {
        return (
          listReply?.id ??
          listReply?.title ??
          null
        );
      }
    }

    return null;
  }

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
      error?.error_data
        ?.details,
    ].filter(Boolean);

    return {
      errorCode:
        error?.code != null
          ? String(
              error.code,
            )
          : null,

      errorMessage:
        parts.length > 0
          ? parts.join(" | ")
          : "WhatsApp message failed",
    };
  }

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

    /*
     * --------------------------------------------------
     * EXISTING LOCAL MESSAGE
     * --------------------------------------------------
     */

    const existingMessage =
      await prisma.whatsAppMessage.findUnique(
        {
          where: {
            whatsappMessageId,
          },
        },
      );

    if (existingMessage) {
      await prisma.whatsAppMessage.update(
        {
          where: {
            id:
              existingMessage.id,
          },

          data: {
            status:
              mappedStatus,

            errorCode,

            errorMessage,

            metadata:
              status,
          },
        },
      );

      await prisma.conversation.update(
        {
          where: {
            id:
              existingMessage
                .conversationId,
          },

          data: {
            lastMessageAt:
              new Date(),
          },
        },
      );

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

    /*
     * --------------------------------------------------
     * RACE CONDITION FALLBACK
     * --------------------------------------------------
     *
     * Meta can sometimes deliver the
     * status webhook before our outbound
     * database write completes.
     */

    const phoneNumberId =
      value?.metadata
        ?.phone_number_id;

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
      await prisma.whatsAppBusinessAccount.findUnique(
        {
          where: {
            phoneNumberId,
          },
        },
      );

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
      await prisma.whatsAppContact.findUnique(
        {
          where: {
            businessId_phoneNumber: {
              businessId,

              phoneNumber:
                recipientPhone,
            },
          },
        },
      );

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
      await prisma.conversation.findFirst(
        {
          where: {
            businessId,

            contactId:
              contact.id,
          },

          orderBy: {
            updatedAt:
              "desc",
          },
        },
      );

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
        await prisma.whatsAppMessage.create(
          {
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
          },
        );

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
      /*
       * Prisma P2002 =
       * another request already
       * inserted this message.
       */

      if (
        error?.code ===
        "P2002"
      ) {
        console.log(
          "[WHATSAPP] Status message already persisted",
          {
            whatsappMessageId,
          },
        );

        const racedMessage =
          await prisma.whatsAppMessage.findUnique(
            {
              where: {
                whatsappMessageId,
              },
            },
          );

        if (racedMessage) {
          await prisma.whatsAppMessage.update(
            {
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
            },
          );
        }

        return;
      }

      throw error;
    }
  }
}

export const whatsappWebhookService =
  new WhatsAppWebhookService();