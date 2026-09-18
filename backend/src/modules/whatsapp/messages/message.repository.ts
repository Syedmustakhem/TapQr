import { prisma } from "../../../config/prisma";

export class MessageRepository {
  async findById(
    businessId: string,
    messageId: string,
  ) {
    return prisma.whatsAppMessage.findFirst({
      where: {
        id: messageId,
        businessId,
      },
    });
  }

  async findByConversation(
    businessId: string,
    conversationId: string,
    options?: {
      page?: number;
      limit?: number;
    },
  ) {
    const page = Math.max(options?.page ?? 1, 1);
    const limit = Math.min(Math.max(options?.limit ?? 50, 1), 100);
    const skip = (page - 1) * limit;

    const where = {
      businessId,
      conversationId,
    };

    const [messages, total] = await Promise.all([
      prisma.whatsAppMessage.findMany({
        where,
        orderBy: {
          createdAt: "asc",
        },
        skip,
        take: limit,
      }),

      prisma.whatsAppMessage.count({
        where,
      }),
    ]);

    return {
      messages,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export const messageRepository = new MessageRepository();