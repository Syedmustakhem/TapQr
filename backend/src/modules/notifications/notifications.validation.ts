import { NotificationType } from "@prisma/client";
import { z } from "zod";

/**
 * Validation for:
 *
 * GET /api/notifications
 *
 * Example:
 *
 * ?page=1&limit=20&unreadOnly=false&type=SECURITY
 */
export const notificationListQuerySchema =
  z.object({
    page: z.coerce
      .number()
      .int()
      .min(1)
      .default(1),

    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20),

    unreadOnly: z
      .enum([
        "true",
        "false",
      ])
      .transform(
        (value) =>
          value === "true"
      )
      .default(false),

    type: z
      .nativeEnum(
        NotificationType
      )
      .optional(),
  });

/**
 * Validation for notification ID routes.
 *
 * Used by:
 *
 * GET  /:id
 * POST /:id/read
 * POST /:id/retry
 */
export const notificationIdSchema =
  z.object({
    id: z
      .string()
      .min(
        1,
        "Notification ID is required."
      ),
  });

/**
 * Type inferred from the query schema.
 */
export type NotificationListQueryInput =
  z.infer<
    typeof notificationListQuerySchema
  >;