import { Router } from "express";

import { authenticate } from "../auth/auth.middleware";
import { validate } from "../../cores/middleware/validate";

import {
  createQRCodeSchema,
  updateQRCodeSchema,
} from "./qrcode.schema";

import { QRCodeController } from "./qrcode.controller";

const router = Router();

const qrCodeController = new QRCodeController();

/**
 * Create QR Code
 */
router.post(
  "/",
  authenticate,
  validate(createQRCodeSchema),
  qrCodeController.createQRCode
);

/**
 * Get All QR Codes of a Business
 */
router.get(
  "/business/:businessId",
  authenticate,
  qrCodeController.getBusinessQRCodes
);

/**
 * Get Single QR Code
 */
router.get(
  "/:id",
  authenticate,
  qrCodeController.getQRCodeById
);

/**
 * Update QR Code
 */
router.put(
  "/:id",
  authenticate,
  validate(updateQRCodeSchema),
  qrCodeController.updateQRCode
);

/**
 * Delete QR Code
 */
router.delete(
  "/:id",
  authenticate,
  qrCodeController.deleteQRCode
);

export default router;