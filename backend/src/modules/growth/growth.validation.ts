import { z } from "zod";

/*
 * ============================================================
 * GROWTH VALIDATION  (trial + referral)
 * ============================================================
 */

export const attributeReferralSchema =
  z.object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .min(4)
      .max(16)
      .regex(
        /^[A-Z0-9]+$/,
        "Invalid referral code format"
      ),
  });

export type AttributeReferralInput = z.infer<
  typeof attributeReferralSchema
>;
