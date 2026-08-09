import { Router } from "express";

import {
  QRCodeRedirectController,
} from "./qrcode.redirect.controller";

const router = Router();

const qrCodeRedirectController =
  new QRCodeRedirectController();

router.get(
  "/r/:shortCode",
  qrCodeRedirectController.redirect
);

export default router;