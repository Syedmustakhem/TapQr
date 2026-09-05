import { Router } from "express";
import { authLimiter } from "../../cores/middleware/rateLimiter";
import { QRCodeRedirectController } from "./qrcode.redirect.controller";

const router = Router();
const controller = new QRCodeRedirectController();

router.get("/:shortCode", authLimiter, controller.redirect);

export default router;
