import { Router } from "express";

import { QRCodePublicController } from "./qrcode.public.controller";

const router = Router();

const controller = new QRCodePublicController();

/**
 * PUBLIC
 *
 * No authenticate middleware here.
 *
 * GET /api/qrcodes/public/:shortCode
 */
router.get(
  "/:shortCode",
  controller.getExperience
);

/**
 * PUBLIC
 *
 * No authenticate middleware here.
 *
 * POST /api/qrcodes/public/:shortCode/scan
 */
router.post(
  "/:shortCode/scan",
  controller.recordScan
);

export default router;