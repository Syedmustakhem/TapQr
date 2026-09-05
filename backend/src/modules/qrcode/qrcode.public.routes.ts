import { Router } from "express";
import { authLimiter } from "../../cores/middleware/rateLimiter";
import { QRCodePublicController } from "./qrcode.public.controller";

const router = Router();
const controller = new QRCodePublicController();

router.get("/:shortCode", controller.getExperience);
router.post("/:shortCode/scan", authLimiter, controller.recordScan);

export default router;
