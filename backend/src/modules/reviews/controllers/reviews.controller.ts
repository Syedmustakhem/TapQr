import { NextFunction, Request, Response } from "express";
import { AuthRequest } from "../../auth/auth.types";
import { ResponseHandler } from "../../../cores/responses/ResponseHandler";
import { AppError } from "../../../cores/errors/AppError";
import { ReviewsService } from "../services/reviews.service";
import {
  createReviewSchema,
  reviewListQuerySchema,
  updateReviewStatusSchema,
  reviewResponseSchema,
  reportReviewSchema,
} from "../validations/reviews.validation";

export class ReviewsController {
  private readonly service = new ReviewsService();

  private requireUserId(req: AuthRequest) {
    if (!req.user?.id) {
      throw new AppError(
        "Authentication required.",
        401,
        "UNAUTHORIZED"
      );
    }
    return req.user.id;
  }

  private requireParam(
    value: string | string[] | undefined,
    label: string
  ): string {
    const result = Array.isArray(value)
      ? value[0]?.trim() ?? ""
      : String(value ?? "").trim();

    if (!result) {
      throw new AppError(
        `${label} is required.`,
        400,
        `${label.replace(/\s+/g, "_").toUpperCase()}_REQUIRED`
      );
    }

    return result;
  }

  createReview = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const businessId = this.requireParam(
        req.params.businessId,
        "Business ID"
      );

      const input = createReviewSchema.parse(req.body);

      const result = await this.service.createReview({
        businessId,
        qrCodeId: input.qrCodeId ?? null,
        userId: null,
        reviewerName: input.reviewerName ?? null,
        reviewerEmail: input.reviewerEmail ?? null,
        rating: input.rating,
        title: input.title ?? null,
        comment: input.comment ?? null,
        verificationToken:
          input.verificationToken ?? null,
      });

      return ResponseHandler.created(
        res,
        "Review submitted successfully. It will be visible after moderation.",
        result
      );
    } catch (error) {
      next(error);
    }
  };

  createAuthenticatedReview = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = this.requireUserId(req);
      const businessId = this.requireParam(
        req.params.businessId,
        "Business ID"
      );

      const input = createReviewSchema.parse(req.body);

      const result = await this.service.createReview({
        businessId,
        qrCodeId: input.qrCodeId ?? null,
        userId,
        reviewerName: input.reviewerName ?? null,
        reviewerEmail: input.reviewerEmail ?? null,
        rating: input.rating,
        title: input.title ?? null,
        comment: input.comment ?? null,
        verificationToken:
          input.verificationToken ?? null,
      });

      return ResponseHandler.created(
        res,
        "Review submitted successfully. It will be visible after moderation.",
        result
      );
    } catch (error) {
      next(error);
    }
  };

  listPublicReviews = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const businessId = this.requireParam(
        req.params.businessId,
        "Business ID"
      );

      const query = reviewListQuerySchema.parse({
        ...req.query,
        status: "PUBLISHED",
      });

      const result = await this.service.listPublicReviews(
        businessId,
        query.page,
        query.limit
      );

      return ResponseHandler.success(
        res,
        "Reviews retrieved successfully.",
        result
      );
    } catch (error) {
      next(error);
    }
  };

  getPublicSummary = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const businessId = this.requireParam(
        req.params.businessId,
        "Business ID"
      );

      const result = await this.service.getPublicSummary(
        businessId
      );

      return ResponseHandler.success(
        res,
        "Review summary retrieved successfully.",
        result
      );
    } catch (error) {
      next(error);
    }
  };

  getExternalReviewUrl = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const businessId = this.requireParam(
        req.params.businessId,
        "Business ID"
      );

      const url = await this.service.getExternalReviewUrl(
        businessId
      );

      return ResponseHandler.success(
        res,
        "External review destination retrieved successfully.",
        { url }
      );
    } catch (error) {
      next(error);
    }
  };

  reportReview = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = this.requireUserId(req);
      const reviewId = this.requireParam(
        req.params.reviewId,
        "Review ID"
      );

      const input = reportReviewSchema.parse(req.body);

      const result = await this.service.reportReview({
        reviewId,
        userId,
        reason: input.reason,
        details: input.details ?? null,
      });

      return ResponseHandler.created(
        res,
        "Review reported successfully.",
        result
      );
    } catch (error) {
      next(error);
    }
  };

  listManagedReviews = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const actorId = this.requireUserId(req);
      const businessId = this.requireParam(
        req.params.businessId,
        "Business ID"
      );

      const query = reviewListQuerySchema.parse(
        req.query
      );

      const result = await this.service.listManagedReviews(
        actorId,
        businessId,
        query
      );

      return ResponseHandler.success(
        res,
        "Reviews retrieved successfully.",
        result
      );
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const actorId = this.requireUserId(req);
      const reviewId = this.requireParam(
        req.params.reviewId,
        "Review ID"
      );

      const input = updateReviewStatusSchema.parse(
        req.body
      );

      const result = await this.service.updateStatus({
        actorId,
        reviewId,
        status: input.status,
        moderationNote: input.moderationNote ?? null,
      });

      return ResponseHandler.success(
        res,
        "Review moderation status updated successfully.",
        result
      );
    } catch (error) {
      next(error);
    }
  };

  respond = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const actorId = this.requireUserId(req);
      const reviewId = this.requireParam(
        req.params.reviewId,
        "Review ID"
      );

      const input = reviewResponseSchema.parse(req.body);

      const result = await this.service.respondToReview({
        actorId,
        reviewId,
        response: input.response,
      });

      return ResponseHandler.success(
        res,
        "Review response saved successfully.",
        result
      );
    } catch (error) {
      next(error);
    }
  };
}
