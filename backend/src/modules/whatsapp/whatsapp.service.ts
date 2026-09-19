import axios from "axios";
import {
  ConversationHandlingMode,
  ConversationStatus,
} from "@prisma/client";

import { prisma } from "../../config/prisma";
import { AppError } from "../../cores/errors/AppError";
import {
  whatsappAutomationService,
} from "./automation/automation.service";
class WhatsAppService {
  /**
   * ---------------------------------------------------------
   * BUSINESS ACCESS
   * ---------------------------------------------------------
   * OWNER or active business member can access Support Inbox.
   * ---------------------------------------------------------
   */
  private async assertBusinessAccess(
    userId: string,
    businessId: string
  ) {
    // Check business owner
    const business = await prisma.business.findFirst({
      where: {
        id: businessId,
        ownerId: userId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (business) {
      return;
    }

    // Check business member
    const member =
      await prisma.businessMember.findUnique({
        where: {
          userId_businessId: {
            userId,
            businessId,
          },
        },
        select: {
          id: true,
          isActive: true,
        },
      });

    if (!member || !member.isActive) {
      throw new AppError(
        "You do not have access to this business",
        403
      );
    }
  }
  /**
   * ---------------------------------------------------------
   * CREATE / START CONVERSATION
   * ---------------------------------------------------------
   * Creates or reuses a WhatsApp contact and creates an OPEN
   * conversation for the business.
   *
   * This does NOT send a WhatsApp message.
   * The actual outbound message is handled by sendMessage().
   * ---------------------------------------------------------
   */
  async createConversation(
    userId: string,
    businessId: string,
    phoneNumber: string,
  ) {
    await this.assertBusinessAccess(
      userId,
      businessId,
    );

    const cleanPhone = phoneNumber
      ?.trim()
      .replace(/[^\d+]/g, "")
      .replace(/^\+/, "");

    if (!cleanPhone) {
      throw new AppError(
        "Customer phone number is required",
        400,
      );
    }

    if (!/^\d{10,15}$/.test(cleanPhone)) {
      throw new AppError(
        "Enter a valid WhatsApp phone number with country code",
        400,
      );
    }

    const contact =
      await prisma.whatsAppContact.upsert({
        where: {
          businessId_phoneNumber: {
            businessId,
            phoneNumber: cleanPhone,
          },
        },
        update: {},
        create: {
          businessId,
          phoneNumber: cleanPhone,
        },
      });

    const existingConversation =
      await prisma.conversation.findFirst({
        where: {
          businessId,
          contactId: contact.id,
          status: {
            in: ["OPEN", "PENDING"],
          },
        },
        include: {
          contact: true,
          assignedTo: true,
          qrCode: true,
        },
        orderBy: {
          lastMessageAt: "desc",
        },
      });

    if (existingConversation) {
      return existingConversation;
    }

    return prisma.conversation.create({
      data: {
        businessId,
        contactId: contact.id,
        status: "OPEN",
        priority: "NORMAL",
        handlingMode: "HUMAN",
      },
      include: {
        contact: true,
        assignedTo: true,
        qrCode: true,
      },
    });
  }
  /**
   * ---------------------------------------------------------
   * CONVERSATION ACCESS
   * ---------------------------------------------------------
   */
  private async getConversationForBusiness(
    businessId: string,
    conversationId: string
  ) {
    const conversation =
      await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          businessId,
        },
        include: {
          contact: true,
          assignedTo: true,
          qrCode: true,
        },
      });

    if (!conversation) {
      throw new AppError(
        "Conversation not found",
        404
      );
    }

    return conversation;
  }

  /**
   * ---------------------------------------------------------
   * GET CONVERSATIONS
   * ---------------------------------------------------------
   */
  async getConversations(
    userId: string,
    businessId: string,
    status?: ConversationStatus
  ) {
    await this.assertBusinessAccess(
      userId,
      businessId
    );

    return prisma.conversation.findMany({
      where: {
        businessId,
        ...(status ? { status } : {}),
      },
      include: {
        contact: true,
        assignedTo: true,
        qrCode: true,
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: [
        {
          lastMessageAt: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    });
  }

  /**
   * ---------------------------------------------------------
   * GET SINGLE CONVERSATION
   * ---------------------------------------------------------
   */
  async getConversation(
    userId: string,
    businessId: string,
    conversationId: string
  ) {
    await this.assertBusinessAccess(
      userId,
      businessId
    );

    return this.getConversationForBusiness(
      businessId,
      conversationId
    );
  }

  /**
   * ---------------------------------------------------------
   * GET MESSAGES
   * ---------------------------------------------------------
   */
  async getMessages(
    userId: string,
    businessId: string,
    conversationId: string
  ) {
    await this.assertBusinessAccess(
      userId,
      businessId
    );

    await this.getConversationForBusiness(
      businessId,
      conversationId
    );

    return prisma.whatsAppMessage.findMany({
      where: {
        businessId,
        conversationId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  }

  /**
   * ---------------------------------------------------------
   * SEND WHATSAPP MESSAGE
   * ---------------------------------------------------------
   */
  async sendMessage(
  userId: string,
  businessId: string,
  conversationId: string,
  text: string,
) {
  try {
    await this.assertBusinessAccess(
      userId,
      businessId,
    );

    const conversation =
      await this.getConversationForBusiness(
        businessId,
        conversationId,
      );

    const cleanText = text?.trim();

    if (!cleanText) {
      throw new AppError(
        "Message text is required",
        400,
      );
    }

    const accessToken =
      process.env.WHATSAPP_ACCESS_TOKEN;

    const phoneNumberId =
      process.env.WHATSAPP_PHONE_NUMBER_ID;

    const apiVersion =
      process.env.WHATSAPP_API_VERSION ||
      "v22.0";

    if (!accessToken) {
      throw new AppError(
        "WhatsApp access token is not configured",
        500,
      );
    }

    if (!phoneNumberId) {
      throw new AppError(
        "WhatsApp phone number ID is not configured",
        500,
      );
    }

    const customerPhone =
      conversation.contact.phoneNumber;

    if (!customerPhone) {
      throw new AppError(
        "Customer phone number is missing",
        400,
      );
    }

    console.log(
      "[WHATSAPP SEND] Starting outbound message",
      {
        businessId,
        conversationId,
        contactId: conversation.contactId,
        customerPhone,
        phoneNumberId,
        apiVersion,
        textLength: cleanText.length,
      },
    );

    let response;

    try {
      response = await axios.post(
        `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: customerPhone,
          type: "text",
          text: {
            body: cleanText,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );
    } catch (error: any) {
      const metaError =
        error?.response?.data;

      console.error(
        "[WHATSAPP META SEND ERROR]",
        {
          status: error?.response?.status,
          statusText: error?.response?.statusText,
          response: metaError,
          message: error?.message,
        },
      );

      throw new AppError(
        metaError?.error?.message ||
          "Failed to send WhatsApp message",
        error?.response?.status >= 400 &&
        error?.response?.status < 600
          ? error.response.status
          : 502,
      );
    }

    const whatsappMessageId =
      response?.data?.messages?.[0]?.id || null;

    console.log(
      "[WHATSAPP META SEND SUCCESS]",
      {
        conversationId,
        whatsappMessageId,
        response: response?.data,
      },
    );

let message;

try {
  message =
    await prisma.whatsAppMessage.create({
      data: {
        businessId,
        conversationId,
        direction: "OUTBOUND",
        type: "TEXT",
        text: cleanText,
        whatsappMessageId,
        status: "SENT",
      },
    });
} catch (error: any) {
  console.error(
    "[WHATSAPP DATABASE MESSAGE ERROR]",
    {
      conversationId,
      whatsappMessageId,
      error,
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
    },
  );

  throw new AppError(
    "WhatsApp message was sent, but could not be saved locally.",
    500,
  );
}

    try {
      await prisma.conversation.updateMany({
        where: {
          id: conversationId,
          businessId,
        },
        data: {
          lastMessageAt: new Date(),
          status: "OPEN",
        },
      });
    } catch (error: any) {
      console.error(
        "[WHATSAPP CONVERSATION UPDATE ERROR]",
        {
          conversationId,
          error,
          message: error?.message,
          code: error?.code,
          meta: error?.meta,
        },
      );

      // Do not fail the whole send operation here.
      // The WhatsApp message has already been successfully
      // delivered to Meta and saved locally.
    }

    return message;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }

    console.error(
      "[WHATSAPP SEND UNEXPECTED ERROR]",
      {
        error,
        message: error?.message,
        stack: error?.stack,
        code: error?.code,
        meta: error?.meta,
      },
    );

    throw new AppError(
      "Failed to send WhatsApp message",
      500,
    );
  }
}
  /**
   * ---------------------------------------------------------
   * SEND AUTOMATED WHATSAPP MESSAGE
   * ---------------------------------------------------------
   * Used internally by the WhatsApp automation engine.
   *
   * This method intentionally does not require a dashboard
   * userId because it is triggered by an inbound WhatsApp
   * webhook rather than a dashboard user.
   * ---------------------------------------------------------
   */
  async sendAutomatedMessage(
    businessId: string,
    conversationId: string,
    text: string,
  ) {
    const conversation =
      await this.getConversationForBusiness(
        businessId,
        conversationId,
      );

    const cleanText = text?.trim();

    if (!cleanText) {
      throw new AppError(
        "Automated message text is required",
        400,
      );
    }

    const accessToken =
      process.env.WHATSAPP_ACCESS_TOKEN;

    const phoneNumberId =
      process.env.WHATSAPP_PHONE_NUMBER_ID;

    const apiVersion =
      process.env.WHATSAPP_API_VERSION ||
      "v22.0";

    if (!accessToken) {
      throw new AppError(
        "WhatsApp access token is not configured",
        500,
      );
    }

    if (!phoneNumberId) {
      throw new AppError(
        "WhatsApp phone number ID is not configured",
        500,
      );
    }

    const customerPhone =
      conversation.contact.phoneNumber;

    if (!customerPhone) {
      throw new AppError(
        "Customer phone number is missing",
        400,
      );
    }

    console.log(
      "[WHATSAPP AUTOMATED SEND] Starting",
      {
        businessId,
        conversationId,
        customerPhone,
        textLength: cleanText.length,
      },
    );

    let response;

    try {
      response = await axios.post(
        `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: customerPhone,
          type: "text",
          text: {
            body: cleanText,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );
    } catch (error: any) {
      const metaError =
        error?.response?.data;

      console.error(
        "[WHATSAPP AUTOMATED META ERROR]",
        {
          status: error?.response?.status,
          response: metaError,
          message: error?.message,
        },
      );

      throw new AppError(
        metaError?.error?.message ||
          "Failed to send automated WhatsApp message",
        error?.response?.status >= 400 &&
        error?.response?.status < 600
          ? error.response.status
          : 502,
      );
    }

    const whatsappMessageId =
      response?.data?.messages?.[0]?.id ||
      null;

    if (!whatsappMessageId) {
      throw new AppError(
        "WhatsApp automated message was accepted without a message ID",
        502,
      );
    }

    const message =
      await prisma.whatsAppMessage.create({
        data: {
          businessId,
          conversationId,
          direction: "OUTBOUND",
          type: "TEXT",
          text: cleanText,
          whatsappMessageId,
          status: "SENT",
          metadata: response?.data,
        },
      });

    await prisma.conversation.updateMany({
      where: {
        id: conversationId,
        businessId,
      },

      data: {
        lastMessageAt: new Date(),
        status: "OPEN",
      },
    });

    console.log(
      "[WHATSAPP AUTOMATED SEND] Success",
      {
        conversationId,
        whatsappMessageId,
        messageId: message.id,
      },
    );

    return message;
  }
/**
 * ---------------------------------------------------------
 * SEND WHATSAPP TEMPLATE MESSAGE
 * ---------------------------------------------------------
 * Used when the WhatsApp customer-service window is closed.
 *
 * Current test template:
 * tapqr_security_alert
 *
 * Variables:
 * {{1}} = customer name
 * {{2}} = notification text
 * ---------------------------------------------------------
 */
async sendTemplateMessage(
  userId: string,
  businessId: string,
  conversationId: string,
) {
  try {
    await this.assertBusinessAccess(
      userId,
      businessId,
    );

    const conversation =
      await this.getConversationForBusiness(
        businessId,
        conversationId,
      );

    const accessToken =
      process.env.WHATSAPP_ACCESS_TOKEN;

    const phoneNumberId =
      process.env.WHATSAPP_PHONE_NUMBER_ID;

    const apiVersion =
      process.env.WHATSAPP_API_VERSION ||
      "v22.0";

    const templateName =
      process.env.WHATSAPP_SUPPORT_TEMPLATE_NAME ||
      "tapqr_security_alert";

    const templateLanguage =
      process.env.WHATSAPP_SUPPORT_TEMPLATE_LANG ||
      "en";

    if (!accessToken) {
      throw new AppError(
        "WhatsApp access token is not configured",
        500,
      );
    }

    if (!phoneNumberId) {
      throw new AppError(
        "WhatsApp phone number ID is not configured",
        500,
      );
    }

    const customerPhone =
      conversation.contact.phoneNumber;

    if (!customerPhone) {
      throw new AppError(
        "Customer phone number is missing",
        400,
      );
    }

    const customerName =
      conversation.contact.displayName ||
      conversation.contact.profileName ||
      "Customer";

    const notificationText =
      "A support request requires your attention on TapQR.";

    console.log(
      "[WHATSAPP TEMPLATE SEND] Starting",
      {
        businessId,
        conversationId,
        customerPhone,
        templateName,
        templateLanguage,
      },
    );

    let response;

    try {
      response = await axios.post(
        `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: customerPhone,
          type: "template",
          template: {
            name: templateName,
            language: {
              code: templateLanguage,
            },
            components: [
              {
                type: "body",
                parameters: [
                  {
                    type: "text",
                    text: customerName,
                  },
                  {
                    type: "text",
                    text: notificationText,
                  },
                ],
              },
            ],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );
    } catch (error: any) {
      const metaError =
        error?.response?.data;

      console.error(
        "[WHATSAPP TEMPLATE META ERROR]",
        {
          status: error?.response?.status,
          response: metaError,
          message: error?.message,
        },
      );

      throw new AppError(
        metaError?.error?.message ||
          "Failed to send WhatsApp template",
        error?.response?.status >= 400 &&
        error?.response?.status < 600
          ? error.response.status
          : 502,
      );
    }

    const whatsappMessageId =
      response?.data?.messages?.[0]?.id ||
      null;

    console.log(
      "[WHATSAPP TEMPLATE SEND SUCCESS]",
      {
        conversationId,
        whatsappMessageId,
        response: response?.data,
      },
    );

    if (!whatsappMessageId) {
      throw new AppError(
        "WhatsApp template was accepted without a message ID",
        502,
      );
    }

    const messageText =
      `Template: ${templateName}\n` +
      `Customer: ${customerName}\n` +
      `Notification: ${notificationText}`;

    let message;

    try {
      message =
        await prisma.whatsAppMessage.create({
          data: {
            businessId,
            conversationId,
            direction: "OUTBOUND",
            type: "TEMPLATE",
            text: messageText,
            whatsappMessageId,
            status: "SENT",
            templateName,
            metadata: response?.data,
          },
        });
    } catch (error: any) {
      console.error(
        "[WHATSAPP TEMPLATE DATABASE ERROR]",
        {
          conversationId,
          whatsappMessageId,
          error,
          message: error?.message,
          code: error?.code,
          meta: error?.meta,
        },
      );

      throw new AppError(
        "WhatsApp template was sent, but could not be saved locally.",
        500,
      );
    }

    try {
      await prisma.conversation.updateMany({
        where: {
          id: conversationId,
          businessId,
        },
        data: {
          lastMessageAt: new Date(),
          status: "OPEN",
        },
      });
    } catch (error: any) {
      console.error(
        "[WHATSAPP TEMPLATE CONVERSATION UPDATE ERROR]",
        {
          conversationId,
          error,
          message: error?.message,
          code: error?.code,
        },
      );
    }

    return message;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }

    console.error(
      "[WHATSAPP TEMPLATE UNEXPECTED ERROR]",
      {
        error,
        message: error?.message,
        stack: error?.stack,
      },
    );

    throw new AppError(
      "Failed to send WhatsApp template",
      500,
    );
  }
}
  /**
   * ---------------------------------------------------------
   * UPDATE CONVERSATION STATUS
   * ---------------------------------------------------------
   */
  async updateConversationStatus(
    userId: string,
    businessId: string,
    conversationId: string,
    status: ConversationStatus
  ) {
    await this.assertBusinessAccess(
      userId,
      businessId
    );

    await this.getConversationForBusiness(
      businessId,
      conversationId
    );

    return prisma.conversation.updateMany({
      where: {
        id: conversationId,
        businessId,
      },
      data: {
        status,
      },
    });
  }

  /**
   * ---------------------------------------------------------
   * CHECK MANAGER / OWNER PERMISSION
   * ---------------------------------------------------------
   */
  private async assertManagerAccess(
    userId: string,
    businessId: string
  ) {
    // Business owner automatically has permission
    const owner = await prisma.business.findFirst({
      where: {
        id: businessId,
        ownerId: userId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (owner) {
      return;
    }

    const member =
      await prisma.businessMember.findUnique({
        where: {
          userId_businessId: {
            userId,
            businessId,
          },
        },
        select: {
          isActive: true,
          role: true,
        },
      });

    if (
      !member ||
      !member.isActive ||
      !["OWNER", "MANAGER"].includes(member.role)
    ) {
      throw new AppError(
        "Only owner or manager can perform this action",
        403
      );
    }
  }

  /**
   * ---------------------------------------------------------
   * ASSIGN CONVERSATION
   * ---------------------------------------------------------
   */
  async assignConversation(
    userId: string,
    businessId: string,
    conversationId: string,
    businessMemberId: string
  ) {
    await this.assertBusinessAccess(
      userId,
      businessId
    );

    await this.assertManagerAccess(
      userId,
      businessId
    );

    await this.getConversationForBusiness(
      businessId,
      conversationId
    );

    const member =
      await prisma.businessMember.findFirst({
        where: {
          id: businessMemberId,
          businessId,
          isActive: true,
        },
        select: {
          id: true,
        },
      });

    if (!member) {
      throw new AppError(
        "Business member not found",
        404
      );
    }

    return prisma.conversation.updateMany({
      where: {
        id: conversationId,
        businessId,
      },
      data: {
        assignedToId: businessMemberId,
      },
    });
  }

  /**
   * ---------------------------------------------------------
   * UNASSIGN CONVERSATION
   * ---------------------------------------------------------
   */
  async unassignConversation(
    userId: string,
    businessId: string,
    conversationId: string
  ) {
    await this.assertBusinessAccess(
      userId,
      businessId
    );

    await this.assertManagerAccess(
      userId,
      businessId
    );

    await this.getConversationForBusiness(
      businessId,
      conversationId
    );

    return prisma.conversation.updateMany({
      where: {
        id: conversationId,
        businessId,
      },
      data: {
        assignedToId: null,
      },
    });
  }

  /**
   * ---------------------------------------------------------
   * SET HANDLING MODE
   * ---------------------------------------------------------
   */
  async setHandlingMode(
    userId: string,
    businessId: string,
    conversationId: string,
    handlingMode: ConversationHandlingMode
  ) {
    await this.assertBusinessAccess(
      userId,
      businessId
    );

    await this.assertManagerAccess(
      userId,
      businessId
    );

    await this.getConversationForBusiness(
      businessId,
      conversationId
    );

    return prisma.conversation.updateMany({
      where: {
        id: conversationId,
        businessId,
      },
      data: {
        handlingMode,
      },
    });
  }
}

export const whatsappService =
  new WhatsAppService();

whatsappAutomationService.setReplySender(
  async (
    businessId,
    conversationId,
    text,
  ) => {
    return whatsappService.sendAutomatedMessage(
      businessId,
      conversationId,
      text,
    );
  },
);