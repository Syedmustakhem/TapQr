import { Router } from "express";

import { authenticate } from "../auth/auth.middleware";

import { validate } from "../../cores/middleware/validate";

import {
  createQRCodeSchema,
  updateQRCodeSchema,
  updateQRBrandingSchema,
} from "./qrcode.schema";

import { QRCodeController } from "./qrcode.controller";

const router =
  Router();

const qrCodeController =
  new QRCodeController();

/**
 * ============================================================
 * AUTHENTICATION
 * ============================================================
 */

router.use(authenticate);

/**
 * ============================================================
 * QR CODE CRUD
 * ============================================================
 */

/**
 * Create QR Code
 *
 * POST /api/qrcodes
 */
router.post(
  "/",
  validate(createQRCodeSchema),
  qrCodeController.createQRCode
);

/**
 * Get business QR Codes
 *
 * GET /api/qrcodes/business/:businessId
 */
router.get(
  "/business/:businessId",
  qrCodeController.getBusinessQRCodes
);

/**
 * ============================================================
 * QR STUDIO
 * ============================================================
 */

/**
 * Get QR branding
 *
 * GET /api/qrcodes/:id/branding
 */
router.get(
  "/:id/branding",
  qrCodeController.getQRBranding
);

/**
 * Update QR branding
 *
 * PUT /api/qrcodes/:id/branding
 */
router.put(
  "/:id/branding",
  validate(updateQRBrandingSchema),
  qrCodeController.updateQRBranding
);

/**
 * ============================================================
 * SINGLE QR
 * ============================================================
 */

/**
 * Get single QR Code
 *
 * GET /api/qrcodes/:id
 */
router.get(
  "/:id",
  qrCodeController.getQRCodeById
);

/**
 * Update QR Code
 *
 * PUT /api/qrcodes/:id
 */
router.put(
  "/:id",
  validate(updateQRCodeSchema),
  qrCodeController.updateQRCode
);

/**
 * Delete QR Code
 *
 * DELETE /api/qrcodes/:id
 */
router.delete(
  "/:id",
  qrCodeController.deleteQRCode
);

export default router;