import {
  ConversationHandlingMode,
  ConversationPriority,
  WhatsAppMessage,
} from "@prisma/client";

import { prisma } from "../../../config/prisma";

type AutomationIntent =
  | "GREETING"
  | "HELP"
  | "MENU"
  | "PRICING"
  | "THANKS"
  | "UNKNOWN";

interface AutomationRule {
  intent: AutomationIntent;
  keywords: string[];
  response: string;
}

interface AutomationConversation {
  id: string;
  businessId: string;
  handlingMode: ConversationHandlingMode;
}

type WhatsAppReplySender = (
  businessId: string,
  conversationId: string,
  text: string,
) => Promise<unknown>;

export class WhatsAppAutomationService {
  private readonly rules: AutomationRule[] = [
    {
      intent: "GREETING",
      keywords: [
        "hi",
        "hello",
        "hey",
        "hii",
        "helo",
        "good morning",
        "good afternoon",
        "good evening",
      ],
      response:
        "👋 Hi! Welcome to TapQR. How can we help you today?",
    },

    {
      intent: "HELP",
      keywords: [
        "help",
        "support",
        "need help",
        "can you help",
      ],
      response:
        "Sure! 👋 Please tell us what you need help with, and our team will assist you.",
    },

    {
      intent: "MENU",
      keywords: [
        "menu",
        "catalog",
        "catalogue",
        "products",
        "product",
        "items",
      ],
      response:
        "📋 Sure! Please check our latest menu and available products here.",
    },

    {
      intent: "PRICING",
      keywords: [
        "price",
        "pricing",
        "cost",
        "rate",
        "rates",
        "how much",
      ],
      response:
        "💰 I'd be happy to help with pricing. Please tell me which product or service you're interested in.",
    },

    {
      intent: "THANKS",
      keywords: [
        "thanks",
        "thank you",
        "thankyou",
        "thx",
      ],
      response:
        "You're welcome! 😊 Let us know if you need anything else.",
    },
  ];

  private replySender:
    | WhatsAppReplySender
    | null = null;

  /**
   * ---------------------------------------------------------
   * CONNECT REPLY SENDER
   * ---------------------------------------------------------
   */

  setReplySender(
    sender: WhatsAppReplySender,
  ): void {
    this.replySender = sender;

    console.log(
      "[WHATSAPP AUTOMATION] Reply sender connected",
    );
  }

  /**
   * ---------------------------------------------------------
   * CHECK WHETHER AI SHOULD PROCESS MESSAGE
   * ---------------------------------------------------------
   */

  shouldAutoReply(
    conversation: AutomationConversation,
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

    if (!message.text?.trim()) {
      return false;
    }

    return true;
  }

  /**
   * ---------------------------------------------------------
   * DETECT HUMAN HANDOFF REQUEST
   * ---------------------------------------------------------
   */

  private shouldHandoffToHuman(
    text: string,
  ): boolean {
    const normalized = text
      .trim()
      .toLowerCase();

    if (!normalized) {
      return false;
    }

    const handoffPatterns = [
      /\bhuman\b/,
      /\bagent\b/,
      /\bstaff\b/,
      /\brepresentative\b/,
      /\bperson\b/,
      /\breal person\b/,
      /\btalk to someone\b/,
      /\btalk to a person\b/,
      /\bspeak to someone\b/,
      /\bspeak to a person\b/,
      /\bcustomer service\b/,
      /\bsupport agent\b/,
      /\bconnect me\b/,
      /\btransfer me\b/,
    ];

    return handoffPatterns.some(
      (pattern) =>
        pattern.test(normalized),
    );
  }

  /**
   * ---------------------------------------------------------
   * HAND OFF CONVERSATION TO HUMAN
   * ---------------------------------------------------------
   */

  private async handoffToHuman(
    conversation: AutomationConversation,
  ): Promise<void> {
    await prisma.conversation.update({
      where: {
        id: conversation.id,
      },

      data: {
        handlingMode:
          ConversationHandlingMode.HUMAN,

        priority:
          ConversationPriority.HIGH,
      },
    });

    console.log(
      "[WHATSAPP HUMAN HANDOFF]",
      {
        conversationId:
          conversation.id,

        businessId:
          conversation.businessId,

        reason:
          "CUSTOMER_REQUESTED_HUMAN",
      },
    );
  }

  /**
   * ---------------------------------------------------------
   * DETECT AUTOMATION INTENT
   * ---------------------------------------------------------
   */

  detectIntent(
    text: string,
  ): AutomationIntent {
    const normalizedText =
      text
        .trim()
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .replace(/\s+/g, " ");

    if (!normalizedText) {
      return "UNKNOWN";
    }

    for (const rule of this.rules) {
      const matched =
        rule.keywords.some(
          (keyword) => {
            const normalizedKeyword =
              keyword
                .toLowerCase()
                .trim();

            if (
              normalizedText ===
              normalizedKeyword
            ) {
              return true;
            }

            return normalizedText.includes(
              ` ${normalizedKeyword} `,
            );
          },
        );

      if (matched) {
        return rule.intent;
      }
    }

    return "UNKNOWN";
  }

  /**
   * ---------------------------------------------------------
   * GET AUTOMATION RESPONSE
   * ---------------------------------------------------------
   */

  getResponse(
    intent: AutomationIntent,
  ): string | null {
    const rule =
      this.rules.find(
        (item) =>
          item.intent === intent,
      );

    return rule?.response ?? null;
  }

  /**
   * ---------------------------------------------------------
   * PROCESS INCOMING MESSAGE
   * ---------------------------------------------------------
   */

  async processIncomingMessage(
    conversation: AutomationConversation,
    message: WhatsAppMessage,
  ): Promise<void> {
    /*
     * -------------------------------------------------------
     * 1. CHECK WHETHER AI CAN PROCESS THIS MESSAGE
     * -------------------------------------------------------
     */

    if (
      !this.shouldAutoReply(
        conversation,
        message,
      )
    ) {
      console.log(
        "[WHATSAPP AUTOMATION] Auto-reply skipped",
        {
          conversationId:
            conversation.id,

          handlingMode:
            conversation.handlingMode,

          messageId:
            message.id,
        },
      );

      return;
    }

    /*
     * -------------------------------------------------------
     * 2. EXTRACT MESSAGE TEXT
     * -------------------------------------------------------
     */

    const text =
      message.text?.trim();

    if (!text) {
      return;
    }

    /*
     * -------------------------------------------------------
     * 3. CHECK HUMAN HANDOFF
     * -------------------------------------------------------
     *
     * This must happen BEFORE normal intent detection.
     */

    if (
      this.shouldHandoffToHuman(
        text,
      )
    ) {
      await this.handoffToHuman(
        conversation,
      );

      return;
    }

    /*
     * -------------------------------------------------------
     * 4. DETECT AUTOMATION INTENT
     * -------------------------------------------------------
     */

    const intent =
      this.detectIntent(text);

    /*
     * -------------------------------------------------------
     * 5. GET AUTOMATED RESPONSE
     * -------------------------------------------------------
     */

    const response =
      this.getResponse(intent);

    console.log(
      "[WHATSAPP AUTOMATION] Intent detected",
      {
        conversationId:
          conversation.id,

        messageId:
          message.id,

        intent,

        hasResponse:
          Boolean(response),
      },
    );

    /*
     * -------------------------------------------------------
     * 6. NO MATCHING RESPONSE
     * -------------------------------------------------------
     */

    if (!response) {
      console.log(
        "[WHATSAPP AUTOMATION] No matching rule",
        {
          conversationId:
            conversation.id,

          messageId:
            message.id,

          intent,
        },
      );

      return;
    }

    /*
     * -------------------------------------------------------
     * 7. CHECK REPLY SENDER
     * -------------------------------------------------------
     */

    if (!this.replySender) {
      console.warn(
        "[WHATSAPP AUTOMATION] Reply sender is not connected",
        {
          conversationId:
            conversation.id,
        },
      );

      return;
    }

    /*
     * -------------------------------------------------------
     * 8. SEND AUTOMATED RESPONSE
     * -------------------------------------------------------
     */

    try {
      await this.replySender(
        conversation.businessId,
        conversation.id,
        response,
      );

      console.log(
        "[WHATSAPP AUTOMATION] Reply sent successfully",
        {
          conversationId:
            conversation.id,

          messageId:
            message.id,

          intent,
        },
      );
    } catch (error) {
      console.error(
        "[WHATSAPP AUTOMATION] Reply failed",
        {
          conversationId:
            conversation.id,

          messageId:
            message.id,

          intent,

          error,
        },
      );
    }
  }
}

export const whatsappAutomationService =
  new WhatsAppAutomationService();