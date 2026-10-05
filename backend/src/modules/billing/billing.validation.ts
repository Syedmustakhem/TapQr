import { z } from "zod";

/*
 * ============================================================
 * BILLING VALIDATION
 * ============================================================
 */

export const checkoutSchema = z.object({
  planCode: z.enum(["PRO_MONTHLY", "PRO_YEARLY"], {
    message:
      "planCode must be PRO_MONTHLY or PRO_YEARLY",
  }),
});

export type CheckoutInput = z.infer<
  typeof checkoutSchema
>;

export const switchPlanSchema = z.object({
  planCode: z.enum(["PRO_MONTHLY", "PRO_YEARLY"], {
    message:
      "planCode must be PRO_MONTHLY or PRO_YEARLY",
  }),
});

export type SwitchPlanInput = z.infer<
  typeof switchPlanSchema
>;
