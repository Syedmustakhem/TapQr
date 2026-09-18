import { Router } from "express";
import { whatsappController } from "./whatsapp.controller";

const router = Router();

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

export default router;