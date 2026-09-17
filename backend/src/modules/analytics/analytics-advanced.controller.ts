import { NextFunction, Response } from "express";
import { ResponseHandler } from "../../cores/responses/ResponseHandler";
import { AppError } from "../../cores/errors/AppError";
import { AnalyticsAuthRequest } from "./analytics.types";
import { AdvancedAnalyticsService } from "./analytics-advanced.service";

const service = new AdvancedAnalyticsService();

export class AdvancedAnalyticsController {
  getQrAnalytics = async (req: AnalyticsAuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Authentication required.", 401, "UNAUTHORIZED");
      const result = await service.getQrAnalytics(
        userId,
        String(req.params.businessId ?? ""),
        String(req.params.qrCodeId ?? ""),
        Number(req.query.days ?? 30),
        Number(req.query.limit ?? 10),
      );
      return ResponseHandler.success(res, "QR analytics retrieved successfully.", result);
    } catch (error) { next(error); }
  };

  getSourceAnalytics = async (req: AnalyticsAuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Authentication required.", 401, "UNAUTHORIZED");
      const result = await service.getSourceAnalytics(
        userId,
        String(req.params.businessId ?? ""),
        Number(req.query.days ?? 30),
      );
      return ResponseHandler.success(res, "Source analytics retrieved successfully.", result);
    } catch (error) { next(error); }
  };
}

export const advancedAnalyticsController = new AdvancedAnalyticsController();
