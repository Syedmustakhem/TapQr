import {
  ConversationHandlingMode,
  ConversationPriority,
  Prisma,
} from "@prisma/client";

import { prisma } from "../../../config/prisma";

export type WhatsAppFlowState =
  | "WELCOME"
  | "MAIN_MENU"
  | "ACCOUNT_MENU"
  | "VERIFICATION_METHOD"
  | "MOBILE_VERIFICATION"
  | "EMAIL_VERIFICATION"
  | "OTP_PENDING"
  | "VERIFIED"
  | "ORDERS_MENU"
  | "PAYMENT_MENU"
  | "QR_SUPPORT_MENU"
  | "TECHNICAL_SUPPORT_MENU"
  | "HUMAN_HANDOFF";

export type WhatsAppFlowContext = {
  state: WhatsAppFlowState;

  selectedOption?: string | null;

  verificationMethod?: "MOBILE" | "EMAIL" | null;

  verificationIdentifier?: string | null;

  verificationExpiresAt?: string | null;

  authenticated?: boolean;

  authenticatedAt?: string | null;

metadata?: Prisma.JsonObject;
};

export type WhatsAppFlowResult = {
  handled: boolean;

  state: WhatsAppFlowState;

  responseText?: string;

  interactive?: {
    type: "button" | "list";
    body: string;
    footer?: string;

    buttons?: Array<{
      id: string;
      title: string;
    }>;

    sections?: Array<{
      title: string;

      rows: Array<{
        id: string;
        title: string;
        description?: string;
      }>;
    }>;
  };

  handoff?: boolean;

  requiresVerification?: boolean;
};

type FlowInput = {
  businessId: string;
  conversationId: string;
  customerPhone: string;
  text: string;
};

class WhatsAppFlowService {
  private defaultState(): WhatsAppFlowContext {
    return {
      state: "WELCOME",
      selectedOption: null,
      verificationMethod: null,
      verificationIdentifier: null,
      verificationExpiresAt: null,
      authenticated: false,
      authenticatedAt: null,
      metadata: {},
    };
  }

  private normalizeState(
    value: unknown,
  ): WhatsAppFlowContext {
    if (
      !value ||
      typeof value !== "object"
    ) {
      return this.defaultState();
    }

    const raw =
      value as Partial<WhatsAppFlowContext>;

    const validStates: WhatsAppFlowState[] = [
      "WELCOME",
      "MAIN_MENU",
      "ACCOUNT_MENU",
      "VERIFICATION_METHOD",
      "MOBILE_VERIFICATION",
      "EMAIL_VERIFICATION",
      "OTP_PENDING",
      "VERIFIED",
      "ORDERS_MENU",
      "PAYMENT_MENU",
      "QR_SUPPORT_MENU",
      "TECHNICAL_SUPPORT_MENU",
      "HUMAN_HANDOFF",
    ];

    const state =
      typeof raw.state === "string" &&
      validStates.includes(
        raw.state as WhatsAppFlowState,
      )
        ? (raw.state as WhatsAppFlowState)
        : "WELCOME";

    return {
      state,

      selectedOption:
        typeof raw.selectedOption === "string"
          ? raw.selectedOption
          : null,

      verificationMethod:
        raw.verificationMethod === "MOBILE" ||
        raw.verificationMethod === "EMAIL"
          ? raw.verificationMethod
          : null,

      verificationIdentifier:
        typeof raw.verificationIdentifier === "string"
          ? raw.verificationIdentifier
          : null,

      verificationExpiresAt:
        typeof raw.verificationExpiresAt === "string"
          ? raw.verificationExpiresAt
          : null,

      authenticated:
        raw.authenticated === true,

      authenticatedAt:
        typeof raw.authenticatedAt === "string"
          ? raw.authenticatedAt
          : null,

      metadata:
        raw.metadata &&
        typeof raw.metadata === "object"
          ? raw.metadata
          : {},
    };
  }

  async getState(
    businessId: string,
    conversationId: string,
  ): Promise<WhatsAppFlowContext> {
    const conversation =
      await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          businessId,
        },

        select: {
          flowState: true,
        },
      });

    if (!conversation) {
      return this.defaultState();
    }

    return this.normalizeState(
      conversation.flowState,
    );
  }

  async setState(
    businessId: string,
    conversationId: string,
    state: Partial<WhatsAppFlowContext>,
  ): Promise<WhatsAppFlowContext> {
    const current =
      await this.getState(
        businessId,
        conversationId,
      );

    const next: WhatsAppFlowContext = {
      ...current,
      ...state,

      metadata: {
        ...(current.metadata ?? {}),
        ...(state.metadata ?? {}),
      },
    };

    await prisma.conversation.updateMany({
      where: {
        id: conversationId,
        businessId,
      },

      data: {
     flowState: next as Prisma.InputJsonValue,
      },
    });

    return next;
  }

  async reset(
    businessId: string,
    conversationId: string,
  ): Promise<WhatsAppFlowContext> {
    const state =
      this.defaultState();

    await prisma.conversation.updateMany({
      where: {
        id: conversationId,
        businessId,
      },

      data: {
    flowState: state as Prisma.InputJsonValue,
      },
    });

    return state;
  }

  async handleMessage(
    input: FlowInput,
  ): Promise<WhatsAppFlowResult> {
    const text =
      input.text.trim();

    if (!text) {
      return {
        handled: false,
        state: "WELCOME",
      };
    }

    const current =
      await this.getState(
        input.businessId,
        input.conversationId,
      );

    /*
     * Global human handoff.
     */
    if (
      this.isHumanRequest(text)
    ) {
      await this.setState(
        input.businessId,
        input.conversationId,
        {
          state: "HUMAN_HANDOFF",
          selectedOption:
            "HUMAN_SUPPORT",
        },
      );

      await prisma.conversation.updateMany({
        where: {
          id: input.conversationId,
          businessId:
            input.businessId,
        },

        data: {
          handlingMode:
            ConversationHandlingMode.HUMAN,

          priority:
            ConversationPriority.HIGH,
        },
      });

      return this.humanHandoff();
    }

    /*
     * Greeting / first contact.
     */
    if (
      current.state === "WELCOME" ||
      current.state === "HUMAN_HANDOFF" ||
      this.isGreeting(text)
    ) {
      await this.setState(
        input.businessId,
        input.conversationId,
        {
          state: "MAIN_MENU",
          selectedOption: null,
          authenticated: false,
        },
      );

      return this.mainMenu();
    }

    switch (current.state) {
      case "MAIN_MENU":
        return this.handleMainMenu(
          input,
          text,
        );

      case "ACCOUNT_MENU":
        return this.handleAccountMenu(
          input,
          text,
        );

      case "VERIFICATION_METHOD":
        return this.handleVerificationMethod(
          input,
          text,
        );

      case "MOBILE_VERIFICATION":
        return {
          handled: true,
          state:
            "MOBILE_VERIFICATION",
          requiresVerification: true,
          responseText:
            "📱 Mobile Verification\n\n" +
            "Please enter the mobile number registered with your TapQR account.\n\n" +
            "Example: +919876543210",
        };

      case "EMAIL_VERIFICATION":
        return {
          handled: true,
          state:
            "EMAIL_VERIFICATION",
          requiresVerification: true,
          responseText:
            "📧 Email Verification\n\n" +
            "Please enter the email address registered with your TapQR account.",
        };

      case "OTP_PENDING":
        return {
          handled: true,
          state: "OTP_PENDING",
          requiresVerification: true,
          responseText:
            "🔐 Please enter the 6-digit verification code we sent you.",
        };

      case "VERIFIED":
        return this.handleVerified(
          input,
          text,
        );

      case "ORDERS_MENU":
        return this.ordersMenu();

      case "PAYMENT_MENU":
        return this.paymentMenu();

      case "QR_SUPPORT_MENU":
        return this.qrSupportMenu();

      case "TECHNICAL_SUPPORT_MENU":
        return this.technicalSupportMenu();

      default:
        await this.setState(
          input.businessId,
          input.conversationId,
          {
            state: "MAIN_MENU",
          },
        );

        return this.mainMenu();
    }
  }

  private async handleMainMenu(
    input: FlowInput,
    text: string,
  ): Promise<WhatsAppFlowResult> {
    const option =
      this.normalizeOption(text);

    switch (option) {
      case "1":
      case "ACCOUNT":
      case "MY ACCOUNT":
      case "MY_ACCOUNT":
        await this.setState(
          input.businessId,
          input.conversationId,
          {
            state: "ACCOUNT_MENU",
            selectedOption:
              "ACCOUNT",
          },
        );

        return this.accountMenu();

      case "2":
      case "ORDERS":
      case "MY ORDERS":
      case "MY_ORDERS":
        await this.setState(
          input.businessId,
          input.conversationId,
          {
            state: "ORDERS_MENU",
            selectedOption:
              "ORDERS",
          },
        );

        return this.ordersMenu();

      case "3":
      case "PAYMENTS":
      case "PAYMENT":
      case "PAYMENT & BILLING":
        await this.setState(
          input.businessId,
          input.conversationId,
          {
            state: "PAYMENT_MENU",
            selectedOption:
              "PAYMENTS",
          },
        );

        return this.paymentMenu();

      case "4":
      case "QR":
      case "QR SUPPORT":
      case "QR_SUPPORT":
        await this.setState(
          input.businessId,
          input.conversationId,
          {
            state: "QR_SUPPORT_MENU",
            selectedOption:
              "QR_SUPPORT",
          },
        );

        return this.qrSupportMenu();

      case "5":
      case "TECHNICAL":
      case "TECHNICAL SUPPORT":
      case "TECHNICAL_SUPPORT":
        await this.setState(
          input.businessId,
          input.conversationId,
          {
            state:
              "TECHNICAL_SUPPORT_MENU",
            selectedOption:
              "TECHNICAL_SUPPORT",
          },
        );

        return this.technicalSupportMenu();

      case "6":
      case "HUMAN":
      case "TALK TO A HUMAN":
      case "HUMAN_SUPPORT":
        return this.humanHandoff();

      default:
        return {
          handled: true,
          state: "MAIN_MENU",
          responseText:
            "Please choose one of the available options below.",
          interactive:
            this.mainMenu().interactive,
        };
    }
  }

  private async handleAccountMenu(
    input: FlowInput,
    text: string,
  ): Promise<WhatsAppFlowResult> {
    const option =
      this.normalizeOption(text);

    if (
      option === "1" ||
      option === "MOBILE" ||
      option === "MOBILE NUMBER" ||
      option === "VERIFY_MOBILE"
    ) {
      await this.setState(
        input.businessId,
        input.conversationId,
        {
          state:
            "MOBILE_VERIFICATION",
          verificationMethod:
            "MOBILE",
        },
      );

      return {
        handled: true,
        state:
          "MOBILE_VERIFICATION",
        requiresVerification: true,
        responseText:
          "📱 Mobile Verification\n\n" +
          "Please enter the mobile number registered with your TapQR account.\n\n" +
          "Example: +919876543210",
      };
    }

    if (
      option === "2" ||
      option === "EMAIL" ||
      option === "EMAIL ADDRESS" ||
      option === "VERIFY_EMAIL"
    ) {
      await this.setState(
        input.businessId,
        input.conversationId,
        {
          state:
            "EMAIL_VERIFICATION",
          verificationMethod:
            "EMAIL",
        },
      );

      return {
        handled: true,
        state:
          "EMAIL_VERIFICATION",
        requiresVerification: true,
        responseText:
          "📧 Email Verification\n\n" +
          "Please enter the email address registered with your TapQR account.",
      };
    }

    return this.accountMenu();
  }

  private async handleVerificationMethod(
    input: FlowInput,
    text: string,
  ): Promise<WhatsAppFlowResult> {
    return this.handleAccountMenu(
      input,
      text,
    );
  }

  private async handleVerified(
    input: FlowInput,
    text: string,
  ): Promise<WhatsAppFlowResult> {
    const option =
      this.normalizeOption(text);

    switch (option) {
      case "1":
      case "ACCOUNT":
        return {
          handled: true,
          state: "VERIFIED",
          responseText:
            "👤 Your TapQR account is verified.\n\n" +
            "Account information is ready to be connected to the account service.",
        };

      case "2":
      case "ORDERS":
        return {
          handled: true,
          state: "VERIFIED",
          responseText:
            "📦 Your verified order area is ready.",
        };

      case "3":
      case "PAYMENTS":
        return {
          handled: true,
          state: "VERIFIED",
          responseText:
            "💳 Your verified payment area is ready.",
        };

      default:
        return {
          handled: true,
          state: "VERIFIED",
          responseText:
            "Your identity is verified. Please choose an account action.",
        };
    }
  }

  private mainMenu(): WhatsAppFlowResult {
    return {
      handled: true,

      state: "MAIN_MENU",

      responseText:
        "👋 Welcome to TapQR Support!\n\n" +
        "I'm your TapQR Support Assistant.\n\n" +
        "How can we help you today?",

      interactive: {
        type: "list",

        body:
          "👋 Welcome to TapQR Support!\n\n" +
          "How can we help you today?",

        footer:
          "TapQR Support",

        sections: [
          {
            title: "Support",

            rows: [
              {
                id: "MY_ACCOUNT",
                title: "My Account",
                description:
                  "Account and verification",
              },

              {
                id: "MY_ORDERS",
                title: "My Orders",
                description:
                  "Orders and delivery",
              },

              {
                id: "PAYMENTS",
                title: "Payment & Billing",
                description:
                  "Payments, refunds and billing",
              },

              {
                id: "QR_SUPPORT",
                title: "QR Support",
                description:
                  "QR problems and management",
              },

              {
                id: "TECHNICAL_SUPPORT",
                title: "Technical Support",
                description:
                  "Technical assistance",
              },

              {
                id: "HUMAN_SUPPORT",
                title: "Talk to a Human",
                description:
                  "Connect with our team",
              },
            ],
          },
        ],
      },
    };
  }

  private accountMenu(): WhatsAppFlowResult {
    return {
      handled: true,

      state: "ACCOUNT_MENU",

      responseText:
        "🔐 Account Verification\n\n" +
        "Before we access private account information, we need to verify your identity.",

      interactive: {
        type: "button",

        body:
          "🔐 Account Verification\n\n" +
          "How would you like to verify your identity?",

        buttons: [
          {
            id: "VERIFY_MOBILE",
            title: "Mobile Number",
          },

          {
            id: "VERIFY_EMAIL",
            title: "Email Address",
          },
        ],
      },
    };
  }

  private ordersMenu(): WhatsAppFlowResult {
    return {
      handled: true,

      state: "ORDERS_MENU",

      requiresVerification: true,

      responseText:
        "📦 My Orders\n\n" +
        "Order information requires account verification.\n\n" +
        "Please choose My Account first to verify your identity.",

      interactive: {
        type: "button",

        body:
          "📦 My Orders\n\n" +
          "Account verification is required.",

        buttons: [
          {
            id: "VERIFY_ACCOUNT",
            title: "Verify Account",
          },

          {
            id: "HUMAN_SUPPORT",
            title: "Talk to Human",
          },
        ],
      },
    };
  }

  private paymentMenu(): WhatsAppFlowResult {
    return {
      handled: true,

      state: "PAYMENT_MENU",

      responseText:
        "💳 Payment & Billing\n\n" +
        "What do you need help with?\n\n" +
        "1️⃣ Payment failed\n" +
        "2️⃣ Payment deducted\n" +
        "3️⃣ Refund\n" +
        "4️⃣ Invoice\n" +
        "5️⃣ Other payment issue",
    };
  }

  private qrSupportMenu(): WhatsAppFlowResult {
    return {
      handled: true,

      state: "QR_SUPPORT_MENU",

      responseText:
        "🔳 QR Support\n\n" +
        "What do you need help with?\n\n" +
        "1️⃣ QR isn't working\n" +
        "2️⃣ Wrong destination\n" +
        "3️⃣ QR analytics\n" +
        "4️⃣ QR maintenance\n" +
        "5️⃣ Create a QR\n" +
        "6️⃣ Manage QR\n" +
        "7️⃣ Talk to Human",
    };
  }

  private technicalSupportMenu(): WhatsAppFlowResult {
    return {
      handled: true,

      state:
        "TECHNICAL_SUPPORT_MENU",

      responseText:
        "🛠 Technical Support\n\n" +
        "Please describe the technical problem.\n\n" +
        "You can also say 'human' to connect with our team.",
    };
  }

  private humanHandoff(): WhatsAppFlowResult {
    return {
      handled: true,

      state: "HUMAN_HANDOFF",

      handoff: true,

      responseText:
        "👤 Human Support\n\n" +
        "I'll connect you with a TapQR support representative.\n\n" +
        "Please briefly describe the issue so our team has the right context.",
    };
  }

  private normalizeOption(
    text: string,
  ): string {
    return text
      .trim()
      .toUpperCase()
      .replace(/[️⃣]/g, "")
      .replace(/\s+/g, " ");
  }

  private isGreeting(
    text: string,
  ): boolean {
    return /^(hi|hello|hey|hii|hiii|good morning|good afternoon|good evening)$/i.test(
      text.trim(),
    );
  }

  private isHumanRequest(
    text: string,
  ): boolean {
    return /human|agent|staff|representative|real person|customer service|support agent|connect me|talk to (a )?(human|person|someone)|speak to (a )?(human|person|someone)/i.test(
      text,
    );
  }
}

export const whatsappFlowService =
  new WhatsAppFlowService();