import { z } from "zod";

export const createQRCodeSchema = z.object({
  businessId: z
    .string()
    .uuid("Invalid Business ID"),

  name: z
    .string()
    .min(3, "QR name must be at least 3 characters")
    .max(100, "QR name cannot exceed 100 characters"),

  description: z
    .string()
    .max(500)
    .optional(),

  destinationUrl: z
    .string()
    .url("Invalid destination URL"),

  type: z.enum([
    "STATIC",
    "DYNAMIC",
  ]),
});

export const updateQRCodeSchema = z.object({
  name: z
    .string()
    .min(3)
    .max(100)
    .optional(),

  description: z
    .string()
    .max(500)
    .optional(),

  destinationUrl: z
    .string()
    .url()
    .optional(),

  status: z
    .enum([
      "ACTIVE",
      "PAUSED",
      "EXPIRED",
    ])
    .optional(),
});