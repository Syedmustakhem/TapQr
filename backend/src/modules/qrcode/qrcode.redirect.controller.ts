import {
  Request,
  Response,
  NextFunction,
} from "express";

import { QRCodeService } from "./qrcode.service";

import { AnalyticsService } from "../analytics/analytics.service";

export class QRCodeRedirectController {
  private readonly qrCodeService =
    new QRCodeService();

  private readonly analyticsService =
    new AnalyticsService();

  /**
   * Public QR redirect.
   *
   * GET /r/:shortCode
   *
   * Flow:
   *
   * 1. Read short code
   * 2. Resolve QR code
   * 3. Record scan
   * 4. Validate destination URL
   * 5. Redirect visitor
   *
   * No authentication required.
   */
  redirect = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      /**
       * Extract short code.
       */
      const shortCode = String(
        req.params.shortCode ?? ""
      ).trim();

      /**
       * Validate short code.
       */
      if (!shortCode) {
        res.status(400).json({
          success: false,
          message:
            "QR short code is required.",
        });

        return;
      }

      /**
       * Resolve QR code.
       *
       * QRCodeService is responsible for:
       *
       * - QR existence
       * - deleted QR validation
       * - active status validation
       */
      const qrCode =
        await this.qrCodeService.resolveQRCode(
          shortCode
        );

      /**
       * Resolve visitor IP.
       *
       * When running behind AWS ALB / reverse proxy,
       * x-forwarded-for normally contains the
       * original client IP.
       */
      const forwardedFor =
        req.headers["x-forwarded-for"];

      const ipAddress =
        typeof forwardedFor === "string"
          ? forwardedFor
              .split(",")[0]
              ?.trim() || undefined
          : req.ip || undefined;

      /**
       * Record QR scan.
       *
       * IMPORTANT:
       *
       * qrCode.id is the QRCode primary key.
       *
       * qrCode.qrCodeId does NOT exist.
       */
      await this.analyticsService.recordScan({
        qrCodeId: qrCode.id,

        ipAddress,

        userAgent:
          req.get("user-agent") ||
          undefined,

        referrer:
          req.get("referer") ||
          undefined,

        browser:
          req.get("sec-ch-ua") ||
          undefined,

        device:
          req.get("sec-ch-ua-mobile") ||
          undefined,

        operatingSystem:
          req.get("sec-ch-ua-platform") ||
          undefined,
      });

      /**
       * A catalog/business QR does not necessarily
       * have a destination URL.
       *
       * Only REDIRECT-style QR codes should
       * perform a direct URL redirect.
       */
      if (!qrCode.destinationUrl) {
        res.status(404).json({
          success: false,
          message:
            "QR Code does not have a destination URL.",
        });

        return;
      }

      /**
       * Redirect guest.
       */
      res.redirect(
        302,
        qrCode.destinationUrl
      );
    } catch (error) {
      next(error);
    }
  };
}