import {
  ConversationHandlingMode,
  ConversationStatus,
} from "@prisma/client";
import { conversationRepository } from "./conversation.repository";

export class ConversationService {
  async getConversations(
    businessId: string,
    options?: {
      status?: ConversationStatus;
      page?: number;
      limit?: number;
    },
  ) {
    return conversationRepository.findAll(
      businessId,
      options,
    );
  }

  async getConversation(
    businessId: string,
    conversationId: string,
  ) {
    const conversation =
      await conversationRepository.findById(
        businessId,
        conversationId,
      );

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    return conversation;
  }

  async updateConversationStatus(
    businessId: string,
    conversationId: string,
    status: ConversationStatus,
  ) {
    const conversation =
      await conversationRepository.findById(
        businessId,
        conversationId,
      );

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    await conversationRepository.updateStatus(
      businessId,
      conversationId,
      status,
    );

    return {
      id: conversationId,
      status,
    };
  }

  async assignConversation(
    businessId: string,
    conversationId: string,
    businessMemberId: string,
  ) {
    if (!businessMemberId?.trim()) {
      throw new Error(
        "Business member ID is required",
      );
    }

    const conversation =
      await conversationRepository.findById(
        businessId,
        conversationId,
      );

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    const result =
      await conversationRepository.assignConversation(
        businessId,
        conversationId,
        businessMemberId,
      );

    if (result.count === 0) {
      throw new Error(
        "Unable to assign conversation",
      );
    }

    return conversationRepository.findById(
      businessId,
      conversationId,
    );
  }

  async unassignConversation(
    businessId: string,
    conversationId: string,
  ) {
    const conversation =
      await conversationRepository.findById(
        businessId,
        conversationId,
      );

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    const result =
      await conversationRepository.unassignConversation(
        businessId,
        conversationId,
      );

    if (result.count === 0) {
      throw new Error(
        "Unable to unassign conversation",
      );
    }

    return conversationRepository.findById(
      businessId,
      conversationId,
    );
  }

  async setHandlingMode(
    businessId: string,
    conversationId: string,
    handlingMode: ConversationHandlingMode,
  ) {
    const conversation =
      await conversationRepository.findById(
        businessId,
        conversationId,
      );

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    return conversationRepository.setHandlingMode(
      businessId,
      conversationId,
      handlingMode,
    );
  }
}

export const conversationService =
  new ConversationService();