import {
  ConversationHandlingMode,
  WhatsAppMessage,
} from "@prisma/client";

export class WhatsAppAutomationService {
  shouldAutoReply(
    conversation: {
      handlingMode: ConversationHandlingMode;
    },
    message: WhatsAppMessage,
  ): boolean {
    if (
      conversation.handlingMode !==
      ConversationHandlingMode.AI
    ) {
      return false;
    }

    if (
      message.direction !== "INBOUND"
    ) {
      return false;
    }

    return true;
  }

  async processIncomingMessage(
    conversation: {
      id: string;
      handlingMode: ConversationHandlingMode;
    },
    message: WhatsAppMessage,
  ): Promise<void> {
    const shouldReply =
      this.shouldAutoReply(
        conversation,
        message,
      );

    if (!shouldReply) {
      console.log(
        "[WHATSAPP AUTOMATION] Auto-reply skipped",
        {
          conversationId:
            conversation.id,
          handlingMode:
            conversation.handlingMode,
          messageId: message.id,
        },
      );

      return;
    }

    console.log(
      "[WHATSAPP AUTOMATION] Message ready for AI engine",
      {
        conversationId:
          conversation.id,
        messageId: message.id,
      },
    );

    /*
     * Smart Auto-Reply Engine will be
     * connected here next.
     */
  }
}

export const whatsappAutomationService =
  new WhatsAppAutomationService();