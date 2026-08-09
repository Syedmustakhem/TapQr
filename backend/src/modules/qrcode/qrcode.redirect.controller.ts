import { Request, Response } from "express";

import { QRCodeService } from "./qrcode.service";
import { AnalyticsService } from "../analytics/analytics.service";

export class QRCodeRedirectController {
  private qrCodeService = new QRCodeService();

  private analyticsService =
    new AnalyticsService();

  redirect = async (
    req: Request,
    res: Response
  ) => {
    const shortCode =
      req.params.shortCode as string;

    const qrCode =
      await this.qrCodeService.resolveQRCode(
        shortCode
      );

    const forwardedFor =
      req.headers["x-forwarded-for"];

    const ipAddress =
      typeof forwardedFor === "string"
        ? forwardedFor.split(",")[0]?.trim()
        : req.ip;

    await this.analyticsService.recordScan({
      qrCodeId: qrCode.qrCodeId,

      ipAddress,

      userAgent:
        req.headers["user-agent"],

      referrer:
        req.headers["referer"],
    });

    return res.redirect(
      302,
      qrCode.destinationUrl
    );
  };
}