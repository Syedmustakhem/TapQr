import axios from "axios";

import {
  ConversationStatus,
  WhatsAppMessageDirection,
  WhatsAppMessageStatus,
  WhatsAppMessageType,
} from "@prisma/client";

import { prisma } from "../../../config/prisma";

export type WhatsAppInteractiveButton = {
  id: string;
  title: string;
};

export type WhatsAppInteractiveRow = {
  id: string;
  title: string;
  description?: string;
};

export type WhatsAppInteractiveSection = {
  title: string;
  rows: WhatsAppInteractiveRow[];
};

export type WhatsAppInteractiveInput = {
  businessId: string;
  conversationId: string;

  type: "button" | "list";

  body: string;

  footer?: string;

  buttons?: WhatsAppInteractiveButton[];

  sections?: WhatsAppInteractiveSection[];
};

class WhatsAppInteractiveService {
  private getConfig() {
    const accessToken =
      process.env.WHATSAPP_ACCESS_TOKEN?.trim();

    const phoneNumberId =
      process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();

    const apiVersion =
      process.env.WHATSAPP_API_VERSION?.trim() ||
      "v23.0";

    if (!accessToken) {
      throw new Error(
        "WHATSAPP_ACCESS_TOKEN is not configured",
      );
    }

    if (!phoneNumberId) {
      throw new Error(
        "WHATSAPP_PHONE_NUMBER_ID is not configured",
      );
    }

    return {
      accessToken,
      phoneNumberId,
      apiVersion,
    };
  }

  async sendInteractive(
    input: WhatsAppInteractiveInput,
  ) {
    const conversation =
      await prisma.conversation.findFirst({
        where: {
          id: input.conversationId,
          businessId: input.businessId,
        },

        include: {
          contact: true,
        },
      });

    if (!conversation) {
      throw new Error(
        "Conversation not found",
      );
    }

    const customerPhone =
      conversation.contact?.phoneNumber;

    if (!customerPhone) {
      throw new Error(
        "Customer phone number not found",
      );
    }

    const config =
      this.getConfig();

    const interactive =
      this.buildInteractivePayload(
        input,
      );

    const payload = {
      messaging_product: "whatsapp",

      recipient_type: "individual",

      to: customerPhone,

      type: "interactive",

      interactive,
    };

    const url =
      `https://graph.facebook.com/` +
      `${config.apiVersion}/` +
      `${config.phoneNumberId}/messages`;

    try {
      const response =
        await axios.post(
          url,
          payload,
          {
            headers: {
              Authorization:
                `Bearer ${config.accessToken}`,

              "Content-Type":
                "application/json",
            },
          },
        );

      const whatsappMessageId =
        response.data?.messages?.[0]?.id ??
        null;

      const savedMessage =
        await prisma.whatsAppMessage.create({
          data: {
            businessId:
              input.businessId,

            conversationId:
              input.conversationId,

            direction:
              WhatsAppMessageDirection.OUTBOUND,

            type:
              WhatsAppMessageType.INTERACTIVE,

            text:
              input.body,

            whatsappMessageId,

            status:
              WhatsAppMessageStatus.SENT,

            metadata: {
              interactive,
              response:
                response.data,
            },
          },
        });

      await prisma.conversation.update({
        where: {
          id: input.conversationId,
        },

        data: {
          lastMessageAt:
            new Date(),

          status:
            ConversationStatus.OPEN,
        },
      });

      return {
        success: true,
        message:
          savedMessage,
        response:
          response.data,
      };
    } catch (error: any) {
      const apiError =
        error?.response?.data;

      console.error(
        "[WHATSAPP INTERACTIVE ERROR]",
        apiError ||
          error?.message ||
          error,
      );

      throw new Error(
        apiError?.error?.message ||
          "Failed to send WhatsApp interactive message",
      );
    }
  }

  private buildInteractivePayload(
    input: WhatsAppInteractiveInput,
  ) {
    if (input.type === "button") {
      const buttons =
        input.buttons ?? [];

      if (
        buttons.length === 0
      ) {
        throw new Error(
          "At least one interactive button is required",
        );
      }

      if (
        buttons.length > 3
      ) {
        throw new Error(
          "WhatsApp supports a maximum of 3 reply buttons",
        );
      }

      return {
        type: "button",

        body: {
          text:
            input.body,
        },

        ...(input.footer
          ? {
              footer: {
                text:
                  input.footer,
              },
            }
          : {}),

        action: {
          buttons:
            buttons.map(
              (button) => ({
                type: "reply",

                reply: {
                  id:
                    this.cleanId(
                      button.id,
                    ),

                  title:
                    this.cleanButtonTitle(
                      button.title,
                    ),
                },
              }),
            ),
        },
      };
    }

    const sections =
      input.sections ?? [];

    if (
      sections.length === 0
    ) {
      throw new Error(
        "At least one interactive list section is required",
      );
    }

    const flattenedRows =
      sections.flatMap(
        (section) =>
          section.rows,
      );

    if (
      flattenedRows.length === 0
    ) {
      throw new Error(
        "Interactive list requires at least one row",
      );
    }

    return {
      type: "list",

      body: {
        text:
          input.body,
      },

      ...(input.footer
        ? {
            footer: {
              text:
                input.footer,
            },
          }
        : {}),

      action: {
        button: "View options",

        sections:
          sections.map(
            (section) => ({
              title:
                this.cleanSectionTitle(
                  section.title,
                ),

              rows:
                section.rows.map(
                  (row) => ({
                    id:
                      this.cleanId(
                        row.id,
                      ),

                    title:
                      this.cleanRowTitle(
                        row.title,
                      ),

                    ...(row.description
                      ? {
                          description:
                            this.cleanDescription(
                              row.description,
                            ),
                        }
                      : {}),
                  }),
                ),
            }),
          ),
      },
    };
  }

  private cleanId(
    value: string,
  ): string {
    return value
      .trim()
      .slice(0, 200);
  }

  private cleanButtonTitle(
    value: string,
  ): string {
    return value
      .trim()
      .slice(0, 20);
  }

  private cleanRowTitle(
    value: string,
  ): string {
    return value
      .trim()
      .slice(0, 24);
  }

  private cleanSectionTitle(
    value: string,
  ): string {
    return value
      .trim()
      .slice(0, 24);
  }

  private cleanDescription(
    value: string,
  ): string {
    return value
      .trim()
      .slice(0, 72);
  }
}

export const whatsappInteractiveService =
  new WhatsAppInteractiveService();