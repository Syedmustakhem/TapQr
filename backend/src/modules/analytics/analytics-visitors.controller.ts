import { NextFunction, Response } from "express";
import { ResponseHandler } from "../../cores/responses/ResponseHandler";
import { AppError } from "../../cores/errors/AppError";
import { AnalyticsAuthRequest } from "./analytics.types";
import { visitorAnalyticsService } from "./analytics-visitors.service";

export class VisitorAnalyticsController {
  getVisitorAnalytics = async (
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
        await visitorAnalyticsService.getVisitorAnalytics(
          userId,
          String(req.params.businessId ?? ""),
          Number(req.query.days ?? 30),
        );

      return ResponseHandler.success(
        res,
        "Visitor analytics retrieved successfully.",
        result,
      );
    } catch (error) {
      next(error);
    }
  };
}

export const visitorAnalyticsController =
  new VisitorAnalyticsController();
