import { Router } from "express";

import { GrowthController } from "./growth.controller";

import { authenticate } from "../auth/auth.middleware";

import { validate } from "../../cores/middleware/validate";

import { attributeReferralSchema } from "./growth.validation";

const router = Router();

const controller = new GrowthController();

/*
 * ============================================================
 * GROWTH ROUTES  ->  mounted at /api/growth
 * ============================================================
 *
 * Public:  GET /referral/validate/:code
 * Auth:    everything else
 */

router.get(
  "/referral/validate/:code",
  controller.validateReferralCode
);

router.use(authenticate);

router.post(
  "/trial/start",
  controller.startTrial
);

router.get(
  "/trial/status",
  controller.getTrialStatus
);

router.post(
  "/referral/code",
  controller.getReferralCode
);

router.get(
  "/referral/stats",
  controller.getReferralStats
);

router.post(
  "/referral/attribute",
  validate(attributeReferralSchema, "body"),
  controller.attributeReferral
);

export default router;
