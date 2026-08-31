import { Request, Response } from "express";

import {
  whatsappWebhookService,
} from "./webhook.service";

export class WhatsAppWebhookController {
  /**
   * GET /api/whatsapp/webhook
   *
   * Meta webhook verification
   */
  verify = (
    req: Request,
    res: Response
  ) => {
    try {
      const mode =
        req.query["hub.mode"] as string | undefined;

      const token =
        req.query["hub.verify_token"] as
          | string
          | undefined;

      const challenge =
        req.query["hub.challenge"] as
          | string
          | undefined;

      const result =
        whatsappWebhookService.verifyWebhook(
          mode,
          token,
          challenge
        );

      return res
        .status(200)
        .send(result);
    } catch (error) {
      console.error(
        "[WHATSAPP WEBHOOK] Verification failed",
        error
      );

      return res
        .status(403)
        .send("Forbidden");
    }
  };

  /**
   * POST /api/whatsapp/webhook
   *
   * Incoming WhatsApp events
   */
  receive = async (
    req: Request,
    res: Response
  ) => {
    try {
      await whatsappWebhookService.processWebhook(
        req.body
      );

      /*
       * Meta expects a quick 200 response.
       */
      return res
        .status(200)
        .send("EVENT_RECEIVED");
    } catch (error) {
      console.error(
        "[WHATSAPP WEBHOOK] Processing failed",
        error
      );

      /*
       * Still acknowledge Meta where possible
       * to avoid unnecessary retries.
       */
      return res
        .status(200)
        .send("EVENT_RECEIVED");
    }
  };
}

export const whatsappWebhookController =
  new WhatsAppWebhookController();