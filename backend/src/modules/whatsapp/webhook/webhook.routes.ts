import { Router } from "express";
import { whatsappWebhookController } from "./webhook.controller";

const router = Router();

router.get(
  "/",
  whatsappWebhookController.verify,
);

router.post(
  "/",
  whatsappWebhookController.receive,
);

export default router;