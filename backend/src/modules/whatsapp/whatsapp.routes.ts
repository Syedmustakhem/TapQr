import { Router } from "express";

import { authenticate } from "../auth/auth.middleware";
import { whatsappController } from "./whatsapp.controller";

const router = Router();

/*
|--------------------------------------------------------------------------
| AUTHENTICATED WHATSAPP SUPPORT
|--------------------------------------------------------------------------
|
| All Support Inbox APIs require a valid TapQR access token.
|
*/

router.use(authenticate);

router.get(
  "/conversations",
  whatsappController.getConversations,
);

router.get(
  "/conversations/:id",
  whatsappController.getConversation,
);

router.get(
  "/conversations/:id/messages",
  whatsappController.getMessages,
);

router.post(
  "/conversations/:id/messages",
  whatsappController.sendMessage,
);

router.patch(
  "/conversations/:id/status",
  whatsappController.updateConversationStatus,
);

router.post(
  "/conversations/:id/assign",
  whatsappController.assignConversation,
);

router.delete(
  "/conversations/:id/assign",
  whatsappController.unassignConversation,
);

router.patch(
  "/conversations/:id/handling-mode",
  whatsappController.setHandlingMode,
);

export default router;