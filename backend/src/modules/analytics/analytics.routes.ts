import { Router } from "express";

import { AnalyticsController } from "./analytics.controller";
import { authenticate } from "../auth/auth.middleware";

const router = Router();

const controller = new AnalyticsController();

/**
 * All analytics endpoints require authentication.
 */
router.use(authenticate);

/**
 * Business analytics
 *
 * GET /api/analytics/business/:businessId
 *
 * Optional:
 * ?days=30
 * ?days=30&qrCodeId=xxxx
 */
router.get(
  "/business/:businessId",
  controller.getBusinessOverview
);

export default router;