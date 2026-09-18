import { prisma } from "../../../config/prisma";
import {
  ConversationHandlingMode,
  ConversationStatus,
} from "@prisma/client";

export class ConversationRepository {
  async findById(
    businessId: string,
    conversationId: string,
  ) {
    return prisma.conversation.findFirst({
      where: {
        id: conversationId,
        businessId,
      },
      include: {
        contact: true,
        assignedTo: true,
      },
    });
  }

  async findAll(
    businessId: string,
    options?: {
      status?: ConversationStatus;
      page?: number;
      limit?: number;
    },
  ) {
    const page = Math.max(options?.page ?? 1, 1);
    const limit = Math.min(
      Math.max(options?.limit ?? 20, 1),
      100,
    );

    const skip = (page - 1) * limit;

    const where = {
      businessId,
      ...(options?.status
        ? { status: options.status }
        : {}),
    };

    const [conversations, total] =
      await Promise.all([
        prisma.conversation.findMany({
          where,
          include: {
            contact: true,
            assignedTo: true,
          },
          orderBy: {
            lastMessageAt: "desc",
          },
          skip,
          take: limit,
        }),

        prisma.conversation.count({
          where,
        }),
      ]);

    return {
      conversations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateStatus(
    businessId: string,
    conversationId: string,
    status: ConversationStatus,
  ) {
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

  async assignConversation(
    businessId: string,
    conversationId: string,
    businessMemberId: string,
  ) {
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
async setHandlingMode(
  businessId: string,
  conversationId: string,
  handlingMode: ConversationHandlingMode,
) {
  return prisma.conversation.update({
    where: {
      id: conversationId,
      businessId,
    },
    data: {
      handlingMode,
    },
    include: {
      contact: true,
      assignedTo: true,
    },
  });
}

  async unassignConversation(
    businessId: string,
    conversationId: string,
  ) {
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
}

export const conversationRepository =
  new ConversationRepository();