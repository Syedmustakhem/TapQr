import {
  Request,
  Response,
  NextFunction,
} from "express";
import { whatsappWebhookService } from "./webhook.service";

export class WhatsAppWebhookController {
  verify = (
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    try {
      const mode =
        typeof req.query["hub.mode"] === "string"
          ? req.query["hub.mode"]
          : undefined;

      const token =
        typeof req.query["hub.verify_token"] ===
        "string"
          ? req.query["hub.verify_token"]
          : undefined;

      const challenge =
        typeof req.query["hub.challenge"] ===
        "string"
          ? req.query["hub.challenge"]
          : undefined;

      const result =
        whatsappWebhookService.verifyWebhook(
          mode,
          token,
          challenge,
        );

      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };

  receive = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await whatsappWebhookService.processWebhook(
        req.body,
      );

      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  };
}

export const whatsappWebhookController =
  new WhatsAppWebhookController();