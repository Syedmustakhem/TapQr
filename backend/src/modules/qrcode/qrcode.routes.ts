import { Router } from "express";
import { authenticate } from "../auth/auth.middleware";
import { validate } from "../../cores/middleware/validate";
import { createQRCodeSchema, updateQRCodeSchema, updateQRBrandingSchema } from "./qrcode.schema";
import { QRCodeController } from "./qrcode.controller";

const router = Router();
const controller = new QRCodeController();

router.use(authenticate);

router.post("/", validate(createQRCodeSchema), controller.createQRCode);
router.get("/business/:businessId", controller.getBusinessQRCodes);
router.get("/:id/branding", controller.getQRBranding);
router.put("/:id/branding", validate(updateQRBrandingSchema), controller.updateQRBranding);
router.get("/:id", controller.getQRCodeById);
router.put("/:id", validate(updateQRCodeSchema), controller.updateQRCode);
router.delete("/:id", controller.deleteQRCode);

export default router;
