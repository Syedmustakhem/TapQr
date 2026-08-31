import { Router } from "express";

import {
  whatsappWebhookController,
} from "./webhook.controller";

const router = Router();

/**
 * Meta webhook verification
 */
router.get(
  "/",
  whatsappWebhookController.verify
);

/**
 * Incoming WhatsApp events
 */
router.post(
  "/",
  whatsappWebhookController.receive
);

export default router;