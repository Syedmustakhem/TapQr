import { Router } from "express";

import {
  QRCodeRedirectController,
} from "./qrcode.redirect.controller";

const router = Router();

const controller =
  new QRCodeRedirectController();

/**
 * Public QR redirect.
 *
 * Example:
 * GET /r/ABC123
 */
router.get(
  "/r/:shortCode",
  controller.redirect
);

export default router;