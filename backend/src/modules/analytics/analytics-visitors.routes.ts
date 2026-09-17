import { Router } from "express";
import { authenticate } from "../auth/auth.middleware";
import { validate } from "../../cores/middleware/validate";
import { visitorAnalyticsController } from "./analytics-visitors.controller";
import {
  visitorAnalyticsParamsSchema,
  visitorAnalyticsQuerySchema,
} from "./analytics-visitors.validation";

const router = Router();

router.use(authenticate);

router.get(
  "/business/:businessId/visitors",
  validate(visitorAnalyticsParamsSchema, "params"),
  validate(visitorAnalyticsQuerySchema, "query"),
  visitorAnalyticsController.getVisitorAnalytics,
);

export default router;
