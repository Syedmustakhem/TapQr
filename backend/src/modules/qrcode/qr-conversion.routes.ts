import { Router } from "express";
import { qrConversionController } from "./qr-conversion.controller";

const router = Router();

/**
 * PUBLIC QR CONVERSION ATTRIBUTION
 *
 * POST /api/qrcodes/public/:shortCode/conversion
 *
 * No authentication required.
 *
 * The backend determines attribution from:
 * - visitor key
 * - latest QR rule match
 * - experiment assignment
 * - A/B variant
 */
router.post(
  "/:shortCode/conversion",
  qrConversionController.create.bind(
    qrConversionController
  )
);

export default router;