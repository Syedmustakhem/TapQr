import { Request } from "express";
import { prisma } from "../../../config/prisma";
import { env } from "../../../config/env";

export class WhatsAppWebhookService {
  /**
   * Verify Meta webhook
   */
  verifyWebhook(
    mode: string | undefined,
    token: string | undefined,
    challenge: string | undefined
  ) {
    if (
      mode !== "subscribe" ||
      token !== env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
    ) {
      throw new Error("Webhook verification failed");
    }

    if (!challenge) {
      throw new Error("Missing webhook challenge");
    }

    return challenge;
  }

  /**
   * Process incoming WhatsApp webhook
   */
  async processWebhook(body: any) {
    console.log(
      "[WHATSAPP WEBHOOK] Incoming event:",
      JSON.stringify(body, null, 2)
    );

    if (body?.object !== "whatsapp_business_account") {
      return;
    }

    const entries = body?.entry ?? [];

    for (const entry of entries) {
      const changes = entry?.changes ?? [];

      for (const change of changes) {
        const value = change?.value;

        if (!value) {
          continue;
        }

        const messages = value?.messages ?? [];

        for (const message of messages) {
          await this.processIncomingMessage(
            value,
            message
          );
        }

        const statuses = value?.statuses ?? [];

        for (const status of statuses) {
          await this.processMessageStatus(status);
        }
      }
    }
  }

  /**
   * Process one incoming message
   */
  private async processIncomingMessage(
    value: any,
    message: any
  ) {
    const phoneNumberId =
      value?.metadata?.phone_number_id;

    const customerPhone =
      message?.from;

    if (!phoneNumberId || !customerPhone) {
      console.warn(
        "[WHATSAPP WEBHOOK] Missing phone number information"
      );

      return;
    }

    console.log(
      "[WHATSAPP WEBHOOK] Message received",
      {
        phoneNumberId,
        customerPhone,
        messageId: message?.id,
        type: message?.type,
      }
    );

    /*
     * Business mapping will be added next.
     *
     * For now we only verify that Meta is
     * reaching TapQR correctly.
     */
  }

  /**
   * Process Meta message status
   */
  private async processMessageStatus(
    status: any
  ) {
    console.log(
      "[WHATSAPP WEBHOOK] Message status",
      {
        messageId: status?.id,
        status: status?.status,
        recipientId: status?.recipient_id,
      }
    );
  }
}

export const whatsappWebhookService =
  new WhatsAppWebhookService();