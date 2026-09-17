import { Router } from "express";
import { authenticate } from "../auth/auth.middleware";
import { qrJourneyAnalyticsController } from "./qr-journey-analytics.controller";

const router = Router();

router.use(authenticate);

router.get(
  "/business/:businessId/journey",
  qrJourneyAnalyticsController.getJourneyAnalytics,
);

export default router;
