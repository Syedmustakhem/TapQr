import { prisma } from "../../../config/prisma";

export type ConversationMemoryMessage = {
  id: string;
  direction: "INBOUND" | "OUTBOUND";
  type: string;
  text: string | null;
  status: string;
  createdAt: Date;
};

export type ConversationMemory = {
  conversationId: string;
  businessId: string;
  messages: ConversationMemoryMessage[];
  messageCount: number;
  lastInboundMessage: ConversationMemoryMessage | null;
  lastOutboundMessage: ConversationMemoryMessage | null;
  lastMessage: ConversationMemoryMessage | null;
  contextText: string;
};

class ConversationMemoryService {
  /**
   * Maximum number of messages loaded into short-term memory.
   *
   * This intentionally stays small for v1.
   * Later, this can be replaced/extended with:
   * - summarization
   * - long-term customer memory
   * - embeddings/vector search
   * - AI-generated conversation summaries
   */
  private readonly DEFAULT_LIMIT = 20;

  /**
   * Maximum characters used when creating the context string.
   *
   * This prevents a long conversation from creating
   * an unnecessarily large AI/automation context.
   */
  private readonly MAX_CONTEXT_CHARS = 6000;

  async getMemory(
    businessId: string,
    conversationId: string,
    limit = this.DEFAULT_LIMIT,
  ): Promise<ConversationMemory> {
    const safeLimit = Math.min(Math.max(limit, 1), 50);

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        businessId,
      },
      select: {
        id: true,
        businessId: true,
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: safeLimit,
          select: {
            id: true,
            direction: true,
            type: true,
            text: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Prisma returns newest first.
    // Memory should be presented chronologically.
    const messages = [...conversation.messages].reverse();

    const lastInboundMessage =
      [...messages]
        .reverse()
        .find((message) => message.direction === "INBOUND") ?? null;

    const lastOutboundMessage =
      [...messages]
        .reverse()
        .find((message) => message.direction === "OUTBOUND") ?? null;

    const lastMessage = messages.length
      ? messages[messages.length - 1]
      : null;

    const contextText = this.buildContextText(messages);

    return {
      conversationId: conversation.id,
      businessId: conversation.businessId,
      messages,
      messageCount: messages.length,
      lastInboundMessage,
      lastOutboundMessage,
      lastMessage,
      contextText,
    };
  }

  /**
   * Get only the recent messages.
   *
   * Useful when the caller doesn't need the derived metadata.
   */
  async getRecentMessages(
    businessId: string,
    conversationId: string,
    limit = this.DEFAULT_LIMIT,
  ): Promise<ConversationMemoryMessage[]> {
    const memory = await this.getMemory(
      businessId,
      conversationId,
      limit,
    );

    return memory.messages;
  }

  /**
   * Build a compact conversation context.
   *
   * Example:
   *
   * Customer: Hi
   * TapQR: Hello! How can I help?
   * Customer: I need help with my order
   */
  private buildContextText(
    messages: ConversationMemoryMessage[],
  ): string {
    if (messages.length === 0) {
      return "";
    }

    const lines: string[] = [];

    for (const message of messages) {
      const speaker =
        message.direction === "INBOUND"
          ? "Customer"
          : "TapQR";

      const content =
        message.text?.trim() ||
        `[${message.type.toLowerCase()} message]`;

      lines.push(`${speaker}: ${content}`);
    }

    let context = lines.join("\n");

    if (context.length <= this.MAX_CONTEXT_CHARS) {
      return context;
    }

    // Preserve the most recent context when the conversation
    // becomes larger than the configured character limit.
    context = context.slice(-this.MAX_CONTEXT_CHARS);

    const firstNewLine = context.indexOf("\n");

    if (firstNewLine >= 0) {
      context = context.slice(firstNewLine + 1);
    }

    return context;
  }
}

export const conversationMemoryService =
  new ConversationMemoryService();