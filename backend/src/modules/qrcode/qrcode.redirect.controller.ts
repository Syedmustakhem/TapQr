import {
  Request,
  Response,
  NextFunction,
} from "express";

import { QRCodeService } from "./qrcode.service";

import { AnalyticsService } from "../analytics/analytics.service";

export class QRCodeRedirectController {
  private qrCodeService =
    new QRCodeService();

  private analyticsService =
    new AnalyticsService();

  redirect = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const shortCode = String(
        req.params.shortCode
      );

      const qrCode =
        await this.qrCodeService.resolveQRCode(
          shortCode
        );

      const forwardedFor =
        req.headers["x-forwarded-for"];

      const ipAddress =
        typeof forwardedFor === "string"
          ? forwardedFor
              .split(",")[0]
              ?.trim()
          : req.ip;

      await this.analyticsService.recordScan(
        {
          qrCodeId:
            qrCode.qrCodeId,

          ipAddress,

          userAgent:
            req.headers["user-agent"],

          referrer:
            req.headers["referer"],
        }
      );

      return res.redirect(
        302,
        qrCode.destinationUrl
      );
    } catch (error) {
      next(error);
    }
  };
}