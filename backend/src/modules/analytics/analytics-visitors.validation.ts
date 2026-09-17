import { z } from "zod";

export const visitorAnalyticsParamsSchema = z
  .object({
    businessId: z.string().min(1),
  })
  .strict();

export const visitorAnalyticsQuerySchema = z
  .object({
    days: z.coerce.number().int().min(1).max(365).default(30),
  })
  .strict();
