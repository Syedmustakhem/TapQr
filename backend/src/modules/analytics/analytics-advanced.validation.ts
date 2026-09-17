import { z } from "zod";

export const advancedAnalyticsParamsSchema = z.object({
  businessId: z.string().min(1),
  qrCodeId: z.string().min(1),
}).strict();

export const advancedAnalyticsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
  limit: z.coerce.number().int().min(1).max(50).default(10),
}).strict();
