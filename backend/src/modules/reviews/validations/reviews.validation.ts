import { z } from "zod";
import { ReviewStatus } from "@prisma/client";

const optionalText = (max: number, min = 1) =>
  z.string().trim().min(min).max(max).nullable().optional();

export const createReviewSchema = z.object({
  qrCodeId: z.string().trim().min(1).nullable().optional(),

  verificationToken: z
    .string()
    .trim()
    .min(20, "Invalid verification token.")
    .max(2048, "Invalid verification token.")
    .nullable()
    .optional(),

  reviewerName: optionalText(100, 2),

  reviewerEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email address.")
    .nullable()
    .optional(),

  rating: z
    .number()
    .int()
    .min(1, "Rating must be between 1 and 5.")
    .max(5, "Rating must be between 1 and 5."),

  title: optionalText(120, 2),
  comment: optionalText(2000, 2),
}).strict().superRefine((data, ctx) => {
  if (!data.reviewerName && !data.reviewerEmail) {
    ctx.addIssue({
      code: "custom",
      path: ["reviewerName"],
      message: "Provide a reviewer name or email address.",
    });
  }
});

export const reviewListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  status: z.nativeEnum(ReviewStatus).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  verified: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
  search: z.string().trim().max(120).optional(),
}).strict();

export const updateReviewStatusSchema = z.object({
  status: z.enum([
    ReviewStatus.PENDING,
    ReviewStatus.PUBLISHED,
    ReviewStatus.HIDDEN,
    ReviewStatus.REJECTED,
  ]),
  moderationNote: optionalText(1000),
}).strict();

export const reviewResponseSchema = z.object({
  response: z.string().trim().min(2).max(2000),
}).strict();

export const reportReviewSchema = z.object({
  reason: z.string().trim().min(2).max(100),
  details: optionalText(1000),
}).strict();
