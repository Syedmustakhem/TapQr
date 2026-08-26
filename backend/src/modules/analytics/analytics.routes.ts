import { Router } from "express";

import {
  AnalyticsController,
} from "./analytics.controller";

import {
  authenticate,
} from "../auth/auth.middleware";

const router = Router();

const controller =
  new AnalyticsController();

/**
 * PUBLIC
 */

router.post(
  "/scan/:qrCodeId",
  controller.recordScan
);

/**
 * PROTECTED
 */

router.get(
  "/qr/:qrCodeId",
  authenticate,
  controller.getQRCodeScans
);

router.get(
  "/qr/:qrCodeId/count",
  authenticate,
  controller.getQRCodeScanCount
);

router.get(
  "/business/:businessId",
  authenticate,
  controller.getBusinessScans
);

router.get(
  "/business/:businessId/count",
  authenticate,
  controller.getBusinessScanCount
);

export default router;