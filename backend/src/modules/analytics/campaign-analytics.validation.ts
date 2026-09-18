import { z } from "zod";

export const campaignAnalyticsParamsSchema = z.object({
  businessId: z
    .string()
    .trim()
    .min(1, "Business ID is required."),
  campaignId: z
    .string()
    .trim()
    .min(1, "Campaign ID is required."),
});

export const campaignAnalyticsQuerySchema = z.object({
  days: z
    .coerce
    .number()
    .int("Days must be an integer.")
    .min(1, "Days must be at least 1.")
    .max(365, "Days cannot exceed 365.")
    .default(30),
});
