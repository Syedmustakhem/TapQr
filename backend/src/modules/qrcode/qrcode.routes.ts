import { Router } from "express";

import { authenticate } from "../auth/auth.middleware";

import { validate } from "../../cores/middleware/validate";

import {
  createQRCodeSchema,
  updateQRCodeSchema,
} from "./qrcode.schema";

import { QRCodeController } from "./qrcode.controller";

const router = Router();

const qrCodeController =
  new QRCodeController();

/**
 * All routes in this file are authenticated.
 */

router.use(authenticate);

/**
 * Create QR Code
 */
router.post(
  "/",
  validate(createQRCodeSchema),
  qrCodeController.createQRCode
);

/**
 * Get business QR Codes
 */
router.get(
  "/business/:businessId",
  qrCodeController.getBusinessQRCodes
);

/**
 * Get single QR Code
 */
router.get(
  "/:id",
  qrCodeController.getQRCodeById
);

/**
 * Update QR Code
 */
router.put(
  "/:id",
  validate(updateQRCodeSchema),
  qrCodeController.updateQRCode
);

/**
 * Delete QR Code
 */
router.delete(
  "/:id",
  qrCodeController.deleteQRCode
);

export default router;