import { Router } from "express";
import { QRCodePublicController } from "./qrcode.public.controller";
import { authLimiter } from "../../cores/middleware/rateLimiter";

const router = Router();
const controller = new QRCodePublicController();

router.get("/:shortCode", controller.getExperience);

router.post(
  "/:shortCode/scan",
  authLimiter,
  controller.recordScan
);

export default router;
