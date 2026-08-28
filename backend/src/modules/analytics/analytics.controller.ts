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

export class AnalyticsController {

  private service =
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
        return res.status(401).json({
          success: false,

          message:
            "Authentication required.",

          code:
            "UNAUTHORIZED",
        });
      }

      const query =
        analyticsQuerySchema.parse(
          req.query
        );

      const result =
        await this.service.getBusinessOverview(
          userId,

String(req.params.businessId),
          query.days,

          query.qrCodeId
        );

      return res.status(200).json({
        success: true,

        message:
          "Analytics retrieved successfully.",

        data: result,
      });

    } catch (error) {
      next(error);
    }
  };
}