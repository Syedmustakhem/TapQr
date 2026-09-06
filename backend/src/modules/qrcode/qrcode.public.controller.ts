import { Request, Response, NextFunction } from "express";

import { QRCodePublicService } from "./qrcode.public.service";

export class QRCodePublicController {
  private readonly service = new QRCodePublicService();

  /**
   * GET PUBLIC QR EXPERIENCE
   *
   * Route:
   * GET /api/qrcodes/public/:shortCode
   *
   * The complete Express request is passed into the service so
   * the Smart Rule Engine can use:
   *
   * - device
   * - browser
   * - operating system
   * - language
   * - referrer
   * - UTM parameters
   * - visitor key
   * - IP
   */
  getExperience = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const shortCode = String(
        req.params.shortCode ?? ""
      ).trim();

      if (!shortCode) {
        res.status(400).json({
          success: false,
          message: "QR code is required.",
          code: "QR_CODE_REQUIRED",
        });
        return;
      }

      const result =
        await this.service.getGuestExperience(
          shortCode,
          req
        );

      res.status(200).json({
        success: true,
        message:
          "QR experience retrieved successfully.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * RECORD PUBLIC QR SCAN
   *
   * Route:
   * POST /api/qrcodes/public/:shortCode/scan
   */
  recordScan = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const shortCode = String(
        req.params.shortCode ?? ""
      ).trim();

      if (!shortCode) {
        res.status(400).json({
          success: false,
          message: "QR code is required.",
          code: "QR_CODE_REQUIRED",
        });
        return;
      }

      const forwardedFor =
        req.headers["x-forwarded-for"];

      let ipAddress: string | undefined;

      if (typeof forwardedFor === "string") {
        ipAddress =
          forwardedFor
            .split(",")[0]
            ?.trim() || undefined;
      } else if (Array.isArray(forwardedFor)) {
        ipAddress =
          forwardedFor[0]?.trim() ||
          undefined;
      } else {
        ipAddress =
          req.ip || undefined;
      }

      const result =
        await this.service.recordScan(
          shortCode,
          {
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
          }
        );

      res.status(200).json({
        success: true,
        message:
          "QR scan recorded successfully.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}