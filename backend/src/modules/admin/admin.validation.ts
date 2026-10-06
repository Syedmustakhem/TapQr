import { z } from "zod";

/*
 * ============================================================
 * ADMIN VALIDATION
 * ============================================================
 */

export const adminListQuerySchema =
  z.object({
    search: z
      .string()
      .trim()
      .max(100)
      .optional(),
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
    status: z
      .string()
      .trim()
      .max(30)
      .optional(),
  });

export const adminUserActionSchema =
  z.object({
    reason: z
      .string()
      .trim()
      .max(500)
      .optional(),
  });

export const adminGrantProSchema =
  z.object({
    days: z
      .number()
      .int()
      .min(1)
      .max(365),
    reason: z
      .string()
      .trim()
      .max(500)
      .optional(),
  });

export const adminExtendTrialSchema =
  z.object({
    days: z
      .number()
      .int()
      .min(1)
      .max(90),
    reason: z
      .string()
      .trim()
      .max(500)
      .optional(),
  });

export const adminPlanUpdateSchema =
  z.object({
    name: z
      .string()
      .trim()
      .min(1)
      .max(80)
      .optional(),
    pricePaise: z
      .number()
      .int()
      .min(0)
      .optional(),
    maxQrs: z
      .number()
      .int()
      .min(1)
      .optional(),
    maxBusinesses: z
      .number()
      .int()
      .min(1)
      .optional(),
    maxSeats: z
      .number()
      .int()
      .min(1)
      .optional(),
    features: z
      .array(z.string().max(60))
      .max(50)
      .optional(),
    isActive: z.boolean().optional(),
  });

export const adminFlagUpsertSchema =
  z.object({
    key: z
      .string()
      .trim()
      .min(1)
      .max(60)
      .regex(/^[a-z0-9_]+$/),
    enabled: z.boolean(),
    description: z
      .string()
      .trim()
      .max(300)
      .optional(),
  });

export const adminBroadcastSchema =
  z.object({
    channel: z.enum(["whatsapp", "email"]),
    segment: z.enum([
      "all",
      "pro",
      "trial",
      "free",
    ]),
    message: z
      .string()
      .trim()
      .min(1)
      .max(1000),
  });

export const adminTicketReplySchema =
  z.object({
    reply: z
      .string()
      .trim()
      .min(1)
      .max(5000),
    close: z.boolean().optional(),
  });

export const adminReviewReportActionSchema =
  z.object({
    action: z.enum([
      "dismiss",
      "remove_review",
    ]),
  });

export const adminSupportTicketSchema =
  z.object({
    subject: z
      .string()
      .trim()
      .min(1)
      .max(120),
    message: z
      .string()
      .trim()
      .min(1)
      .max(5000),
  });

export type AdminListQuery = z.infer<
  typeof adminListQuerySchema
>;
