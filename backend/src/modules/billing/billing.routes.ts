import { Router } from "express";

import { BillingController } from "./billing.controller";

import { authenticate } from "../auth/auth.middleware";

import { validate } from "../../cores/middleware/validate";

import { checkoutSchema } from "./billing.validation";

const router = Router();

const controller = new BillingController();

/*
 * ============================================================
 * BILLING ROUTES  ->  mounted at /api/billing
 * ============================================================
 *
 * NOTE: POST /webhook is registered WITHOUT authentication
 * (Razorpay signs it instead) and WITHOUT the JSON body parser.
 * app.ts mounts express.raw() for this exact path BEFORE
 * express.json() — see BACKEND-BILLING-SNIPPETS.md.
 */

router.post(
  "/webhook",
  controller.webhook
);

router.use(authenticate);

router.post(
  "/checkout",
  validate(checkoutSchema, "body"),
  controller.createCheckout
);

router.get(
  "/status",
  controller.getStatus
);

router.post(
  "/cancel",
  controller.cancelSubscription
);

export default router;
