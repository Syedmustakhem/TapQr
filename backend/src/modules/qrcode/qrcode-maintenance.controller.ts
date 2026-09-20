import {
  Request,
  Response,
  NextFunction,
} from "express";

import { AppError } from "../../cores/errors/AppError";
import { qrMaintenanceService } from "./qrcode-maintenance.service";

export class QRCodeMaintenanceController {
  checkQRCode = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const rawId = req.params.id;

      const qrCodeId = Array.isArray(rawId)
        ? rawId[0]
        : rawId;

      if (!qrCodeId) {
        throw new AppError(
          "QR code ID is required",
          400,
        );
      }

      const businessId =
        req.headers["x-business-id"];

      if (
        typeof businessId !== "string" ||
        !businessId
      ) {
        throw new AppError(
          "Business ID is required",
          400,
        );
      }

      const result =
        await qrMaintenanceService.checkQRCode(
          businessId,
          qrCodeId,
        );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}