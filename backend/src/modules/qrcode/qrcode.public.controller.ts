import {
  Request,
  Response,
  NextFunction,
} from "express";

import { QRCodeRepository } from "./qrcode.repository";
import { AnalyticsService } from "../analytics/analytics.service";

export class QRCodePublicController {

  private qrRepository =
    new QRCodeRepository();

  private analyticsService =
    new AnalyticsService();

  redirect = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {

    try {

      const shortCode =
        req.params.shortCode;

      const qr =
        await this.qrRepository
          .findByShortCode(
            shortCode
          );

      if (!qr) {
        return res.status(404).json({
          success: false,
          message: "QR Code not found.",
        });
      }

      if (qr.deletedAt) {
        return res.status(404).json({
          success: false,
          message: "QR Code not found.",
        });
      }

      if (qr.status !== "ACTIVE") {
        return res.status(410).json({
          success: false,
          message: "QR Code is not active.",
        });
      }

      //
      // Record scan
      //

      await this.analyticsService
        .recordScan({
          qrCodeId: qr.id,

          ipAddress:
            req.ip,

          userAgent:
            req.get("user-agent")
              || undefined,

          referrer:
            req.get("referer")
              || undefined,

          browser:
            req.get("sec-ch-ua")
              || undefined,

          device:
            req.get("sec-ch-ua-mobile")
              || undefined,

          operatingSystem:
            req.get("sec-ch-ua-platform")
              || undefined,
        });

      //
      // Redirect user
      //

      return res.redirect(
        302,
        qr.destinationUrl
      );

    } catch (error) {
      next(error);
    }
  };
}