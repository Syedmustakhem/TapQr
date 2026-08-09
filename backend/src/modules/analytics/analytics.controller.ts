import {
  Request,
  Response,
  NextFunction,
} from "express";

import { AnalyticsService } from "./analytics.service";

export class AnalyticsController {

  private analyticsService =
    new AnalyticsService();

  /**
   * PUBLIC
   *
   * Record a QR scan.
   */
  recordScan = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {

    try {

      const qrCodeId =
        req.params.qrCodeId;

      const scan =
        await this.analyticsService.recordScan({
          qrCodeId,

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

      return res.status(201).json({
        success: true,
        data: scan,
      });

    } catch (error) {
      next(error);
    }
  };

  /**
   * OWNER
   *
   * Get QR scan history.
   */
  getQRCodeScans = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {

    try {

      const qrCodeId =
        req.params.qrCodeId;

      const ownerId =
        (req as any).user.id;

      const scans =
        await this.analyticsService
          .getQRCodeScans(
            qrCodeId,
            ownerId
          );

      return res.status(200).json({
        success: true,
        data: scans,
      });

    } catch (error) {
      next(error);
    }
  };

  /**
   * OWNER
   *
   * Get QR scan count.
   */
  getQRCodeScanCount = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {

    try {

      const qrCodeId =
        req.params.qrCodeId;

      const ownerId =
        (req as any).user.id;

      const result =
        await this.analyticsService
          .getQRCodeScanCount(
            qrCodeId,
            ownerId
          );

      return res.status(200).json({
        success: true,
        data: result,
      });

    } catch (error) {
      next(error);
    }
  };

  /**
   * OWNER
   *
   * Get all business scans.
   */
  getBusinessScans = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {

    try {

      const businessId =
        req.params.businessId;

      const ownerId =
        (req as any).user.id;

      const scans =
        await this.analyticsService
          .getBusinessScans(
            businessId,
            ownerId
          );

      return res.status(200).json({
        success: true,
        data: scans,
      });

    } catch (error) {
      next(error);
    }
  };

  /**
   * OWNER
   *
   * Get business scan count.
   */
  getBusinessScanCount = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {

    try {

      const businessId =
        req.params.businessId;

      const ownerId =
        (req as any).user.id;

      const result =
        await this.analyticsService
          .getBusinessScanCount(
            businessId,
            ownerId
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