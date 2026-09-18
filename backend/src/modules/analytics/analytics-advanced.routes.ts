import { Router } from "express";

import { authenticate } from "../auth/auth.middleware";
import { validate } from "../../cores/middleware/validate";

import { advancedAnalyticsController } from "./analytics-advanced.controller";

import {
  advancedAnalyticsParamsSchema,
  advancedAnalyticsQuerySchema,
} from "./analytics-advanced.validation";

import {
  campaignAnalyticsParamsSchema,
  campaignAnalyticsQuerySchema,
} from "./campaign-analytics.validation";

const router = Router();

const zBusinessParamsSchema =
  advancedAnalyticsParamsSchema.pick({
    businessId: true,
  });

router.use(authenticate);
router.get(
  "/business/:businessId/campaigns/:campaignId/qr-performance",
  validate(campaignAnalyticsParamsSchema, "params"),
  validate(campaignAnalyticsQuerySchema, "query"),
  advancedAnalyticsController.getCampaignQRPerformance,
);

router.get(
  "/business/:businessId/campaigns/:campaignId/conversion-attribution",
  validate(
    campaignAnalyticsParamsSchema,
    "params",
  ),
  validate(
    campaignAnalyticsQuerySchema,
    "query",
  ),
  advancedAnalyticsController
    .getCampaignConversionAttribution,
);
router.get(
  "/business/:businessId/qr/:qrCodeId",
  validate(advancedAnalyticsParamsSchema, "params"),
  validate(advancedAnalyticsQuerySchema, "query"),
  advancedAnalyticsController.getQrAnalytics,
);

router.get(
  "/business/:businessId/sources",
  validate(zBusinessParamsSchema, "params"),
  validate(advancedAnalyticsQuerySchema, "query"),
  advancedAnalyticsController.getSourceAnalytics,
);

router.get(
  "/business/:businessId/campaigns/:campaignId",
  validate(campaignAnalyticsParamsSchema, "params"),
  validate(campaignAnalyticsQuerySchema, "query"),
  advancedAnalyticsController.getCampaignAnalytics,
);

export default router;
