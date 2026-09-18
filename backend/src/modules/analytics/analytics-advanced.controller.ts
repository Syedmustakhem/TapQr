import { NextFunction, Response } from "express";

import { ResponseHandler } from "../../cores/responses/ResponseHandler";
import { AppError } from "../../cores/errors/AppError";
import { AnalyticsAuthRequest } from "./analytics.types";
import { AdvancedAnalyticsService } from "./analytics-advanced.service";

const service = new AdvancedAnalyticsService();

export class AdvancedAnalyticsController {
  /**
   * GET /business/:businessId/qr/:qrCodeId
   *
   * QR-level advanced analytics.
   */
  getQrAnalytics = async (
    req: AnalyticsAuthRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError(
          "Authentication required.",
          401,
          "UNAUTHORIZED",
        );
      }

      const result = await service.getQrAnalytics(
        userId,
        String(req.params.businessId ?? ""),
        String(req.params.qrCodeId ?? ""),
        Number(req.query.days ?? 30),
      );

      return ResponseHandler.success(
        res,
        "QR analytics retrieved successfully.",
        result,
      );
    } catch (error) {
      next(error);
    }
  };
  getCampaignQRPerformance = async (
    req: AnalyticsAuthRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError(
          "Authentication required.",
          401,
          "UNAUTHORIZED",
        );
      }

      const result =
        await service.getCampaignQRPerformance(
          userId,
          String(req.params.businessId ?? ""),
          String(req.params.campaignId ?? ""),
          Number(req.query.days ?? 30),
        );

      return ResponseHandler.success(
        res,
        "Campaign QR performance retrieved successfully.",
        result,
      );
    } catch (error) {
      next(error);
    }
  };

    getCampaignConversionAttribution =
    async (
      req: AnalyticsAuthRequest,
      res: Response,
      next: NextFunction,
    ) => {
      try {
        const userId =
          req.user?.id;

        if (!userId) {
          throw new AppError(
            "Authentication required.",
            401,
            "UNAUTHORIZED",
          );
        }

        const result =
          await service.getCampaignConversionAttribution(
            userId,
            String(
              req.params.businessId ??
                "",
            ),
            String(
              req.params.campaignId ??
                "",
            ),
            Number(
              req.query.days ?? 30,
            ),
          );

        return ResponseHandler.success(
          res,
          "Campaign conversion and attribution analytics retrieved successfully.",
          result,
        );
      } catch (error) {
        next(error);
      }
    };
  /**
   * GET /business/:businessId/sources
   *
   * Business-level source analytics.
   */
  getSourceAnalytics = async (
    req: AnalyticsAuthRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError(
          "Authentication required.",
          401,
          "UNAUTHORIZED",
        );
      }

      const result =
        await service.getSourceAnalytics(
          userId,
          String(req.params.businessId ?? ""),
          Number(req.query.days ?? 30),
        );

      return ResponseHandler.success(
        res,
        "Source analytics retrieved successfully.",
        result,
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /business/:businessId/campaigns/:campaignId
   *
   * Campaign overview analytics.
   */
  getCampaignAnalytics = async (
    req: AnalyticsAuthRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError(
          "Authentication required.",
          401,
          "UNAUTHORIZED",
        );
      }

      const result =
        await service.getCampaignAnalytics(
          userId,
          String(req.params.businessId ?? ""),
          String(req.params.campaignId ?? ""),
          Number(req.query.days ?? 30),
        );

      return ResponseHandler.success(
        res,
        "Campaign analytics retrieved successfully.",
        result,
      );
    } catch (error) {
      next(error);
    }
  };
}

export const advancedAnalyticsController =
  new AdvancedAnalyticsController();