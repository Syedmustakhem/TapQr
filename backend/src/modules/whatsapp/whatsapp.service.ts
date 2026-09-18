import axios from "axios";
import {
  ConversationHandlingMode,
  ConversationStatus,
} from "@prisma/client";

import { prisma } from "../../config/prisma";
import { AppError } from "../../cores/errors/AppError";

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
    text: string
  ) {
    await this.assertBusinessAccess(
      userId,
      businessId
    );

    const conversation =
      await this.getConversationForBusiness(
        businessId,
        conversationId
      );

    const cleanText = text?.trim();

    if (!cleanText) {
      throw new AppError(
        "Message text is required",
        400
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
        500
      );
    }

    if (!phoneNumberId) {
      throw new AppError(
        "WhatsApp phone number ID is not configured",
        500
      );
    }

    const customerPhone =
      conversation.contact.phoneNumber;

    if (!customerPhone) {
      throw new AppError(
        "Customer phone number is missing",
        400
      );
    }

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
        }
      );
    } catch (error: any) {
      const metaError =
        error?.response?.data;

      console.error(
        "[WHATSAPP SEND ERROR]",
        metaError || error?.message || error
      );

      throw new AppError(
        metaError?.error?.message ||
          "Failed to send WhatsApp message",
        502
      );
    }

    const whatsappMessageId =
      response?.data?.messages?.[0]?.id || null;

    const message =
      await prisma.whatsAppMessage.create({
        data: {
          businessId,
          conversationId,
          contactId: conversation.contactId,
          direction: "OUTBOUND",
          type: "TEXT",
          content: cleanText,
          whatsappMessageId,
          status: "SENT",
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

    return message;
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