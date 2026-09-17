import { NextFunction, Response } from "express";
import { ResponseHandler } from "../../cores/responses/ResponseHandler";
import { AppError } from "../../cores/errors/AppError";
import { AnalyticsAuthRequest } from "./analytics.types";
import { qrJourneyAnalyticsService } from "./qr-journey-analytics.service";

export class QRJourneyAnalyticsController {
  getJourneyAnalytics = async (
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

      const businessId = String(
        req.params.businessId ?? "",
      ).trim();

      if (!businessId) {
        throw new AppError(
          "Business ID is required.",
          400,
          "BUSINESS_ID_REQUIRED",
        );
      }

      const rawDays = Number(req.query.days ?? 30);

      if (
        !Number.isInteger(rawDays) ||
        rawDays < 1 ||
        rawDays > 365
      ) {
        throw new AppError(
          "Days must be an integer between 1 and 365.",
          400,
          "INVALID_DAYS",
        );
      }

      const result =
        await qrJourneyAnalyticsService.getJourneyAnalytics(
          userId,
          businessId,
          rawDays,
        );

      return ResponseHandler.success(
        res,
        "QR journey analytics retrieved successfully.",
        result,
      );
    } catch (error) {
      next(error);
    }
  };
}

export const qrJourneyAnalyticsController =
  new QRJourneyAnalyticsController();
