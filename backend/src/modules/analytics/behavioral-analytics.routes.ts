import { Router } from "express";
import { authenticate } from "../auth/auth.middleware";
import { behavioralAnalyticsController } from "./behavioral-analytics.controller";

const router = Router();
router.use(authenticate);
router.get("/business/:businessId/behavior", behavioralAnalyticsController.getBehavioralAnalytics);
export default router;
