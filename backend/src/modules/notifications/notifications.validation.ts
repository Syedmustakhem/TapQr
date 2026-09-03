import { z } from "zod";
import { NotificationType } from "@prisma/client";

export const notificationListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).max(100000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(25),
    unreadOnly: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .default(false),
    type: z.nativeEnum(NotificationType).optional(),
  })
  .strict();

export const notificationIdParamSchema = z
  .object({
    id: z.string().trim().min(1, "Notification ID is required."),
  })
  .strict();

export const publishNotificationSchema = z
  .object({
    userId: z.string().uuid("Invalid user ID."),
    businessId: z.string().uuid("Invalid business ID.").nullable().optional(),
    type: z.nativeEnum(NotificationType),
    title: z.string().trim().min(1).max(160),
    message: z.string().trim().min(1).max(2000),
    actionUrl: z.string().trim().max(500).nullable().optional(),
    metadata: z.record(z.string(), z.unknown()).nullable().optional(),
    eventKey: z.string().trim().min(1).max(255),
    expiresAt: z.coerce.date().nullable().optional(),
  })
  .strict();
