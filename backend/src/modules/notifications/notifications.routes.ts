import { Router } from "express";

import { authenticate } from "../auth/auth.middleware";
import { NotificationController } from "./notifications.controller";

const router = Router();

/**
 * Every notification endpoint requires
 * an authenticated user.
 */
router.use(authenticate);

/**
 * IMPORTANT:
 *
 * Static routes must come before /:id.
 *
 * Otherwise:
 *
 * /unread-count
 *
 * could be interpreted as:
 *
 * /:id
 */
router.get(
  "/unread-count",
  NotificationController.unreadCount
);

router.post(
  "/read-all",
  NotificationController.markAllRead
);

router.get(
  "/",
  NotificationController.list
);

router.get(
  "/:id",
  NotificationController.getById
);

router.post(
  "/:id/read",
  NotificationController.markRead
);

router.post(
  "/:id/retry",
  NotificationController.retry
);

export default router;