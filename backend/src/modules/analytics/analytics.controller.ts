import {
  Response,
  NextFunction,
} from "express";

import {
  AnalyticsAuthRequest,
} from "./analytics.types";

import {
  analyticsQuerySchema,
} from "./analytics.validation";

import {
  AnalyticsService,
} from "./analytics.service";

import {
  ResponseHandler,
} from "../../cores/responses/ResponseHandler";

import {
  AppError,
} from "../../cores/errors/AppError";

export class AnalyticsController {
  private readonly service =
    new AnalyticsService();

  getBusinessOverview = async (
    req: AnalyticsAuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId =
        req.user?.id;

      if (!userId) {
        throw new AppError(
          "Authentication required.",
          401,
          "UNAUTHORIZED"
        );
      }

      const businessId =
        String(
          req.params.businessId ?? ""
        ).trim();

      if (!businessId) {
        throw new AppError(
          "Business ID is required.",
          400,
          "BUSINESS_ID_REQUIRED"
        );
      }

      const query =
        analyticsQuerySchema.parse(
          req.query
        );

      const result =
        await this.service.getBusinessOverview(
          userId,
          businessId,
          query.days,
          query.qrCodeId,
          query.limit
        );

      return ResponseHandler.success(
        res,
        "Analytics retrieved successfully.",
        result
      );
    } catch (error) {
      next(error);
    }
  };
}